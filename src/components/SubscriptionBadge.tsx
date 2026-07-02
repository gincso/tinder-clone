import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../config/theme';

interface SubscriptionBadgeProps {
  tier: 'free' | 'premium' | 'platinum';
  size?: 'small' | 'large';
}

const TIER_CONFIG = {
  free: {
    label: 'Free',
    icon: '○',
    color: COLORS.free,
    bgColor: '#F0F0F0',
  },
  premium: {
    label: 'Premium',
    icon: '◆',
    color: COLORS.gold,
    bgColor: '#FFF8E1',
  },
  platinum: {
    label: 'Platinum',
    icon: '◇',
    color: COLORS.platinum,
    bgColor: '#F5F5FA',
  },
};

const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({ tier, size = 'small' }) => {
  const config = TIER_CONFIG[tier];
  const isLarge = size === 'large';

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }, isLarge && styles.badgeLarge]}>
      <Text style={[styles.icon, { color: config.color }, isLarge && styles.iconLarge]}>
        {config.icon}
      </Text>
      <Text
        style={[
          styles.label,
          { color: config.color },
          isLarge && styles.labelLarge,
          tier === 'premium' && { fontWeight: '800' },
          tier === 'platinum' && { fontWeight: '800' },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  badgeLarge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
    ...SHADOWS.small,
  },
  icon: {
    fontSize: 10,
  },
  iconLarge: {
    fontSize: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  labelLarge: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
});

export default SubscriptionBadge;
