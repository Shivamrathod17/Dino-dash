import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StatusBar as RNStatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScoreCard } from '../components/ScoreCard';
import { CoinCounter } from '../components/CoinCounter';
import { Dinosaur } from '../components/Dinosaur';
import { ObstacleRenderer } from '../components/ObstacleRenderer';
import { CoinRenderer } from '../components/CoinRenderer';
import { ParallaxBackground } from '../components/ParallaxBackground';
import { GroundPlatform } from '../components/GroundPlatform';
import { GameOverModal } from './GameOverModal';
import { GameButton } from '../components/GameButton';
import { TutorialOverlay } from '../components/TutorialOverlay';
import {
  GameState,
  TutorialStep,
  DinoEntity,
  ObstacleEntity,
  CoinEntity,
} from '../types/game';
import { PHYSICS } from '../game/physics';

interface GamePlayScreenProps {
  gameState: GameState;
  tutorialStep?: TutorialStep;
  score: number;
  bestScore: number;
  coinsThisRun: number;
  totalCoins?: number;
  reviveCost?: number;
  canRevive?: boolean;
  isNewHighScore: boolean;
  dino: DinoEntity;
  obstacles: ObstacleEntity[];
  coins: CoinEntity[];
  groundOffset: number;
  groundY: number;
  screenWidth: number;
  screenHeight: number;
  onJump: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  onRevive?: () => void;
}

export const GamePlayScreen: React.FC<GamePlayScreenProps> = ({
  gameState,
  tutorialStep = 'hidden',
  score,
  bestScore,
  coinsThisRun,
  totalCoins = 0,
  reviveCost = 100,
  canRevive = false,
  isNewHighScore,
  dino,
  obstacles,
  coins,
  groundOffset,
  groundY,
  screenWidth,
  screenHeight,
  onJump,
  onPause,
  onResume,
  onRestart,
  onHome,
  onRevive,
}) => {
  const insets = useSafeAreaInsets();
  // Safe top padding that sits cleanly below camera punch-hole, notch, and status bar
  const topInset = Math.max(
    insets.top,
    RNStatusBar.currentHeight || 0,
    Platform.OS === 'android' ? 38 : 44
  ) + 12;

  const isPlaying = gameState === 'PLAYING';
  const isPaused = gameState === 'PAUSED';
  const isGameOver = gameState === 'GAMEOVER';

  return (
    <View style={styles.container}>
      {/* 1. Parallax background scenery */}
      <ParallaxBackground
        width={screenWidth}
        height={screenHeight}
        groundY={groundY}
      />

      {/* 2. Dynamic obstacles */}
      <ObstacleRenderer obstacles={obstacles} groundY={groundY} />

      {/* 3. Dynamic collectible coins */}
      <CoinRenderer coins={coins} groundY={groundY} />

      {/* 4. Player Dinosaur */}
      <Dinosaur dino={dino} groundY={groundY} />

      {/* 5. Moving ground platform */}
      <GroundPlatform
        width={screenWidth}
        groundY={groundY}
        height={PHYSICS.GROUND_HEIGHT}
        offset={groundOffset}
      />

      {/* 6. Tap-to-jump active touch layer (only active when playing) */}
      {isPlaying && (
        <TouchableWithoutFeedback onPress={onJump}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      )}

      {/* 6.1 Interactive Onboarding Hint (Only shows for beginners, auto-dismisses when proficient) */}
      {isPlaying && (
        <TutorialOverlay step={tutorialStep} screenHeight={screenHeight} />
      )}

      {/* 7. HUD Overlay (Pause button, Coins on Left | Center clear for Camera | Score on Right) */}
      {!isGameOver && !isPaused && (
        <View
          style={[styles.hudContainer, { paddingTop: topInset }]}
          pointerEvents="box-none"
        >
          <View style={styles.topHudRow} pointerEvents="box-none">
            {/* Left Cluster: Pause button & Coin counter together */}
            <View style={styles.leftCluster} pointerEvents="box-none">
              <TouchableOpacity
                onPress={onPause}
                style={styles.pauseButton}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.pauseIcon}>⏸</Text>
              </TouchableOpacity>

              <CoinCounter coins={coinsThisRun} />
            </View>

            {/* Right Cluster: Score card */}
            <ScoreCard label="SCORE" score={score} />
          </View>
        </View>
      )}

      {/* 8. Pause In-Tree Overlay */}
      {isPaused && (
        <View style={styles.modalBackdrop}>
          <View style={styles.pauseCard}>
            <Text style={styles.pauseTitle}>Game Paused</Text>
            <Text style={styles.pauseSubtitle}>Take a breather!</Text>

            <View style={styles.pauseScoreBox}>
              <Text style={styles.pauseScoreLabel}>CURRENT SCORE</Text>
              <Text style={styles.pauseScoreValue}>
                {score.toString().padStart(5, '0')}
              </Text>
            </View>

            <View style={styles.pauseButtons}>
              <GameButton
                title="RESUME"
                icon="▶"
                variant="green"
                onPress={onResume}
              />
              <GameButton
                title="RESTART"
                icon="↻"
                variant="orange"
                onPress={onRestart}
              />
              <GameButton
                title="HOME"
                icon="🏠"
                variant="blue"
                onPress={onHome}
              />
            </View>
          </View>
        </View>
      )}

      {/* 9. Game Over In-Tree Overlay */}
      <GameOverModal
        visible={isGameOver}
        score={score}
        bestScore={bestScore}
        isNewHighScore={isNewHighScore}
        coinsThisRun={coinsThisRun}
        totalCoins={totalCoins}
        reviveCost={reviveCost}
        canRevive={canRevive}
        onPlayAgain={onRestart}
        onHome={onHome}
        onRevive={onRevive}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#53c5ff',
  },
  hudContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topHudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  leftCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pauseButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  pauseIcon: {
    fontSize: 18,
    color: '#0284c7',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 15, 30, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 100,
    elevation: 20,
  },
  pauseCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 26,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  pauseTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
  },
  pauseSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 16,
  },
  pauseScoreBox: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 18,
    marginBottom: 16,
  },
  pauseScoreLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
  },
  pauseScoreValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0284c7',
    letterSpacing: 1.5,
  },
  pauseButtons: {
    width: '100%',
  },
});
