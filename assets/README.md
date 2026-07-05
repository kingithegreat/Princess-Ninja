# App icon / splash source assets

`icon-source.html` and `icon-foreground.html` are canvas drawings that mirror
the in-game player render (`src/game.ts`'s `renderPlayer`) — same cape/body/
head shapes and palette — so the app icon reads as the same character. They
were rendered to PNG with a headless Chromium (`page.screenshot`), not with
`@capacitor/assets`, because that tool depends on `sharp`, whose prebuilt
binary download is blocked by this sandbox's network policy.

- `logo.png` — character + glow aura, used for the legacy launcher icon,
  the round icon, and the splash screens.
- `icon-foreground.png` — character only (no glow), pre-scaled to Android's
  adaptive-icon safe zone (the guaranteed-visible inner ~66% circle of the
  108dp foreground layer).

`generate-icons.py` resizes/composites these two source PNGs into every
density-specific file under `android/app/src/main/res/` (mipmap icons +
drawable splash screens). Re-run it after changing either source PNG:

```
python3 assets/generate-icons.py
```

To change the artwork itself, edit `icon-source.html`/`icon-foreground.html`
and re-render them (open in a headless browser and screenshot the `#icon`
canvas at 1024x1024), then re-run the script above.
