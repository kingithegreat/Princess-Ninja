export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface ScorePopup {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
}

export interface CameraShakeState {
  trauma: number;
}

export const EFFECTS_CONFIG = {
  trailInterval: 0.04,
  trailLife: 0.35,
  burstCount: 10,
  burstLife: 0.5,
  popupLife: 0.8,
  popupRiseSpeed: 40,
  shakeDecayPerSecond: 2.5,
  shakeMaxOffsetPx: 14,
} as const;

export function spawnTrailParticle(x: number, y: number, color: string): Particle {
  return {
    x,
    y,
    vx: -40,
    vy: 0,
    life: EFFECTS_CONFIG.trailLife,
    maxLife: EFFECTS_CONFIG.trailLife,
    color,
    size: 6,
  };
}

/** Radial burst of sparks used to punctuate a landed trick. `rng` is
 * injectable so tests can assert exact particle placement. */
export function spawnBurst(
  x: number,
  y: number,
  color: string,
  rng: () => number = Math.random,
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < EFFECTS_CONFIG.burstCount; i++) {
    const angle = (i / EFFECTS_CONFIG.burstCount) * Math.PI * 2 + rng() * 0.5;
    const speed = 80 + rng() * 120;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: EFFECTS_CONFIG.burstLife,
      maxLife: EFFECTS_CONFIG.burstLife,
      color,
      size: 3 + rng() * 3,
    });
  }
  return particles;
}

export function advanceParticles(particles: Particle[], dtSeconds: number): Particle[] {
  return particles
    .map((p) => ({ ...p, x: p.x + p.vx * dtSeconds, y: p.y + p.vy * dtSeconds, life: p.life - dtSeconds }))
    .filter((p) => p.life > 0);
}

export function spawnScorePopup(x: number, y: number, points: number): ScorePopup {
  return {
    x,
    y,
    text: `+${Math.round(points)}`,
    life: EFFECTS_CONFIG.popupLife,
    maxLife: EFFECTS_CONFIG.popupLife,
  };
}

export function advancePopups(popups: ScorePopup[], dtSeconds: number): ScorePopup[] {
  return popups
    .map((p) => ({ ...p, y: p.y - EFFECTS_CONFIG.popupRiseSpeed * dtSeconds, life: p.life - dtSeconds }))
    .filter((p) => p.life > 0);
}

export function createCameraShakeState(): CameraShakeState {
  return { trauma: 0 };
}

/** Adds to the current trauma (clamped to 1) rather than overwriting it, so
 * shakes from rapid events stack instead of resetting. */
export function triggerShake(state: CameraShakeState, amount: number): CameraShakeState {
  return { trauma: Math.min(1, state.trauma + amount) };
}

export function tickShake(state: CameraShakeState, dtSeconds: number): CameraShakeState {
  if (state.trauma <= 0) return state;
  return { trauma: Math.max(0, state.trauma - EFFECTS_CONFIG.shakeDecayPerSecond * dtSeconds) };
}

/** Offset scales with trauma^2 so small shakes stay subtle and only big
 * hits (crashes) really rattle the camera. */
export function shakeOffset(state: CameraShakeState, rng: () => number = Math.random): { x: number; y: number } {
  const magnitude = state.trauma * state.trauma * EFFECTS_CONFIG.shakeMaxOffsetPx;
  return {
    x: (rng() * 2 - 1) * magnitude,
    y: (rng() * 2 - 1) * magnitude,
  };
}
