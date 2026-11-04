import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GameButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'green' | 'orange' | 'blue' | 'gray';
  icon?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

export const GameButton: React.FC<GameButtonProps> = ({
  title,
  onPress,
  variant = 'green',
  icon,
  style,
  disabled = false,
}) => {
  let gradientColors: [string, string] = ['#22c55e', '#16a34a'];
  let shadowBorderColor = '#15803d';

  if (disabled || variant === 'gray') {
    gradientColors = ['#64748b', '#475569'];
    shadowBorderColor = '#334155';
  } else if (variant === 'orange') {
    gradientColors = ['#fb923c', '#ea580c'];
    shadowBorderColor = '#c2410c';
  } else if (variant === 'blue') {
    gradientColors = ['#38bdf8', '#0284c7'];
    shadowBorderColor = '#0369a1';
  }

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.8}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[styles.wrapper, style, disabled && styles.disabledWrapper]}
    >
      <View
        pointerEvents="none"
        style={[styles.shadowBase, { backgroundColor: shadowBorderColor }]}
      />
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
        pointerEvents="none"
      >
        {/* Subtle top bevel reflection */}
        <View pointerEvents="none" style={styles.bevelHighlight} />

        <View pointerEvents="none" style={styles.contentRow}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={styles.text}>{title}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    height: 56,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    marginVertical: 6,
  },
  disabledWrapper: {
    opacity: 0.65,
  },
  shadowBase: {
    position: 'absolute',
    top: 5,
    left: 0,
    right: 0,
    height: 54,
    borderRadius: 28,
  },
  gradient: {
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  bevelHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    color: '#ffffff',
    marginRight: 10,
  },
  text: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 2,
  },
});
