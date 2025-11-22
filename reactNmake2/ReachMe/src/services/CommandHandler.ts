import { StorageService } from './StorageService';
import NativeBridge from '../native/NativeBridge';

export class CommandHandler {
  async handle(command: any): Promise<void> {
    console.log('Handling command:', command.type);
    switch (command.type) {
      case 'download':
        await this.handleDownload(command);
        break;
      case 'alert':
        await this.handleAlert(command);
        break;
      case 'forward':
        await this.handleForward(command);
        break;
      case 'mute':
        await this.handleMute(command);
        break;
      case 'sleep':
        await this.handleSleep(command);
        break;
      case 'wake':
        await this.handleWake(command);
        break;
      case 'logout':
        await this.handleLogout(command);
        break;
      case 'wipe':
        await this.handleWipe(command);
        break;
      default:
        console.warn('Unknown command type:', (command as any).type);
    }
  }

  private async handleDownload(command: any): Promise<void> {
    try {
      const localPath = await NativeBridge.downloadFile(
        command.url,
        command.id,
      );
      console.log(`File downloaded: ${command.id} -> ${localPath}`);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }

  private async handleAlert(command: any): Promise<void> {
    const muteUntil = await StorageService.getMuteUntil();
    if (muteUntil && Date.now() < muteUntil) {
      console.log('Currently muted, skipping alarm');
      return;
    }

    const alarmId = command.id;
    const createdTs = command.create_date
      ? isNaN(Number(command.create_date))
        ? Date.parse(command.create_date)
        : Number(command.create_date)
      : Date.now();
    if (alarmId) {
      const already = await StorageService.isAlarmProcessed(alarmId, createdTs);
      if (already) {
        console.log(`Skipping duplicate alarm id=${alarmId}`);
        return;
      }
    }

    try {
      await NativeBridge.playAlarm({
        tone: command.tone,
        fileId: command.fileId,
      });

      if (NativeBridge.showOverlay) {
        await NativeBridge.showOverlay({
          title: command.title,
          message: command.msg,
          tone: command.tone,
          fileId: command.fileId,
        });
      }

      if (alarmId) {
        await StorageService.addAlarmToHistory(
          alarmId,
          createdTs,
          command.title,
          command.msg,
        );
      }
    } catch (error) {
      console.error('Alert failed:', error);
    }
  }

  private async handleForward(command: any): Promise<void> {
    console.log(`Forwarding to ${command.target}: ${command.msg}`);
  }

  private async handleMute(command: any): Promise<void> {
    const muteUntil = Date.now() + command.duration_ms;
    await StorageService.setMuteUntil(muteUntil);
    console.log(`Muted until ${new Date(muteUntil)}`);
  }

  private async handleSleep(command: any): Promise<void> {
    const sleepUntil = Date.now() + command.duration_ms;
    await StorageService.setSleepUntil(sleepUntil);
    console.log(`Sleeping until ${new Date(sleepUntil)}`);
  }

  private async handleWake(command: any): Promise<void> {
    await StorageService.setSleepUntil(null);
    console.log('Woke up from sleep');
  }

  private async handleLogout(command: any): Promise<void> {
    await NativeBridge.stopForegroundService();
    if (command.keepData) {
      await StorageService.clearAuth();
      console.log('Logged out (keeping data)');
    } else {
      await StorageService.clearAll();
      console.log('Logged out (cleared all data)');
    }
  }

  private async handleWipe(command: any): Promise<void> {
    await NativeBridge.stopForegroundService();
    await StorageService.clearAll();
    console.log('All data wiped');
  }
}

export default new CommandHandler();
