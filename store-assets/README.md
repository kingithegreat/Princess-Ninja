# Store assets — Princess Ninja

## Screenshots (5, Google Play compliant)

Generated **headlessly from the real game** — no device, no emulator, no mockups.
Every frame is a genuine game state produced by actually playing the build.

| File | What it shows |
|---|---|
| `01-start-screen-shop.png` | Start screen + shop, seeded to a real mid-progression player (Crimson Blade equipped, 1,525 coins, Head Start owned) |
| `02-combo-x4-peak.png` | Peak action — **x4.0 style multiplier**, 5,714 score, player mid-jump over obstacles |
| `03-mid-run-x3.png` | x3.0 combo running, different obstacle layout |
| `04-early-run.png` | Earlier in the run — establishes the core dodge/jump loop |
| `05-game-over-rewards.png` | The reward loop: final score → coins earned → shop to spend them |

All 1920×1080 landscape. Play requires 320–3840px per side with the long edge
≤2× the short edge; 16:9 passes comfortably. Landscape is valid for a landscape
game.

## Regenerating

```bash
npm ci && npm run build
python3 tools/generate-store-screenshots.py
```

**Why the script is smarter than "click start and screenshot":** tricks only
land when the player actually *clears an obstacle*, so naive input leaves the
style multiplier pinned at x1.0 and the frames look dead — which actively
undersells the game, since the combo system is the whole hook. The script plays
with real keyboard input, burst-captures the entire run, reads the live
multiplier out of `#multiplier`, and keeps only frames where a combo is
genuinely running. Nothing is faked; the boring frames just aren't shipped.

## Still needed before submission

- [ ] **Feature graphic** (1024×500) — required by Play, not yet generated
- [x] App icon + adaptive icon — already in `android/app/src/main/res/`

## Feature graphic

| File | Play Console field | Spec | Status |
|---|---|---|---|
| `feature-graphic.png` | Feature graphic | 1024×500 PNG, no alpha | ✅ generated 2026-07-24 |

Play will not publish a listing without one, and this app had none. Built from a
real gameplay frame out of `screenshots/` plus the game's own palette — same
treatment across the portfolio so the listings read as one studio.
