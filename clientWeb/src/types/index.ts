export interface User {
  id?: number;
  email: string;
  name?: string;
  phone?: string;
  relationship?: string;
  googleId?: string;
}

export interface UserCheckResponse {
  allowed: boolean;
  user?: User;
  message?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface Alert {
  id: string;
  create_date: string;
  tone: string;
  title: string;
  msg: string;
  name: string;
  relationship: string;
  email: string;
  phone: string;
}

export interface ServerCommand {
  type: string;
  [key: string]: any;
}

export interface PollSettings {
  intervalSeconds: number;
  enabled: boolean;
}
