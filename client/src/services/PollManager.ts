import {PollService} from './PollService';
import {StorageService} from './StorageService';

class PollManager {
  private service: PollService | null = null;
  private running = false;

  get isRunning(): boolean {
    return this.running;
  }

  async ensureRunning(): Promise<void> {
    if (this.running && this.service) return;
    const deviceId = await StorageService.getDeviceId();
    const settings = await StorageService.getPollSettings();
    const intervalSeconds = settings ? settings.minutes * 60 + settings.seconds : 30;
    this.service = new PollService(deviceId);
    await this.service.startPolling(intervalSeconds * 1000);
    this.running = true;
  }

  async stop(): Promise<void> {
    if (this.service) {
      this.service.stopPolling();
    }
    this.service = null;
    this.running = false;
  }

  async updateInterval(minutes: number, seconds: number): Promise<void> {
    await StorageService.savePollSettings(minutes, seconds);
    if (!this.service) {
      // If not running, start with the new interval
      await this.ensureRunning();
      return;
    }
    const intervalSeconds = minutes * 60 + seconds;
    this.service.stopPolling();
    await this.service.startPolling(intervalSeconds * 1000);
  }
}

export const pollManager = new PollManager();
