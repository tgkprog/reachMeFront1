interface Config {
  api: {
    baseUrl: string;
  };
  oauth: {
    google: {
      clientId: string;
    };
  };
  auth: {
    passwordLoginEnabled: boolean;
    passwordLoginEndpoint: string;
  };
}

const config: Config = {
  api: {
    baseUrl:
      (window as any).APP_CONFIG?.API_BASE_URL ||
      import.meta.env.VITE_API_BASE_URL ||
      "https://reachme2.com:8052",
  },
  oauth: {
    google: {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
    },
  },
  auth: {
    passwordLoginEnabled: true,
    passwordLoginEndpoint: "/user/login",
  },
};

export default config;
