import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPersistedData } from '../types/game';

const STORAGE_KEYS = {
  BEST_SCORE: '@dino_dash_sec_score_v1',
  TOTAL_COINS: '@dino_dash_sec_coins_v1',
  SOUND_ENABLED: '@dino_dash_sound_enabled',
  HAPTICS_ENABLED: '@dino_dash_haptics_enabled',
  // Backward compatibility keys for graceful migration
  LEGACY_COINS: '@dino_dash_real_player_coins_v1',
  LEGACY_SCORE: '@dino_dash_best_score',
};

const DEFAULT_DATA: UserPersistedData = {
  bestScore: 0,
  totalCoins: 0,
  soundEnabled: true,
  hapticsEnabled: true,
};

// Anti-Cheat: Application Integrity Salt for Hash Signature
const INTEGRITY_SALT = 'DINO_ARCADE_PROD_INTEGRITY_SALT_#9X!';
const MAX_REALISTIC_COINS = 5_000_000;
const MAX_REALISTIC_SCORE = 5_000_000;
const MAX_COINS_PER_OPERATION = 500;

/**
 * Computes a deterministic cryptographic-style hash signature
 * to detect any unauthorized modification of save data in SQLite/AsyncStorage.
 */
function computeSignature(key: string, value: number): string {
  const input = `${key}::${value}::${INTEGRITY_SALT}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;

  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= (code + (i << 1));
    h2 = Math.imul(h2, 0x27d4eb2f);
  }

  return `${(h1 >>> 0).toString(16)}-${(h2 >>> 0).toString(16)}`;
}

/**
 * Validates, unpacks, and verifies data integrity.
 * If tampered, corrupted, or invalid, safely returns default.
 */
function parseAndVerify(key: string, raw: string | null, maxLimit: number): number {
  if (!raw) return 0;

  try {
    // 1. Check if signed JSON payload: { v: number, s: string }
    if (raw.startsWith('{') && raw.endsWith('}')) {
      const parsed = JSON.parse(raw);
      if (
        typeof parsed.v === 'number' &&
        Number.isSafeInteger(parsed.v) &&
        parsed.v >= 0 &&
        parsed.v <= maxLimit &&
        typeof parsed.s === 'string'
      ) {
        const expectedSig = computeSignature(key, parsed.v);
        if (parsed.s === expectedSig) {
          return parsed.v; // Verified Authentic!
        } else {
          console.warn(`[AntiCheat] Checksum mismatch for ${key}! Value was modified externally. Resetting.`);
          return 0; // Tampered data rejected!
        }
      }
      return 0;
    }

    // 2. Backward compatibility: If plain numeric string, validate bounds
    const numericVal = parseInt(raw, 10);
    if (Number.isSafeInteger(numericVal) && numericVal >= 0 && numericVal <= maxLimit) {
      return numericVal;
    }
  } catch (e) {
    console.warn(`[StorageManager] Corrupted save data detected for ${key}`, e);
  }

  return 0;
}

let cachedData: UserPersistedData = { ...DEFAULT_DATA };

export const StorageManager = {
  async loadUserData(): Promise<UserPersistedData> {
    try {
      const [
        secScoreRaw,
        secCoinsRaw,
        legacyScoreRaw,
        legacyCoinsRaw,
        soundRaw,
        hapticsRaw,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.BEST_SCORE),
        AsyncStorage.getItem(STORAGE_KEYS.TOTAL_COINS),
        AsyncStorage.getItem(STORAGE_KEYS.LEGACY_SCORE),
        AsyncStorage.getItem(STORAGE_KEYS.LEGACY_COINS),
        AsyncStorage.getItem(STORAGE_KEYS.SOUND_ENABLED),
        AsyncStorage.getItem(STORAGE_KEYS.HAPTICS_ENABLED),
      ]);

      // Verify authentic secure values, or gracefully migrate legacy clean values
      let bestScore = parseAndVerify(STORAGE_KEYS.BEST_SCORE, secScoreRaw, MAX_REALISTIC_SCORE);
      if (bestScore === 0 && legacyScoreRaw) {
        bestScore = parseAndVerify(STORAGE_KEYS.BEST_SCORE, legacyScoreRaw, MAX_REALISTIC_SCORE);
        this.saveBestScore(bestScore);
      }

      let totalCoins = parseAndVerify(STORAGE_KEYS.TOTAL_COINS, secCoinsRaw, MAX_REALISTIC_COINS);
      if (totalCoins === 0 && legacyCoinsRaw) {
        totalCoins = parseAndVerify(STORAGE_KEYS.TOTAL_COINS, legacyCoinsRaw, MAX_REALISTIC_COINS);
        this.persistSecureCoins(totalCoins);
      }

      cachedData = {
        bestScore,
        totalCoins,
        soundEnabled: soundRaw !== null ? soundRaw === 'true' : DEFAULT_DATA.soundEnabled,
        hapticsEnabled: hapticsRaw !== null ? hapticsRaw === 'true' : DEFAULT_DATA.hapticsEnabled,
      };

      return cachedData;
    } catch (e) {
      console.warn('[StorageManager] Failed to read from AsyncStorage, using fallback cache', e);
      return cachedData;
    }
  },

  getCachedData(): UserPersistedData {
    return cachedData;
  },

  persistSecureCoins(coins: number): void {
    const payload = JSON.stringify({
      v: coins,
      s: computeSignature(STORAGE_KEYS.TOTAL_COINS, coins),
    });
    AsyncStorage.setItem(STORAGE_KEYS.TOTAL_COINS, payload).catch((e) => {
      console.warn('[StorageManager] Failed to persist secure coins', e);
    });
  },

  saveBestScore(newScore: number): boolean {
    if (!Number.isSafeInteger(newScore) || newScore <= cachedData.bestScore || newScore > MAX_REALISTIC_SCORE) {
      return false;
    }

    cachedData.bestScore = newScore;
    const payload = JSON.stringify({
      v: newScore,
      s: computeSignature(STORAGE_KEYS.BEST_SCORE, newScore),
    });

    AsyncStorage.setItem(STORAGE_KEYS.BEST_SCORE, payload).catch((e) => {
      console.warn('[StorageManager] Failed to persist secure best score', e);
    });
    return true;
  },

  addCoins(amount: number): number {
    // Anti-Cheat: Validate realistic bounds per single operation
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_COINS_PER_OPERATION) {
      return cachedData.totalCoins;
    }

    const nextTotal = Math.min(MAX_REALISTIC_COINS, cachedData.totalCoins + amount);
    cachedData.totalCoins = nextTotal;
    this.persistSecureCoins(nextTotal);
    return cachedData.totalCoins;
  },

  deductCoins(amount: number): { success: boolean; newTotal: number } {
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return { success: true, newTotal: cachedData.totalCoins };
    }
    if (cachedData.totalCoins < amount) {
      return { success: false, newTotal: cachedData.totalCoins };
    }

    cachedData.totalCoins -= amount;
    this.persistSecureCoins(cachedData.totalCoins);
    return { success: true, newTotal: cachedData.totalCoins };
  },

  async setSoundEnabled(enabled: boolean): Promise<void> {
    cachedData.soundEnabled = Boolean(enabled);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, cachedData.soundEnabled ? 'true' : 'false');
    } catch (e) {
      console.warn('[StorageManager] Failed to persist sound setting', e);
    }
  },

  async setHapticsEnabled(enabled: boolean): Promise<void> {
    cachedData.hapticsEnabled = Boolean(enabled);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HAPTICS_ENABLED, cachedData.hapticsEnabled ? 'true' : 'false');
    } catch (e) {
      console.warn('[StorageManager] Failed to persist haptics setting', e);
    }
  },
};
