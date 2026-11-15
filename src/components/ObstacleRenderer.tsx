import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { ObstacleEntity } from '../types/game';

interface ObstacleRendererProps {
  obstacles: ObstacleEntity[];
  groundY: number;
}

const OBSTACLE_SPRITES = {
  cactus1: require('../../assets/sprites/cactus1.png'),
  cactus2: require('../../assets/sprites/cactus2.png'),
  rock: require('../../assets/sprites/rock.png'),
  bird1: require('../../assets/sprites/bird_fly1.png'),
  bird2: require('../../assets/sprites/bird_fly2.png'),
};

export const ObstacleRenderer: React.FC<ObstacleRendererProps> = React.memo(({
  obstacles,
  groundY,
}) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {obstacles.map((obs) => {
        let sprite = OBSTACLE_SPRITES.cactus1;
        if (obs.type === 'cactus_flower') {
          sprite = OBSTACLE_SPRITES.cactus2;
        } else if (obs.type === 'rock') {
          sprite = OBSTACLE_SPRITES.rock;
        } else if (obs.type === 'bird_low' || obs.type === 'bird_high') {
          sprite = (obs.animFrame ?? 0) === 1 ? OBSTACLE_SPRITES.bird2 : OBSTACLE_SPRITES.bird1;
        }

        const topPosition = groundY - obs.y - obs.height;

        return (
          <Image
            key={obs.id}
            source={sprite}
            style={[
              styles.obstacle,
              {
                left: obs.x,
                top: topPosition,
                width: obs.width,
                height: obs.height,
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
  obstacle: {
    position: 'absolute',
    zIndex: 8,
  },
});

