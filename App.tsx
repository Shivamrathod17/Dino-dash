import React from 'react';
import { StyleSheet, View, useWindowDimensions, StatusBar } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useGameLoop } from './src/game/useGameLoop';
import { HomeScreen } from './src/screens/HomeScreen';
import { GamePlayScreen } from './src/screens/GamePlayScreen';

export default function App() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const {
    gameState,
    score,
    bestScore,
    coinsThisRun,
    totalCoins,
    isNewHighScore,
    dino,
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
  } = useGameLoop({ screenWidth, screenHeight });

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <ExpoStatusBar style="dark" />
        <StatusBar barStyle="dark-content" />

        {gameState === 'HOME' ? (
          <HomeScreen
            bestScore={bestScore}
            totalCoins={totalCoins}
            screenWidth={screenWidth}
            screenHeight={screenHeight}
            onPlayGame={startGame}
          />
        ) : (
          <GamePlayScreen
            gameState={gameState}
            score={score}
            bestScore={bestScore}
            coinsThisRun={coinsThisRun}
            totalCoins={totalCoins}
            reviveCost={reviveCost}
            canRevive={canRevive}
            isNewHighScore={isNewHighScore}
            dino={dino}
            obstacles={obstacles}
            coins={coins}
            groundOffset={groundOffset}
            groundY={groundY}
            screenWidth={screenWidth}
            screenHeight={screenHeight}
            onJump={jump}
            onPause={pauseGame}
            onResume={resumeGame}
            onRestart={startGame}
            onHome={returnToHome}
            onRevive={revivePlayer}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#53c5ff',
  },
});
