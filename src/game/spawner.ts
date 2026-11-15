import { ObstacleEntity, ObstacleType, CoinEntity } from '../types/game';

let nextEntityId = 1;

export type ObstacleCategory = 'stone' | 'bird' | 'cactus' | 'eagle';

let globalRunCounter = 0;
let lastSpawnedCategory: ObstacleCategory | null = null;
let lastSpawnedType: ObstacleType | null = null;
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
 * a DIFFERENT obstacle!
 */
export function resetSpawnerForNewRun(): void {
  globalRunCounter += 1;
  lastSpawnedCategory = null;
  lastSpawnedType = null;
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
 * Progressive Difficulty Curve & Dynamic Obstacle Selection:
 * 
 * 1. Early / Beginner Tier (score < 100):
 *    - Designed specifically so players immediately feel: "Haan, main khel sakta hoon!"
 *    - Strictly simple ground hurdles: 'rock' and 'cactus_small'
 *    - Both have low height and very forgiving jump clearance
 *    - Alternates strictly between 'rock' and 'cactus_small' (Run 1 starts with 'rock', Run 2 starts with 'cactus_small')
 *    - NO high birds, NO low birds, NO swooping eagles in this warm-up stage!
 * 
 * 2. Intermediate Tier (100 <= score < 250):
 *    - Introduces 'cactus_flower' (flowered cactus) and 'bird_low' (low pterodactyl to jump over)
 *    - Categories: ['stone', 'cactus', 'bird']
 *    - Strictly never spawns the same category twice in a row
 * 
 * 3. Advanced / High-Thrill Tier (score >= 250):
 *    - Full obstacle roster unlocked: 'eagle' (swooping predator), 'bird_high' (overhead bird to duck/run under),
 *      and 'cactus_tall' (tall cactus)
 *    - Categories: ['stone', 'bird', 'cactus', 'eagle']
 *    - Strictly never spawns the same category twice in a row
 */
export function pickObstacleType(score: number): ObstacleType {
  if (score < 100) {
    // Beginner Tier: Only simple single-ground hurdles
    if (isFirstSpawnOfRun) {
      isFirstSpawnOfRun = false;
      const starterType: ObstacleType = globalRunCounter % 2 === 0 ? 'rock' : 'cactus_small';
      lastSpawnedCategory = getCategoryForType(starterType);
      lastSpawnedType = starterType;
      return starterType;
    }

    // Alternate between rock and small cactus (guarantees variety + beginner friendliness)
    const nextType: ObstacleType = lastSpawnedType === 'rock' ? 'cactus_small' : 'rock';
    lastSpawnedType = nextType;
    lastSpawnedCategory = getCategoryForType(nextType);
    return nextType;
  }

  isFirstSpawnOfRun = false;

  if (score < 250) {
    // Intermediate Tier: Stone, Cactus (small or flower), and Low Flying Bird
    const midCategories: ObstacleCategory[] = ['stone', 'cactus', 'bird'];
    const candidates = midCategories.filter((c) => c !== lastSpawnedCategory);
    const category = candidates[Math.floor(Math.random() * candidates.length)];
    lastSpawnedCategory = category;

    switch (category) {
      case 'stone':
        lastSpawnedType = 'rock';
        return 'rock';
      case 'bird':
        lastSpawnedType = 'bird_low';
        return 'bird_low';
      case 'cactus': {
        const cType: ObstacleType = Math.random() < 0.5 ? 'cactus_small' : 'cactus_flower';
        lastSpawnedType = cType;
        return cType;
      }
      default:
        lastSpawnedType = 'rock';
        return 'rock';
    }
  }

  // Advanced Tier: Full obstacle roster with all 4 distinct categories!
  const allCategories: ObstacleCategory[] = ['stone', 'bird', 'cactus', 'eagle'];
  const candidates = allCategories.filter((c) => c !== lastSpawnedCategory);
  const category = candidates[Math.floor(Math.random() * candidates.length)];
  lastSpawnedCategory = category;

  switch (category) {
    case 'stone':
      lastSpawnedType = 'rock';
      return 'rock';

    case 'bird': {
      const bType: ObstacleType = Math.random() < 0.55 ? 'bird_low' : 'bird_high';
      lastSpawnedType = bType;
      return bType;
    }

    case 'eagle':
      lastSpawnedType = 'eagle';
      return 'eagle';

    case 'cactus': {
      const roll = Math.random();
      const cType: ObstacleType =
        roll < 0.35 ? 'cactus_small' : roll < 0.70 ? 'cactus_flower' : 'cactus_tall';
      lastSpawnedType = cType;
      return cType;
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

  let minSafeDistance: number;
  let randomAdditionalGap: number;

  if (score < 100) {
    // Beginner Tier: Extra wide, forgiving gaps so the player has plenty of reaction time (2.0s+ between jumps)
    minSafeDistance = 380 + speed * 0.35;
    randomAdditionalGap = 50 + Math.random() * 100;
  } else if (score < 250) {
    // Intermediate Tier: Moderate comfortable gaps
    minSafeDistance = 300 + speed * 0.40;
    randomAdditionalGap = 40 + Math.random() * 120;
  } else {
    // Advanced Tier: Dynamic responsive pacing
    minSafeDistance = 250 + speed * 0.45;
    randomAdditionalGap = Math.random() * 180;
  }

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
