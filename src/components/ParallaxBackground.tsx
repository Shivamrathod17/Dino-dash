import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';

interface ParallaxBackgroundProps {
  width: number;
  height: number;
  groundY: number;
}

const CLOUD_IMG = require('../../assets/sprites/cloud.png');

export const ParallaxBackground: React.FC<ParallaxBackgroundProps> = React.memo(({
  width,
  height,
  groundY,
}) => {
  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      {/* 1. Vibrant Cyan Sky Gradient */}
      <LinearGradient
        colors={['#53c5ff', '#82d6ff', '#b8ebff']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* 2. Soft White Clouds (Layered at different heights) */}
      <Image
        source={CLOUD_IMG}
        style={[styles.cloud, { top: 60, left: 20, width: 130, height: 70, opacity: 0.95 }]}
        resizeMode="contain"
      />
      <Image
        source={CLOUD_IMG}
        style={[styles.cloud, { top: 120, right: 30, width: 160, height: 85, opacity: 0.85 }]}
        resizeMode="contain"
      />
      <Image
        source={CLOUD_IMG}
        style={[styles.cloud, { top: 90, left: width * 0.45, width: 110, height: 60, opacity: 0.75 }]}
        resizeMode="contain"
      />

      {/* 3. Layered Blue Mountains & Green Hills Silhouette */}
      <View style={[styles.landscapeContainer, { top: groundY - 145, width, height: 150 }]}>
        <Svg width={width} height={150} viewBox={`0 0 ${width} 150`}>
          {/* Distant Mountains (Deep blue-cyan) */}
          <Path
            d={`M -20 150 L 40 45 L 110 100 L 190 30 L 270 95 L 340 40 L 420 150 Z`}
            fill="#7dbbe8"
            opacity={0.65}
          />
          {/* Mid Mountains */}
          <Path
            d={`M 20 150 L 100 65 L 180 115 L 260 55 L 350 110 L ${width + 30} 70 L ${width + 30} 150 Z`}
            fill="#69aee3"
            opacity={0.75}
          />

          {/* Rounded Hills & Trees (Foreground greenery) */}
          <Path
            d={`M -10 150 Q 50 105 110 120 Q 180 95 250 115 Q 320 100 ${width + 20} 125 L ${width + 20} 150 Z`}
            fill="#56c943"
          />
          {/* Soft tree clumps */}
          <Circle cx="45" cy="115" r="22" fill="#46ba34" />
          <Circle cx="75" cy="120" r="18" fill="#40b02f" />
          <Circle cx="160" cy="110" r="26" fill="#4bbd38" />
          <Circle cx="195" cy="116" r="20" fill="#3fae2e" />
          <Circle cx="290" cy="112" r="25" fill="#4abf38" />
          <Circle cx="325" cy="118" r="19" fill="#3fae2e" />
          <Circle cx={width - 40} cy="115" r="24" fill="#46ba34" />
        </Svg>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  cloud: {
    position: 'absolute',
  },
  landscapeContainer: {
    position: 'absolute',
    left: 0,
  },
});

