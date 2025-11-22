import axios, { AxiosInstance } from 'axios';
import { StorageService } from './StorageService';
import config from '../config';

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
    this.api.interceptors.request.use(async cfg => {
      const token = await StorageService.getToken();
      if (token) {
        (cfg.headers as any).Authorization = `Bearer ${token}`;
      }
      return cfg;
    });
  }

  async checkUserAllowed(email: string): Promise<any> {
    try {
      const response = await this.api.post('/api/user/check', { email });
      return response.data;
    } catch (error) {
      console.error('User check failed:', error);
      throw error;
    }
  }

  async passwordLogin(
    email: string,
    password: string,
  ): Promise<{ user: any; token?: string }> {
    try {
      const response = await this.api.post('/api/user/passwordLogin', {
        email,
        password,
      });
      const data = response.data || {};
      if (data.success === false) {
        throw new Error(data.message || 'Login failed');
      }
      const user = data.user || { email };
      return { user, token: data.token };
    } catch (error) {
      console.error('Password login failed:', error);
      throw error;
    }
  }

  async canAttemptLogin(): Promise<boolean> {
    const lastAttempt = await StorageService.getLastLoginAttempt();
    if (!lastAttempt) return true;
    const threeMinutes = 3 * 60 * 1000;
    const now = Date.now();
    return now - lastAttempt >= threeMinutes;
  }

  async recordLoginAttempt(): Promise<void> {
    await StorageService.saveLastLoginAttempt(Date.now());
  }

  async login(user: any, token?: string): Promise<void> {
    await StorageService.saveUser(user);
    if (token) await StorageService.saveToken(token);
  }

  async logout(keepData: boolean = false): Promise<void> {
    if (!keepData) await StorageService.clearAll();
    else await StorageService.clearAuth();
  }

  async isLoggedIn(): Promise<boolean> {
    const user = await StorageService.getUser();
    return user !== null;
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<{ user: any; token?: string }> {
    try {
      const response = await this.api.post('/api/user/register', {
        email,
        password,
        firstName,
        lastName,
      });
      const data = response.data || {};
      if (data.success === false)
        throw new Error(data.message || 'Registration failed');
      const user = data.user || { email, firstName, lastName };
      return { user, token: data.token };
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await this.api.post('/api/user/forgot-password', {
        email,
      });
      if (response.data.success === false)
        throw new Error(response.data.message || 'Forgot password failed');
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw error;
    }
  }
}

export default new AuthService();
