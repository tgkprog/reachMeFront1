import EncryptedStorage from 'react-native-encrypted-storage';
import {User} from '@types/index';

const USER_KEY = 'user_profile';
const TOKEN_KEY = 'auth_token';
const LAST_LOGIN_ATTEMPT_KEY = 'last_login_attempt';
const POLL_SETTINGS_KEY = 'poll_settings';
const SLEEP_UNTIL_KEY = 'sleep_until';
const MUTE_UNTIL_KEY = 'mute_until';

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
    await EncryptedStorage.setItem(
      POLL_SETTINGS_KEY,
      JSON.stringify({minutes, seconds}),
    );
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
}
