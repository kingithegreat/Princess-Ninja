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
Planning stage — repo currently has no code beyond this plan. Logged in the
Notion brain (Project Tracker + Projects hub) as Status: Research.

## Next step
Scaffold the TS + Vite project and implement the core run/jump/slide loop
with a first working version of the Style Score formula.
