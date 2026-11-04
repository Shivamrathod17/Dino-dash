import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar as RNStatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScoreCard } from '../components/ScoreCard';
import { GameButton } from '../components/GameButton';
import { Dinosaur } from '../components/Dinosaur';
import { ParallaxBackground } from '../components/ParallaxBackground';
import { GroundPlatform } from '../components/GroundPlatform';
import { DinoEntity, DinoExpression } from '../types/game';
import { PHYSICS } from '../game/physics';
import { AudioManager } from '../audio/audio';
import { StorageManager } from '../storage/storage';

interface HomeScreenProps {
  bestScore: number;
  totalCoins: number;
  screenWidth: number;
  screenHeight: number;
  onPlayGame: () => void;
}

const CACTUS_IMG = require('../../assets/sprites/cactus1.png');

export const HomeScreen: React.FC<HomeScreenProps> = ({
  bestScore,
  totalCoins,
  screenWidth,
  screenHeight,
  onPlayGame,
}) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    RNStatusBar.currentHeight || 0,
    Platform.OS === 'android' ? 38 : 44
  ) + 12;

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  useEffect(() => {
    const data = StorageManager.getCachedData();
    setSoundEnabled(data.soundEnabled);
  }, []);

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    StorageManager.setSoundEnabled(nextVal);
    AudioManager.playButton();
  };

  const groundY = screenHeight - PHYSICS.GROUND_HEIGHT - 30;

  // Idle dinosaur positioned on the ground (exact same 74x74 size as gameplay)
  const idleDino: DinoEntity = {
    x: 48,
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
    expression: 'normal',
  };

  return (
    <View style={styles.container}>
      {/* Background scenery */}
      <ParallaxBackground width={screenWidth} height={screenHeight} groundY={groundY} />

      {/* Ground platform */}
      <GroundPlatform
        width={screenWidth}
        groundY={groundY}
        height={PHYSICS.GROUND_HEIGHT + 30}
        offset={0}
      />

      {/* Foreground decorative cactus */}
      <Image
        source={CACTUS_IMG}
        style={[
          styles.homeCactus,
          {
            left: screenWidth - 78,
            top: groundY - 72,
            width: 50,
            height: 75,
          },
        ]}
        resizeMode="contain"
      />

      {/* Idle character */}
      <Dinosaur dino={idleDino} groundY={groundY} isHomeIdle={true} />

      {/* UI Overlay */}
      <View style={[styles.uiOverlay, { paddingTop: topInset }]}>
        {/* Top Header Row */}
        <View style={styles.topRow}>
          <View style={styles.titleArea}>
            <TouchableOpacity
              onPress={toggleSound}
              style={styles.soundButton}
              activeOpacity={0.7}
            >
              <Text style={styles.soundIcon}>{soundEnabled ? '🔊' : '🔇'}</Text>
            </TouchableOpacity>

            {/* Dino Dash Logo with Crown */}
            <View style={styles.logoRow}>
              <View style={styles.dinoWordWrap}>
                <Text style={styles.dinoWord}>Dino</Text>
                <Text style={styles.logoCrown}>👑</Text>
              </View>
              <Text style={styles.dashWord}>Dash</Text>
            </View>
          </View>

          {/* Right Stats: Best Score */}
          <View style={styles.rightStatsCluster}>
            <ScoreCard label="BEST" score={bestScore} showCrown={true} />
          </View>
        </View>

        {/* Bottom Play Panel */}
        <View style={[styles.bottomCardWrapper, { paddingBottom: Math.max(insets.bottom, 16) + 14 }]}>
          <View style={styles.bottomCard}>
            <Text style={styles.panelInstruction}>
              JUMP OVER OBSTACLES AND SURVIVE
            </Text>

            <GameButton
              title="PLAY GAME"
              icon="▶"
              variant="green"
              onPress={onPlayGame}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#53c5ff',
  },
  uiOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
  },
  rightStatsCluster: {
    alignItems: 'flex-end',
  },
  titleArea: {
    flex: 1,
  },
  soundButton: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 18,
    alignSelf: 'flex-start',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  soundIcon: {
    fontSize: 16,
  },
  logoRow: {
    marginTop: -2,
  },
  dinoWordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dinoWord: {
    fontSize: 44,
    fontWeight: '900',
    color: '#facc15',
    letterSpacing: 1,
    textShadowColor: '#854d0e',
    textShadowOffset: { width: 1.5, height: 2 },
    textShadowRadius: 1,
  },
  logoCrown: {
    fontSize: 22,
    marginLeft: 4,
    marginTop: -10,
    transform: [{ rotate: '15deg' }],
  },
  dashWord: {
    fontSize: 44,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: -14,
    letterSpacing: 1,
    textShadowColor: '#1e3a8a',
    textShadowOffset: { width: 2, height: 2.5 },
    textShadowRadius: 2,
  },
  homeCactus: {
    position: 'absolute',
    zIndex: 9,
  },
  bottomCardWrapper: {
    paddingHorizontal: 18,
  },
  bottomCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  panelInstruction: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 12,
    textAlign: 'center',
  },
});
