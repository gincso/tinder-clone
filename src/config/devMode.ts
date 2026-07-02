export const DEV_MODE = true;

export const DEV_SETTINGS = {
  useMockData: DEV_MODE,
  logActions: DEV_MODE,
  skipAuth: DEV_MODE,
  defaultUser: {
    uid: 'user_self',
    email: 'alex@flame.app',
    displayName: 'Alex',
  },
};
