# Play Store Listing — Princess Ninja

Draft copy generated from the current build (2026-07-05). **[ADEN]** = needs a
decision or Console access before this can be used — automation flags it,
never decides it.

> ⚠️ **[ADEN] Brand check.** Working title "Princess Ninja" is already a
> usable public title (not a generic scaffold name like shootemup's was) —
> no rename forced. Confirm you're happy shipping under this exact name, or
> swap it here and in `capacitor.config.ts` / `android/app/build.gradle`
> before first upload. `applicationId com.princessninja.app` is already
> locked in and cannot change after publishing — confirm now while it's free.

## Title (≤30 chars)

**Princess Ninja: Style Run** (26)

Alternates: `Princess Ninja Run` · `Ninja Princess: Style Runner` · `Princess Ninja: Trick Run`

## Short description (≤80 chars)

**A princess-ninja endless runner where style — not just survival — scores.** (76)

Alternates: `Dash, slide and dodge with style in this ninja princess endless runner.` · `Chain stylish tricks as a ninja princess in this fast endless runner.`

## Promo line

**Survival keeps you alive. Style is what scores.**

## Full description (≤4000 chars)

```
Run, dash, wall-run and slide as a princess-ninja out to prove that survival
alone isn't good enough — style is what actually counts. 🥷👑

Princess Ninja is an endless runner with a twist: distance keeps you in the
game, but a Style Score multiplier is the real objective. Play it safe and
your score barely climbs. Chain risky, stylish moves — near-miss dodges,
slides under low beams, perfectly-timed jumps — and watch the multiplier
grow. One clean, boring stretch and it resets. High score belongs to whoever
commits to the risk.

⚡ STYLE OVER SAFETY
Every trick you land — a jump, a slide, a razor-close dodge — builds your
combo multiplier. The longer you chain them, the faster your score climbs.
Play it safe and you'll survive longer, but you won't top the leaderboard.

🧱 HAZARDS THAT FORCE THE TRICK
Full-width spikes force a jump, full-width low beams force a slide — no lane
dodge saves you. Twin-lane patterns, then full-width hazards, then a
gauntlet of chained obstacles arrive as the run gets faster and further.

🎨 JUICE ON EVERY MOVE
Camera shake, particle trail bursts on trick landings, floating score
popups, dust puffs on jumps and slides, and a multiplier-driven glow aura
that intensifies the longer your combo holds — every stylish move feels
like one.

🪙 SPEND YOUR STYLE
Every run's score converts to currency. Spend it in the shop on cosmetic
trail/cape recolors (Gold Trail, Crimson Blade, Phantom Teal) or run
modifiers: Second Wind (survive one otherwise-fatal hit), Head Start (bank
free distance every run), Forgiving Combo (a longer combo window), Steady
Pace (a gentler speed ramp) and Gold Rush (bonus currency per run).

🏃 PICK UP AND PLAY
No tutorials, no waiting, no mandatory ads. Drop in, dash, and see how long
you can keep the multiplier alive.

⭐ WHY YOU'LL LOVE IT
- A scoring hook that rewards risk over safety
- Full-width hazards that force real trick execution, not just lane-dodging
- Camera shake, trails, popups and a combo glow that make every trick feel great
- Eight shop unlocks: three cosmetics, five run modifiers
- Free to play, lightweight download

How stylish can you make your run? 🥷
```

## Data safety / IARC (verify against final build before submitting)

- **Data collected:** none — no accounts, no network calls, no analytics SDK.
  Currency/cosmetics/charms persist to on-device `localStorage` only.
- **Ads:** none in the current build.
- **IARC rating basis:** mild cartoon action (obstacle-dodging runner, no
  violence against characters, no blood/gore) — expect "Everyone" / "3+"-style
  rating, same tier as the sibling repos. Confirm on the actual IARC
  questionnaire, don't assume.
- **Target audience:** general audience, 13+ recommended framing (do not
  declare the app as directed at children — same guidance as shootemup/
  Vacuum Empire/Pokie Palace).
- **Category:** Arcade (or Casual) · tags: endless runner, arcade, action

## Assets still needed (Aden or a follow-up automated pass)

- [ ] Feature graphic (1024×500)
- [ ] 6–8 phone screenshots (gameplay mid-run, shop panel, game-over/style-score popup, start screen)
- [ ] Short promo video (optional, not required for launch)

App icon and adaptive-icon foreground are already generated and in
`android/app/src/main/res/` — no icon work needed.
