export const APP_NAME = 'Flame';
export const API_URL = 'https://api.flame.app';
export const VIDEO_CALL_PROVIDER = 'daily';
export const DAILY_API_KEY = ''; // Set via environment
export const STRIPE_PUBLISHABLE_KEY = ''; // Set via environment

export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: 'Free',
    features: [
      '25 swipes per day',
      '5 min video calls',
      '3 rewinds per day',
      '1 super like per day',
      'Basic profile',
      'Standard match suggestions',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 14.99,
    priceLabel: '$14.99',
    features: [
      'Unlimited swipes',
      '30 min video calls',
      'Unlimited rewinds',
      '5 super likes per day',
      'See who likes you',
      '1 boost per month',
      'Extended distance range',
      'Passport feature',
      'Incognito mode',
    ],
  },
  platinum: {
    id: 'platinum',
    name: 'Platinum',
    price: 29.99,
    priceLabel: '$29.99',
    features: [
      'Everything in Premium',
      'Unlimited video calls',
      'Priority profile visibility',
      'Message before matching',
      'Verified badge',
      '10 super likes per day',
      '3 boosts per month',
      'Advanced filters',
      'Read receipts',
    ],
  },
};

export const SWIPE_ACTIONS = {
  LIKE: 'like',
  NOPE: 'nope',
  SUPER_LIKE: 'super_like',
  BOOST: 'boost',
};
