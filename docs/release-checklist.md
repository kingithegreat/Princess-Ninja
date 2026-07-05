# Release Checklist — Princess Ninja → Google Play

Generated 2026-07-05, Milestone 6 (polish & launch prep). **[ADEN]** = needs
Aden's identity/payment/Console access — automation must flag, never do.
Everything else is code/CI work.

## Already done (this repo)

- [x] Milestones 1–5 shipped and merged: prototype loop + Style Score,
      content pass (hazard variety/patterns/difficulty ramp), art & feel
      (camera shake, particle trails, score popups, dust puffs, multiplier
      glow, parallax dusk skyline, procedural player animation), meta
      progression (currency, 3 cosmetics, 5 run modifiers, shop UI), mobile
      packaging (Capacitor Android, touch controls, responsive canvas)
- [x] `applicationId com.princessninja.app` locked in `capacitor.config.ts` +
      `android/app/build.gradle` — do not change post-launch
- [x] `versionCode 1` / `versionName "1.0"`
- [x] Real app icon + adaptive-icon foreground generated
      (`android/app/src/main/res/mipmap-*`, `assets/`) — no placeholder art
- [x] `android.yml` workflow: debug APK on every main push; signed release
      APK builds automatically once `ANDROID_KEYSTORE_*` secrets exist (same
      secret names as shootemup/Vacuum Empire — one keystore can't be shared
      across apps though, each needs its own)
- [x] CI (`ci.yml`) + fail-closed `claude/**` auto-merge pipeline — main
      stays green, zero open PRs as of this session
- [x] Privacy policy drafted (`docs/privacy-policy.md` + hostable `.html`),
      code-verified against current build (no network calls, no analytics,
      localStorage-only persistence)
- [x] Store listing copy drafted (`docs/store-listing.md`)

## Phase 0 — Account (the long pole; do first)

- [ ] **[ADEN]** Create Play developer account ($25 one-time; identity
      verification can take days). Same account later serves Vacuum Empire
      and shootemup — whoever creates it first unblocks all three.
- [ ] **[ADEN]** Create the app entry: Free · "It's a game" · general
      audience (do NOT declare it targets children)

## Phase 1 — Signing

- [ ] **[ADEN]** Generate the upload keystore:
      `keytool -genkey -v -keystore princess-ninja-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`
      — store passwords in a password manager, never commit
- [ ] **[ADEN]** Add repo secrets: `ANDROID_KEYSTORE_BASE64`
      (`base64 -w0 princess-ninja-upload.jks`), `ANDROID_KEYSTORE_PASSWORD`,
      `ANDROID_KEY_ALIAS` (`upload`), `ANDROID_KEY_PASSWORD` — once these
      exist, `android.yml`'s `build-release-apk` job starts producing a
      signed build automatically on every main push
- [ ] Enable **Play App Signing** in Console (Google keeps the app signing
      key; you keep the upload key)
- [ ] Note: `android.yml`'s release job now builds a signed **AAB**
      (`bundleRelease`, fixed 2026-07-05) — matches Play Console's
      requirement for new app submissions. Nothing further needed here.

## Phase 2 — Internal testing

- [ ] **[ADEN]** Upload the AAB to Internal testing, add testers, install
      on a real device
- [ ] Smoke test: lane run/jump/slide/dash · near-miss dodge detection ·
      Style Score multiplier climb + decay + reset-on-crash · full-width
      spike (jump-only) and low-beam (slide-only) hazards · twin-lane,
      full-width, and gauntlet patterns at their distance thresholds ·
      currency payout on run end · shop purchases (3 cosmetics, 5 run
      modifiers) persist across app restart · pre-run start-screen shop
      access · touch controls on a real device (not just mouse/keyboard in
      dev) · pause/backgrounding

## Phase 3 — Closed testing (mandatory 14-day clock)

- [ ] **[ADEN]** New personal Play accounts MUST run closed testing with
      **≥12 opted-in testers for ≥14 continuous days** before production
      access unlocks — **start this as early as possible**, in parallel
      with the shootemup/Vacuum Empire equivalents if using the same
      account
- [ ] Keep shipping fixes to the closed track during the window; keep 12+
      opted in

## Phase 4 — Store content (parallel with Phase 3)

- [ ] Produce remaining assets per `docs/store-listing.md`: feature
      graphic (1024×500), 6–8 phone screenshots, optional promo video
- [ ] Paste final title/short/full description into Console
- [ ] Complete Console forms: target audience 13+, IARC questionnaire
      (expect mild-cartoon-action tier — confirm on the actual form,
      don't assume), Data safety = No data collected (re-verify build
      first), ads = No
- [ ] **[ADEN]** Host the privacy policy (delete the DRAFT banner + fill
      placeholders first) and paste the URL into Console. GitHub Pages is
      free only on public repos — either make this repo public, host from
      a small public `privacy-policies` repo, or use any static host
- [ ] Pricing Free · countries · Category Arcade or Casual + tags

## Phase 5 — Production

- [ ] **[ADEN]** After the 14-day/12-tester window: apply for production
      access, create a Production release, staged rollout 10% → 50% →
      100%, submit for review
- [ ] Post-launch: watch Android vitals + reviews; ship updates by
      bumping `versionCode`/`versionName` and pushing to main

## Optional (post-v1)

- [ ] Fastlane `supply` / Gradle Play Publisher auto-upload from CI (needs
      **[ADEN]** Play service-account JSON as a secret)
- [ ] E2E/device testing — this repo has no Playwright/device-test
      workflow yet (unlike Sadie's widget suite); consider adding one if
      manual smoke-testing before each release becomes a bottleneck
