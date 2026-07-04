import { LANE_COUNT } from "./player";

export type ObstacleType = "wall" | "hurdle" | "barrier";

export const OBSTACLE_TYPES: ObstacleType[] = ["wall", "hurdle", "barrier"];

export interface Obstacle {
  id: number;
  lane: number;
  type: ObstacleType;
  x: number;
  resolved: boolean;
}

let nextId = 0;

export function spawnObstacle(x: number): Obstacle {
  const lane = Math.floor(Math.random() * LANE_COUNT);
  const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
  return { id: nextId++, lane, type, x, resolved: false };
}

export function advanceObstacles(obstacles: Obstacle[], dx: number): Obstacle[] {
  return obstacles.map((o) => ({ ...o, x: o.x - dx })).filter((o) => o.x > -80);
}

export function resetObstacleIds(): void {
  nextId = 0;
}
