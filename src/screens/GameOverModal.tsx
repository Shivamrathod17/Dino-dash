import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Animated,
} from 'react-native';
import { GameButton } from '../components/GameButton';

interface GameOverModalProps {
  visible: boolean;
  score: number;
  bestScore: number;
  isNewHighScore: boolean;
  coinsThisRun?: number;
  totalCoins?: number;
  reviveCost?: number;
  canRevive?: boolean;
  onPlayAgain: () => void;
  onHome: () => void;
  onRevive?: () => void;
}

const SAD_DINO_IMG = require('../../assets/sprites/dino_dead.png');

export const GameOverModal: React.FC<GameOverModalProps> = ({
  visible,
  score,
  bestScore,
  isNewHighScore,
  coinsThisRun = 0,
  totalCoins = 0,
  reviveCost = 100,
  canRevive = false,
  onPlayAgain,
  onHome,
  onRevive,
}) => {
  const [sorryMessage, setSorryMessage] = useState<string | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Reset sorry message whenever modal becomes visible or resets
  useEffect(() => {
    if (visible) {
      setSorryMessage(null);
    }
  }, [visible]);

  if (!visible) return null;

  const formattedScore = score.toString().padStart(5, '0');
  const formattedBest = bestScore.toString().padStart(5, '0');

  const handleRevivePress = () => {
    if (canRevive && onRevive) {
      setSorryMessage(null);
      onRevive();
    } else {
      const missingCoins = Math.max(0, reviveCost - coinsThisRun);
      setSorryMessage(`😔 Sorry! You need ${missingCoins} more coins to revive.`);

      // Horizontal shake animation on the sorry message box
      shakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  };

  return (
    <View style={styles.backdrop}>
      <View style={styles.modalCard}>
        {/* Game Over Title */}
        <Text style={styles.gameOverText}>Game Over!</Text>

        {/* Current Score Display */}
        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.currentScoreText}>{formattedScore}</Text>
        </View>

        {/* Best Score Display */}
        <View style={styles.bestScoreRow}>
          <Text style={styles.crownIcon}>👑</Text>
          <Text style={styles.bestScoreLabel}>
            {isNewHighScore ? 'NEW BEST SCORE' : 'BEST SCORE'}
          </Text>
          <Text style={styles.bestScoreValue}>{formattedBest}</Text>
        </View>

        {/* Coins Badge: Shows coins collected in this run */}
        <View style={styles.coinsRow}>
          <View style={styles.coinBadge}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.coinsLabel}>MY COINS</Text>
            <Text style={styles.coinsValue}>{coinsThisRun}</Text>
          </View>
        </View>

        {/* Sad Dinosaur Sitting */}
        <View style={styles.dinoContainer}>
          <Image
            source={SAD_DINO_IMG}
            style={styles.sadDino}
            resizeMode="contain"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {onRevive && (
            <View style={styles.reviveWrapper}>
              <GameButton
                title={canRevive ? `REVIVE (${reviveCost} 🪙)` : `NEED ${reviveCost} 🪙`}
                variant={canRevive ? 'green' : 'gray'}
                disabled={false}
                onPress={handleRevivePress}
                style={styles.button}
              />

              {sorryMessage ? (
                <Animated.View
                  style={[
                    styles.sorryBox,
                    { transform: [{ translateX: shakeAnim }] },
                  ]}
                >
                  <Text style={styles.sorryText}>{sorryMessage}</Text>
                </Animated.View>
              ) : !canRevive ? (
                <Text style={styles.needCoinsHint}>
                  Need {Math.max(0, reviveCost - coinsThisRun)} more coins to revive
                </Text>
              ) : null}
            </View>
          )}

          <GameButton
            title="PLAY AGAIN"
            icon="↻"
            variant="orange"
            onPress={onPlayAgain}
            style={styles.button}
          />

          <GameButton
            title="HOME"
            icon="🏠"
            variant="blue"
            onPress={onHome}
            style={styles.button}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 15, 30, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
    zIndex: 100,
    elevation: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(15, 35, 55, 0.96)',
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  gameOverText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#ef4444',
    letterSpacing: 1,
    marginBottom: 16,
    textShadowColor: '#ffffff',
    textShadowOffset: { width: 1.5, height: 1.5 },
    textShadowRadius: 1,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  currentScoreText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
  },
  bestScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
  },
  crownIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  bestScoreLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.8,
    marginRight: 8,
  },
  bestScoreValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#facc15',
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.35)',
    marginBottom: 8,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  coinsLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#facc15',
    letterSpacing: 0.6,
    marginRight: 6,
  },
  coinsValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  dinoContainer: {
    height: 76,
    width: 76,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  sadDino: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 6,
    zIndex: 10,
  },
  reviveWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  sorryBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#f87171',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 4,
    marginBottom: 4,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  sorryText: {
    color: '#fee2e2',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  needCoinsHint: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fb7185',
    marginTop: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  button: {
    marginVertical: 4,
  },
});
