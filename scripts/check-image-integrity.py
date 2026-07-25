#!/usr/bin/env python3
"""
Image integrity guard — fails CI if any committed image file is corrupt.

Why this exists
---------------
On 2026-07-24, 36 PNG/WebP files across two repos were found corrupt: byte 0x89
(the first byte of the PNG signature) had been replaced by the UTF-8 replacement
character (EF BF BD), so none of them decoded. Vacuum Empire's adaptive launcher
icon was one of them, which means a build would have shipped to Google Play with
a blank icon on every Android version. Android CI was green throughout, because
nothing ever asserted that an image is actually an image.

Design notes
------------
* Standard library only. No pip install in CI, no network, no supply chain.
* PNG chunk CRCs are verified, so this catches corruption ANYWHERE in the file,
  not just a damaged header. That is the strongest check available without a
  decoder, and it is exactly the bug class that got through last time.
* A file that is tracked as an image but is really a Git LFS pointer is reported
  distinctly, because that is a checkout problem rather than corruption and the
  fix is different.

Usage:  python3 scripts/check-image-integrity.py [root]
Exit:   0 = all good, 1 = at least one bad file
"""

import binascii
import struct
import sys
from pathlib import Path

IMAGE_SUFFIXES = {".png", ".webp", ".jpg", ".jpeg", ".gif", ".bmp"}

SKIP_DIRS = {
    ".git", "node_modules", "build", "dist", "out",
    ".gradle", ".idea", "vendor", ".next", "coverage",
}

LFS_MAGIC = b"version https://git-lfs"


class BadImage(Exception):
    """Raised with a human-readable reason why a file is not a valid image."""


def check_png(data: bytes) -> None:
    sig = b"\x89PNG\r\n\x1a\n"
    if not data.startswith(sig):
        got = " ".join(f"{b:02x}" for b in data[:8])
        # The 2026-07-24 bug produced exactly this: EF BF BD where 89 belonged.
        if data[:3] == b"\xef\xbf\xbd":
            raise BadImage(
                f"PNG signature corrupt — starts with UTF-8 replacement char "
                f"(ef bf bd) instead of 89. Got: {got}"
            )
        raise BadImage(f"not a PNG — bad signature. First 8 bytes: {got}")

    pos = len(sig)
    seen_ihdr = False
    seen_iend = False
    n = len(data)

    while pos < n:
        if pos + 8 > n:
            raise BadImage(f"truncated chunk header at byte {pos}")
        (length,) = struct.unpack(">I", data[pos : pos + 4])
        ctype = data[pos + 4 : pos + 8]
        body_start = pos + 8
        body_end = body_start + length

        if body_end + 4 > n:
            raise BadImage(
                f"truncated file — chunk {ctype.decode('ascii', 'replace')} "
                f"claims {length} bytes but the file ends early"
            )

        if not seen_ihdr and ctype != b"IHDR":
            raise BadImage("first chunk is not IHDR")
        if ctype == b"IHDR":
            seen_ihdr = True

        expected = struct.unpack(">I", data[body_end : body_end + 4])[0]
        actual = binascii.crc32(ctype + data[body_start:body_end]) & 0xFFFFFFFF
        if expected != actual:
            raise BadImage(
                f"CRC mismatch in {ctype.decode('ascii', 'replace')} chunk at "
                f"byte {pos} — file contents are damaged "
                f"(expected {expected:#010x}, computed {actual:#010x})"
            )

        if ctype == b"IEND":
            seen_iend = True
            break
        pos = body_end + 4

    if not seen_ihdr:
        raise BadImage("no IHDR chunk — not a usable PNG")
    if not seen_iend:
        raise BadImage("no IEND chunk — file is truncated")


def check_jpeg(data: bytes) -> None:
    if not data.startswith(b"\xff\xd8\xff"):
        got = " ".join(f"{b:02x}" for b in data[:4])
        raise BadImage(f"not a JPEG — bad SOI marker. First 4 bytes: {got}")
    if not data.rstrip(b"\x00").endswith(b"\xff\xd9"):
        raise BadImage("JPEG has no EOI marker — file is truncated")


def check_webp(data: bytes) -> None:
    if not data.startswith(b"RIFF"):
        got = " ".join(f"{b:02x}" for b in data[:4])
        raise BadImage(f"not a WebP — missing RIFF header. First 4 bytes: {got}")
    if data[8:12] != b"WEBP":
        raise BadImage("RIFF container is not WEBP")
    (declared,) = struct.unpack("<I", data[4:8])
    actual = len(data) - 8
    if actual < declared:
        raise BadImage(
            f"truncated WebP — header declares {declared} bytes, file has {actual}"
        )


def check_gif(data: bytes) -> None:
    if data[:6] not in (b"GIF87a", b"GIF89a"):
        got = " ".join(f"{b:02x}" for b in data[:6])
        raise BadImage(f"not a GIF — bad header. First 6 bytes: {got}")


def check_bmp(data: bytes) -> None:
    if not data.startswith(b"BM"):
        raise BadImage("not a BMP — missing 'BM' magic")


CHECKERS = {
    ".png": check_png,
    ".jpg": check_jpeg,
    ".jpeg": check_jpeg,
    ".webp": check_webp,
    ".gif": check_gif,
    ".bmp": check_bmp,
}

# Smallest plausible real image; anything under this is a stub or a failed write.
MIN_BYTES = 32


def check_file(path: Path) -> None:
    data = path.read_bytes()

    if len(data) == 0:
        raise BadImage("file is empty (0 bytes)")
    if data.startswith(LFS_MAGIC):
        raise BadImage(
            "this is a Git LFS pointer, not image data — the real file was never "
            "fetched. Run 'git lfs pull', or enable lfs in the checkout step."
        )
    if len(data) < MIN_BYTES:
        raise BadImage(f"only {len(data)} bytes — too small to be a real image")

    CHECKERS[path.suffix.lower()](data)


def iter_images(root: Path):
    # A single file is a legitimate target (spot-checking one asset, or a
    # pre-commit hook passing changed paths). Without this branch rglob() on a
    # file yields nothing and the run would exit 0 having checked nothing —
    # a green tick that proves absolutely nothing.
    if root.is_file():
        if root.suffix.lower() in IMAGE_SUFFIXES:
            yield root
        return

    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        if path.suffix.lower() not in IMAGE_SUFFIXES:
            continue
        if SKIP_DIRS.intersection(path.parts):
            continue
        yield path


def main(argv) -> int:
    root = Path(argv[1] if len(argv) > 1 else ".").resolve()

    checked = 0
    failures = []

    def label(path: Path) -> str:
        # relative_to(itself) yields '.', which tells the reader nothing.
        return path.name if path == root else str(path.relative_to(root))

    for path in iter_images(root):
        checked += 1
        try:
            check_file(path)
        except BadImage as exc:
            failures.append((label(path), str(exc)))
        except Exception as exc:  # unreadable file, permissions, etc.
            failures.append(
                (label(path), f"could not be read: {type(exc).__name__}: {exc}")
            )

    if not checked:
        print("[image-integrity] No image files found — nothing to check.")
        return 0

    if failures:
        print(f"[image-integrity] FAILED — {len(failures)} of {checked} image(s) are corrupt:\n")
        for rel, reason in failures:
            print(f"  ✗ {rel}")
            print(f"      {reason}")
        print(
            "\nThese files are committed but do not decode. Shipping them means "
            "blank icons, missing splash screens, or a rejected store build.\n"
            "Restore each from a known-good commit "
            "(git checkout <good-sha> -- <path>) or regenerate it."
        )
        return 1

    print(f"[image-integrity] OK — all {checked} image(s) decode cleanly.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
