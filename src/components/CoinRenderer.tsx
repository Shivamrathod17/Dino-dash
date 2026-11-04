import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { CoinEntity } from '../types/game';

interface CoinRendererProps {
  coins: CoinEntity[];
  groundY: number;
}

const COIN_IMG = require('../../assets/sprites/coin.png');

export const CoinRenderer: React.FC<CoinRendererProps> = React.memo(({
  coins,
  groundY,
}) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {coins.map((coin) => {
        const topPosition = groundY - coin.y - coin.height;
        const isPopping = coin.collected && coin.collectedAnimTimer && coin.collectedAnimTimer > 0;
        const opacity = isPopping ? coin.collectedAnimTimer! / 0.25 : 1.0;
        const scale = isPopping ? 1.0 + (1.0 - coin.collectedAnimTimer! / 0.25) * 0.6 : 1.0;

        return (
          <Image
            key={coin.id}
            source={COIN_IMG}
            style={[
              styles.coin,
              {
                left: coin.x,
                top: topPosition,
                width: coin.width,
                height: coin.height,
                opacity,
                transform: [{ scale }],
              },
            ]}
            resizeMode="contain"
          />
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  coin: {
    position: 'absolute',
    zIndex: 9,
  },
});

