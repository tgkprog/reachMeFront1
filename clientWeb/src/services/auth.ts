import axios, { type AxiosInstance } from "axios";
import type { User, UserCheckResponse, LoginResponse } from "@/types";
import config from "@/config";
import storage from "./storage";

class AuthService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: config.api.baseUrl,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add token interceptor
    this.api.interceptors.request.use((cfg) => {
      const token = storage.getToken();
      if (token) {
        cfg.headers.Authorization = `Bearer ${token}`;
      }
      return cfg;
    });
  }

  async checkUserAllowed(email: string): Promise<UserCheckResponse> {
    try {
      const response = await this.api.post("/api/user/check", { email });
      return response.data;
    } catch (error) {
      console.error("User check failed:", error);
      throw error;
    }
  }

  async googleLogin(credential: string): Promise<LoginResponse> {
    try {
      const response = await this.api.post("/api/auth/google", { credential });
      const { user, token } = response.data;

      storage.saveUser(user);
      storage.saveToken(token);
      storage.clearLastLoginAttempt();

      return response.data;
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    }
  }

  async passwordLogin(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.api.post(config.auth.passwordLoginEndpoint, {
        email,
        password,
      });
      const { user, token } = response.data;

      storage.saveUser(user);
      storage.saveToken(token);
      storage.clearLastLoginAttempt();

      return response.data;
    } catch (error) {
      console.error("Password login failed:", error);
      throw error;
    }
  }

  async isLoggedIn(): Promise<boolean> {
    const user = storage.getUser();
    const token = storage.getToken();
    return !!(user && token);
  }

  async logout(): Promise<void> {
    storage.clearAuth();
  }

  canAttemptLogin(): boolean {
    const lastAttempt = storage.getLastLoginAttempt();
    if (!lastAttempt) return true;

    const threeMinutes = 3 * 60 * 1000;
    return Date.now() - lastAttempt > threeMinutes;
  }

  recordLoginAttempt(): void {
    storage.saveLastLoginAttempt(Date.now());
  }
}

export default new AuthService();
