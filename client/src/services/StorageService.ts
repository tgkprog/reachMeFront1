import EncryptedStorage from 'react-native-encrypted-storage';
import {User} from '@types/index';

const USER_KEY = 'user_profile';
const TOKEN_KEY = 'auth_token';
const LAST_LOGIN_ATTEMPT_KEY = 'last_login_attempt';
const POLL_SETTINGS_KEY = 'poll_settings';
const SLEEP_UNTIL_KEY = 'sleep_until';
const MUTE_UNTIL_KEY = 'mute_until';
const DEVICE_ID_KEY = 'device_id';
const ALARM_HISTORY_KEY = 'alarm_history';

export class StorageService {
  static async saveUser(user: User): Promise<void> {
    await EncryptedStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  static async getUser(): Promise<User | null> {
    const data = await EncryptedStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  static async saveToken(token: string): Promise<void> {
    await EncryptedStorage.setItem(TOKEN_KEY, token);
  }

  static async getToken(): Promise<string | null> {
    return await EncryptedStorage.getItem(TOKEN_KEY);
  }

  static async saveLastLoginAttempt(timestamp: number): Promise<void> {
    await EncryptedStorage.setItem(LAST_LOGIN_ATTEMPT_KEY, timestamp.toString());
  }

  static async getLastLoginAttempt(): Promise<number | null> {
    const data = await EncryptedStorage.getItem(LAST_LOGIN_ATTEMPT_KEY);
    return data ? parseInt(data, 10) : null;
  }

  static async savePollSettings(minutes: number, seconds: number): Promise<void> {
    await EncryptedStorage.setItem(POLL_SETTINGS_KEY, JSON.stringify({minutes, seconds}));
  }

  static async getPollSettings(): Promise<{minutes: number; seconds: number} | null> {
    const data = await EncryptedStorage.getItem(POLL_SETTINGS_KEY);
    return data ? JSON.parse(data) : null;
  }

  static async setSleepUntil(timestamp: number | null): Promise<void> {
    if (timestamp === null) {
      await EncryptedStorage.removeItem(SLEEP_UNTIL_KEY);
    } else {
      await EncryptedStorage.setItem(SLEEP_UNTIL_KEY, timestamp.toString());
    }
  }

  static async getSleepUntil(): Promise<number | null> {
    const data = await EncryptedStorage.getItem(SLEEP_UNTIL_KEY);
    return data ? parseInt(data, 10) : null;
  }

  static async setMuteUntil(timestamp: number | null): Promise<void> {
    if (timestamp === null) {
      await EncryptedStorage.removeItem(MUTE_UNTIL_KEY);
    } else {
      await EncryptedStorage.setItem(MUTE_UNTIL_KEY, timestamp.toString());
    }
  }

  static async getMuteUntil(): Promise<number | null> {
    const data = await EncryptedStorage.getItem(MUTE_UNTIL_KEY);
    return data ? parseInt(data, 10) : null;
  }

  static async clearAuth(): Promise<void> {
    await EncryptedStorage.removeItem(USER_KEY);
    await EncryptedStorage.removeItem(TOKEN_KEY);
    await EncryptedStorage.removeItem(LAST_LOGIN_ATTEMPT_KEY);
  }

  static async clearAll(): Promise<void> {
    await EncryptedStorage.clear();
  }

  static async getDeviceId(): Promise<string> {
    let existing = await EncryptedStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const newId = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    await EncryptedStorage.setItem(DEVICE_ID_KEY, newId);
    return newId;
  }

  // Alarm history management (prevent duplicate alerts)
  static async getAlarmHistory(): Promise<{id: string; ts: number; title?: string; msg?: string}[]> {
    const data = await EncryptedStorage.getItem(ALARM_HISTORY_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static async addAlarmToHistory(id: string, createdTs: number, title?: string, msg?: string): Promise<void> {
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    let history = await StorageService.getAlarmHistory();
    const now = Date.now();
    // Remove entries older than 2 days
    history = history.filter(h => now - h.ts <= twoDaysMs);
    // If id already present, do nothing
    if (history.some(h => h.id === id)) {
      return;
    }
    // Append new
    history.push({id, ts: createdTs, title, msg});
    // Cap at 100 (keep newest)
    if (history.length > 100) {
      history = history.sort((a, b) => b.ts - a.ts).slice(0, 100);
    }
    await EncryptedStorage.setItem(ALARM_HISTORY_KEY, JSON.stringify(history));
  }

  static async isAlarmProcessed(id: string, createdTs: number): Promise<boolean> {
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    const history = await StorageService.getAlarmHistory();
    const now = Date.now();
    const found = history.find(h => h.id === id);
    if (!found) return false;
    // If found but too old, treat as not processed (will prune soon)
    if (now - found.ts > twoDaysMs) return false;
    return true;
  }
}
