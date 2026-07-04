import { describe, expect, it } from "vitest";
import {
  EFFECTS_CONFIG,
  advanceParticles,
  advancePopups,
  createCameraShakeState,
  shakeOffset,
  spawnBurst,
  spawnDust,
  spawnScorePopup,
  spawnTrailParticle,
  tickShake,
  triggerShake,
} from "./effects";

describe("particles", () => {
  it("moves a trail particle by its velocity and counts down its life", () => {
    const particle = spawnTrailParticle(100, 50, "#fff");
    const [next] = advanceParticles([particle], 0.1);
    expect(next.x).toBeCloseTo(100 + particle.vx * 0.1, 5);
    expect(next.y).toBeCloseTo(50, 5);
    expect(next.life).toBeCloseTo(particle.life - 0.1, 5);
  });

  it("removes particles once their life expires", () => {
    const particle = spawnTrailParticle(0, 0, "#fff");
    const next = advanceParticles([particle], particle.maxLife + 1);
    expect(next).toHaveLength(0);
  });

  it("spawns a burst with the configured particle count, radiating outward", () => {
    const burst = spawnBurst(10, 10, "#ffd166", () => 0);
    expect(burst).toHaveLength(EFFECTS_CONFIG.burstCount);
    for (const p of burst) {
      expect(p.x).toBe(10);
      expect(p.y).toBe(10);
    }
  });

  it("spawns ground-hugging dust that drifts backward, shorter-lived than a trick burst", () => {
    const dust = spawnDust(10, 10, () => 0.5);
    expect(dust).toHaveLength(EFFECTS_CONFIG.dustCount);
    for (const p of dust) {
      expect(p.vx).toBeLessThan(0);
      expect(p.maxLife).toBe(EFFECTS_CONFIG.dustLife);
    }
  });
});

describe("score popups", () => {
  it("formats the popup text with a leading plus sign", () => {
    const popup = spawnScorePopup(1, 2, 123.6);
    expect(popup.text).toBe("+124");
  });

  it("rises upward over time and expires", () => {
    const popup = spawnScorePopup(0, 100, 50);
    const [next] = advancePopups([popup], 0.1);
    expect(next.y).toBeLessThan(100);
    const gone = advancePopups([popup], popup.maxLife + 1);
    expect(gone).toHaveLength(0);
  });
});

describe("camera shake", () => {
  it("starts with zero trauma", () => {
    expect(createCameraShakeState().trauma).toBe(0);
  });

  it("stacks trauma from repeated triggers, capped at 1", () => {
    let state = createCameraShakeState();
    state = triggerShake(state, 0.6);
    state = triggerShake(state, 0.6);
    expect(state.trauma).toBe(1);
  });

  it("decays trauma over time and never goes negative", () => {
    let state = triggerShake(createCameraShakeState(), 0.5);
    state = tickShake(state, 1000);
    expect(state.trauma).toBe(0);
  });

  it("produces no offset at zero trauma and a bounded offset at full trauma", () => {
    const still = shakeOffset(createCameraShakeState(), () => 0.5);
    expect(still.x).toBe(0);
    expect(still.y).toBe(0);

    const shaking = shakeOffset({ trauma: 1 }, () => 1);
    expect(Math.abs(shaking.x)).toBeLessThanOrEqual(EFFECTS_CONFIG.shakeMaxOffsetPx);
  });
});
