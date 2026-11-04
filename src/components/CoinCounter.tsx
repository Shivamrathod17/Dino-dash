import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';

interface CoinCounterProps {
  coins: number;
}

const COIN_IMG = require('../../assets/sprites/coin.png');

export const CoinCounter: React.FC<CoinCounterProps> = React.memo(({ coins }) => {
  return (
    <View style={styles.container}>
      <Image source={COIN_IMG} style={styles.coinIcon} resizeMode="contain" />
      <Text style={styles.coinText}>{coins}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coinIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  coinText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#d97706',
  },
});

