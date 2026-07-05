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

Milestone 5 also picked up its remaining code-shaped items. The fixed
800x450 canvas now scales responsively: `#app` sizes itself to
`min(94vw, 94vh * 16/9)` with `aspect-ratio: 16/9`, so the canvas fills the
available space in both portrait and landscape without changing the game's
internal drawing coordinates; the HUD and shop panel use `cqw`-based
`clamp()` font sizing (via `container-type: inline-size` on `#app`) so text
stays legible instead of overflowing a small container, and the shop panel
scrolls (`max-height: 92%; overflow-y: auto`) now that eight items don't fit
a phone-sized screen at once. Verified via Playwright screenshots at a
390x844 portrait viewport and 844x390 landscape.

Since none of that mattered without a way to actually play on a touchscreen
— the whole input layer was keyboard-only — `input.ts` gained
`bindPointerInput`: swipe up/down maps to jump/slide, left/right to lane
changes, and a stationary tap defaults to jump (the runner-genre norm),
built on pointer events so it also works with a mouse on desktop. Verified
by dispatching a synthetic swipe gesture in the Playwright check and
confirming the run kept progressing (jump triggered, no crash).

Release signing infrastructure is in place: `android/app/build.gradle` reads
an untracked `android/keystore.properties` (template at
`keystore.properties.example`, `.gitignore`d alongside `*.jks`) and applies
it to the `release` signing config only when present, so unsigned
debug/CI builds are unaffected. `.github/workflows/android.yml` gained a
`build-release-apk` job that writes the keystore + properties from repo
secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`,
`ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`) and runs `assembleRelease`,
gated on `ANDROID_KEYSTORE_BASE64` being set so the workflow doesn't fail
before those secrets exist. Actually generating and provisioning a
production keystore is an ops/secrets step for the repo owner, not
something a dev session can do — `npm run android:build:release` is there
for a local signed build once `keystore.properties` exists.

Capacitor's placeholder app icon and splash screen are replaced with real
ones, procedurally: `assets/icon-source.html`/`icon-foreground.html` draw the
same cape/body/head shapes and palette as the in-game player render
(`src/game.ts`'s `renderPlayer`), rendered to PNG with a headless browser
screenshot rather than `@capacitor/assets`, since that tool needs `sharp`,
whose prebuilt binary download this sandbox's network policy blocks (`npm
install` failed with a 403 on `sharp-libvips`'s GitHub release). Instead,
`assets/generate-icons.py` (Pillow) resizes/composites the two source PNGs
into every density-specific `mipmap`/`drawable` file Android expects,
matching the existing placeholders' exact dimensions so no manifest/XML
wiring changed — plus a themed `ic_launcher_background` color (`#1c1f30`,
the game's own canvas background) replacing the default white/teal. Two
unreferenced default-template leftovers (`drawable/ic_launcher_background.xml`,
`drawable-v24/ic_launcher_foreground.xml` — confirmed unused via a repo-wide
grep) were removed rather than left stale. Verified visually via the
generated PNGs at each size (icon, round icon, portrait/landscape splash);
gradle itself still isn't runnable from this sandbox (see Milestone 5 build
notes above), so the actual APK render is CI's `android.yml` job to confirm.

## Next step
- Milestone 5 still needs: the repo owner generating a real release keystore
  + populating the `ANDROID_KEYSTORE_BASE64`/etc. GitHub secrets so
  `build-release-apk` actually runs, and a real device/emulator check of the
  new icon and splash screen (only verified as static PNGs so far).
- Milestone 3 still needs real sprite/character art (an asset pipeline or
  drawn character sheet) to replace the placeholder rectangle in the game's
  own canvas rendering — a design asset task rather than a code task.
