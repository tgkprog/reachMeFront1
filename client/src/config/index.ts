/**
 * Application Configuration
 *
 * Centralizes all environment-based configuration.
 * Create a .env file from .env.example to set these values.
 */

import {
  API_BASE_URL,
  GOOGLE_WEB_CLIENT_ID,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  FACEBOOK_APP_ID,
  DEFAULT_POLL_INTERVAL,
  MIN_POLL_INTERVAL,
  MAX_POLL_INTERVAL,
  ENABLE_WEB_NOTIFICATIONS,
  ENABLE_SERVICE_WORKER,
  DEBUG_MODE,
  ANDROID_PACKAGE_NAME,
  WEB_PORT,
  WEB_APP_TITLE,
  STORAGE_ENCRYPTION_KEY,
  GOOGLE_ANALYTICS_ID,
  SENTRY_DSN,
  SKIP_USER_CHECK,
  MOCK_SERVER,
} from '@env';

// Helper to get boolean from string
const getBool = (value: string | undefined, defaultValue: boolean = false): boolean => {
  if (!value) return defaultValue;
  return value === 'true' || value === '1';
};

// Helper to get number from string
const getNumber = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const config = {
  // Backend API
  api: {
    baseUrl: API_BASE_URL || 'https://api.yourbackend.com',
  },

  // OAuth Configuration
  oauth: {
    google: {
      webClientId: GOOGLE_WEB_CLIENT_ID || '',
    },
    github: {
      clientId: GITHUB_CLIENT_ID || '',
      clientSecret: GITHUB_CLIENT_SECRET || '',
    },
    facebook: {
      appId: FACEBOOK_APP_ID || '',
    },
  },

  // Polling Configuration
  polling: {
    defaultInterval: getNumber(DEFAULT_POLL_INTERVAL, 60),
    minInterval: getNumber(MIN_POLL_INTERVAL, 10),
    maxInterval: getNumber(MAX_POLL_INTERVAL, 180),
  },

  // Feature Flags
  features: {
    webNotifications: getBool(ENABLE_WEB_NOTIFICATIONS, true),
    serviceWorker: getBool(ENABLE_SERVICE_WORKER, false),
    debugMode: getBool(DEBUG_MODE, false),
  },

  // Android Configuration
  android: {
    packageName: ANDROID_PACKAGE_NAME || 'com.reachme',
  },

  // Web Configuration
  web: {
    port: getNumber(WEB_PORT, 8080),
    title: WEB_APP_TITLE || 'ReachMe',
  },

  // Security
  security: {
    storageEncryptionKey: STORAGE_ENCRYPTION_KEY || '',
  },

  // Analytics (Optional)
  analytics: {
    googleAnalyticsId: GOOGLE_ANALYTICS_ID || '',
    sentryDsn: SENTRY_DSN || '',
  },

  // Development
  dev: {
    skipUserCheck: getBool(SKIP_USER_CHECK, false),
    mockServer: getBool(MOCK_SERVER, false),
  },
};

// Validation helper for required config
export const validateConfig = (): string[] => {
  const errors: string[] = [];

  if (!config.api.baseUrl || config.api.baseUrl === 'https://api.yourbackend.com') {
    errors.push('API_BASE_URL is not configured. Please set it in your .env file.');
  }

  if (!config.oauth.google.webClientId) {
    errors.push('GOOGLE_WEB_CLIENT_ID is not configured. Please set it in your .env file.');
  }

  return errors;
};

// Export individual configs for convenience
export const {api, oauth, polling, features, android, web, security, analytics, dev} = config;

export default config;
