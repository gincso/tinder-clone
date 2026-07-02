import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SIZES, SHADOWS } from '../../config/theme';
import { databaseService } from '../../services/DatabaseService';
import { authService } from '../../services/AuthService';
import { UserProfile, RootStackParamList } from '../../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const SubscriptionBadge: React.FC<{ tier: 'free' | 'premium' | 'platinum' }> = ({ tier }) => {
  const badgeConfig = {
    free: { label: 'Free', bg: COLORS.free },
    premium: { label: 'Premium', bg: COLORS.gold },
    platinum: { label: 'Platinum', bg: '#C0C0C0' },
  };

  const config = badgeConfig[tier];

  return (
    <View style={[styles.subBadge, { backgroundColor: config.bg }]}>
      <Text style={styles.subBadgeText}>{config.label}</Text>
    </View>
  );
};

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [swipesToday, setSwipesToday] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);
  const [signingOut, setSigningOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const userProfile = await databaseService.getProfile(user.uid);
      setProfile(userProfile);

      const usage = await databaseService.getDailyUsage(user.uid);
      setSwipesToday(usage?.swipesUsed ?? 0);

      const matches = await databaseService.getMatches(user.uid);
      setMatchesCount(matches.length);
    } catch (err) {
      console.error('Failed to load profile:', err);
      Alert.alert('Error', 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            try {
              await authService.signOut();
            } catch (err) {
              console.error('Sign out failed:', err);
              Alert.alert('Error', 'Failed to sign out.');
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Unable to load profile.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isFree = profile.subscriptionTier === 'free';
  const profilePhoto = profile.photos?.[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.photoContainer}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
          ) : (
            <View style={[styles.profilePhoto, styles.photoPlaceholder]}>
              <Text style={styles.placeholderText}>
                {profile.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.age}>{profile.age}</Text>
        </View>

        <Text style={styles.location}>
          📍 {profile.location?.city || 'Unknown location'}
        </Text>

        <SubscriptionBadge tier={profile.subscriptionTier} />

        {profile.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        ) : null}

        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestsContainer}>
              {profile.interests.map((interest, index) => (
                <View key={index} style={styles.interestChip}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{swipesToday}</Text>
            <Text style={styles.statLabel}>Swipes Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{matchesCount}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
        </View>

        {isFree && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('Premium')}
            activeOpacity={0.8}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <ActivityIndicator size="small" color={COLORS.error} />
          ) : (
            <Text style={styles.signOutText}>Sign Out</Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: SIZES.fontLarge,
    color: COLORS.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: SIZES.paddingSmall,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  settingsIcon: {
    fontSize: 20,
  },
  photoContainer: {
    alignItems: 'center',
    marginTop: SIZES.paddingSmall,
    marginBottom: SIZES.padding,
  },
  profilePhoto: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  photoPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    gap: 8,
  },
  name: {
    fontSize: SIZES.fontXXLarge,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  age: {
    fontSize: SIZES.fontXLarge,
    color: COLORS.textSecondary,
  },
  location: {
    fontSize: SIZES.fontMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SIZES.paddingSmall,
  },
  subBadge: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: SIZES.radiusSmall,
    marginTop: SIZES.paddingSmall,
    marginBottom: SIZES.padding,
  },
  subBadgeText: {
    fontSize: SIZES.fontSmall,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 1,
  },
  section: {
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.fontLarge,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.paddingSmall,
  },
  bioText: {
    fontSize: SIZES.fontMedium,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  interestText: {
    fontSize: SIZES.fontMedium,
    color: COLORS.text,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginTop: SIZES.padding,
    alignItems: 'center',
    justifyContent: 'space-around',
    ...SHADOWS.small,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  statNumber: {
    fontSize: SIZES.fontXXLarge,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: SIZES.fontSmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  upgradeButton: {
    marginTop: SIZES.paddingLarge,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: SIZES.radiusLarge,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  upgradeButtonText: {
    fontSize: SIZES.fontLarge,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  signOutButton: {
    marginTop: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: SIZES.fontLarge,
    color: COLORS.error,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});

export default ProfileScreen;
