import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  primary: '#FF6B6B',
  secondary: '#FFE66D',
  accent: '#4ECDC4',
  background: '#FFFFFF',
  surface: '#F8F8F8',
  text: '#2D3436',
  textSecondary: '#636E72',
  textLight: '#B2BEC3',
  border: '#E0E0E0',
  error: '#E74C3C',
  success: '#2ECC71',
  white: '#FFFFFF',
  black: '#000000',
  gradientStart: '#FF6B6B',
  gradientEnd: '#FFA07A',
  premium: '#FFD700',
  superLike: '#00BFFF',
  boost: '#9B59B6',
  free: '#A0A0A0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

export const SIZES = {
  width,
  height,
  padding: 16,
  paddingSmall: 8,
  paddingLarge: 24,
  radius: 12,
  radiusSmall: 8,
  radiusLarge: 20,
  icon: 24,
  iconLarge: 32,
  fontSmall: 12,
  fontMedium: 14,
  fontLarge: 16,
  fontXLarge: 20,
  fontXXLarge: 28,
  fontTitle: 32,
  cardWidth: width * 0.9,
  cardHeight: height * 0.65,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const FONTS = {
  regular: 'System',
  bold: 'System',
};

export const FREE_TIER_LIMITS = {
  swipesPerDay: 25,
  superLikesPerDay: 1,
  boostsPerMonth: 0,
  rewindsPerDay: 3,
  seeWhoLikesYou: false,
  maxDistance: 50,
  ageRange: { min: 18, max: 55 },
  videoCallMinutes: 5,
};

export const PREMIUM_TIER_LIMITS = {
  swipesPerDay: Infinity,
  superLikesPerDay: 5,
  boostsPerMonth: 1,
  rewindsPerDay: Infinity,
  seeWhoLikesYou: true,
  maxDistance: 100,
  ageRange: { min: 18, max: 99 },
  videoCallMinutes: 30,
};
