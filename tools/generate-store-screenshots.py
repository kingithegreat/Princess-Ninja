#!/usr/bin/env python3
"""
Princess Ninja store screenshots, take 2.

Take 1 failed for a real reason: tricks only fire when the player actually
CLEARS an obstacle, so tapping in empty air left the style multiplier at x1.0
and the frames looked dead. A store screenshot showing x1.0 and an empty track
actively undersells the game — style/combo IS the hook.

Fix: play the game for real with keyboard input, burst-capture frames the whole
run, and read the live multiplier out of the HUD (#multiplier) at each frame.
Then keep only the frames where a combo is genuinely running. Nothing is faked —
we just don't ship the boring frames.
"""
import pathlib
import subprocess
import time
from playwright.sync_api import sync_playwright

REPO = pathlib.Path("/home/claude/princess-ninja")
RAW = pathlib.Path("/home/claude/pn-raw")
RAW.mkdir(parents=True, exist_ok=True)
for f in RAW.glob("*.png"):
    f.unlink()

W, H = 1920, 1080
SEEDED = {
    "currency": 1240,
    "unlocked": ["crimsonBlade"],
    "equipped": "crimsonBlade",
    "charms": 1,
    "perks": ["headStart"],
}

server = subprocess.Popen(
    ["npx", "vite", "preview", "--port", "4174", "--host", "127.0.0.1"],
    cwd=REPO, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
)
time.sleep(4)

frames = []  # (multiplier, score, path)

try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": W, "height": H})
        page.goto("http://127.0.0.1:4174/", wait_until="load")
        page.evaluate(
            "s => localStorage.setItem('princess-ninja:progression', JSON.stringify(s))",
            SEEDED,
        )
        page.reload(wait_until="load")
        page.wait_for_timeout(1200)

        page.click("[data-start]")
        page.wait_for_timeout(600)

        # Play for real. Alternate jump / slide / lane-changes on the keyboard —
        # this is exactly what a human does, and it's the only way tricks land.
        pattern = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowRight",
                   "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowUp"]
        i = 0
        for step in range(70):
            if page.locator("[data-restart]").count() > 0:
                print(f"  run ended naturally at frame {step}")
                break

            page.keyboard.press(pattern[i % len(pattern)])
            i += 1
            page.wait_for_timeout(260)

            hud = page.evaluate("""() => ({
                mult: document.querySelector('#multiplier')?.textContent || '',
                score: document.querySelector('#score')?.textContent || ''
            })""")
            try:
                mult = float(hud["mult"].replace("x", "").strip())
            except ValueError:
                mult = 1.0

            path = RAW / f"f{step:03d}.png"
            page.screenshot(path=str(path))
            frames.append((mult, hud["score"], path))

        # Game over — wait for the real overlay rather than sleeping blindly.
        for _ in range(80):
            if page.locator("[data-restart]").count() > 0:
                break
            page.keyboard.press("ArrowUp")
            page.wait_for_timeout(300)
        page.wait_for_timeout(700)
        page.screenshot(path=str(RAW / "gameover.png"))

        browser.close()
finally:
    server.terminate()

frames.sort(key=lambda f: -f[0])
print(f"\ncaptured {len(frames)} gameplay frames")
print("top multipliers reached:")
for mult, score, path in frames[:8]:
    print(f"  x{mult:<5} {score:<14} {path.name}")
best = frames[0][0] if frames else 0
print(f"\nbest multiplier this run: x{best}")
if best <= 1.0:
    print("!! STILL x1.0 — tricks are not landing. Do not ship these.")
