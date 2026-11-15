import { ObstacleEntity, ObstacleType, CoinEntity } from '../types/game';

let nextEntityId = 1;
const recentSpawnTypes: ObstacleType[] = [];

export interface SpawnerState {
  lastObstacleX: number;
  lastCoinGroupX: number;
  minObstacleGap: number;
  nextObstacleSpawnDistance: number;
}

export function createInitialSpawnerState(): SpawnerState {
  recentSpawnTypes.length = 0;
  return {
    lastObstacleX: 0,
    lastCoinGroupX: 0,
    minObstacleGap: 240,
    nextObstacleSpawnDistance: 320,
  };
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
      return { width: 58, height: 46, y: 30 };
    case 'bird_high':
      // High flying bird/pterodactyl: flies high in the air, player runs underneath safely
      return { width: 58, height: 46, y: 92 };
  }
}

/**
 * Picks diverse obstacles right from early game:
 * cacti, rocks/stones, low flying birds, high flying birds
 * with anti-repetition so obstacles stay fresh and engaging!
 */
export function pickObstacleType(score: number): ObstacleType {
  const pool: { type: ObstacleType; weight: number }[] = [
    { type: 'cactus_small', weight: 24 },
    { type: 'cactus_flower', weight: 22 },
    { type: 'rock', weight: 24 },
    { type: 'cactus_tall', weight: score > 100 ? 15 : 6 },
    { type: 'bird_low', weight: 22 },
    { type: 'bird_high', weight: score > 60 ? 18 : 8 },
  ];

  // Strongly disincentivize repeating the last spawned type
  const lastType = recentSpawnTypes[recentSpawnTypes.length - 1];
  const adjustedPool = pool.map((item) => {
    let w = item.weight;
    if (item.type === lastType) {
      w = Math.max(2, Math.floor(w * 0.20));
    }
    return { type: item.type, weight: w };
  });

  const totalWeight = adjustedPool.reduce((sum, item) => sum + item.weight, 0);
  let rnd = Math.random() * totalWeight;
  let picked: ObstacleType = adjustedPool[0].type;
  for (const item of adjustedPool) {
    if (rnd < item.weight) {
      picked = item.type;
      break;
    }
    rnd -= item.weight;
  }

  recentSpawnTypes.push(picked);
  if (recentSpawnTypes.length > 3) recentSpawnTypes.shift();

  return picked;
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
