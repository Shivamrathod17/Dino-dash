import { useState, useRef, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  GameState,
  DinoEntity,
  ObstacleEntity,
  CoinEntity,
  GameStats,
} from '../types/game';
import {
  PHYSICS,
  DinoPhysicsState,
  createInitialDinoPhysics,
  updateDinoPhysics,
  triggerJump,
} from './physics';
import {
  checkDinoObstacleCollision,
  checkDinoCoinCollision,
} from './collision';
import {
  spawnObstacle,
  spawnCoinPattern,
  spawnJumpArcCoins,
  spawnGroundRunCoins,
  resetSpawnerForNewRun,
} from './spawner';
import { AudioManager } from '../audio/audio';
import { StorageManager } from '../storage/storage';

interface UseGameLoopOptions {
  screenWidth: number;
  screenHeight: number;
}

export function useGameLoop({ screenWidth, screenHeight }: UseGameLoopOptions) {
  const [gameState, setGameState] = useState<GameState>('HOME');
  const [score, setScore] = useState<number>(0);
  const [coinsThisRun, setCoinsThisRun] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [totalCoins, setTotalCoins] = useState<number>(0);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);

  // Entities state exposed for rendering
  const [dinoRender, setDinoRender] = useState<DinoEntity>({
    x: PHYSICS.DINO_X_POS,
    y: 0,
    vy: 0,
    width: PHYSICS.DINO_WIDTH,
    height: PHYSICS.DINO_HEIGHT,
    isGrounded: true,
    state: 'idle',
    jumpPhase: 'rise',
    runFrame: 0,
    animTimer: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  });

  const [obstacles, setObstacles] = useState<ObstacleEntity[]>([]);
  const [coins, setCoins] = useState<CoinEntity[]>([]);
  const [groundOffset, setGroundOffset] = useState<number>(0);

  // Mutable refs for high-frequency physics loop (avoid stale closures)
  const gameStateRef = useRef<GameState>('HOME');
  gameStateRef.current = gameState;

  const dinoPhysicsRef = useRef<DinoPhysicsState>(createInitialDinoPhysics());
  const obstaclesRef = useRef<ObstacleEntity[]>([]);
  const coinsRef = useRef<CoinEntity[]>([]);
  const statsRef = useRef<GameStats>({
    score: 0,
    coinsThisRun: 0,
    distance: 0,
    speed: PHYSICS.INITIAL_SPEED,
  });

  const groundOffsetRef = useRef<number>(0);
  const nextObstacleDistRef = useRef<number>(360);
  const lastTimeRef = useRef<number | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isRevivingRef = useRef<boolean>(false);
  const isRevivingInProgressRef = useRef<boolean>(false);
  const invulnerableTimerRef = useRef<number>(0);
  const jumpBufferTimerRef = useRef<number>(0);
  const revivesCountRef = useRef<number>(0);
  const [revivesCount, setRevivesCount] = useState<number>(0);
  const coinsBankedThisRunRef = useRef<number>(0);

  // Dynamic Revive cost: 100 for 1st, 200 for 2nd, etc. (based on current run coins)
  const reviveCost = (revivesCount + 1) * 100;
  const canRevive = coinsThisRun >= reviveCost;

  // Ground Y on screen
  const groundY = screenHeight - PHYSICS.GROUND_HEIGHT;

  // Load saved data on init
  useEffect(() => {
    AudioManager.init();
    StorageManager.loadUserData().then((data) => {
      setBestScore(data.bestScore);
      setTotalCoins(data.totalCoins);
    });

    return () => {
      AudioManager.cleanup();
    };
  }, []);

  // Jump action
  const jump = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING') return;

    if (dinoPhysicsRef.current.isGrounded) {
      dinoPhysicsRef.current = triggerJump(dinoPhysicsRef.current);
      AudioManager.playJump();
      jumpBufferTimerRef.current = 0;
    } else if (dinoPhysicsRef.current.vy < 0 && dinoPhysicsRef.current.y < 55) {
      // Jump buffer: if player taps just before landing, queue the jump
      jumpBufferTimerRef.current = 0.14;
    }
  }, []);

  // End run
  const handleGameOver = useCallback(() => {
    if (gameStateRef.current === 'GAMEOVER') return;

    gameStateRef.current = 'GAMEOVER';
    setGameState('GAMEOVER');

    AudioManager.playGameOver();

    const currentScore = Math.floor(statsRef.current.score);
    const cached = StorageManager.getCachedData();
    const newRecord = currentScore > cached.bestScore;
    setIsNewHighScore(newRecord);

    if (newRecord) {
      StorageManager.saveBestScore(currentScore);
      setBestScore(currentScore);
    }

    // Set dino to dead state
    dinoPhysicsRef.current.state = 'gameover';
    dinoPhysicsRef.current.expression = 'hurt';
    setDinoRender((prev) => ({
      ...prev,
      state: 'gameover',
      expression: 'hurt',
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      showDust: false,
    }));
  }, []);

  // Start / Restart game
  const startGame = useCallback(() => {
    AudioManager.playButton();
    setIsNewHighScore(false);
    resetSpawnerForNewRun();
    isRevivingRef.current = false;
    isRevivingInProgressRef.current = false;
    invulnerableTimerRef.current = 0;
    revivesCountRef.current = 0;
    setRevivesCount(0);
    coinsBankedThisRunRef.current = 0;

    jumpBufferTimerRef.current = 0;
    dinoPhysicsRef.current = createInitialDinoPhysics();
    statsRef.current = {
      score: 0,
      coinsThisRun: 0,
      distance: 0,
      speed: PHYSICS.INITIAL_SPEED,
    };
    obstaclesRef.current = [];
    coinsRef.current = [];
    groundOffsetRef.current = 0;
    nextObstacleDistRef.current = 320;
    lastTimeRef.current = null;

    setScore(0);
    setCoinsThisRun(0);
    setObstacles([]);
    setCoins([]);
    setGroundOffset(0);

    setDinoRender({
      x: PHYSICS.DINO_X_POS,
      y: 0,
      vy: 0,
      width: PHYSICS.DINO_WIDTH,
      height: PHYSICS.DINO_HEIGHT,
      isGrounded: true,
      state: 'running',
      jumpPhase: 'rise',
      runFrame: 0,
      animTimer: 0,
      rotation: 2.5,
      scaleX: 1,
      scaleY: 1,
      showDust: false,
    });

    gameStateRef.current = 'PLAYING';
    setGameState('PLAYING');
  }, []);

  // Pause
  const pauseGame = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING') return;
    AudioManager.playButton();
    gameStateRef.current = 'PAUSED';
    setGameState('PAUSED');
  }, []);

  // Resume
  const resumeGame = useCallback(() => {
    if (gameStateRef.current !== 'PAUSED') return;
    AudioManager.playButton();
    lastTimeRef.current = null; // Reset delta baseline so no leap
    gameStateRef.current = 'PLAYING';
    setGameState('PLAYING');
  }, []);

  // Go to Home
  const returnToHome = useCallback(() => {
    AudioManager.playButton();
    resetSpawnerForNewRun();
    jumpBufferTimerRef.current = 0;
    revivesCountRef.current = 0;
    setRevivesCount(0);
    coinsBankedThisRunRef.current = 0;
    gameStateRef.current = 'HOME';
    setGameState('HOME');

    dinoPhysicsRef.current = {
      ...createInitialDinoPhysics(),
      state: 'idle',
    };
    setDinoRender({
      x: PHYSICS.DINO_X_POS,
      y: 0,
      vy: 0,
      width: PHYSICS.DINO_WIDTH,
      height: PHYSICS.DINO_HEIGHT,
      isGrounded: true,
      state: 'idle',
      jumpPhase: 'rise',
      runFrame: 0,
      animTimer: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      showDust: false,
    });
    setObstacles([]);
    setCoins([]);
    setScore(0);
    setCoinsThisRun(0);
  }, []);

  // Coin-Based Revive: 100 coins for 1st, 200 for 2nd, etc. (deducted from current run coins)
  const revivePlayer = useCallback(() => {
    if (gameStateRef.current !== 'GAMEOVER' || isRevivingInProgressRef.current) return;
    isRevivingInProgressRef.current = true;

    const cost = (revivesCountRef.current + 1) * 100;
    const currentRunCoins = statsRef.current.coinsThisRun;
    if (currentRunCoins < cost) {
      isRevivingInProgressRef.current = false;
      return;
    }

    // Deduct coins from current run
    const remainingCoins = currentRunCoins - cost;
    statsRef.current.coinsThisRun = remainingCoins;
    setCoinsThisRun(remainingCoins);
    setTotalCoins(remainingCoins);

    revivesCountRef.current += 1;
    setRevivesCount(revivesCountRef.current);

    AudioManager.playCoin();
    AudioManager.playButton();

    // Clear immediate obstacles ahead of player
    obstaclesRef.current = obstaclesRef.current.filter((obs) => obs.x > screenWidth * 0.7);
    setObstacles([...obstaclesRef.current]);

    // Reset dino on ground with 2 seconds invulnerability & celebratory pose
    jumpBufferTimerRef.current = 0;
    dinoPhysicsRef.current = createInitialDinoPhysics();
    dinoPhysicsRef.current.expression = 'celebrate';
    dinoPhysicsRef.current.expressionTimer = 0.8;
    invulnerableTimerRef.current = 2.0;
    isRevivingRef.current = true;
    lastTimeRef.current = null;

    gameStateRef.current = 'PLAYING';
    setGameState('PLAYING');

    setTimeout(() => {
      isRevivingInProgressRef.current = false;
    }, 400);
  }, [screenWidth]);

  // Handle AppState (auto pause when app is backgrounded)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState.match(/inactive|background/) && gameStateRef.current === 'PLAYING') {
        pauseGame();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [pauseGame]);

  // Main animation frame loop
  useEffect(() => {
    let isRunning = true;

    const gameLoop = (timestamp: number) => {
      if (!isRunning) return;

      if (gameStateRef.current === 'PLAYING') {
        if (lastTimeRef.current === null) {
          lastTimeRef.current = timestamp;
          animFrameIdRef.current = requestAnimationFrame(gameLoop);
          return;
        }

        const rawDt = (timestamp - lastTimeRef.current) / 1000;
        lastTimeRef.current = timestamp;
        const dt = Math.min(rawDt, PHYSICS.MAX_DELTA_TIME);

        // 1. Update Speed & Distance with Anti-Speedhack clamp
        const stats = statsRef.current;
        stats.speed = Math.min(
          PHYSICS.MAX_SPEED,
          stats.speed + PHYSICS.SPEED_ACCELERATION * dt
        );
        const maxAllowedDelta = PHYSICS.MAX_SPEED * PHYSICS.MAX_DELTA_TIME * 1.5;
        const moveDist = Math.min(stats.speed * dt, maxAllowedDelta);
        stats.distance += moveDist;
        stats.score = stats.distance / 10;
        setScore(Math.floor(stats.score));

        // 2. Update Ground Parallax
        groundOffsetRef.current = (groundOffsetRef.current + moveDist) % 600;
        setGroundOffset(groundOffsetRef.current);

        // 3. Update Dino Physics
        const updatedDino = updateDinoPhysics(
          dinoPhysicsRef.current,
          dt,
          stats.speed,
          () => {
            AudioManager.playLand();
          }
        );
        dinoPhysicsRef.current = updatedDino;

        // Process buffered jump input on touchdown
        if (jumpBufferTimerRef.current > 0) {
          jumpBufferTimerRef.current -= dt;
          if (dinoPhysicsRef.current.isGrounded) {
            dinoPhysicsRef.current = triggerJump(dinoPhysicsRef.current);
            AudioManager.playJump();
            jumpBufferTimerRef.current = 0;
          }
        }

        // Invulnerability countdown if revived
        if (invulnerableTimerRef.current > 0) {
          invulnerableTimerRef.current -= dt;
        }

        // 4. Update Obstacles
        nextObstacleDistRef.current -= moveDist;
        if (nextObstacleDistRef.current <= 0) {
          const spawnX = screenWidth + 20;
          const { obstacle, nextGap } = spawnObstacle(spawnX, stats.score, stats.speed);
          obstaclesRef.current.push(obstacle);
          nextObstacleDistRef.current = nextGap;

          const obstacleCenterX = spawnX + obstacle.width / 2;

          // Spawn coins synchronized with player path
          if (obstacle.type === 'bird_high') {
            // High flying bird: player runs safely under, spawn ground coins beneath
            const groundCoinsX = spawnX + obstacle.width / 2 - 42;
            const groundGroup = spawnGroundRunCoins(groundCoinsX, 3);
            coinsRef.current.push(...groundGroup);
          } else if (obstacle.type === 'eagle') {
            // Eagle swoops at mid-height (y=40): spawn ground coins ahead
            const groundCoinsX = spawnX + obstacle.width + 60;
            const groundGroup = spawnGroundRunCoins(groundCoinsX, 3);
            coinsRef.current.push(...groundGroup);
          } else if (Math.random() < 0.70) {
            const coinGroup = spawnJumpArcCoins(obstacleCenterX, obstacle.height);
            coinsRef.current.push(...coinGroup);
          } else if (nextGap > 340) {
            // In wide open gaps between obstacles, spawn ground coins to collect while running
            const groundCoinsX = spawnX + obstacle.width + 80;
            const groundGroup = spawnGroundRunCoins(groundCoinsX, 3);
            coinsRef.current.push(...groundGroup);
          }
        }

        // Move obstacles
        const remainingObstacles: ObstacleEntity[] = [];
        let hitDetected = false;

        for (let i = 0; i < obstaclesRef.current.length; i++) {
          const obs = obstaclesRef.current[i];
          obs.x -= moveDist;

          // Animate flying wings (flapping up & down for birds and eagles)
          if (obs.type === 'bird_low' || obs.type === 'bird_high' || obs.type === 'eagle') {
            obs.animFrame = Math.floor(Date.now() / 150) % 2;
          }

          // Collision check
          if (invulnerableTimerRef.current <= 0 && !hitDetected) {
            const currentDinoEntity: DinoEntity = {
              x: PHYSICS.DINO_X_POS,
              y: updatedDino.y,
              vy: updatedDino.vy,
              width: PHYSICS.DINO_WIDTH,
              height: PHYSICS.DINO_HEIGHT,
              isGrounded: updatedDino.isGrounded,
              state: updatedDino.state,
              jumpPhase: updatedDino.jumpPhase,
              runFrame: updatedDino.runFrame,
              animTimer: updatedDino.animTimer,
              rotation: updatedDino.rotation,
              scaleX: updatedDino.scaleX,
              scaleY: updatedDino.scaleY,
            };

            if (checkDinoObstacleCollision(currentDinoEntity, obs, groundY)) {
              hitDetected = true;
              handleGameOver();
              // Don't kill loop! Loop continues running requestAnimationFrame
              break;
            }
          }

          // Keep if still on screen
          if (obs.x + obs.width > -40) {
            remainingObstacles.push(obs);
          }
        }

        obstaclesRef.current = remainingObstacles;
        setObstacles([...remainingObstacles]);

        // 5. Update Coins (only if not game over on this frame)
        if (!hitDetected && gameStateRef.current === 'PLAYING') {
          const remainingCoins: CoinEntity[] = [];
          let newlyCollectedCount = 0;

          for (let i = 0; i < coinsRef.current.length; i++) {
            const coin = coinsRef.current[i];
            coin.x -= moveDist;

            if (!coin.collected) {
              const currentDinoEntity: DinoEntity = {
                x: PHYSICS.DINO_X_POS,
                y: updatedDino.y,
                vy: updatedDino.vy,
                width: PHYSICS.DINO_WIDTH,
                height: PHYSICS.DINO_HEIGHT,
                isGrounded: updatedDino.isGrounded,
                state: updatedDino.state,
                jumpPhase: updatedDino.jumpPhase,
                runFrame: updatedDino.runFrame,
                animTimer: updatedDino.animTimer,
                rotation: updatedDino.rotation,
                scaleX: updatedDino.scaleX,
                scaleY: updatedDino.scaleY,
              };

              if (checkDinoCoinCollision(currentDinoEntity, coin, groundY)) {
                coin.collected = true;
                coin.collectedAnimTimer = 0.25;
                newlyCollectedCount++;
                AudioManager.playCoin();
                // Trigger celebratory/happy coin reaction expression!
                updatedDino.expression = Math.random() < 0.5 ? 'coin' : 'love';
                updatedDino.expressionTimer = 0.45;
              }
            } else if (coin.collectedAnimTimer && coin.collectedAnimTimer > 0) {
              coin.collectedAnimTimer -= dt;
              coin.y += 120 * dt; // Float up slightly on collection
            }

            if (coin.x + coin.width > -30 && (!coin.collected || (coin.collectedAnimTimer && coin.collectedAnimTimer > 0))) {
              remainingCoins.push(coin);
            }
          }
          coinsRef.current = remainingCoins;
          setCoins([...remainingCoins]);

          if (newlyCollectedCount > 0) {
            stats.coinsThisRun += newlyCollectedCount;
            setCoinsThisRun(stats.coinsThisRun);
          }

          // 6. Update Dino for rendering
          setDinoRender({
            x: PHYSICS.DINO_X_POS,
            y: updatedDino.y,
            vy: updatedDino.vy,
            width: PHYSICS.DINO_WIDTH,
            height: PHYSICS.DINO_HEIGHT,
            isGrounded: updatedDino.isGrounded,
            state: updatedDino.state,
            jumpPhase: updatedDino.jumpPhase,
            runFrame: updatedDino.runFrame,
            animTimer: updatedDino.animTimer,
            rotation: updatedDino.rotation,
            scaleX: 1,
            scaleY: 1,
            showDust: updatedDino.showDust,
            expression: updatedDino.expression,
            isInvulnerable: invulnerableTimerRef.current > 0,
          });
        }
      }

      animFrameIdRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [screenWidth, screenHeight, groundY, handleGameOver]);

  return {
    gameState,
    score,
    bestScore,
    coinsThisRun,
    totalCoins,
    isNewHighScore,
    dino: dinoRender,
    obstacles,
    coins,
    groundOffset,
    groundY,
    jump,
    startGame,
    pauseGame,
    resumeGame,
    returnToHome,
    revivePlayer,
    reviveCost,
    canRevive,
  };
}
