export type GameState = 'HOME' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type DinoAnimState = 'idle' | 'running' | 'jumping' | 'falling' | 'landing' | 'gameover';

export type DinoExpression =
  | 'normal'
  | 'coin'
  | 'love'
  | 'wink'
  | 'happy'
  | 'excited'
  | 'celebrate'
  | 'hurt'
  | 'dizzy'
  | 'laugh';

export type JumpPhase = 'launch' | 'rise' | 'apex' | 'fall';

export type ObstacleType =
  | 'cactus_small'
  | 'cactus_tall'
  | 'cactus_flower'
  | 'rock'
  | 'bird_low'
  | 'bird_high';

export interface HitBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ObstacleEntity {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  passed: boolean;
  animFrame?: number;
}

export interface CoinEntity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
  collectedAnimTimer?: number;
}

export interface DinoEntity {
  x: number;
  y: number; // Vertical position above ground
  vy: number; // Vertical velocity
  width: number;
  height: number;
  isGrounded: boolean;
  state: DinoAnimState;
  jumpPhase: JumpPhase;
  runFrame: number; // 0 to 7 (8-frame cycle)
  animTimer: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  showDust?: boolean;
  expression?: DinoExpression;
  isInvulnerable?: boolean;
}

export interface GameStats {
  score: number;
  coinsThisRun: number;
  distance: number;
  speed: number;
}

export interface UserPersistedData {
  bestScore: number;
  totalCoins: number;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}
