export interface User {
  email: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
}

export interface UserCheckResponse {
  allowed: boolean;
  message?: string;
}

export interface ServerCommand {
  type: 'download' | 'alert' | 'forward' | 'mute' | 'sleep' | 'wake' | 'logout' | 'wipe';
  [key: string]: any;
}

export interface DownloadCommand extends ServerCommand {
  type: 'download';
  id: string;
  url: string;
}

export interface AlertCommand extends ServerCommand {
  type: 'alert';
  tone: 'preset' | 'file';
  fileId?: string;
  title: string;
  msg: string;
  // Unique alarm identifier provided by server
  id?: string;
  // ISO timestamp or epoch milliseconds string when created
  create_date?: string;
}

export interface ForwardCommand extends ServerCommand {
  type: 'forward';
  target: string;
  msg: string;
}

export interface MuteCommand extends ServerCommand {
  type: 'mute';
  duration_ms: number;
}

export interface SleepCommand extends ServerCommand {
  type: 'sleep';
  duration_ms: number;
}

export interface WakeCommand extends ServerCommand {
  type: 'wake';
}

export interface LogoutCommand extends ServerCommand {
  type: 'logout';
  keepData: boolean;
}

export interface WipeCommand extends ServerCommand {
  type: 'wipe';
}

export interface PollResponse {
  commands?: ServerCommand[];
  min_poll_time?: number;
}

export interface AppState {
  isLoggedIn: boolean;
  user: User | null;
  isMuted: boolean;
  muteUntil: number | null;
  isSleeping: boolean;
  sleepUntil: number | null;
  pollInterval: {minutes: number; seconds: number};
  effectivePollTime: number;
  lastLoginAttempt: number | null;
}

export interface PermissionStatus {
  overlay: boolean;
  dnd: boolean;
  exactAlarm: boolean;
  batteryOptimization: boolean;
  notifications: boolean;
  storage: boolean;
}
