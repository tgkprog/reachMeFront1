const STORAGE_KEYS = {
  USER: "user_profile",
  TOKEN: "auth_token",
  DEVICE_ID: "device_id",
  ALARM_HISTORY: "alarm_history",
  POLL_SETTINGS: "poll_settings",
  SLEEP_UNTIL: "sleep_until",
  MUTE_UNTIL: "mute_until",
  LAST_LOGIN_ATTEMPT: "last_login_attempt",
};

class StorageService {
  private storage = window.localStorage;

  // User
  saveUser(user: any): void {
    this.storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  getUser(): any | null {
    const data = this.storage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  }

  // Token
  saveToken(token: string): void {
    this.storage.setItem(STORAGE_KEYS.TOKEN, token);
  }

  getToken(): string | null {
    return this.storage.getItem(STORAGE_KEYS.TOKEN);
  }

  // Device ID
  getDeviceId(): string {
    let deviceId = this.storage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) {
      deviceId = `web-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 15)}`;
      this.storage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    return deviceId;
  }

  // Alarm History
  getAlarmHistory(): any[] {
    const data = this.storage.getItem(STORAGE_KEYS.ALARM_HISTORY);
    return data ? JSON.parse(data) : [];
  }

  addAlarmToHistory(alarm: any): void {
    const history = this.getAlarmHistory();
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;

    const filtered = history.filter((a: any) => {
      const createdAt = new Date(a.create_date).getTime();
      return createdAt > twoDaysAgo;
    });

    filtered.unshift(alarm);
    const limited = filtered.slice(0, 100);

    this.storage.setItem(STORAGE_KEYS.ALARM_HISTORY, JSON.stringify(limited));
  }

  isAlarmProcessed(alarmId: string): boolean {
    const history = this.getAlarmHistory();
    return history.some((a: any) => a.id === alarmId);
  }

  // Poll Settings
  savePollSettings(settings: any): void {
    this.storage.setItem(STORAGE_KEYS.POLL_SETTINGS, JSON.stringify(settings));
  }

  getPollSettings(): any | null {
    const data = this.storage.getItem(STORAGE_KEYS.POLL_SETTINGS);
    return data ? JSON.parse(data) : null;
  }

  // Sleep/Mute
  saveSleepUntil(timestamp: number): void {
    this.storage.setItem(STORAGE_KEYS.SLEEP_UNTIL, timestamp.toString());
  }

  getSleepUntil(): number | null {
    const data = this.storage.getItem(STORAGE_KEYS.SLEEP_UNTIL);
    return data ? parseInt(data, 10) : null;
  }

  saveMuteUntil(timestamp: number): void {
    this.storage.setItem(STORAGE_KEYS.MUTE_UNTIL, timestamp.toString());
  }

  getMuteUntil(): number | null {
    const data = this.storage.getItem(STORAGE_KEYS.MUTE_UNTIL);
    return data ? parseInt(data, 10) : null;
  }

  // Last login attempt
  saveLastLoginAttempt(timestamp: number): void {
    this.storage.setItem(STORAGE_KEYS.LAST_LOGIN_ATTEMPT, timestamp.toString());
  }

  getLastLoginAttempt(): number | null {
    const data = this.storage.getItem(STORAGE_KEYS.LAST_LOGIN_ATTEMPT);
    return data ? parseInt(data, 10) : null;
  }

  // Clear all
  clear(): void {
    this.storage.clear();
  }

  clearAuth(): void {
    this.storage.removeItem(STORAGE_KEYS.USER);
    this.storage.removeItem(STORAGE_KEYS.TOKEN);
  }
}

export default new StorageService();
