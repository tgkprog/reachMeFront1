// Simple runtime config for React Native.
// For build-time overrides (local/dev/prod), replace these values via environment or native-build config.

const local = {
  api: { baseUrl: 'http://10.0.2.2:8052' }, // Android emulator host mapping
};

const dev = {
  api: { baseUrl: 'https://dev.reachme2.com:8052' },
};

const prod = {
  api: { baseUrl: 'https://reachme2.com:8052' },
};

// Use __DEV__ to choose local/dev for now. You can override by setting global.__APP_ENV__ = 'prod' etc.
const env = (global as any).__APP_ENV__ || (__DEV__ ? 'local' : 'prod');

const cfg = env === 'local' ? local : env === 'dev' ? dev : prod;

export default cfg;
