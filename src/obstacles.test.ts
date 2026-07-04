import { describe, expect, it } from "vitest";
import {
  DIFFICULTY_TIERS,
  FULL_WIDTH_LANE,
  FULL_WIDTH_TYPES,
  GAUNTLET_GAP_PX,
  SINGLE_LANE_TYPES,
  pickPattern,
  resetObstacleIds,
  spawnWave,
} from "./obstacles";

/** Returns an rng that yields the given values in order, then repeats the
 * last one — lets tests force exact pattern/lane/type choices. */
function scriptedRng(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

describe("pickPattern", () => {
  it("only ever spawns single obstacles before the twin-lane tier", () => {
    expect(pickPattern(0, () => 0)).toBe("single");
    expect(pickPattern(DIFFICULTY_TIERS.twinLane - 1, () => 0)).toBe("single");
  });

  it("can spawn a twin pattern once the twin-lane tier is reached", () => {
    expect(pickPattern(DIFFICULTY_TIERS.twinLane, () => 0)).toBe("twin");
    expect(pickPattern(DIFFICULTY_TIERS.twinLane, () => 0.9)).toBe("single");
  });

  it("can spawn a full-width hazard once that tier is reached", () => {
    expect(pickPattern(DIFFICULTY_TIERS.fullWidth, () => 0)).toBe("fullWidth");
    expect(pickPattern(DIFFICULTY_TIERS.fullWidth, () => 0.9)).toBe("single");
  });

  it("can spawn a gauntlet once that tier is reached, but never before it", () => {
    expect(pickPattern(DIFFICULTY_TIERS.gauntlet, () => 0)).toBe("gauntlet");
    expect(pickPattern(DIFFICULTY_TIERS.gauntlet - 1, () => 0)).not.toBe("gauntlet");
  });
});

describe("spawnWave", () => {
  it("builds a single obstacle in one of the three lanes early in the run", () => {
    resetObstacleIds();
    const wave = spawnWave(900, 0, scriptedRng([0.9, 0.5, 0]));
    expect(wave).toHaveLength(1);
    expect(wave[0].lane).toBeGreaterThanOrEqual(0);
    expect(wave[0].lane).toBeLessThan(3);
    expect(SINGLE_LANE_TYPES).toContain(wave[0].type);
    expect(wave[0].x).toBe(900);
  });

  it("builds a twin pattern that blocks exactly two distinct lanes", () => {
    resetObstacleIds();
    // pattern roll -> twin; lane rolls -> 0, then 1 (distinct); type rolls for each
    const wave = spawnWave(900, DIFFICULTY_TIERS.twinLane, scriptedRng([0, 0, 0.9, 0, 0]));
    expect(wave).toHaveLength(2);
    const lanes = new Set(wave.map((o) => o.lane));
    expect(lanes.size).toBe(2);
    for (const obstacle of wave) {
      expect(SINGLE_LANE_TYPES).toContain(obstacle.type);
      expect(obstacle.x).toBe(900);
    }
  });

  it("builds a full-width hazard that can't be dodged into a lane", () => {
    resetObstacleIds();
    const wave = spawnWave(900, DIFFICULTY_TIERS.fullWidth, scriptedRng([0, 0]));
    expect(wave).toHaveLength(1);
    expect(wave[0].lane).toBe(FULL_WIDTH_LANE);
    expect(FULL_WIDTH_TYPES).toContain(wave[0].type);
  });

  it("builds a gauntlet chaining a twin pattern into a trailing full-width hazard", () => {
    resetObstacleIds();
    const wave = spawnWave(900, DIFFICULTY_TIERS.gauntlet, scriptedRng([0, 0, 0.9, 0, 0, 0]));
    expect(wave).toHaveLength(3);
    const twinPart = wave.slice(0, 2);
    const fullWidthPart = wave[2];
    expect(new Set(twinPart.map((o) => o.lane)).size).toBe(2);
    expect(fullWidthPart.lane).toBe(FULL_WIDTH_LANE);
    expect(fullWidthPart.x).toBe(900 + GAUNTLET_GAP_PX);
  });

  it("assigns every obstacle a unique, incrementing id", () => {
    resetObstacleIds();
    const wave = spawnWave(900, DIFFICULTY_TIERS.gauntlet, scriptedRng([0, 0, 0.9, 0, 0, 0]));
    const ids = wave.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
  });
});
