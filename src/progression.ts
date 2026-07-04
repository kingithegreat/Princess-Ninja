export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const PROGRESSION_STORAGE_KEY = "princess-ninja:progression";

/** Cosmetics catalog. `default` is always unlocked and free — it's the
 * fallback look, not a purchase. */
export const COSMETICS = {
  default: { id: "default", name: "Classic", cost: 0, trailColor: "#7b61ff", capeColor: "#c1121f" },
  goldTrail: { id: "goldTrail", name: "Gold Trail", cost: 500, trailColor: "#ffd166", capeColor: "#c9902b" },
  crimsonBlade: { id: "crimsonBlade", name: "Crimson Blade", cost: 200, trailColor: "#ef476f", capeColor: "#7a0d1f" },
  phantomTeal: { id: "phantomTeal", name: "Phantom Teal", cost: 900, trailColor: "#118ab2", capeColor: "#0a5a73" },
} as const;

export type CosmeticId = keyof typeof COSMETICS;

/** Cosmetics offered in the shop, in display order. Excludes `default`,
 * which is the free fallback rather than something to purchase. */
export const SHOP_COSMETICS: CosmeticId[] = ["goldTrail", "crimsonBlade", "phantomTeal"];

export const PROGRESSION_CONFIG = {
  /** Currency earned per point of a run's final (distance + style) score. */
  currencyPerScorePoint: 0.05,
  /** Cost of one Second Wind charm — a run modifier that survives a single
   * crash instead of ending the run. */
  secondWindCost: 150,
} as const;

export interface ProgressionState {
  currency: number;
  unlocked: CosmeticId[];
  equipped: CosmeticId;
  charms: number;
}

export function createProgressionState(): ProgressionState {
  return { currency: 0, unlocked: [], equipped: "default", charms: 0 };
}

/** Loads saved progression, falling back to a fresh state on missing or
 * corrupt data rather than throwing — meta progression is a bonus layer,
 * not something that should be able to break a run. */
export function loadProgression(store: KeyValueStore): ProgressionState {
  try {
    const raw = store.getItem(PROGRESSION_STORAGE_KEY);
    if (!raw) return createProgressionState();
    const parsed = JSON.parse(raw);
    return {
      currency: typeof parsed.currency === "number" ? parsed.currency : 0,
      unlocked: Array.isArray(parsed.unlocked)
        ? parsed.unlocked.filter((id: unknown): id is CosmeticId => typeof id === "string" && id in COSMETICS)
        : [],
      equipped: typeof parsed.equipped === "string" && parsed.equipped in COSMETICS ? parsed.equipped : "default",
      charms: typeof parsed.charms === "number" && parsed.charms >= 0 ? parsed.charms : 0,
    };
  } catch {
    return createProgressionState();
  }
}

export function saveProgression(store: KeyValueStore, state: ProgressionState): void {
  store.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(state));
}

/** Currency earned from a finished run's total score. */
export function currencyForRun(totalScore: number): number {
  return Math.floor(totalScore * PROGRESSION_CONFIG.currencyPerScorePoint);
}

export function awardCurrency(state: ProgressionState, amount: number): ProgressionState {
  return { ...state, currency: state.currency + amount };
}

export function isUnlocked(state: ProgressionState, id: CosmeticId): boolean {
  return id === "default" || state.unlocked.includes(id);
}

/** Spends currency to unlock a cosmetic. A no-op if already unlocked or if
 * currency is insufficient — callers can compare the returned state to tell
 * whether the purchase went through. */
export function unlockCosmetic(state: ProgressionState, id: CosmeticId): ProgressionState {
  if (isUnlocked(state, id)) return state;
  const cost = COSMETICS[id].cost;
  if (state.currency < cost) return state;
  return { ...state, currency: state.currency - cost, unlocked: [...state.unlocked, id] };
}

/** Equips a cosmetic. A no-op if it isn't unlocked yet. */
export function equipCosmetic(state: ProgressionState, id: CosmeticId): ProgressionState {
  if (!isUnlocked(state, id)) return state;
  return { ...state, equipped: id };
}

export function activeCosmetic(state: ProgressionState) {
  return COSMETICS[state.equipped];
}

/** Buys one Second Wind charm. A no-op if currency is insufficient. */
export function buyCharm(state: ProgressionState): ProgressionState {
  if (state.currency < PROGRESSION_CONFIG.secondWindCost) return state;
  return { ...state, currency: state.currency - PROGRESSION_CONFIG.secondWindCost, charms: state.charms + 1 };
}

export function hasCharm(state: ProgressionState): boolean {
  return state.charms > 0;
}

/** Spends one charm. A no-op if none are held — callers should check
 * `hasCharm` first to decide whether the save even happens. */
export function consumeCharm(state: ProgressionState): ProgressionState {
  if (state.charms <= 0) return state;
  return { ...state, charms: state.charms - 1 };
}
