# Princess Ninja — Plan

Endless runner starring a princess-ninja protagonist. The twist: survival
alone doesn't score you — **style does**. Distance keeps you alive; stylish
play (near-misses, wall-runs, slide-unders, chained tricks) is what drives
the score multiplier.

## Core concept
- **Genre:** endless runner (Temple Run / Subway Surfers lane-and-lean feel).
- **Hook:** a **Style Score** multiplier that climbs while you chain risky,
  stylish moves (near-miss dodges, wall-runs, slides under low obstacles,
  perfect-timing jumps) and resets on a clean/safe run. Safe path = low
  score. Risky path = high score, high fail chance.
- **Character:** ninja princess — traversal kit (dash, wall-run, slide)
  reads as "stylish" rather than purely functional.

## Tech stack
Match the sibling projects' pattern for consistency with existing tooling,
CI, and automation (shootemup, Vacuum Empire, Pokie Palace all follow this):
- TypeScript + Vite for the web build.
- Capacitor for Android packaging once the core loop is fun.
- GitHub Actions CI (lint/typecheck/test/build) + `claude/**` auto-merge
  pipeline, same shape as the other repos.

## Milestones
1. **Prototype** — lane-based run/jump/slide/dash loop, procedural obstacle
   spawner, and a first pass at the Style Score formula (combo window,
   multiplier decay, near-miss detection).
2. **Content pass** — obstacle variety, hazard patterns that reward specific
   tricks, difficulty ramp tied to distance.
3. **Art & feel** — character animation, environment art/theme, juice (trails,
   camera shake, score pop feedback) for stylish actions.
4. **Meta progression** — currency earned from style score, cosmetic unlocks,
   run modifiers — consistent with the progression patterns used in the
   other game repos.
5. **Mobile packaging** — Capacitor Android build, CI, signing.
6. **Polish & launch prep** — store listing, privacy policy, release
   checklist, device testing.

## Status
Milestones 1-2 done (prototype loop + Style Score, content pass with hazard
variety/patterns/difficulty ramp). Milestone 3 (art & feel) is well underway:
camera shake on crash, particle trail + trick-landing spark burst, floating
score popups, dust puffs on jump takeoff/landing and slide starts, a
multiplier-driven glow aura on the player that intensifies with the combo,
a parallax dusk skyline + ground gradient environment theme, scrolling lane
dashes, and procedural player animation (run bob, jump arc, cape/head
silhouette). All still programmatic canvas art — no sprite/image assets yet.

Milestone 4 (meta progression) has its first pass in: a run's final score
converts to currency, persisted to `localStorage`; a game-over shop sells
one cosmetic unlock (a gold trail/cape recolor) that can be equipped and
actually changes the player's rendered colors; a coins counter lives in the
HUD.

## Next step
Two directions, either is reasonable next:
- Broaden milestone 4 — more cosmetics, run modifiers (e.g. a currency-
  bought head start or forgiving-combo-window perk), a proper shop screen
  instead of the inline game-over buttons.
- Milestone 3 still needs real sprite/character art (an asset pipeline or
  drawn character sheet) to replace the placeholder rectangle — a design
  asset task rather than a code task.
