import axios, {AxiosInstance} from 'axios';
import {User, UserCheckResponse} from '@types/index';
import {StorageService} from './StorageService';
import {config} from '../config';

export class AuthService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: config.api.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token interceptor
    this.api.interceptors.request.use(async config => {
      const token = await StorageService.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async checkUserAllowed(email: string): Promise<UserCheckResponse> {
    try {
      const response = await this.api.post('/api/user/check', {email});
      return response.data;
    } catch (error) {
      console.error('User check failed:', error);
      throw error;
    }
  }

  async canAttemptLogin(): Promise<boolean> {
    const lastAttempt = await StorageService.getLastLoginAttempt();
    if (!lastAttempt) {
      return true;
    }

    const threeMinutes = 3 * 60 * 1000;
    const now = Date.now();
    return now - lastAttempt >= threeMinutes;
  }

  async recordLoginAttempt(): Promise<void> {
    await StorageService.saveLastLoginAttempt(Date.now());
  }

  async login(user: User, token?: string): Promise<void> {
    await StorageService.saveUser(user);
    if (token) {
      await StorageService.saveToken(token);
    }
  }

  async logout(keepData: boolean = false): Promise<void> {
    if (!keepData) {
      await StorageService.clearAll();
    } else {
      await StorageService.clearAuth();
    }
  }

  async isLoggedIn(): Promise<boolean> {
    const user = await StorageService.getUser();
    return user !== null;
  }

  async getCurrentUser(): Promise<User | null> {
    return await StorageService.getUser();
  }
}
