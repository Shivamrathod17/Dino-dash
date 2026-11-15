import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import { TutorialStep } from '../types/game';

interface TutorialOverlayProps {
  step: TutorialStep;
  screenHeight: number;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  step,
  screenHeight,
}) => {
  // Fade opacity
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Bouncing finger animation (translateY)
  const bounceAnim = useRef(new Animated.Value(0)).current;
  // Pulsing ring scale & opacity
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.8)).current;

  // Track active animation loops
  const bounceLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (step === 'tap_to_jump') {
      // Fade in smoothly
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();

      // Finger bouncing loop
      bounceAnim.setValue(0);
      const bounceLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -16,
            duration: 380,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 380,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      bounceLoopRef.current = bounceLoop;
      bounceLoop.start();

      // Expanding pulse ring loop
      pulseScale.setValue(1);
      pulseOpacity.setValue(0.8);
      const pulseLoop = Animated.loop(
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.8,
            duration: 900,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoopRef.current = pulseLoop;
      pulseLoop.start();
    } else if (step === 'good_job') {
      // Fade in celebration and stop bounce
      bounceLoopRef.current?.stop();
      pulseLoopRef.current?.stop();
      bounceAnim.setValue(0);

      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.delay(850),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hidden: fade out quickly
      bounceLoopRef.current?.stop();
      pulseLoopRef.current?.stop();
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      bounceLoopRef.current?.stop();
      pulseLoopRef.current?.stop();
    };
  }, [step]);

  if (step === 'hidden') {
    return null;
  }

  const isGoodJob = step === 'good_job';

  return (
    <View
      style={[
        styles.container,
        { top: Math.max(120, screenHeight * 0.28) },
      ]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.hintCard,
          isGoodJob ? styles.cardSuccess : styles.cardDefault,
          {
            opacity: fadeAnim,
            transform: [{ scale: fadeAnim }],
          },
        ]}
      >
        {!isGoodJob ? (
          // Tap to Jump Prompt
          <View style={styles.contentRow}>
            <View style={styles.handContainer}>
              {/* Expanding Ripple Ring */}
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: pulseScale }],
                    opacity: pulseOpacity,
                  },
                ]}
              />
              {/* Bouncing Hand */}
              <Animated.Text
                style={[
                  styles.handIcon,
                  { transform: [{ translateY: bounceAnim }] },
                ]}
              >
                👆
              </Animated.Text>
            </View>

            <View style={styles.textColumn}>
              <View style={styles.titleBadgeRow}>
                <Text style={styles.titleText}>TAP TO JUMP!</Text>
                <Text style={styles.sparkle}>✨</Text>
              </View>
              <Text style={styles.subtitleText}>
                Tap anywhere to leap over hurdles
              </Text>
            </View>
          </View>
        ) : (
          // Encouraging Celebration Prompt
          <View style={styles.contentRow}>
            <Text style={styles.starIcon}>⭐</Text>
            <View style={styles.textColumn}>
              <Text style={styles.successTitleText}>PERFECT JUMP!</Text>
              <Text style={styles.successSubtitleText}>
                Great timing! Keep going! 🎯
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 90,
  },
  hintCard: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
    maxWidth: 340,
    borderWidth: 2.5,
  },
  cardDefault: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderColor: '#38bdf8',
  },
  cardSuccess: {
    backgroundColor: 'rgba(6, 78, 59, 0.94)',
    borderColor: '#34d399',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  handContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#38bdf8',
  },
  handIcon: {
    fontSize: 34,
  },
  starIcon: {
    fontSize: 34,
  },
  textColumn: {
    flexShrink: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  sparkle: {
    fontSize: 16,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#93c5fd',
    marginTop: 2,
  },
  successTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#6ee7b7',
    letterSpacing: 0.8,
  },
  successSubtitleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d1fae5',
    marginTop: 2,
  },
});

