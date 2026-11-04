import { ObstacleEntity, ObstacleType, CoinEntity } from '../types/game';

let nextEntityId = 1;

export interface SpawnerState {
  lastObstacleX: number;
  lastCoinGroupX: number;
  minObstacleGap: number;
  nextObstacleSpawnDistance: number;
}

export function createInitialSpawnerState(): SpawnerState {
  return {
    lastObstacleX: 0,
    lastCoinGroupX: 0,
    minObstacleGap: 240,
    nextObstacleSpawnDistance: 320,
  };
}

export function getObstacleDimensions(type: ObstacleType): { width: number; height: number } {
  switch (type) {
    case 'cactus_small':
      return { width: 44, height: 65 };
    case 'cactus_tall':
      return { width: 52, height: 84 };
    case 'cactus_flower':
      return { width: 50, height: 82 };
    case 'rock':
      return { width: 50, height: 44 };
  }
}

export function pickObstacleType(score: number): ObstacleType {
  const roll = Math.random();
  if (score < 250) {
    return roll < 0.6 ? 'cactus_small' : 'cactus_tall';
  } else if (score < 600) {
    if (roll < 0.4) return 'cactus_small';
    if (roll < 0.75) return 'cactus_tall';
    return 'cactus_flower';
  } else {
    // Advanced: All types including spiked rock
    if (roll < 0.30) return 'cactus_small';
    if (roll < 0.55) return 'cactus_tall';
    if (roll < 0.80) return 'cactus_flower';
    return 'rock';
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
    y: 0,
    width: dims.width,
    height: dims.height,
    passed: false,
  };

  // Safe minimum distance scaling with speed so the jump is always humanly possible
  const minSafeDistance = 240 + speed * 0.45;
  const randomAdditionalGap = Math.random() * 220;
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
