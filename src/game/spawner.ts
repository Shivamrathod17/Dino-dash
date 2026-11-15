import { ObstacleEntity, ObstacleType, CoinEntity } from '../types/game';

let nextEntityId = 1;

export type ObstacleCategory = 'stone' | 'bird' | 'cactus' | 'eagle';

let globalRunCounter = 0;
let lastSpawnedCategory: ObstacleCategory | null = null;
let isFirstSpawnOfRun = true;

export interface SpawnerState {
  lastObstacleX: number;
  lastCoinGroupX: number;
  minObstacleGap: number;
  nextObstacleSpawnDistance: number;
}

export function createInitialSpawnerState(): SpawnerState {
  resetSpawnerForNewRun();
  return {
    lastObstacleX: 0,
    lastCoinGroupX: 0,
    minObstacleGap: 240,
    nextObstacleSpawnDistance: 320,
  };
}

/**
 * Resets spawner state for each new game run.
 * Increments globalRunCounter so every single game run starts with
 * a DIFFERENT obstacle category!
 */
export function resetSpawnerForNewRun(): void {
  globalRunCounter += 1;
  lastSpawnedCategory = null;
  isFirstSpawnOfRun = true;
}

export function getCategoryForType(type: ObstacleType): ObstacleCategory {
  switch (type) {
    case 'cactus_small':
    case 'cactus_tall':
    case 'cactus_flower':
      return 'cactus';
    case 'rock':
      return 'stone';
    case 'bird_low':
    case 'bird_high':
      return 'bird';
    case 'eagle':
      return 'eagle';
  }
}

export function getObstacleDimensions(type: ObstacleType): { width: number; height: number; y: number } {
  switch (type) {
    case 'cactus_small':
      return { width: 44, height: 65, y: 0 };
    case 'cactus_tall':
      return { width: 52, height: 86, y: 0 };
    case 'cactus_flower':
      return { width: 50, height: 82, y: 0 };
    case 'rock':
      // Stone / Rock sitting low on the ground
      return { width: 52, height: 44, y: 0 };
    case 'bird_low':
      // Low flying bird/pterodactyl: flies just above ground, player jumps over
      return { width: 58, height: 46, y: 28 };
    case 'bird_high':
      // High flying bird/pterodactyl: flies high in the air, player runs underneath safely
      return { width: 58, height: 46, y: 92 };
    case 'eagle':
      // Flying Eagle: swoops across at mid-low height with animated flapping wings
      return { width: 60, height: 48, y: 40 };
  }
}

/**
 * Shuffled Category Spawning System:
 * 1. Each new game run starts with a completely different category (Rotating order: Stone -> Bird -> Cactus -> Eagle).
 * 2. Within a run, NEVER spawn two obstacles of the same category back-to-back.
 * This guarantees high variety and maximum user engagement on every run!
 */
export function pickObstacleType(score: number): ObstacleType {
  const allCategories: ObstacleCategory[] = ['stone', 'bird', 'cactus', 'eagle'];

  let category: ObstacleCategory;

  if (isFirstSpawnOfRun) {
    // Rotating starting theme for each new run
    category = allCategories[globalRunCounter % allCategories.length];
    isFirstSpawnOfRun = false;
  } else {
    // Strictly filter out the last category so no two identical themes appear in a row!
    const candidates = allCategories.filter((c) => c !== lastSpawnedCategory);
    category = candidates[Math.floor(Math.random() * candidates.length)];
  }

  lastSpawnedCategory = category;

  // Pick the specific visual variation for the chosen category
  switch (category) {
    case 'stone':
      return 'rock';

    case 'bird':
      return Math.random() < 0.55 ? 'bird_low' : 'bird_high';

    case 'eagle':
      return 'eagle';

    case 'cactus': {
      const roll = Math.random();
      if (roll < 0.40) return 'cactus_small';
      if (roll < 0.75) return 'cactus_flower';
      return 'cactus_tall';
    }
  }
}

export function spawnObstacle(
  spawnX: number,
  score: number,
  speed: number
): { obstacle: ObstacleEntity; nextGap: number } {
  const type = pickObstacleType(score);
  const dims = getObstacleDimensions(type);

  const obstacle: ObstacleEntity = {
    id: `obs_${nextEntityId++}`,
    type,
    x: spawnX,
    y: dims.y,
    width: dims.width,
    height: dims.height,
    passed: false,
    animFrame: 0,
  };

  // Safe minimum distance scaling with speed so the jump is always humanly possible
  const minSafeDistance = 250 + speed * 0.45;
  const randomAdditionalGap = Math.random() * 200;
  const nextGap = minSafeDistance + randomAdditionalGap;

  return { obstacle, nextGap };
}

/**
 * Spawns a 5-coin parabolic jump arc centered directly over the obstacle.
 * The arc perfectly matches the dinosaur's jump trajectory so the player
 * collects ALL 5 coins seamlessly while clearing the obstacle!
 */
export function spawnJumpArcCoins(
  obstacleCenterX: number,
  obstacleHeight: number = 70
): CoinEntity[] {
  const coins: CoinEntity[] = [];
  const coinSize = 34;

  // 5 coins symmetrically placed around the obstacle center:
  // Offsets: -72px (takeoff), -36px (rise), 0px (apex), +36px (fall), +72px (touchdown)
  const count = 5;
  const offsets = [-72, -36, 0, 36, 72];

  // Peak coin clears the obstacle and sits directly in the dinosaur's belly/chest
  const peakHeight = Math.max(120, obstacleHeight + 36);
  const midHeight = Math.max(88, peakHeight - 32);
  const baseHeight = 52;

  const heights = [baseHeight, midHeight, peakHeight, midHeight, baseHeight];

  for (let i = 0; i < count; i++) {
    coins.push({
      id: `coin_${nextEntityId++}`,
      x: obstacleCenterX + offsets[i] - coinSize / 2,
      y: heights[i],
      width: coinSize,
      height: coinSize,
      collected: false,
    });
  }

  return coins;
}

/**
 * Spawns a horizontal line of coins on the ground for casual collection while running
 */
export function spawnGroundRunCoins(startX: number, count = 3): CoinEntity[] {
  const coins: CoinEntity[] = [];
  const coinSize = 34;
  const spacingX = 42;
  const groundHeight = 18; // Perfect height for running dinosaur

  for (let i = 0; i < count; i++) {
    coins.push({
      id: `coin_${nextEntityId++}`,
      x: startX + i * spacingX,
      y: groundHeight,
      width: coinSize,
      height: coinSize,
      collected: false,
    });
  }

  return coins;
}

// Fallback legacy pattern
export function spawnCoinPattern(
  startX: number,
  patternType: 'arc' | 'line' | 'high_arc'
): CoinEntity[] {
  if (patternType === 'arc' || patternType === 'high_arc') {
    return spawnJumpArcCoins(startX + 40, 75);
  } else {
    return spawnGroundRunCoins(startX, 3);
  }
}
