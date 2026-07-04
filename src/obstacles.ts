import { LANE_COUNT } from "./player";

export type ObstacleType = "wall" | "hurdle" | "barrier" | "spikes" | "lowBeam";

/** Single-lane hazards: only the lane they occupy is dangerous. */
export const SINGLE_LANE_TYPES: ObstacleType[] = ["wall", "hurdle", "barrier"];
/** Full-width hazards: span every lane, so a lane dodge can't save you —
 * landing the matching trick is the only way through. */
export const FULL_WIDTH_TYPES: ObstacleType[] = ["spikes", "lowBeam"];

/** Obstacle types that require a jump to clear. */
export const JUMP_TYPES: ObstacleType[] = ["hurdle", "spikes"];
/** Obstacle types that require a slide to clear. */
export const SLIDE_TYPES: ObstacleType[] = ["barrier", "lowBeam"];

/** Sentinel lane value meaning "spans every lane" (full-width hazard). */
export const FULL_WIDTH_LANE = -1;

export interface Obstacle {
  id: number;
  lane: number;
  type: ObstacleType;
  x: number;
  resolved: boolean;
}

let nextId = 0;

function makeObstacle(lane: number, type: ObstacleType, x: number): Obstacle {
  return { id: nextId++, lane, type, x, resolved: false };
}

/** Distance (px travelled) at which each hazard pattern unlocks. Keeps the
 * opening run gentle (single obstacles only) and layers in real complexity
 * the further the player gets. */
export const DIFFICULTY_TIERS = {
  twinLane: 1200,
  fullWidth: 2600,
  gauntlet: 4200,
} as const;

export type SpawnPattern = "single" | "twin" | "fullWidth" | "gauntlet";

/** Chooses the next wave's pattern, weighted by distance. `rng` is
 * injectable (defaults to Math.random) so tests can force a specific pick. */
export function pickPattern(distance: number, rng: () => number = Math.random): SpawnPattern {
  const roll = rng();
  if (distance >= DIFFICULTY_TIERS.gauntlet && roll < 0.15) return "gauntlet";
  if (distance >= DIFFICULTY_TIERS.fullWidth && roll < 0.3) return "fullWidth";
  if (distance >= DIFFICULTY_TIERS.twinLane && roll < 0.55) return "twin";
  return "single";
}

function randomLane(rng: () => number): number {
  return Math.floor(rng() * LANE_COUNT);
}

function randomFrom<T>(pool: T[], rng: () => number): T {
  return pool[Math.floor(rng() * pool.length)];
}

function buildSingle(x: number, rng: () => number): Obstacle[] {
  return [makeObstacle(randomLane(rng), randomFrom(SINGLE_LANE_TYPES, rng), x)];
}

/** Blocks two of the three lanes, each with its own trick requirement,
 * leaving exactly one lane the player must find (or trick through). */
function buildTwin(x: number, rng: () => number): Obstacle[] {
  const blockedLanes = new Set<number>();
  while (blockedLanes.size < 2) blockedLanes.add(randomLane(rng));
  return [...blockedLanes].map((lane) => makeObstacle(lane, randomFrom(SINGLE_LANE_TYPES, rng), x));
}

function buildFullWidth(x: number, rng: () => number): Obstacle[] {
  return [makeObstacle(FULL_WIDTH_LANE, randomFrom(FULL_WIDTH_TYPES, rng), x)];
}

/** Gap (in px) between the two waves of a gauntlet pattern. */
export const GAUNTLET_GAP_PX = 260;

/** Builds the obstacle(s) for one spawn "wave" at position x. A wave is a
 * single obstacle, a two-lane pattern, a full-width hazard, or (at high
 * distance) a gauntlet chaining a twin pattern into a full-width hazard. */
export function spawnWave(x: number, distance: number, rng: () => number = Math.random): Obstacle[] {
  switch (pickPattern(distance, rng)) {
    case "gauntlet":
      return [...buildTwin(x, rng), ...buildFullWidth(x + GAUNTLET_GAP_PX, rng)];
    case "fullWidth":
      return buildFullWidth(x, rng);
    case "twin":
      return buildTwin(x, rng);
    case "single":
    default:
      return buildSingle(x, rng);
  }
}

export function advanceObstacles(obstacles: Obstacle[], dx: number): Obstacle[] {
  return obstacles.map((o) => ({ ...o, x: o.x - dx })).filter((o) => o.x > -80);
}

export function resetObstacleIds(): void {
  nextId = 0;
}
