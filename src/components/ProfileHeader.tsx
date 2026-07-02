import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../config/theme';
import { UserProfile } from '../types';
import SubscriptionBadge from './SubscriptionBadge';

interface ProfileHeaderProps {
  profile: UserProfile;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile }) => {
  return (
    <View style={styles.container}>
      <View style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={1}>
          {profile.name}
          <Text style={styles.age}>, {profile.age}</Text>
        </Text>
        {profile.verified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedIcon}>✓</Text>
          </View>
        )}
      </View>
      {profile.bio ? (
        <Text style={styles.bio} numberOfLines={2}>
          {profile.bio}
        </Text>
      ) : null}
      <View style={styles.detailsRow}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.location} numberOfLines={1}>
          {profile.location.city}
        </Text>
      </View>
      {(profile.isPremium || profile.isPlatinum) && (
        <View style={styles.badgeRow}>
          {profile.isPremium && <SubscriptionBadge tier="premium" size="small" />}
          {profile.isPlatinum && <SubscriptionBadge tier="platinum" size="small" />}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: SIZES.fontXXLarge,
    fontWeight: '800',
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  age: {
    fontSize: SIZES.fontXLarge,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
  },
  verifiedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedIcon: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },
  bio: {
    fontSize: SIZES.fontMedium,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationIcon: {
    fontSize: 13,
  },
  location: {
    fontSize: SIZES.fontSmall,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
});

export default ProfileHeader;
