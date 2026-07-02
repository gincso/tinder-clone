// Firebase configuration
// Replace with your own Firebase project config
export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  PROFILES: 'profiles',
  SWIPES: 'swipes',
  MATCHES: 'matches',
  MESSAGES: 'messages',
  VIDEO_CALLS: 'video_calls',
  SUBSCRIPTIONS: 'subscriptions',
  SETTINGS: 'settings',
  REPORTS: 'reports',
  BOOSTS: 'boosts',
};
