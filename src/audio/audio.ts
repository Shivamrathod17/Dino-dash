import * as Haptics from 'expo-haptics';
import { StorageManager } from '../storage/storage';

type SoundType = 'jump' | 'coin' | 'gameover' | 'button' | 'land';

const SOUND_ASSETS: Record<SoundType, any> = {
  jump: require('../../assets/sounds/jump.wav'),
  coin: require('../../assets/sounds/coin.wav'),
  gameover: require('../../assets/sounds/gameover.wav'),
  button: require('../../assets/sounds/button.wav'),
  land: require('../../assets/sounds/land.wav'),
};

interface SimplePlayer {
  play: () => void;
  seekTo?: (seconds: number) => Promise<void> | void;
  release?: () => void;
  volume?: number;
}

class SoundController {
  private players: Partial<Record<SoundType, SimplePlayer>> = {};
  private isAvailable = false;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      // Dynamically load expo-audio to prevent crash if native module is absent
      const ExpoAudio = require('expo-audio');

      if (ExpoAudio && typeof ExpoAudio.createAudioPlayer === 'function') {
        for (const key of Object.keys(SOUND_ASSETS) as SoundType[]) {
          try {
            const player = ExpoAudio.createAudioPlayer(SOUND_ASSETS[key]);
            if (player) {
              if (key === 'coin') player.volume = 0.85;
              else if (key === 'button') player.volume = 0.5;
              else player.volume = 0.75;

              this.players[key] = player;
            }
          } catch (playerErr) {
            console.warn(`[SoundController] Could not create player for ${key}:`, playerErr);
          }
        }
        this.isAvailable = true;
      }
    } catch (e) {
      console.warn('[SoundController] Native audio module unavailable. Running in silent/haptic mode.', e);
      this.isAvailable = false;
    }
  }

  play(type: SoundType): void {
    const settings = StorageManager.getCachedData();
    if (!settings.soundEnabled || !this.isAvailable) return;

    try {
      const player = this.players[type];
      if (player) {
        if (typeof player.seekTo === 'function') {
          try {
            const res = player.seekTo(0);
            if (res && typeof res.catch === 'function') {
              res.catch(() => {});
            }
          } catch (_) {}
        }
        player.play();
      }
    } catch (e) {
      // Re-create player if seek/play failed
      try {
        const ExpoAudio = require('expo-audio');
        if (ExpoAudio && typeof ExpoAudio.createAudioPlayer === 'function') {
          const freshPlayer = ExpoAudio.createAudioPlayer(SOUND_ASSETS[type]);
          this.players[type] = freshPlayer;
          freshPlayer.play();
        }
      } catch (innerErr) {
        // Silently tolerate if audio engine is busy
      }
    }
  }

  triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'notification'): void {
    const settings = StorageManager.getCachedData();
    if (!settings.hapticsEnabled) return;

    try {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'notification':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
      }
    } catch (e) {
      // Haptics not available on some devices/web
    }
  }

  playJump(): void {
    this.triggerHaptic('medium');
    this.play('jump');
  }

  playCoin(): void {
    this.triggerHaptic('medium');
    this.play('coin');
  }

  playGameOver(): void {
    this.triggerHaptic('heavy');
    this.play('gameover');
  }

  playButton(): void {
    this.triggerHaptic('light');
    this.play('button');
  }

  playLand(): void {
    this.triggerHaptic('light');
    this.play('land');
  }

  cleanup(): void {
    for (const key of Object.keys(this.players) as SoundType[]) {
      try {
        const player = this.players[key];
        if (player && typeof player.release === 'function') {
          player.release();
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    this.players = {};
    this.isInitialized = false;
  }
}

export const AudioManager = new SoundController();
