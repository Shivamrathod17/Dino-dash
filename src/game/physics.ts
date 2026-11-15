import { JumpPhase, DinoExpression } from '../types/game';

export const PHYSICS = {
  GRAVITY: -2250, // px / sec^2 downwards base gravity
  JUMP_FORCE: 820, // px / sec upwards initial jump impulse
  INITIAL_SPEED: 260, // px / sec - friendly, accessible starting speed for beginners
  MAX_SPEED: 620, // px / sec
  SPEED_ACCELERATION: 4.0, // px / sec^2
  MAX_DELTA_TIME: 0.033, // 33ms clamp to prevent tunneling through obstacles on frame drop

  // Dinosaur character dimensions
  DINO_WIDTH: 74,
  DINO_HEIGHT: 74,
  DINO_X_POS: 48, // Fixed horizontal distance from left edge

  // Ground level relative to bottom of game viewport
  GROUND_HEIGHT: 110,

  // Animation timings (seconds)
  BASE_STRIDE_INTERVAL: 0.055, // At base speed (300px/s) for 8-frame cycle
  LANDING_SQUASH_DURATION: 0.12, // Elastic impact duration
};

export interface DinoPhysicsState {
  y: number; // 0 is ground level, positive is air
  vy: number;
  isGrounded: boolean;
  state: 'idle' | 'running' | 'jumping' | 'falling' | 'landing' | 'gameover';
  jumpPhase: JumpPhase;
  rotation: number;
  scaleX: number;
  scaleY: number;
  runFrame: number; // 0 to 7
  animTimer: number;
  stridePhase: number;
  landingTimer: number;
  dustTimer: number;
  showDust: boolean;
  expression: DinoExpression;
  expressionTimer: number;
}

export function createInitialDinoPhysics(): DinoPhysicsState {
  return {
    y: 0,
    vy: 0,
    isGrounded: true,
    state: 'running',
    jumpPhase: 'rise',
    rotation: 2.5,
    scaleX: 1,
    scaleY: 1,
    runFrame: 0,
    animTimer: 0,
    stridePhase: 0,
    landingTimer: 0,
    dustTimer: 0,
    showDust: false,
    expression: 'normal',
    expressionTimer: 0,
  };
}

export function updateDinoPhysics(
  dino: DinoPhysicsState,
  dt: number,
  currentSpeed: number = PHYSICS.INITIAL_SPEED,
  onLand?: () => void
): DinoPhysicsState {
  const clampedDt = Math.min(dt, PHYSICS.MAX_DELTA_TIME);

  let newY = dino.y;
  let newVy = dino.vy;
  let isGrounded = dino.isGrounded;
  let state = dino.state;
  let jumpPhase = dino.jumpPhase;
  let rotation = dino.rotation;
  let scaleX = dino.scaleX;
  let scaleY = dino.scaleY;
  let landingTimer = dino.landingTimer;
  let dustTimer = Math.max(0, dino.dustTimer - clampedDt);
  let expression = dino.expression;
  let expressionTimer = Math.max(0, dino.expressionTimer - clampedDt);
  if (expressionTimer === 0 && expression !== 'normal' && state !== 'gameover') {
    expression = 'normal';
  }
  let runFrame = dino.runFrame;
  let animTimer = dino.animTimer + clampedDt;
  let stridePhase = dino.stridePhase;

  if (!isGrounded) {
    // ---- SMOOTH, SATISFYING PLATFORMER JUMP DYNAMICS ----
    const absVy = Math.abs(newVy);
    let effectiveGravity = PHYSICS.GRAVITY;

    // Gentle buoyancy near apex for satisfying crest hang-time
    if (absVy <= 120) {
      effectiveGravity = PHYSICS.GRAVITY * 0.82; // gentle 18% float
    } else if (newVy < -120) {
      effectiveGravity = PHYSICS.GRAVITY * 1.10; // snappy, crisp descent
    }

    newVy += effectiveGravity * clampedDt;
    newY += newVy * clampedDt;

    if (newY <= 0) {
      // Touchdown impact with ground
      newY = 0;
      newVy = 0;
      isGrounded = true;
      landingTimer = PHYSICS.LANDING_SQUASH_DURATION;
      state = 'landing';
      jumpPhase = 'fall';
      rotation = 1.0;
      scaleX = 1.0;
      scaleY = 1.0;
      dustTimer = 0.14; // dust puff on landing
      if (onLand) onLand();
    } else {
      // Distinct, natural jump flight phases:
      if (newVy > 660) {
        // Phase 1: Launch Extension (initial takeoff thrust)
        state = 'jumping';
        jumpPhase = 'launch';
        rotation += (-3 - rotation) * Math.min(1.0, clampedDt * 20);
        scaleY = 1.0;
        scaleX = 1.0;
      } else if (newVy > 120) {
        // Phase 2: Ascent Leap (tucked feet, upward aerodynamic angle)
        state = 'jumping';
        jumpPhase = 'rise';
        rotation += (-5 - rotation) * Math.min(1.0, clampedDt * 16);
        scaleY = 1.0;
        scaleX = 1.0;
      } else if (absVy <= 120) {
        // Phase 3: Apex Float (level, heroic crest)
        state = 'jumping';
        jumpPhase = 'apex';
        rotation += (0 - rotation) * Math.min(1.0, clampedDt * 12);
        scaleX = 1.0;
        scaleY = 1.0;
      } else {
        // Phase 4: Descent (forward tilt, legs extending down to meet ground)
        state = 'falling';
        jumpPhase = 'fall';
        rotation += (4 - rotation) * Math.min(1.0, clampedDt * 14);
        scaleY = 1.0;
        scaleX = 1.0;
      }
    }
  } else {
    // ---- ON GROUND: RUN CYCLE & ELASTIC LANDING ----
    newY = 0; // Feet securely on the grass baseline

    if (landingTimer > 0) {
      landingTimer -= clampedDt;
      state = 'landing';

      scaleX = 1.0;
      scaleY = 1.0;
      rotation += (2.5 - rotation) * Math.min(1.0, clampedDt * 20);
    } else {
      state = 'running';

      // Dynamic stride frequency synchronized with ground speed
      const speedRatio = Math.max(1.0, currentSpeed / PHYSICS.INITIAL_SPEED);
      const strideInterval = Math.max(0.035, PHYSICS.BASE_STRIDE_INTERVAL / speedRatio);

      const phaseDelta = (clampedDt / strideInterval) * (Math.PI / 4);
      stridePhase = (stridePhase + phaseDelta) % (Math.PI * 2);

      if (animTimer >= strideInterval) {
        animTimer = 0;
        runFrame = (runFrame + 1) % 8;

        // Trigger dust puff on footfall contact frames (0 and 4)
        if (runFrame === 0 || runFrame === 4) {
          dustTimer = 0.08;
        }
      }

      // Athletic, confident forward sprint lean
      rotation = 2.5;
      scaleX = 1.0;
      scaleY = 1.0;
    }
  }

  return {
    y: newY,
    vy: newVy,
    isGrounded,
    state,
    jumpPhase,
    rotation,
    scaleX,
    scaleY,
    runFrame,
    animTimer,
    stridePhase,
    landingTimer,
    dustTimer,
    showDust: dustTimer > 0,
    expression,
    expressionTimer,
  };
}

export function triggerJump(dino: DinoPhysicsState): DinoPhysicsState {
  if (!dino.isGrounded) return dino;

  return {
    ...dino,
    vy: PHYSICS.JUMP_FORCE,
    isGrounded: false,
    state: 'jumping',
    jumpPhase: 'launch',
    landingTimer: 0,
    rotation: -3,
    scaleX: 1.0,
    scaleY: 1.0,
    dustTimer: 0.16,
    showDust: true,
  };
}
