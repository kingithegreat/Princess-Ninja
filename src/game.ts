import { bindInput } from "./input";
import {
  CameraShakeState,
  EFFECTS_CONFIG,
  Particle,
  ScorePopup,
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
import {
  DIFFICULTY_TIERS,
  FULL_WIDTH_LANE,
  JUMP_TYPES,
  Obstacle,
  SLIDE_TYPES,
  advanceObstacles,
  resetObstacleIds,
  spawnWave,
} from "./obstacles";
import {
  JUMP_DURATION,
  PlayerState,
  createPlayerState,
  moveLane,
  startJump,
  startSlide,
  tickPlayer,
} from "./player";
import {
  COSMETICS,
  CosmeticId,
  ProgressionState,
  activeCosmetic,
  awardCurrency,
  currencyForRun,
  equipCosmetic,
  isUnlocked,
  loadProgression,
  saveProgression,
  unlockCosmetic,
} from "./progression";
import {
  STYLE_SCORE_CONFIG,
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
/** How much camera trauma a crash adds — big enough to read as an impact
 * without throwing the whole scene around. */
const CRASH_SHAKE_TRAUMA = 0.8;
const TRICK_BURST_COLOR = "#ffd166";
/** Cosmetic being sold in the game-over shop — the only unlockable so far. */
const SHOP_COSMETIC: CosmeticId = "goldTrail";

function laneCenterY(lane: number): number {
  return LANE_TOP + lane * LANE_HEIGHT + LANE_HEIGHT / 2;
}

/** Spawn waves come faster the further the run has gone, on top of the
 * gameplay speed ramp — distance drives both raw speed and hazard density. */
function spawnIntervalRange(distance: number): [number, number] {
  if (distance >= DIFFICULTY_TIERS.gauntlet) return [0.55, 0.85];
  if (distance >= DIFFICULTY_TIERS.fullWidth) return [0.65, 1.0];
  if (distance >= DIFFICULTY_TIERS.twinLane) return [0.75, 1.15];
  return [SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_MAX];
}

export class Game {
  private ctx: CanvasRenderingContext2D;
  private scoreEl: HTMLElement;
  private coinsEl: HTMLElement;
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

  private particles: Particle[] = [];
  private popups: ScorePopup[] = [];
  private shake: CameraShakeState = createCameraShakeState();
  private trailTimer = 0;

  /** Meta progression (currency + cosmetics) — persists across runs and
   * across page loads, unlike the rest of the run-scoped state above. */
  private progression: ProgressionState;

  constructor(
    canvas: HTMLCanvasElement,
    hud: { score: HTMLElement; coins: HTMLElement; multiplier: HTMLElement; overlay: HTMLElement },
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
    this.scoreEl = hud.score;
    this.coinsEl = hud.coins;
    this.multiplierEl = hud.multiplier;
    this.overlayEl = hud.overlay;
    this.progression = loadProgression(window.localStorage);
    this.coinsEl.textContent = `🪙 ${this.progression.currency}`;
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
      case "jump": {
        const wasRunning = this.player.aerial === "running";
        this.player = startJump(this.player);
        if (wasRunning) this.spawnGroundDust();
        break;
      }
      case "slide": {
        const wasRunning = this.player.aerial === "running";
        this.player = startSlide(this.player);
        if (wasRunning) this.spawnGroundDust();
        break;
      }
    }
  }

  /** Puff of dust at the player's feet — used for jump takeoffs, landings,
   * and slide starts so ground contact reads as an impact. */
  private spawnGroundDust(): void {
    const y = laneCenterY(this.player.lane) + 40;
    this.particles.push(...spawnDust(PLAYER_X - 10, y));
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
    this.particles = [];
    this.popups = [];
    this.shake = createCameraShakeState();
    this.trailTimer = 0;
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
    const wasJumping = this.player.aerial === "jumping";
    this.player = tickPlayer(this.player, dt);
    if (wasJumping && this.player.aerial === "running") this.spawnGroundDust();
    this.style = tickDecay(this.style, dt);
    this.shake = tickShake(this.shake, dt);
    this.particles = advanceParticles(this.particles, dt);
    this.popups = advancePopups(this.popups, dt);
    this.emitTrail(dt);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.obstacles.push(...spawnWave(900, this.distance));
      const [min, max] = spawnIntervalRange(this.distance);
      this.spawnTimer = min + Math.random() * (max - min);
    }
    this.obstacles = advanceObstacles(this.obstacles, this.speed * dt);
    this.resolveCollisions();

    this.scoreEl.textContent = `Score: ${totalScore(this.style, this.distance)}`;
    this.multiplierEl.textContent = `x${this.style.multiplier.toFixed(1)}`;
  }

  /** Leaves a faint trail behind the player, on a timer so it reads as a
   * steady streak rather than one particle per frame. */
  private emitTrail(dt: number): void {
    this.trailTimer -= dt;
    if (this.trailTimer > 0) return;
    this.trailTimer = EFFECTS_CONFIG.trailInterval;
    const y = laneCenterY(this.player.lane) + (this.player.aerial === "jumping" ? -60 : 0);
    this.particles.push(spawnTrailParticle(PLAYER_X - 20, y, activeCosmetic(this.progression).trailColor));
  }

  private resolveCollisions(): void {
    for (const obstacle of this.obstacles) {
      if (obstacle.resolved || obstacle.x > PLAYER_X) continue;
      obstacle.resolved = true;

      const isFullWidth = obstacle.lane === FULL_WIDTH_LANE;

      // Full-width hazards span every lane — there's no dodging into safety,
      // the matching trick is the only way through.
      if (!isFullWidth && obstacle.lane !== this.player.lane) {
        const elapsed = this.clock - this.player.lastLaneChangeAt;
        if (elapsed <= DODGE_RELEVANCE_WINDOW) {
          const tightness = Math.max(0, 1 - elapsed / DODGE_RELEVANCE_WINDOW);
          this.applyTrick("laneDodge", tightness);
        }
        continue;
      }

      const needsJump = JUMP_TYPES.includes(obstacle.type);
      const needsSlide = SLIDE_TYPES.includes(obstacle.type);

      if (needsJump && this.player.aerial === "jumping") {
        this.applyTrick("jump");
      } else if (needsSlide && this.player.aerial === "sliding") {
        this.applyTrick("slide");
      } else {
        this.endRun();
        return;
      }
    }
  }

  /** Lands a trick and punctuates it with a spark burst and a floating
   * score popup at the player's position — the "juice" that sells a
   * stylish move beyond the raw multiplier number. */
  private applyTrick(trick: "laneDodge" | "jump" | "slide", tightness = 1): void {
    const before = this.style.styleScore;
    this.style = landTrick(this.style, trick, tightness);
    const gained = this.style.styleScore - before;

    const y = laneCenterY(this.player.lane) + (this.player.aerial === "jumping" ? -60 : 0);
    this.particles.push(...spawnBurst(PLAYER_X, y, TRICK_BURST_COLOR));
    this.popups.push(spawnScorePopup(PLAYER_X, y - 30, gained));
  }

  private endRun(): void {
    this.gameOver = true;
    this.style = crashStyleScore(this.style);
    this.shake = triggerShake(this.shake, CRASH_SHAKE_TRAUMA);

    const finalScore = totalScore(this.style, this.distance);
    const earned = currencyForRun(finalScore);
    this.progression = awardCurrency(this.progression, earned);
    saveProgression(window.localStorage, this.progression);

    this.renderGameOverOverlay(finalScore, earned);
  }

  /** Renders the game-over panel: final score, the currency just earned,
   * a restart button, and a tiny shop for the run's one cosmetic unlock —
   * re-called after a shop action so the panel reflects the new balance
   * without re-awarding currency. */
  private renderGameOverOverlay(finalScore: number, earned: number): void {
    this.coinsEl.textContent = `🪙 ${this.progression.currency}`;

    const cost = COSMETICS[SHOP_COSMETIC].cost;
    const unlocked = isUnlocked(this.progression, SHOP_COSMETIC);
    const equipped = this.progression.equipped === SHOP_COSMETIC;
    const shopHtml = unlocked
      ? `<button type="button" data-equip>${equipped ? "Switch to Classic" : "Equip Gold Trail"}</button>`
      : `<button type="button" data-unlock ${this.progression.currency >= cost ? "" : "disabled"}>Unlock Gold Trail (🪙${cost})</button>`;

    this.overlayEl.innerHTML = `
      <div class="panel">
        <h2>Wiped out!</h2>
        <p>Score: ${finalScore}</p>
        <p class="currency-earned">+${earned} 🪙 (total ${this.progression.currency})</p>
        <button type="button" data-restart>Run again (Jump)</button>
        ${shopHtml}
      </div>`;

    this.overlayEl.querySelector<HTMLButtonElement>("[data-restart]")?.addEventListener("click", () => this.restart());
    this.overlayEl.querySelector<HTMLButtonElement>("[data-unlock]")?.addEventListener("click", () => {
      this.progression = unlockCosmetic(this.progression, SHOP_COSMETIC);
      saveProgression(window.localStorage, this.progression);
      this.renderGameOverOverlay(finalScore, earned);
    });
    this.overlayEl.querySelector<HTMLButtonElement>("[data-equip]")?.addEventListener("click", () => {
      this.progression = equipCosmetic(this.progression, equipped ? "default" : SHOP_COSMETIC);
      saveProgression(window.localStorage, this.progression);
      this.renderGameOverOverlay(finalScore, earned);
    });
  }

  private render(): void {
    const { ctx } = this;
    ctx.clearRect(0, 0, 800, 450);

    ctx.save();
    const offset = shakeOffset(this.shake);
    ctx.translate(offset.x, offset.y);

    this.renderEnvironment();
    this.renderObstacles();
    this.renderParticles();
    this.renderPlayer();
    this.renderPopups();

    ctx.restore();
  }

  private renderEnvironment(): void {
    const { ctx } = this;

    // Dusk sky band above the track with a slow parallax rooftop skyline —
    // gives the ninja-princess setting a place, not just a track.
    const sky = ctx.createLinearGradient(0, 0, 0, LANE_TOP);
    sky.addColorStop(0, "#241a3d");
    sky.addColorStop(1, "#3a2a5c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 800, LANE_TOP);

    ctx.fillStyle = "rgba(16, 18, 28, 0.6)";
    const skylineScroll = (this.distance * 0.08) % 120;
    for (let i = -1; i < 8; i++) {
      const x = i * 120 - skylineScroll;
      const roofHeight = 12 + ((i * 37) % 22);
      ctx.fillRect(x, LANE_TOP - roofHeight, 60, roofHeight);
    }

    for (let lane = 0; lane < 3; lane++) {
      ctx.fillStyle = lane % 2 === 0 ? "#20243a" : "#252a44";
      ctx.fillRect(0, LANE_TOP + lane * LANE_HEIGHT, 800, LANE_HEIGHT);
    }

    // Scrolling lane-divider dashes sell forward speed even on the flat
    // lane backgrounds above.
    ctx.strokeStyle = "rgba(244, 240, 255, 0.15)";
    ctx.lineWidth = 3;
    ctx.setLineDash([28, 22]);
    const scroll = -((this.distance * 0.6) % 50);
    for (let lane = 1; lane < 3; lane++) {
      const y = LANE_TOP + lane * LANE_HEIGHT;
      ctx.beginPath();
      ctx.lineDashOffset = scroll;
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Ground band below the track, echoing the sky's dusk palette.
    const groundTop = LANE_TOP + LANE_HEIGHT * 3;
    const ground = ctx.createLinearGradient(0, groundTop, 0, 450);
    ground.addColorStop(0, "#2a1f3a");
    ground.addColorStop(1, "#15121f");
    ctx.fillStyle = ground;
    ctx.fillRect(0, groundTop, 800, 450 - groundTop);
  }

  private renderObstacles(): void {
    const { ctx } = this;
    for (const obstacle of this.obstacles) {
      if (obstacle.lane === FULL_WIDTH_LANE) {
        const trackTop = LANE_TOP;
        const trackHeight = LANE_HEIGHT * 3;
        if (obstacle.type === "spikes") {
          // Ground-level spike strip across the whole track — jump it.
          ctx.fillStyle = "#c1121f";
          ctx.fillRect(obstacle.x - 16, trackTop, 32, trackHeight);
        } else {
          // Overhead beam leaving headroom at the bottom — slide under it.
          ctx.fillStyle = "#7b61ff";
          ctx.fillRect(obstacle.x - 16, trackTop, 32, trackHeight - 34);
        }
        continue;
      }

      ctx.fillStyle =
        obstacle.type === "wall" ? "#ef476f" : obstacle.type === "hurdle" ? "#ffd166" : "#118ab2";
      const y = laneCenterY(obstacle.lane);
      const height = obstacle.type === "barrier" ? 40 : 70;
      ctx.fillRect(obstacle.x - 20, y - height / 2, 40, height);
    }
  }

  private renderParticles(): void {
    const { ctx } = this;
    for (const particle of this.particles) {
      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private renderPlayer(): void {
    const { ctx } = this;
    const baseY = laneCenterY(this.player.lane);
    let width = 44;
    let height = 80;
    let yOffset = 0;

    if (this.player.aerial === "jumping") {
      // Sine arc over the jump's duration reads as a real hop rather than
      // a flat teleport up and down.
      const progress = 1 - this.player.aerialTimer / JUMP_DURATION;
      yOffset = -Math.sin(progress * Math.PI) * 70;
      height = 70;
    } else if (this.player.aerial === "sliding") {
      height = 40;
      width = 54;
    } else {
      // Idle run cycle: a small bob keeps the character feeling alive
      // between tricks.
      yOffset = -Math.abs(Math.sin(this.clock * 9)) * 4;
    }

    const top = baseY - height / 2 + yOffset;

    // Glow aura scales with the style multiplier — the higher the combo,
    // the more the character itself visibly reads as "on fire".
    const heat = (this.style.multiplier - STYLE_SCORE_CONFIG.baseMultiplier) /
      (STYLE_SCORE_CONFIG.maxMultiplier - STYLE_SCORE_CONFIG.baseMultiplier);
    if (heat > 0) {
      const cx = PLAYER_X;
      const cy = top + height / 2;
      const radius = 28 + heat * 40;
      const gradient = ctx.createRadialGradient(cx, cy, 4, cx, cy, radius);
      gradient.addColorStop(0, `rgba(255, 209, 102, ${0.25 + heat * 0.35})`);
      gradient.addColorStop(1, "rgba(255, 209, 102, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cape trails behind the body — longer at speed, tucked in on a slide —
    // to give the ninja-princess silhouette some motion read.
    const capeLength = this.player.aerial === "sliding" ? 14 : 26;
    ctx.fillStyle = activeCosmetic(this.progression).capeColor;
    ctx.beginPath();
    ctx.moveTo(PLAYER_X - width / 2, top + 6);
    ctx.lineTo(PLAYER_X - width / 2 - capeLength, top + height / 2);
    ctx.lineTo(PLAYER_X - width / 2, top + height - 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#f4f0ff";
    ctx.fillRect(PLAYER_X - width / 2, top, width, height);

    // Head accent so the sprite reads top-to-bottom instead of as a slab.
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(PLAYER_X, top + 10, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderPopups(): void {
    const { ctx } = this;
    ctx.font = "bold 20px system-ui, sans-serif";
    ctx.textAlign = "center";
    for (const popup of this.popups) {
      ctx.globalAlpha = popup.life / popup.maxLife;
      ctx.fillStyle = "#ffd166";
      ctx.fillText(popup.text, popup.x, popup.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  }
}
