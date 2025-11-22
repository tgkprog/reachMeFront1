import axios, { AxiosInstance } from 'axios';
import { StorageService } from './StorageService';
import CommandHandler from './CommandHandler';
import config from '../config';

export class PollService {
  private api: AxiosInstance;
  private pollTimer: NodeJS.Timeout | null = null;
  private isPolling: boolean = false;
  private commandHandler: CommandHandler;
  private deviceId: string;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
    this.commandHandler = new CommandHandler();
    this.api = axios.create({
      baseURL: config.api.baseUrl,
      timeout: 30000,
    });

    this.api.interceptors.request.use(async cfg => {
      const token = await StorageService.getToken();
      if (token) {
        cfg.headers = cfg.headers || {};
        (cfg.headers as any).Authorization = `Bearer ${token}`;
      }
      return cfg;
    });
  }

  async startPolling(intervalMs: number): Promise<void> {
    if (this.isPolling) return;
    this.isPolling = true;
    await this.poll();
    this.pollTimer = setInterval(async () => {
      await this.poll();
    }, intervalMs);
  }

  stopPolling(): void {
    this.isPolling = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  async poll(): Promise<void> {
    const sleepUntil = await StorageService.getSleepUntil();
    if (sleepUntil && Date.now() < sleepUntil) {
      console.log('Currently sleeping, skipping poll');
      return;
    }

    try {
      const response = await this.api.get(
        `/reachme/check?deviceId=${this.deviceId}`,
      );
      const data = response.data || {};
      const commands = data.commands || [];
      const min_poll_time = data.min_poll_time || 0;

      if (min_poll_time) {
        const currentSettings = await StorageService.getPollSettings();
        if (currentSettings) {
          const userPollTime =
            currentSettings.minutes * 60 + currentSettings.seconds;
          const effectivePollTime = Math.max(userPollTime, min_poll_time);
          const currentInterval = this.pollTimer
            ? (this.pollTimer as any)._idleTimeout
            : 0;
          if (effectivePollTime * 1000 !== currentInterval) {
            this.stopPolling();
            await this.startPolling(effectivePollTime * 1000);
          }
        }
      }

      if (commands && commands.length > 0) {
        for (const command of commands) {
          await this.commandHandler.handle(command);
        }
      }
    } catch (error) {
      console.error('Poll failed:', error);
    }
  }

  async updatePollInterval(
    minutes: number,
    seconds: number,
    minPollTime: number = 0,
  ): Promise<void> {
    await StorageService.savePollSettings(minutes, seconds);
    const userPollTime = minutes * 60 + seconds;
    const effectivePollTime = Math.max(userPollTime, minPollTime);
    this.stopPolling();
    await this.startPolling(effectivePollTime * 1000);
  }
}

export default PollService;
