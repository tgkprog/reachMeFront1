// Web fallback for Google Sign-In (native component not available on web)
// For production web, integrate Google Identity Services or OAuth popup flow

export const GoogleSignin = {
  configure: (config: any) => {
    console.log('Google Sign-In configure (web stub):', config);
  },
  hasPlayServices: async () => false,
  signIn: async () => {
    throw new Error('Google Sign-In not available on web. Use password login or implement web OAuth flow.');
  },
  signOut: async () => {
    console.log('Google Sign-In signOut (web stub)');
  },
  isSignedIn: async () => false,
  getCurrentUser: async () => null,
};

export const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};
