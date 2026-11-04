import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Image, Animated, Text } from 'react-native';
import { DinoEntity } from '../types/game';

interface DinosaurProps {
  dino: DinoEntity;
  groundY: number;
  isHomeIdle?: boolean;
}

const SPRITES = {
  idle: require('../../assets/sprites/dino_idle.png'),
  run0: require('../../assets/sprites/dino_run_f0.png'),
  run1: require('../../assets/sprites/dino_run_f1.png'),
  run2: require('../../assets/sprites/dino_run_f2.png'),
  run3: require('../../assets/sprites/dino_run_f3.png'),
  run4: require('../../assets/sprites/dino_run_f4.png'),
  run5: require('../../assets/sprites/dino_run_f5.png'),
  run6: require('../../assets/sprites/dino_run_f6.png'),
  run7: require('../../assets/sprites/dino_run_f7.png'),
  jumpLaunch: require('../../assets/sprites/dino_jump_launch.png'),
  jumpRise: require('../../assets/sprites/dino_jump_rise.png'),
  jumpApex: require('../../assets/sprites/dino_jump_apex.png'),
  jumpFall: require('../../assets/sprites/dino_jump_fall.png'),
  dead: require('../../assets/sprites/dino_dead.png'),
  trail: require('../../assets/sprites/jump_trail.png'),
  dust: require('../../assets/sprites/dust.png'),

  // Game Action Poses
  actCoin: require('../../assets/sprites/dino_act_coin.png'),
  actStar: require('../../assets/sprites/dino_act_star.png'),
  actCelebrate: require('../../assets/sprites/dino_act_celebrate.png'),
  actHurt: require('../../assets/sprites/dino_act_hurt.png'),
  actFall: require('../../assets/sprites/dino_act_fall.png'),
  actWin: require('../../assets/sprites/dino_act_win.png'),

  // Cute Expressions
  exprHappy: require('../../assets/sprites/dino_expr_happy.png'),
  exprLaugh: require('../../assets/sprites/dino_expr_laugh.png'),
  exprExcited: require('../../assets/sprites/dino_expr_excited.png'),
  exprWink: require('../../assets/sprites/dino_expr_wink.png'),
  exprLove: require('../../assets/sprites/dino_expr_love.png'),
  exprSurprised: require('../../assets/sprites/dino_expr_surprised.png'),
  exprSad: require('../../assets/sprites/dino_expr_sad.png'),
  exprCrying: require('../../assets/sprites/dino_expr_crying.png'),
  exprAngry: require('../../assets/sprites/dino_expr_angry.png'),
  exprDizzy: require('../../assets/sprites/dino_expr_dizzy.png'),
};

export const Dinosaur: React.FC<DinosaurProps> = React.memo(({
  dino,
  groundY,
  isHomeIdle = false,
}) => {
  // Star sparkle shimmer animation during jump
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Gentle shimmer loop for in-air sparkles
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const isJumpingOrFalling = dino.state === 'jumping' || dino.state === 'falling';
  const isLanding = dino.state === 'landing';

  // Dynamic sprite selection: Always use full-body 512x512 sprites to guarantee identical character size
  let spriteSource = SPRITES.idle;

  if (dino.state === 'gameover') {
    spriteSource = SPRITES.dead;
  } else if (isJumpingOrFalling) {
    if (dino.jumpPhase === 'launch') {
      spriteSource = SPRITES.jumpLaunch;
    } else if (dino.jumpPhase === 'rise') {
      spriteSource = SPRITES.jumpRise;
    } else if (dino.jumpPhase === 'apex') {
      spriteSource = SPRITES.jumpApex;
    } else {
      spriteSource = SPRITES.jumpFall;
    }
  } else if (dino.state === 'running') {
    const frame = Math.abs(dino.runFrame) % 8;
    switch (frame) {
      case 0: spriteSource = SPRITES.run0; break;
      case 1: spriteSource = SPRITES.run1; break;
      case 2: spriteSource = SPRITES.run2; break;
      case 3: spriteSource = SPRITES.run3; break;
      case 4: spriteSource = SPRITES.run4; break;
      case 5: spriteSource = SPRITES.run5; break;
      case 6: spriteSource = SPRITES.run6; break;
      case 7: spriteSource = SPRITES.run7; break;
      default: spriteSource = SPRITES.run0; break;
    }
  } else if (isLanding) {
    spriteSource = SPRITES.jumpLaunch;
  }

  // Calculate screen position: Y goes downwards from top
  const topPosition = groundY - dino.y - dino.height;

  const sparkleOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1.0],
  });

  const sparkleScale = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.15],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* 1. Ground Takeoff Shockwave Ring when leaping */}
      {dino.state === 'jumping' && dino.jumpPhase === 'launch' && (
        <View
          style={[
            styles.takeoffRing,
            {
              left: dino.x + 8,
              top: groundY - 14,
            },
          ]}
        />
      )}

      {/* 2. Ground Landing Impact Ripple & Dual Dust Blast on touchdown */}
      {isLanding && (
        <>
          {/* Landing Ground Compression Ripple */}
          <View
            style={[
              styles.landingRipple,
              {
                left: dino.x - 2,
                top: groundY - 12,
              },
            ]}
          />

          {/* Left Dust Plume */}
          <Image
            source={SPRITES.dust}
            style={[
              styles.dustParticle,
              {
                left: dino.x - 20,
                top: groundY - 26,
                transform: [{ scaleX: -1 }], // mirrored to shoot backwards
              },
            ]}
            resizeMode="contain"
          />

          {/* Right Dust Plume */}
          <Image
            source={SPRITES.dust}
            style={[
              styles.dustParticle,
              {
                left: dino.x + 36,
                top: groundY - 26,
              },
            ]}
            resizeMode="contain"
          />
        </>
      )}

      {/* 3. Regular Ground Footstrike Dust Puff during running */}
      {dino.showDust && !isLanding && (
        <Image
          source={SPRITES.dust}
          style={[
            styles.dustParticle,
            {
              left: dino.x - 14,
              top: groundY - 26,
            },
          ]}
          resizeMode="contain"
        />
      )}

      {/* 4. Dinosaur Main Character Container */}
      <View
        style={[
          styles.dinoContainer,
          {
            left: dino.x,
            top: topPosition,
            width: dino.width,
            height: dino.height,
            transform: [
              { rotate: `${dino.rotation || 0}deg` },
            ],
          },
        ]}
      >
        {/* Dynamic Wind Swoosh Streamlines & Speed Trails streaming behind in air */}
        {isJumpingOrFalling && (
          <>
            {/* Main Wind Swoosh Arc */}
            <Image
              source={SPRITES.trail}
              style={[
                styles.jumpTrail,
                {
                  opacity:
                    dino.jumpPhase === 'rise'
                      ? 0.85
                      : dino.jumpPhase === 'launch'
                      ? 0.70
                      : dino.jumpPhase === 'apex'
                      ? 0.50
                      : 0.35,
                  transform: [
                    { translateY: dino.jumpPhase === 'fall' ? -3 : 0 },
                    { scale: dino.jumpPhase === 'rise' ? 1.08 : 0.95 },
                  ],
                },
              ]}
              resizeMode="contain"
            />

            {/* Upper Wind Speed Streak */}
            <View style={[styles.speedStreak, styles.speedStreakTop]} />
            {/* Lower Wind Speed Streak */}
            <View style={[styles.speedStreak, styles.speedStreakBottom]} />

            {/* Airborne Cartoon Leap Energy Star Sparkles */}
            <Animated.Text
              style={[
                styles.starSparkle,
                {
                  left: -16,
                  top: 10,
                  opacity: sparkleOpacity,
                  transform: [{ scale: sparkleScale }],
                },
              ]}
            >
              ✦
            </Animated.Text>
            <Animated.Text
              style={[
                styles.starSparkle,
                {
                  left: -26,
                  top: 26,
                  fontSize: 16,
                  opacity: sparkleOpacity,
                  transform: [{ scale: sparkleScale }],
                },
              ]}
            >
              ★
            </Animated.Text>
            <Animated.Text
              style={[
                styles.starSparkle,
                {
                  left: -14,
                  top: 44,
                  fontSize: 12,
                  opacity: sparkleOpacity,
                  transform: [{ scale: sparkleScale }],
                },
              ]}
            >
              ✦
            </Animated.Text>

            {/* Action Energy Gleam beside the dino's brow */}
            <Animated.Text
              style={[
                styles.actionGleam,
                {
                  opacity: sparkleOpacity,
                  transform: [{ scale: sparkleScale }],
                },
              ]}
            >
              ✧
            </Animated.Text>
          </>
        )}

        {/* Floating Coin Collection Heart / Reaction Indicator */}
        {dino.expression === 'coin' && (
          <View style={styles.coinReactionBubble}>
            <Text style={styles.coinReactionText}>🪙 +1</Text>
          </View>
        )}
        {dino.expression === 'love' && (
          <View style={styles.coinReactionBubble}>
            <Text style={styles.coinReactionText}>💖</Text>
          </View>
        )}

        {/* Revive Protective Golden Shield Ring */}
        {dino.isInvulnerable && (
          <View style={styles.shieldAura} />
        )}

        {/* Main Character Sprite */}
        <Animated.Image
          source={spriteSource}
          style={styles.sprite}
          resizeMode="contain"
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  dinoContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  shieldAura: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.22)',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  sprite: {
    width: '100%',
    height: '100%',
  },
  jumpTrail: {
    position: 'absolute',
    left: -32,
    bottom: -2,
    width: 48,
    height: 48,
  },
  speedStreak: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 3,
  },
  speedStreakTop: {
    left: -28,
    top: 12,
    width: 26,
    height: 3,
  },
  speedStreakBottom: {
    left: -24,
    bottom: 12,
    width: 22,
    height: 3,
  },
  starSparkle: {
    position: 'absolute',
    color: '#ffdd33',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 220, 50, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  actionGleam: {
    position: 'absolute',
    right: 2,
    top: 4,
    color: '#fff366',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 230, 80, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  takeoffRing: {
    position: 'absolute',
    width: 58,
    height: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 240, 150, 0.85)',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    zIndex: 8,
  },
  landingRipple: {
    position: 'absolute',
    width: 78,
    height: 18,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 235, 120, 0.4)',
    zIndex: 8,
  },
  dustParticle: {
    position: 'absolute',
    width: 34,
    height: 24,
    opacity: 0.88,
    zIndex: 9,
  },
  coinReactionBubble: {
    position: 'absolute',
    top: -24,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ffc83b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 12,
  },
  coinReactionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ff9000',
  },
});
