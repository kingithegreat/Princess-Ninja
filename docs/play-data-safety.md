# Play Console — Data safety notes (Princess Ninja)

> **STUB — Aden to review before submitting the Data safety form.** Engineering
> notes derived from the code on branch `feat/android-internal-ready-20261115`
> (2026-11-15). Re-verify against the exact build you upload; if any SDK,
> network call, ad, purchase, or permission is added, redo this page,
> `docs/privacy-policy.md` / `public/privacy.html`, and the Console form.

## Code facts (re-check each release)

| Check | Result | How to re-verify |
|---|---|---|
| Dependencies | `@capacitor/android` + `@capacitor/core` only — no Firebase, ads, analytics, crash reporting, IAP | `package.json` |
| Network calls | None (`fetch(`, `XMLHttpRequest`, `axios`, external URLs: no matches in `src/`, `index.html`) | `grep -rnE "fetch\(|XMLHttpRequest|https?://" src index.html` |
| Permissions | `INTERNET` only (Capacitor template default; unused by the game) | `android/app/src/main/AndroidManifest.xml` |
| Persisted data | Currency, cosmetic unlocks, run modifiers in WebView `localStorage` (on-device) | `src/progression.ts`, `src/game.ts` |
| Accounts / login / real-money purchases | None | — |

## Suggested Data safety form answers

- **Does your app collect or share any of the required user data types?** → **No**
- Encrypted in transit → not applicable (nothing transmitted)
- Data deletion request → not applicable (no accounts; uninstall clears local data)
- **Ads** → **No, my app does not contain ads**
- **Target audience** → 13+ (not designed for children; not in Designed for Families)
- **Content rating (IARC)** → casual endless-runner, no violence beyond cartoon "ninja" theme, no gambling, no user-generated content, no data sharing, no real-money purchases (in-game currency is earned only)
- **Privacy policy URL** → host `public/privacy.html` (or `docs/privacy-policy.html`) over HTTPS after filling the `[BRACKETED]` placeholders and removing the STUB banner, then paste the URL

Note: Play's form covers data that *leaves the device*; on-device-only
`localStorage` progress does not need to be declared as "collected".
