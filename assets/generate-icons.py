"""Regenerates the Android launcher icons and splash screens from
assets/logo.png (character + glow) and assets/icon-foreground.png
(character only, sized to the adaptive-icon safe zone).

Both source PNGs are pre-rendered snapshots of icon-source.html /
icon-foreground.html (rendered via a headless browser, since @capacitor/assets
needs `sharp`, which needs a prebuilt binary this sandbox's network policy
blocks). Re-run this after editing either source PNG:

    python3 assets/generate-icons.py

Requires Pillow (`pip install pillow`).
"""

import os

from PIL import Image, ImageDraw

ASSETS = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(ASSETS, "..", "android", "app", "src", "main", "res")
BG = (0x1C, 0x1F, 0x30, 255)  # matches src/style.css canvas background

full_icon = Image.open(os.path.join(ASSETS, "logo.png")).convert("RGBA")
foreground = Image.open(os.path.join(ASSETS, "icon-foreground.png")).convert("RGBA")


def flatten_on_bg(img, size):
    bg = Image.new("RGBA", (size, size), BG)
    bg.alpha_composite(img.resize((size, size), Image.LANCZOS))
    return bg


def circle_mask(img):
    size = img.size[0]
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size, size), fill=255)
    out = img.copy()
    out.putalpha(mask)
    return out


LEGACY_SIZES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
FOREGROUND_SIZES = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}

for density, size in LEGACY_SIZES.items():
    square = flatten_on_bg(full_icon, size)
    square.convert("RGB").save(f"{RES}/mipmap-{density}/ic_launcher.png")
    circle_mask(square).save(f"{RES}/mipmap-{density}/ic_launcher_round.png")

for density, size in FOREGROUND_SIZES.items():
    foreground.resize((size, size), Image.LANCZOS).save(
        f"{RES}/mipmap-{density}/ic_launcher_foreground.png"
    )

# Splash screens: full-bleed background + centered character-with-glow logo,
# scaled off whichever dimension is smaller so it never overflows either
# portrait or landscape framing.
SPLASH_SIZES = {
    "drawable/splash.png": (480, 320),
    "drawable-land-mdpi/splash.png": (480, 320),
    "drawable-land-hdpi/splash.png": (800, 480),
    "drawable-land-xhdpi/splash.png": (1280, 720),
    "drawable-land-xxhdpi/splash.png": (1600, 960),
    "drawable-land-xxxhdpi/splash.png": (1920, 1280),
    "drawable-port-mdpi/splash.png": (320, 480),
    "drawable-port-hdpi/splash.png": (480, 800),
    "drawable-port-xhdpi/splash.png": (720, 1280),
    "drawable-port-xxhdpi/splash.png": (960, 1600),
    "drawable-port-xxxhdpi/splash.png": (1280, 1920),
}

for rel_path, (w, h) in SPLASH_SIZES.items():
    canvas = Image.new("RGBA", (w, h), BG)
    logo_size = int(min(w, h) * 0.62)
    logo = full_icon.resize((logo_size, logo_size), Image.LANCZOS)
    canvas.alpha_composite(logo, ((w - logo_size) // 2, (h - logo_size) // 2))
    canvas.convert("RGB").save(f"{RES}/{rel_path}")

print("Done.")
