import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface ScoreCardProps {
  label: string; // 'SCORE' | 'BEST'
  score: number;
  showCrown?: boolean;
}

export const ScoreCard: React.FC<ScoreCardProps> = React.memo(({
  label,
  score,
  showCrown = false,
}) => {
  // Pad score to 5 digits e.g. 00126
  const formattedScore = score.toString().padStart(5, '0');

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        {showCrown && <Text style={styles.crown}>👑</Text>}
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.scoreText}>{formattedScore}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 95,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  crown: {
    fontSize: 11,
    marginRight: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0284c7',
    letterSpacing: 1.2,
  },
});

