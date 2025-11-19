import axios, { type AxiosInstance } from "axios";
import type { ServerCommand } from "@/types";
import config from "@/config";
import storage from "./storage";
import { useAlarmStore } from "@/stores/alarms";

class PollService {
  private api: AxiosInstance;
  private intervalId: number | null = null;
  private currentInterval = 60; // seconds
  private isPolling = false;

  constructor() {
    this.api = axios.create({
      baseURL: config.api.baseUrl,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.api.interceptors.request.use((cfg) => {
      const token = storage.getToken();
      if (token) {
        cfg.headers.Authorization = `Bearer ${token}`;
      }
      return cfg;
    });
  }

  start(intervalSeconds: number = 60): void {
    if (this.isPolling) {
      console.log("Polling already active");
      return;
    }

    this.currentInterval = intervalSeconds;
    this.isPolling = true;

    console.log(`Starting polling every ${intervalSeconds}s`);

    // Poll immediately
    this.poll();

    // Then poll on interval
    this.intervalId = window.setInterval(() => {
      this.poll();
    }, intervalSeconds * 1000);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isPolling = false;
    console.log("Polling stopped");
  }

  updateInterval(intervalSeconds: number): void {
    this.currentInterval = intervalSeconds;
    if (this.isPolling) {
      this.stop();
      this.start(intervalSeconds);
    }
  }

  private async poll(): Promise<void> {
    try {
      const deviceId = storage.getDeviceId();
      const response = await this.api.get("/reachme/check", {
        params: { deviceId },
      });

      const { commands, min_poll_time } = response.data;

      // Adjust interval if server suggests different timing
      if (min_poll_time && min_poll_time !== this.currentInterval) {
        console.log(`Server suggests poll interval: ${min_poll_time}s`);
        this.updateInterval(min_poll_time);
      }

      // Handle commands
      if (commands && commands.length > 0) {
        for (const command of commands) {
          await this.handleCommand(command);
        }
      }
    } catch (error) {
      console.error("Poll error:", error);
    }
  }

  private async handleCommand(command: ServerCommand): Promise<void> {
    console.log("Handling command:", command.type, command);

    switch (command.type) {
      case "alert":
        this.handleAlert(command);
        break;
      case "sleep":
        this.handleSleep(command);
        break;
      case "mute":
        this.handleMute(command);
        break;
      case "wake":
        this.handleWake();
        break;
      case "logout":
        this.handleLogout();
        break;
      default:
        console.log("Unknown command type:", command.type);
    }
  }

  private normalizeDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString();
    // If it looks like "2023-11-19 12:34:56" and has no Z or offset, append Z
    // This ensures the browser treats it as UTC
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?$/)) {
      return dateStr.replace(' ', 'T') + 'Z';
    }
    return dateStr;
  }

  private handleAlert(command: any): void {
    const alarmId = command.id || `${Date.now()}`;

    if (storage.isAlarmProcessed(alarmId)) {
      console.log("Alarm already processed:", alarmId);
      return;
    }

    const alarm = {
      id: alarmId,
      create_date: this.normalizeDate(command.create_date),
      tone: command.tone || "default",
      title: command.title || "Alert",
      msg: command.msg || "",
      name: command.name || "",
      relationship: command.relationship || "",
      email: command.email || "",
      phone: command.phone || "",
    };

    storage.addAlarmToHistory(alarm);

    // Update store
    try {
      const alarmStore = useAlarmStore();
      alarmStore.setLatestAlarm(alarm);
    } catch (e) {
      console.warn("Could not update alarm store (Pinia not active?)", e);
    }

    // Show browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(alarm.title, {
        body: alarm.msg,
        icon: "/favicon.ico",
        tag: alarmId,
      });
    }
  }

  private handleSleep(command: any): void {
    const minutes = command.minutes || 60;
    const until = Date.now() + minutes * 60 * 1000;
    storage.saveSleepUntil(until);
    console.log(`Sleep until ${new Date(until).toLocaleString()}`);
  }

  private handleMute(command: any): void {
    const minutes = command.minutes || 60;
    const until = Date.now() + minutes * 60 * 1000;
    storage.saveMuteUntil(until);
    console.log(`Mute until ${new Date(until).toLocaleString()}`);
  }

  private handleWake(): void {
    storage.saveSleepUntil(0);
    storage.saveMuteUntil(0);
    console.log("Wake command received");
  }

  private handleLogout(): void {
    console.log("Logout command received");
    this.stop();
    storage.clear();
    window.location.href = "/login";
  }
}

export default new PollService();
