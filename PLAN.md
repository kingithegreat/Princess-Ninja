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

Milestone 4 (meta progression) is broadened out: a run's final score
converts to currency, persisted to `localStorage`; the shop sells three
cosmetic unlocks (Gold Trail, Crimson Blade, Phantom Teal — each an
equippable trail/cape recolor) and a stackable "Second Wind" charm — a run
modifier that silently absorbs one otherwise-fatal hit (brief harmless-pass-
through window, distinct green save-burst + smaller shake) instead of
ending the run. HUD shows coins and charms live. The shop itself is no
longer game-over-only: a pre-run start screen (shown on load, and reused
after every crash's "Run again") lets you spend banked currency before
committing to the next run, sharing the same shop markup/listener wiring
as the game-over panel.

Milestone 4 grew two more run modifiers alongside Second Wind: Head Start
(a one-time shop purchase that banks 1200px of distance at the start of
every future run, at the cost of skipping straight into twin-lane hazards
instead of the gentle opening) and Forgiving Combo (a one-time purchase
that extends the combo window by a second on every landed trick). Both are
permanent once bought — unlike charms, they don't need repurchasing — and
share the existing shop panel/listener wiring.

Milestone 4 grew two more perks on top of that: Steady Pace (a one-time
purchase that slows the run's per-second speed ramp to 65% of normal, so
max speed still hits eventually but the climb there is more forgiving) and
Gold Rush (a one-time purchase that multiplies currency earned at the end
of every run by 1.25x). Both share the existing perk shop wiring — six
permanent-perk-or-cosmetic purchases now sit alongside the two consumable
charms.

With eight purchasable items now crammed into the shop, it got a small
differentiation pass: the flat undifferentiated button row was split into
two labeled sections — "Cosmetics" (looks only) and "Run Modifiers" (the
Second Wind charm plus every permanent perk) — so the panel stays scannable
as it grows. Verified visually via a rendered screenshot of the start
screen. Purchase costs themselves were reviewed and already scale sensibly
with each perk's long-run power (comboWindow < headStart < steadyPace <
goldRush), so no cost changes were needed.

Milestone 5 (mobile packaging) got its first pass: Capacitor is wired up
(`@capacitor/core`, `@capacitor/android`, `@capacitor/cli`, `capacitor.config.ts`
with appId `com.princessninja.app`) and the native `android/` Gradle project
is scaffolded and committed. `npm run cap:sync` builds the web bundle and
copies it into the Android project; `npm run android:build` additionally
runs the Gradle debug build. A separate `android.yml` CI workflow builds and
uploads the debug APK — scoped to `main` pushes and manual dispatch (not
every `claude/**` push) since the Gradle build needs a full Android SDK and
network access to `dl.google.com`/`services.gradle.org` that the sandboxed
dev session's egress policy blocks, so it couldn't be verified locally.
Verified for real via a manual `workflow_dispatch` run on `main` after
merge: `gradlew assembleDebug` succeeded on GitHub's hosted runner and
uploaded a working `princess-ninja-debug-apk` artifact (~3.6MB).

## Next step
- Milestone 5 still needs: an app icon/splash screen (currently Capacitor's
  generic placeholders), a release (signed) build + keystore management
  instead of just the debug APK, and a check that the fixed 800x450 canvas
  scales sensibly on real device screens.
- Milestone 3 still needs real sprite/character art (an asset pipeline or
  drawn character sheet) to replace the placeholder rectangle — a design
  asset task rather than a code task.
