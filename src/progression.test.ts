import { describe, expect, it } from "vitest";
import {
  KeyValueStore,
  PROGRESSION_CONFIG,
  PROGRESSION_STORAGE_KEY,
  activeCosmetic,
  awardCurrency,
  buyCharm,
  consumeCharm,
  createProgressionState,
  currencyForRun,
  equipCosmetic,
  hasCharm,
  isUnlocked,
  loadProgression,
  saveProgression,
  unlockCosmetic,
} from "./progression";

function fakeStore(initial: Record<string, string> = {}): KeyValueStore {
  const data = { ...initial };
  return {
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

describe("progression state", () => {
  it("starts with no currency, no unlocks, no charms, and the default cosmetic equipped", () => {
    const state = createProgressionState();
    expect(state.currency).toBe(0);
    expect(state.unlocked).toEqual([]);
    expect(state.equipped).toBe("default");
    expect(state.charms).toBe(0);
  });

  it("converts a run's total score into currency", () => {
    expect(currencyForRun(1000)).toBe(50);
    expect(currencyForRun(0)).toBe(0);
  });

  it("awards currency additively", () => {
    let state = createProgressionState();
    state = awardCurrency(state, 50);
    state = awardCurrency(state, 25);
    expect(state.currency).toBe(75);
  });
});

describe("cosmetics", () => {
  it("treats the default cosmetic as always unlocked", () => {
    expect(isUnlocked(createProgressionState(), "default")).toBe(true);
  });

  it("does not unlock a paid cosmetic without enough currency", () => {
    const state = awardCurrency(createProgressionState(), 100);
    const next = unlockCosmetic(state, "goldTrail");
    expect(isUnlocked(next, "goldTrail")).toBe(false);
    expect(next.currency).toBe(100);
  });

  it("unlocks a paid cosmetic and deducts its cost when affordable", () => {
    const state = awardCurrency(createProgressionState(), 500);
    const next = unlockCosmetic(state, "goldTrail");
    expect(isUnlocked(next, "goldTrail")).toBe(true);
    expect(next.currency).toBe(0);
  });

  it("does not double-charge for an already-unlocked cosmetic", () => {
    let state = awardCurrency(createProgressionState(), 1000);
    state = unlockCosmetic(state, "goldTrail");
    const again = unlockCosmetic(state, "goldTrail");
    expect(again.currency).toBe(state.currency);
  });

  it("refuses to equip a cosmetic that isn't unlocked", () => {
    const state = createProgressionState();
    const next = equipCosmetic(state, "goldTrail");
    expect(next.equipped).toBe("default");
  });

  it("equips a cosmetic once it's unlocked", () => {
    let state = awardCurrency(createProgressionState(), 500);
    state = unlockCosmetic(state, "goldTrail");
    state = equipCosmetic(state, "goldTrail");
    expect(state.equipped).toBe("goldTrail");
    expect(activeCosmetic(state).trailColor).toBe("#ffd166");
  });
});

describe("charms (Second Wind)", () => {
  it("reports no charm held by default", () => {
    expect(hasCharm(createProgressionState())).toBe(false);
  });

  it("does not sell a charm without enough currency", () => {
    const state = awardCurrency(createProgressionState(), 100);
    const next = buyCharm(state);
    expect(next.charms).toBe(0);
    expect(next.currency).toBe(100);
  });

  it("sells a charm and deducts its cost when affordable", () => {
    const state = awardCurrency(createProgressionState(), 150);
    const next = buyCharm(state);
    expect(next.charms).toBe(1);
    expect(next.currency).toBe(150 - PROGRESSION_CONFIG.secondWindCost);
    expect(hasCharm(next)).toBe(true);
  });

  it("stacks multiple charms across separate purchases", () => {
    let state = awardCurrency(createProgressionState(), 1000);
    state = buyCharm(state);
    state = buyCharm(state);
    expect(state.charms).toBe(2);
  });

  it("consumes one charm at a time", () => {
    let state = awardCurrency(createProgressionState(), 300);
    state = buyCharm(state);
    state = buyCharm(state);
    state = consumeCharm(state);
    expect(state.charms).toBe(1);
  });

  it("does not go negative when consuming with no charms held", () => {
    const state = consumeCharm(createProgressionState());
    expect(state.charms).toBe(0);
  });
});

describe("persistence", () => {
  it("returns a fresh state when nothing is stored yet", () => {
    const state = loadProgression(fakeStore());
    expect(state).toEqual(createProgressionState());
  });

  it("falls back to a fresh state on corrupt stored data", () => {
    const state = loadProgression(fakeStore({ [PROGRESSION_STORAGE_KEY]: "{not json" }));
    expect(state).toEqual(createProgressionState());
  });

  it("round-trips a saved state", () => {
    const store = fakeStore();
    let state = awardCurrency(createProgressionState(), 500);
    state = equipCosmetic(unlockCosmetic(state, "goldTrail"), "goldTrail");
    saveProgression(store, state);
    expect(loadProgression(store)).toEqual(state);
  });

  it("ignores an unknown equipped/unlocked cosmetic id from stale or tampered data", () => {
    const store = fakeStore({
      [PROGRESSION_STORAGE_KEY]: JSON.stringify({ currency: 10, unlocked: ["notReal"], equipped: "notReal" }),
    });
    const state = loadProgression(store);
    expect(state.unlocked).toEqual([]);
    expect(state.equipped).toBe("default");
    expect(state.currency).toBe(10);
  });

  it("falls back to zero charms on a missing or negative charms value", () => {
    const store = fakeStore({
      [PROGRESSION_STORAGE_KEY]: JSON.stringify({ currency: 10, unlocked: [], equipped: "default", charms: -3 }),
    });
    expect(loadProgression(store).charms).toBe(0);
  });
});
