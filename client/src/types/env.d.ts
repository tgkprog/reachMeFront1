/**
 * TypeScript definitions for environment variables
 *
 * This file provides type safety for variables loaded from .env file
 * via react-native-dotenv
 */

declare module '@env' {
  // Backend API
  export const API_BASE_URL: string;

  // OAuth Configuration
  export const GOOGLE_WEB_CLIENT_ID: string;
  export const GITHUB_CLIENT_ID: string;
  export const GITHUB_CLIENT_SECRET: string;
  export const FACEBOOK_APP_ID: string;

  // Polling Configuration
  export const DEFAULT_POLL_INTERVAL: string;
  export const MIN_POLL_INTERVAL: string;
  export const MAX_POLL_INTERVAL: string;

  // Feature Flags
  export const ENABLE_WEB_NOTIFICATIONS: string;
  export const ENABLE_SERVICE_WORKER: string;
  export const DEBUG_MODE: string;

  // Android Configuration
  export const ANDROID_PACKAGE_NAME: string;

  // Web Configuration
  export const WEB_PORT: string;
  export const WEB_APP_TITLE: string;

  // Security
  export const STORAGE_ENCRYPTION_KEY: string;

  // Analytics (Optional)
  export const GOOGLE_ANALYTICS_ID: string;
  export const SENTRY_DSN: string;

  // Development
  export const SKIP_USER_CHECK: string;
  export const MOCK_SERVER: string;
}
