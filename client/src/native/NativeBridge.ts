import {NativeModules, Platform} from 'react-native';

interface ReachMeNativeModule {
  showOverlay(args: any): Promise<void>;
  hideOverlay(): Promise<void>;
  playAlarm(args: any): Promise<void>;
  stopAlarm(): Promise<void>;
  downloadFile(url: string, id: string): Promise<string>;
  startForegroundService(): Promise<void>;
  stopForegroundService(): Promise<void>;
  checkPermissions(): Promise<{[key: string]: boolean}>;
  requestOverlayPermission(): Promise<void>;
  requestDNDPermission(): Promise<void>;
  requestExactAlarmPermission(): Promise<void>;
  requestBatteryOptimization(): Promise<void>;
  getLocalFilePath(fileId: string): Promise<string | null>;
}

const LINKING_ERROR =
  `The package 'react-native-reachme' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ios: "- You have run 'pod install'\n", default: ''}) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const ReachMeNative: ReachMeNativeModule = NativeModules.ReachMeNative
  ? NativeModules.ReachMeNative
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      },
    );

export class NativeBridge {
  static async showOverlay(args: {
    title: string;
    message: string;
    tone: string;
    fileId?: string;
  }): Promise<void> {
    if (Platform.OS === 'android') {
      return ReachMeNative.showOverlay(args);
    }
  }

  static async hideOverlay(): Promise<void> {
    if (Platform.OS === 'android') {
      return ReachMeNative.hideOverlay();
    }
  }

  static async playAlarm(args: {
    tone: 'preset' | 'file';
    fileId?: string;
  }): Promise<void> {
    if (Platform.OS === 'android') {
      return ReachMeNative.playAlarm(args);
    } else if (Platform.OS === 'web') {
      // Web fallback: use HTML5 Audio
      const audio = new Audio('/alarm.mp3');
      audio.loop = true;
      return audio.play();
    }
  }

  static async stopAlarm(): Promise<void> {
    if (Platform.OS === 'android') {
      return ReachMeNative.stopAlarm();
    }
  }

  static async downloadFile(url: string, id: string): Promise<string> {
    if (Platform.OS === 'android') {
      return ReachMeNative.downloadFile(url, id);
    }
    // Web: store in IndexedDB or localStorage
    return url;
  }

  static async startForegroundService(): Promise<void> {
    if (Platform.OS === 'android') {
      return ReachMeNative.startForegroundService();
    }
  }

  static async stopForegroundService(): Promise<void> {
    if (Platform.OS === 'android') {
      return ReachMeNative.stopForegroundService();
    }
  }

  static async checkPermissions(): Promise<{[key: string]: boolean}> {
    if (Platform.OS === 'android') {
      return ReachMeNative.checkPermissions();
    }
    // Web: check notification permission
    if (Platform.OS === 'web' && 'Notification' in window) {
      return {
        notifications: Notification.permission === 'granted',
      };
    }
    return {};
  }

  static async requestOverlayPermission(): Promise<void> {
    if (Platform.OS === 'android') {
      return ReachMeNative.requestOverlayPermission();
    }
  }

  static async requestDNDPermission(): Promise<void> {
    if (Platform.OS === 'android') {
      return ReachMeNative.requestDNDPermission();
    }
  }

  static async requestExactAlarmPermission(): Promise<void> {
    if (Platform.OS === 'android') {
      return ReachMeNative.requestExactAlarmPermission();
    }
  }

  static async requestBatteryOptimization(): Promise<void> {
    if (Platform.OS === 'android') {
      return ReachMeNative.requestBatteryOptimization();
    }
  }

  static async getLocalFilePath(fileId: string): Promise<string | null> {
    if (Platform.OS === 'android') {
      return ReachMeNative.getLocalFilePath(fileId);
    }
    return null;
  }
}
