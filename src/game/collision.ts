import { DinoEntity, ObstacleEntity, CoinEntity, HitBox } from '../types/game';

// Obstacle collision: Inset hitbox for forgiving arcade gameplay (player doesn't die on edge grazes)
export function getDinoObstacleHitBox(dino: DinoEntity, groundY: number): HitBox {
  const screenY = groundY - dino.y - dino.height;
  const insetX = dino.width * 0.20;
  const insetY = dino.height * 0.16;

  return {
    x: dino.x + insetX,
    y: screenY + insetY,
    width: dino.width - insetX * 2,
    height: dino.height - insetY * 2,
  };
}

// Coin collection: Generous magnetic collection halo around the dinosaur
export function getDinoCoinCollectorHitBox(dino: DinoEntity, groundY: number): HitBox {
  const screenY = groundY - dino.y - dino.height;
  const haloX = 10;
  const haloY = 12;

  return {
    x: dino.x - haloX,
    y: screenY - haloY,
    width: dino.width + haloX * 2,
    height: dino.height + haloY * 2,
  };
}

export function getObstacleHitBox(obstacle: ObstacleEntity, groundY: number): HitBox {
  const screenY = groundY - obstacle.y - obstacle.height;
  const insetX = obstacle.width * 0.18;
  const insetTop = obstacle.height * 0.12;

  return {
    x: obstacle.x + insetX,
    y: screenY + insetTop,
    width: obstacle.width - insetX * 2,
    height: obstacle.height - insetTop,
  };
}

export function getCoinHitBox(coin: CoinEntity, groundY: number): HitBox {
  const screenY = groundY - coin.y - coin.height;
  // Generous arcade collection radius (+12px)
  const padding = 12;

  return {
    x: coin.x - padding,
    y: screenY - padding,
    width: coin.width + padding * 2,
    height: coin.height + padding * 2,
  };
}

export function checkAABBCollision(boxA: HitBox, boxB: HitBox): boolean {
  return (
    boxA.x < boxB.x + boxB.width &&
    boxA.x + boxA.width > boxB.x &&
    boxA.y < boxB.y + boxB.height &&
    boxA.y + boxA.height > boxB.y
  );
}

export function checkDinoObstacleCollision(
  dino: DinoEntity,
  obstacle: ObstacleEntity,
  groundY: number
): boolean {
  const dinoBox = getDinoObstacleHitBox(dino, groundY);
  const obsBox = getObstacleHitBox(obstacle, groundY);
  return checkAABBCollision(dinoBox, obsBox);
}

export function checkDinoCoinCollision(
  dino: DinoEntity,
  coin: CoinEntity,
  groundY: number
): boolean {
  if (coin.collected) return false;
  const dinoBox = getDinoCoinCollectorHitBox(dino, groundY);
  const coinBox = getCoinHitBox(coin, groundY);
  return checkAABBCollision(dinoBox, coinBox);
}
