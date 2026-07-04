import { describe, expect, it } from "vitest";
import {
  STYLE_SCORE_CONFIG,
  createStyleScoreState,
  crash,
  landTrick,
  tickDecay,
  totalScore,
} from "./styleScore";

describe("styleScore", () => {
  it("starts at baseline", () => {
    const state = createStyleScoreState();
    expect(state.multiplier).toBe(1);
    expect(state.styleScore).toBe(0);
    expect(state.comboTimer).toBe(0);
  });

  it("increases the multiplier on a landed trick and resets the combo timer", () => {
    const state = createStyleScoreState();
    const next = landTrick(state, "jump");
    expect(next.multiplier).toBe(1 + STYLE_SCORE_CONFIG.multiplierStep);
    expect(next.comboTimer).toBe(STYLE_SCORE_CONFIG.comboWindowSeconds);
    expect(next.styleScore).toBeGreaterThan(0);
  });

  it("caps the multiplier at maxMultiplier", () => {
    let state = createStyleScoreState();
    for (let i = 0; i < 50; i++) {
      state = landTrick(state, "slide");
    }
    expect(state.multiplier).toBe(STYLE_SCORE_CONFIG.maxMultiplier);
  });

  it("awards a bigger bonus for a tighter lane dodge", () => {
    const state = createStyleScoreState();
    const loose = landTrick(state, "laneDodge", 0);
    const tight = landTrick(state, "laneDodge", 1);
    expect(tight.styleScore).toBeGreaterThan(loose.styleScore);
  });

  it("uses a custom combo window when one is supplied", () => {
    const state = landTrick(createStyleScoreState(), "jump", 1, STYLE_SCORE_CONFIG.comboWindowSeconds + 1);
    expect(state.comboTimer).toBe(STYLE_SCORE_CONFIG.comboWindowSeconds + 1);
  });

  it("does not decay the multiplier while inside the combo window", () => {
    const state = landTrick(createStyleScoreState(), "jump");
    const ticked = tickDecay(state, STYLE_SCORE_CONFIG.comboWindowSeconds - 0.1);
    expect(ticked.multiplier).toBe(state.multiplier);
    expect(ticked.comboTimer).toBeCloseTo(0.1, 5);
  });

  it("decays the multiplier back toward baseline once the combo window expires", () => {
    let state = landTrick(createStyleScoreState(), "jump");
    state = tickDecay(state, STYLE_SCORE_CONFIG.comboWindowSeconds);
    expect(state.comboTimer).toBe(0);
    state = tickDecay(state, 1);
    expect(state.multiplier).toBeCloseTo(
      1 + STYLE_SCORE_CONFIG.multiplierStep - STYLE_SCORE_CONFIG.decayPerSecond,
      5,
    );
  });

  it("never decays the multiplier below baseline", () => {
    let state = landTrick(createStyleScoreState(), "jump");
    state = tickDecay(state, STYLE_SCORE_CONFIG.comboWindowSeconds);
    state = tickDecay(state, 100);
    expect(state.multiplier).toBe(STYLE_SCORE_CONFIG.baseMultiplier);
  });

  it("resets the multiplier to baseline on crash", () => {
    let state = landTrick(createStyleScoreState(), "jump");
    state = crash(state);
    expect(state.multiplier).toBe(STYLE_SCORE_CONFIG.baseMultiplier);
    expect(state.comboTimer).toBe(0);
  });

  it("combines distance and style score into a floored total", () => {
    const state = landTrick(createStyleScoreState(), "jump");
    expect(totalScore(state, 42.7)).toBe(Math.floor(42.7 + state.styleScore));
  });
});
