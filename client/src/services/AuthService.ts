import axios, {AxiosInstance} from 'axios';
import {User, UserCheckResponse} from '@types/index';
import {StorageService} from './StorageService';
import {config, auth} from '../config';

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

  async passwordLogin(email: string, password: string): Promise<{user: User; token?: string}> {
    if (!auth.passwordLoginEnabled) {
      throw new Error('Password login disabled');
    }
    try {
      const response = await this.api.post(auth.passwordLoginEndpoint, {email, password});
      const data = response.data || {};
      // Expected shape: { success: boolean, token: string, user: { email, firstName, lastName, photoUrl? } }
      if (data.success === false) {
        throw new Error(data.message || 'Login failed');
      }
      const user: User = {
        email: (data.user && data.user.email) || email,
        firstName: (data.user && data.user.firstName) || '',
        lastName: (data.user && data.user.lastName) || '',
        photoUrl: data.user && data.user.photoUrl ? data.user.photoUrl : undefined,
      };
      return {user, token: data.token};
    } catch (error: any) {
      console.error('Password login failed:', error);
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
