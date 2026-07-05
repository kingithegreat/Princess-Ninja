export const LANE_COUNT = 3;
export const JUMP_DURATION = 0.5;
export const SLIDE_DURATION = 0.5;

export type AerialState = "running" | "jumping" | "sliding";

export interface PlayerState {
  lane: number;
  aerial: AerialState;
  aerialTimer: number;
  lastLaneChangeAt: number;
}

export function createPlayerState(): PlayerState {
  return { lane: 1, aerial: "running", aerialTimer: 0, lastLaneChangeAt: -Infinity };
}

export function moveLane(state: PlayerState, delta: -1 | 1, now: number): PlayerState {
  const lane = Math.min(LANE_COUNT - 1, Math.max(0, state.lane + delta));
  if (lane === state.lane) return state;
  return { ...state, lane, lastLaneChangeAt: now };
}

export function startJump(state: PlayerState): PlayerState {
  if (state.aerial !== "running") return state;
  return { ...state, aerial: "jumping", aerialTimer: JUMP_DURATION };
}

export function startSlide(state: PlayerState): PlayerState {
  if (state.aerial !== "running") return state;
  return { ...state, aerial: "sliding", aerialTimer: SLIDE_DURATION };
}

export function tickPlayer(state: PlayerState, dtSeconds: number): PlayerState {
  if (state.aerial === "running") return state;
  const aerialTimer = state.aerialTimer - dtSeconds;
  if (aerialTimer <= 0) {
    return { ...state, aerial: "running", aerialTimer: 0 };
  }
  return { ...state, aerialTimer };
}
