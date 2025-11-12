import {
  ServerCommand,
  DownloadCommand,
  AlertCommand,
  ForwardCommand,
  MuteCommand,
  SleepCommand,
  WakeCommand,
  LogoutCommand,
  WipeCommand,
} from '../types';
import {NativeBridge} from '../native/NativeBridge';
import {StorageService} from './StorageService';
import {Platform} from 'react-native';

export class CommandHandler {
  async handle(command: ServerCommand): Promise<void> {
    console.log('Handling command:', command.type);

    switch (command.type) {
      case 'download':
        await this.handleDownload(command as DownloadCommand);
        break;
      case 'alert':
        await this.handleAlert(command as AlertCommand);
        break;
      case 'forward':
        await this.handleForward(command as ForwardCommand);
        break;
      case 'mute':
        await this.handleMute(command as MuteCommand);
        break;
      case 'sleep':
        await this.handleSleep(command as SleepCommand);
        break;
      case 'wake':
        await this.handleWake(command as WakeCommand);
        break;
      case 'logout':
        await this.handleLogout(command as LogoutCommand);
        break;
      case 'wipe':
        await this.handleWipe(command as WipeCommand);
        break;
      default:
        console.warn('Unknown command type:', (command as any).type);
    }
  }

  private async handleDownload(command: DownloadCommand): Promise<void> {
    try {
      const localPath = await NativeBridge.downloadFile(command.url, command.id);
      console.log(`File downloaded: ${command.id} -> ${localPath}`);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }

  private async handleAlert(command: AlertCommand): Promise<void> {
    // Check if muted
    const muteUntil = await StorageService.getMuteUntil();
    if (muteUntil && Date.now() < muteUntil) {
      console.log('Currently muted, skipping alarm');
      return;
    }

    try {
      // Play alarm
      await NativeBridge.playAlarm({
        tone: command.tone,
        fileId: command.fileId,
      });

      // Show overlay or notification
      if (Platform.OS === 'android') {
        await NativeBridge.showOverlay({
          title: command.title,
          message: command.msg,
          tone: command.tone,
          fileId: command.fileId,
        });
      } else if (Platform.OS === 'web') {
        // Web: show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(command.title, {
            body: command.msg,
            requireInteraction: true,
          });
        }
      }
    } catch (error) {
      console.error('Alert failed:', error);
    }
  }

  private async handleForward(command: ForwardCommand): Promise<void> {
    // Forward notification to another user via API
    console.log(`Forwarding to ${command.target}: ${command.msg}`);
    // Implementation depends on backend API
  }

  private async handleMute(command: MuteCommand): Promise<void> {
    const muteUntil = Date.now() + command.duration_ms;
    await StorageService.setMuteUntil(muteUntil);
    console.log(`Muted until ${new Date(muteUntil)}`);
  }

  private async handleSleep(command: SleepCommand): Promise<void> {
    const sleepUntil = Date.now() + command.duration_ms;
    await StorageService.setSleepUntil(sleepUntil);
    console.log(`Sleeping until ${new Date(sleepUntil)}`);
  }

  private async handleWake(command: WakeCommand): Promise<void> {
    await StorageService.setSleepUntil(null);
    console.log('Woke up from sleep');
  }

  private async handleLogout(command: LogoutCommand): Promise<void> {
    await NativeBridge.stopForegroundService();
    
    if (command.keepData) {
      await StorageService.clearAuth();
      console.log('Logged out (keeping data)');
    } else {
      await StorageService.clearAll();
      console.log('Logged out (cleared all data)');
    }
  }

  private async handleWipe(command: WipeCommand): Promise<void> {
    await NativeBridge.stopForegroundService();
    await StorageService.clearAll();
    console.log('All data wiped');
  }
}
