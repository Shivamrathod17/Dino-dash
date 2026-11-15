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


export function getObstacleHitBox(obstacle: ObstacleEntity, groundY: number): HitBox {
  const screenY = groundY - obstacle.y - obstacle.height;

  if (obstacle.type === 'bird_low' || obstacle.type === 'bird_high') {
    // Flying bird hitbox: body is centered, wings spread
    const insetX = obstacle.width * 0.15;
    const insetY = obstacle.height * 0.18;
    return {
      x: obstacle.x + insetX,
      y: screenY + insetY,
      width: obstacle.width - insetX * 2,
      height: obstacle.height - insetY * 2,
    };
  }

  if (obstacle.type === 'rock') {
    // Stone / Rock is low to the ground
    const insetX = obstacle.width * 0.12;
    const insetTop = obstacle.height * 0.10;
    return {
      x: obstacle.x + insetX,
      y: screenY + insetTop,
      width: obstacle.width - insetX * 2,
      height: obstacle.height - insetTop,
    };
  }

  // Cacti
  const insetX = obstacle.width * 0.18;
  const insetTop = obstacle.height * 0.12;

  return {
    x: obstacle.x + insetX,
    y: screenY + insetTop,
    width: obstacle.width - insetX * 2,
    height: obstacle.height - insetTop,
  };
}

// Exact physical touch box of the dinosaur's body
export function getDinoBodyHitBox(dino: DinoEntity, groundY: number): HitBox {
  const screenY = groundY - dino.y - dino.height;
  // Natural bounds of the character body within the 74x74 container
  const insetX = dino.width * 0.12;
  const insetY = dino.height * 0.08;

  return {
    x: dino.x + insetX,
    y: screenY + insetY,
    width: dino.width - insetX * 2,
    height: dino.height - insetY * 2,
  };
}

export function getCoinHitBox(coin: CoinEntity, groundY: number): HitBox {
  const screenY = groundY - coin.y - coin.height;

  // True visual bounds of the coin (no magnetic padding)
  const inset = coin.width * 0.08;
  return {
    x: coin.x + inset,
    y: screenY + inset,
    width: coin.width - inset * 2,
    height: coin.height - inset * 2,
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

/**
 * Exact Touch Collision:
 * Only collects a coin if the Dino's physical body ACTUALLY touches the coin!
 * Any coin that is not touched will NOT be collected.
 */
export function checkDinoCoinCollision(
  dino: DinoEntity,
  coin: CoinEntity,
  groundY: number
): boolean {
  if (coin.collected) return false;

  const dinoBody = getDinoBodyHitBox(dino, groundY);
  const coinScreenY = groundY - coin.y - coin.height;

  // Coin circle center and radius (exact circular touch area)
  const coinRadius = coin.width * 0.44; // ~15px radius for 34px coin
  const coinCenterX = coin.x + coin.width / 2;
  const coinCenterY = coinScreenY + coin.height / 2;

  // Find the closest point on the Dino's body rectangle to the coin circle center
  const closestX = Math.max(dinoBody.x, Math.min(coinCenterX, dinoBody.x + dinoBody.width));
  const closestY = Math.max(dinoBody.y, Math.min(coinCenterY, dinoBody.y + dinoBody.height));

  // Distance squared from closest point to circle center
  const distX = coinCenterX - closestX;
  const distY = coinCenterY - closestY;
  const distSquared = distX * distX + distY * distY;

  // Exact physical touch contact
  return distSquared <= coinRadius * coinRadius;
}
