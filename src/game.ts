import { bindInput } from "./input";
import {
  Obstacle,
  advanceObstacles,
  resetObstacleIds,
  spawnObstacle,
} from "./obstacles";
import {
  PlayerState,
  createPlayerState,
  moveLane,
  startJump,
  startSlide,
  tickPlayer,
} from "./player";
import {
  StyleScoreState,
  createStyleScoreState,
  crash as crashStyleScore,
  landTrick,
  tickDecay,
  totalScore,
} from "./styleScore";

const PLAYER_X = 120;
const LANE_HEIGHT = 120;
const LANE_TOP = 45;
const BASE_SPEED = 260; // px/sec
const MAX_SPEED = 620;
const SPEED_RAMP_PER_SEC = 4;
const SPAWN_INTERVAL_MIN = 0.85;
const SPAWN_INTERVAL_MAX = 1.4;
/** A lane change only counts as a stylish dodge if it happened this
 * recently relative to the obstacle reaching the player. */
const DODGE_RELEVANCE_WINDOW = 1.2;

function laneCenterY(lane: number): number {
  return LANE_TOP + lane * LANE_HEIGHT + LANE_HEIGHT / 2;
}

export class Game {
  private ctx: CanvasRenderingContext2D;
  private scoreEl: HTMLElement;
  private multiplierEl: HTMLElement;
  private overlayEl: HTMLElement;

  private player: PlayerState = createPlayerState();
  private obstacles: Obstacle[] = [];
  private style: StyleScoreState = createStyleScoreState();
  private distance = 0;
  private speed = BASE_SPEED;
  private clock = 0;
  private spawnTimer = 1;
  private gameOver = false;
  private lastFrameTime = 0;
  private unbindInput: () => void;

  constructor(canvas: HTMLCanvasElement, hud: { score: HTMLElement; multiplier: HTMLElement; overlay: HTMLElement }) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
    this.scoreEl = hud.score;
    this.multiplierEl = hud.multiplier;
    this.overlayEl = hud.overlay;
    this.unbindInput = bindInput((action) => this.handleAction(action));
  }

  start(): void {
    this.lastFrameTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  destroy(): void {
    this.unbindInput();
  }

  private handleAction(action: "left" | "right" | "jump" | "slide"): void {
    if (this.gameOver) {
      if (action === "jump") this.restart();
      return;
    }
    switch (action) {
      case "left":
        this.player = moveLane(this.player, -1, this.clock);
        break;
      case "right":
        this.player = moveLane(this.player, 1, this.clock);
        break;
      case "jump":
        this.player = startJump(this.player);
        break;
      case "slide":
        this.player = startSlide(this.player);
        break;
    }
  }

  private restart(): void {
    this.player = createPlayerState();
    this.obstacles = [];
    this.style = createStyleScoreState();
    this.distance = 0;
    this.speed = BASE_SPEED;
    this.clock = 0;
    this.spawnTimer = 1;
    this.gameOver = false;
    resetObstacleIds();
    this.overlayEl.innerHTML = "";
  }

  private loop(time: number): void {
    const dt = Math.min(0.05, (time - this.lastFrameTime) / 1000);
    this.lastFrameTime = time;
    if (!this.gameOver) {
      this.update(dt);
    }
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  private update(dt: number): void {
    this.clock += dt;
    this.distance += this.speed * dt;
    this.speed = Math.min(MAX_SPEED, this.speed + SPEED_RAMP_PER_SEC * dt);
    this.player = tickPlayer(this.player, dt);
    this.style = tickDecay(this.style, dt);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.obstacles.push(spawnObstacle(900));
      this.spawnTimer =
        SPAWN_INTERVAL_MIN + Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN);
    }
    this.obstacles = advanceObstacles(this.obstacles, this.speed * dt);
    this.resolveCollisions();

    this.scoreEl.textContent = `Score: ${totalScore(this.style, this.distance)}`;
    this.multiplierEl.textContent = `x${this.style.multiplier.toFixed(1)}`;
  }

  private resolveCollisions(): void {
    for (const obstacle of this.obstacles) {
      if (obstacle.resolved || obstacle.x > PLAYER_X) continue;
      obstacle.resolved = true;

      if (obstacle.lane !== this.player.lane) {
        const elapsed = this.clock - this.player.lastLaneChangeAt;
        if (elapsed <= DODGE_RELEVANCE_WINDOW) {
          const tightness = Math.max(0, 1 - elapsed / DODGE_RELEVANCE_WINDOW);
          this.style = landTrick(this.style, "laneDodge", tightness);
        }
        continue;
      }

      if (obstacle.type === "hurdle" && this.player.aerial === "jumping") {
        this.style = landTrick(this.style, "jump");
      } else if (obstacle.type === "barrier" && this.player.aerial === "sliding") {
        this.style = landTrick(this.style, "slide");
      } else {
        this.endRun();
        return;
      }
    }
  }

  private endRun(): void {
    this.gameOver = true;
    this.style = crashStyleScore(this.style);
    const finalScore = totalScore(this.style, this.distance);
    this.overlayEl.innerHTML = `<div class="panel"><h2>Wiped out!</h2><p>Score: ${finalScore}</p><button type="button" data-restart>Run again (Jump)</button></div>`;
    const button = this.overlayEl.querySelector<HTMLButtonElement>("[data-restart]");
    button?.addEventListener("click", () => this.restart());
  }

  private render(): void {
    const { ctx } = this;
    ctx.clearRect(0, 0, 800, 450);

    for (let lane = 0; lane < 3; lane++) {
      ctx.fillStyle = lane % 2 === 0 ? "#20243a" : "#252a44";
      ctx.fillRect(0, LANE_TOP + lane * LANE_HEIGHT, 800, LANE_HEIGHT);
    }

    for (const obstacle of this.obstacles) {
      ctx.fillStyle =
        obstacle.type === "wall" ? "#ef476f" : obstacle.type === "hurdle" ? "#ffd166" : "#118ab2";
      const y = laneCenterY(obstacle.lane);
      const height = obstacle.type === "barrier" ? 40 : 70;
      ctx.fillRect(obstacle.x - 20, y - height / 2, 40, height);
    }

    const baseY = laneCenterY(this.player.lane);
    let height = 80;
    let yOffset = 0;
    if (this.player.aerial === "jumping") {
      yOffset = -60;
    } else if (this.player.aerial === "sliding") {
      height = 40;
    }
    ctx.fillStyle = "#f4f0ff";
    ctx.fillRect(PLAYER_X - 22, baseY - height / 2 + yOffset, 44, height);
  }
}
