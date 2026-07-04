export const STYLE_SCORE_CONFIG = {
  baseMultiplier: 1,
  maxMultiplier: 5,
  multiplierStep: 0.5,
  comboWindowSeconds: 2.5,
  decayPerSecond: 0.5,
  basePoints: 100,
  tightDodgeBonus: 1.5,
} as const;

export type TrickType = "laneDodge" | "jump" | "slide";

export interface StyleScoreState {
  multiplier: number;
  styleScore: number;
  comboTimer: number;
}

export function createStyleScoreState(): StyleScoreState {
  return {
    multiplier: STYLE_SCORE_CONFIG.baseMultiplier,
    styleScore: 0,
    comboTimer: 0,
  };
}

/** Call every frame. Counts down the combo window; once it expires the
 * multiplier decays back toward baseline until the next trick lands. */
export function tickDecay(state: StyleScoreState, dtSeconds: number): StyleScoreState {
  if (state.comboTimer > 0) {
    return { ...state, comboTimer: Math.max(0, state.comboTimer - dtSeconds) };
  }
  if (state.multiplier <= STYLE_SCORE_CONFIG.baseMultiplier) {
    return state;
  }
  const decayed = Math.max(
    STYLE_SCORE_CONFIG.baseMultiplier,
    state.multiplier - STYLE_SCORE_CONFIG.decayPerSecond * dtSeconds,
  );
  return { ...state, multiplier: decayed };
}

/** A stylish move landed. `tightness` (0-1) scales the near-miss bonus by
 * how close the dodge was — tighter dodges are worth more. `comboWindowSeconds`
 * defaults to the base config but can be extended by a purchased perk. */
export function landTrick(
  state: StyleScoreState,
  trick: TrickType,
  tightness = 1,
  comboWindowSeconds: number = STYLE_SCORE_CONFIG.comboWindowSeconds,
): StyleScoreState {
  const bonus = trick === "laneDodge" ? 1 + STYLE_SCORE_CONFIG.tightDodgeBonus * tightness : 1;
  const pointsEarned = STYLE_SCORE_CONFIG.basePoints * state.multiplier * bonus;
  const nextMultiplier = Math.min(
    STYLE_SCORE_CONFIG.maxMultiplier,
    state.multiplier + STYLE_SCORE_CONFIG.multiplierStep,
  );
  return {
    multiplier: nextMultiplier,
    styleScore: state.styleScore + pointsEarned,
    comboTimer: comboWindowSeconds,
  };
}

/** A crash breaks the combo entirely — multiplier resets to baseline. */
export function crash(state: StyleScoreState): StyleScoreState {
  return { ...state, multiplier: STYLE_SCORE_CONFIG.baseMultiplier, comboTimer: 0 };
}

export function totalScore(state: StyleScoreState, distanceScore: number): number {
  return Math.floor(distanceScore + state.styleScore);
}
