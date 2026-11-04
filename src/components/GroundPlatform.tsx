import React from 'react';
import { StyleSheet, View, Image } from 'react-native';

interface GroundPlatformProps {
  width: number;
  groundY: number;
  height: number;
  offset: number; // 0 to 600
}

const GROUND_IMG = require('../../assets/sprites/ground.png');
const TILE_WIDTH = 600;

export const GroundPlatform: React.FC<GroundPlatformProps> = React.memo(({
  width,
  groundY,
  height,
  offset,
}) => {
  // Compute how many tiles are needed to cover width + extra buffer
  const numTiles = Math.ceil(width / TILE_WIDTH) + 2;
  const normalizedOffset = offset % TILE_WIDTH;

  return (
    <View style={[styles.container, { top: groundY, width, height }]} pointerEvents="none">
      <View style={[styles.slider, { transform: [{ translateX: -normalizedOffset }] }]}>
        {Array.from({ length: numTiles }).map((_, i) => (
          <Image
            key={i}
            source={GROUND_IMG}
            style={[styles.groundTile, { width: TILE_WIDTH, height }]}
            resizeMode="stretch"
          />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    overflow: 'hidden',
  },
  slider: {
    flexDirection: 'row',
    height: '100%',
  },
  groundTile: {
    height: '100%',
  },
});

