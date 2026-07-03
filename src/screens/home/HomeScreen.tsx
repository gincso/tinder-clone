import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SIZES, SHADOWS, FREE_TIER_LIMITS, PREMIUM_TIER_LIMITS } from '../../config/theme';
import { databaseService } from '../../services/DatabaseService';
import { authService } from '../../services/AuthService';
import { UserProfile, DailyUsage, RootStackParamList } from '../../types';
import SwipeCard from '../../components/SwipeCard';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
  route: HomeScreenRouteProp;
}

type SwipeDirection = 'left' | 'right' | 'super';

const SWIPE_THRESHOLD = 120;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, route }) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'premium' | 'platinum'>('free');
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState<UserProfile | null>(null);
  const [lastSwipe, setLastSwipe] = useState<{ targetUserId: string; action: string } | null>(null);
  const [swipeHistory, setSwipeHistory] = useState<{ targetUserId: string; action: string }[]>([]);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const currentUser = authService.getCurrentUser();

  const fetchProfiles = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await databaseService.getProfilesForSwiping(currentUser.uid, 20);
      setProfiles(data.filter(p => p.id !== currentUser.uid));
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchUsageAndTier = useCallback(async () => {
    if (!currentUser) return;
    try {
      const usage = await databaseService.getDailyUsage(currentUser.uid);
      setDailyUsage(usage);
      const profile = await databaseService.getProfile(currentUser.uid);
      if (profile) {
        setSubscriptionTier(profile.subscriptionTier);
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  }, [currentUser]);

  useFocusEffect(
    useCallback(() => {
      fetchProfiles();
      fetchUsageAndTier();
    }, [fetchProfiles, fetchUsageAndTier])
  );

  const getLimits = () => {
    return subscriptionTier === 'free' ? FREE_TIER_LIMITS : PREMIUM_TIER_LIMITS;
  };

  const canSwipe = (direction: SwipeDirection): boolean => {
    const limits = getLimits();
    const swipesLeft = limits.swipesPerDay - (dailyUsage?.swipesUsed || 0);
    const superLikesLeft = limits.superLikesPerDay - (dailyUsage?.superLikesUsed || 0);

    if (swipesLeft <= 0) return false;
    if (direction === 'super' && superLikesLeft <= 0) return false;
    return true;
  };

  const handleOutOfSwipes = () => {
    Alert.alert(
      'Out of Swipes!',
      'Upgrade to Premium for unlimited swipes and more!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade', onPress: () => navigation.navigate('Premium') },
      ]
    );
  };

  const recordSwipeAction = useCallback(
    async (targetUserId: string, action: 'like' | 'nope' | 'super_like') => {
      if (!currentUser) return;
      try {
        await databaseService.recordSwipe({
          userId: currentUser.uid,
          targetUserId,
          action,
        });
        await databaseService.incrementSwipesUsed(currentUser.uid);

        setLastSwipe({ targetUserId, action });
        setSwipeHistory(prev => [...prev, { targetUserId, action }]);

        if (action === 'like' || action === 'super_like') {
          await checkForMatch(targetUserId);
        }

        fetchUsageAndTier();
      } catch (error) {
        console.error('Error recording swipe:', error);
      }
    },
    [currentUser, fetchUsageAndTier]
  );

  const checkForMatch = useCallback(
    async (targetUserId: string) => {
      if (!currentUser) return;
      try {
        const matches = await databaseService.getMatches(currentUser.uid);
        const newMatch = matches.find(
          m => m.users.includes(targetUserId) && m.isNew
        );
        if (newMatch) {
          const matchedProfile = profiles.find(p => p.id === targetUserId);
          if (matchedProfile) {
            setMatchedUser(matchedProfile);
            setShowMatchModal(true);
          }
        }
      } catch (error) {
        console.error('Error checking match:', error);
      }
    },
    [currentUser, profiles]
  );

  const swipe = useCallback(
    async (direction: SwipeDirection) => {
      if (!canSwipe(direction)) {
        handleOutOfSwipes();
        return;
      }

      const profile = profiles[currentIndex];
      if (!profile) return;

      const action = (direction === 'right' ? 'like' : direction === 'left' ? 'nope' : 'super_like') as 'like' | 'nope' | 'super_like';

      const targetX = direction === 'right' ? SIZES.width + 200 : direction === 'left' ? -SIZES.width - 200 : 0;
      const targetY = direction === 'super' ? -SIZES.height - 200 : 0;
      const targetRotate = direction === 'left' ? -30 : direction === 'right' ? 30 : 0;

      translateX.value = withTiming(targetX, { duration: 300 });
      translateY.value = withTiming(targetY, { duration: 300 });
      rotate.value = withTiming(targetRotate, { duration: 300 });
      cardScale.value = withTiming(0.8, { duration: 200 }, () => {
        cardScale.value = withTiming(1, { duration: 0 });
      });

      setTimeout(() => {
        translateX.value = 0;
        translateY.value = 0;
        rotate.value = 0;
        setCurrentIndex(prev => prev + 1);
        recordSwipeAction(profile.id, action);
      }, 300);
    },
    [currentIndex, profiles, canSwipe, translateX, translateY, rotate, cardScale, recordSwipeAction]
  );

  const handleRewind = useCallback(() => {
    if (currentIndex <= 0 || swipeHistory.length === 0) return;
    const prevSwipe = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory(prev => prev.slice(0, -1));
    setCurrentIndex(prev => prev - 1);
    setLastSwipe(null);
  }, [currentIndex, swipeHistory]);

  const animatedCardStyle = (index: number) => {
    const isTopCard = index === currentIndex;
    const offsetY = (index - currentIndex) * 8;
    const scaleFactor = Math.max(1 - (index - currentIndex) * 0.05, 0.9);

    return useAnimatedStyle(() => {
      if (!isTopCard) {
        return {
          transform: [
            { translateY: offsetY },
            { scale: scaleFactor },
          ],
          zIndex: profiles.length - index,
        };
      }

      const rotation = interpolate(
        translateX.value,
        [-SIZES.width / 2, 0, SIZES.width / 2],
        [-15, 0, 15]
      );

      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { rotate: `${rotation}deg` },
        ],
        zIndex: profiles.length,
        opacity: opacity.value,
      };
    });
  };

  const onSwipeLeft = useCallback(() => swipe('left'), [swipe]);
  const onSwipeRight = useCallback(() => swipe('right'), [swipe]);
  const onSwipeSuper = useCallback(() => swipe('super'), [swipe]);

  const renderTopBar = () => (
    <View style={styles.topBar}>
      <TouchableOpacity
        style={styles.topBarButton}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Icon name="settings-outline" size={SIZES.icon} color={COLORS.text} />
      </TouchableOpacity>
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.logoContainer}
      >
        <Text style={styles.logoText}>flame</Text>
      </LinearGradient>
      <TouchableOpacity
        style={styles.topBarButton}
        onPress={() => navigation.navigate('Premium')}
      >
        <Icon name="filter-outline" size={SIZES.icon} color={COLORS.text} />
      </TouchableOpacity>
    </View>
  );

  const renderActionButtons = () => {
    const limits = getLimits();
    const superLikesLeft = limits.superLikesPerDay - (dailyUsage?.superLikesUsed || 0);
    const swipesLeft = limits.swipesPerDay - (dailyUsage?.swipesUsed || 0);

    return (
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rewindButton]}
          onPress={handleRewind}
          disabled={currentIndex === 0}
        >
          <Icon
            name="refresh-outline"
            size={28}
            color={currentIndex === 0 ? COLORS.textLight : COLORS.accent}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.nopeButton]}
          onPress={onSwipeLeft}
          disabled={swipesLeft <= 0}
        >
          <Icon name="close-outline" size={32} color={COLORS.error} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.superLikeButton]}
          onPress={onSwipeSuper}
          disabled={superLikesLeft <= 0}
        >
          <Icon
            name="star-outline"
            size={28}
            color={superLikesLeft <= 0 ? COLORS.textLight : COLORS.superLike}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={onSwipeRight}
          disabled={swipesLeft <= 0}
        >
          <Icon name="heart-outline" size={32} color={COLORS.success} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.boostButton]}
          onPress={() => Alert.alert('Boost', 'Boost your profile to get more visibility!')}
        >
          <Icon name="flash-outline" size={28} color={COLORS.boost} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderSwipesLeft = () => {
    const limits = getLimits();
    const swipesLeft = limits.swipesPerDay - (dailyUsage?.swipesUsed || 0);
    if (subscriptionTier !== 'free') return null;
    return (
      <View style={styles.swipesLeftContainer}>
        <Text style={styles.swipesLeftText}>
          {swipesLeft > 0 ? `${swipesLeft} swipes left today` : 'Out of swipes'}
        </Text>
      </View>
    );
  };

  const renderOutOfSwipes = () => (
    <View style={styles.outOfSwipesContainer}>
      <Icon name="heart-dislike-outline" size={64} color={COLORS.textLight} />
      <Text style={styles.outOfSwipesTitle}>Out of Swipes!</Text>
      <Text style={styles.outOfSwipesSubtitle}>Upgrade to Premium for unlimited swipes</Text>
      <TouchableOpacity
        style={styles.upgradeButton}
        onPress={() => navigation.navigate('Premium')}
      >
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.upgradeGradient}
        >
          <Text style={styles.upgradeText}>Upgrade to Premium</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const currentProfile = profiles[currentIndex];
  const hasSwipesLeft = getLimits().swipesPerDay - (dailyUsage?.swipesUsed || 0) > 0;

  return (
    <View style={styles.container}>
      {renderTopBar()}
      {renderSwipesLeft()}

      <View style={styles.cardContainer}>
        {!hasSwipesLeft && profiles.length > 0 ? (
          renderOutOfSwipes()
        ) : currentProfile ? (
          profiles.slice(currentIndex, currentIndex + 3).map((profile, idx) => {
            const absoluteIndex = currentIndex + idx;
            if (absoluteIndex >= profiles.length) return null;
            return (
              <Animated.View
                key={profile.id}
                style={[
                  styles.cardWrapper,
                  animatedCardStyle(absoluteIndex),
                ]}
                pointerEvents={absoluteIndex === currentIndex ? 'auto' : 'none'}
              >
                <SwipeCard
                  profile={profile}
                  onSwipeLeft={onSwipeLeft}
                  onSwipeRight={onSwipeRight}
                  onSuperLike={onSwipeSuper}
                />
              </Animated.View>
            );
          })
        ) : (
          renderOutOfSwipes()
        )}
      </View>

      {currentProfile && hasSwipesLeft && renderActionButtons()}

      {showMatchModal && matchedUser && (
        <View style={styles.matchModalOverlay}>
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            style={styles.matchModalGradient}
          >
            <Text style={styles.matchModalTitle}>It's a Match!</Text>
            <Text style={styles.matchModalSubtitle}>
              You and {matchedUser.name} liked each other
            </Text>
            <View style={styles.matchModalActions}>
              <TouchableOpacity
                style={styles.keepSwipingButton}
                onPress={() => setShowMatchModal(false)}
              >
                <Text style={styles.keepSwipingText}>Keep Swiping</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendMessageButton}
                onPress={() => {
                  setShowMatchModal(false);
                  navigation.navigate('Chat', {
                    matchId: '',
                    userName: matchedUser.name,
                  });
                }}
              >
                <Text style={styles.sendMessageText}>Send a Message</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.paddingLarge,
    paddingBottom: SIZES.paddingSmall,
  },
  topBarButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  logoContainer: {
    paddingHorizontal: SIZES.paddingLarge,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radiusLarge,
  },
  logoText: {
    fontSize: SIZES.fontTitle,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 2,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.padding,
  },
  cardWrapper: {
    position: 'absolute',
    width: SIZES.cardWidth,
    height: SIZES.cardHeight,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: SIZES.padding,
    paddingBottom: SIZES.paddingLarge + 10,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  rewindButton: {
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  nopeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  superLikeButton: {
    borderWidth: 2,
    borderColor: COLORS.superLike,
  },
  likeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  boostButton: {
    borderWidth: 2,
    borderColor: COLORS.boost,
  },
  swipesLeftContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.paddingSmall,
  },
  swipesLeftText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.textSecondary,
  },
  outOfSwipesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.paddingLarge,
  },
  outOfSwipesTitle: {
    fontSize: SIZES.fontXXLarge,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.padding,
  },
  outOfSwipesSubtitle: {
    fontSize: SIZES.fontLarge,
    color: COLORS.textSecondary,
    marginTop: SIZES.paddingSmall,
    textAlign: 'center',
  },
  upgradeButton: {
    marginTop: SIZES.paddingLarge,
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
  },
  upgradeGradient: {
    paddingHorizontal: SIZES.paddingLarge * 2,
    paddingVertical: SIZES.padding,
    alignItems: 'center',
  },
  upgradeText: {
    fontSize: SIZES.fontLarge,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  matchModalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  matchModalGradient: {
    width: SIZES.width * 0.8,
    padding: SIZES.paddingLarge,
    borderRadius: SIZES.radiusLarge,
    alignItems: 'center',
  },
  matchModalTitle: {
    fontSize: SIZES.fontTitle,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SIZES.paddingSmall,
  },
  matchModalSubtitle: {
    fontSize: SIZES.fontLarge,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SIZES.paddingLarge,
    opacity: 0.9,
  },
  matchModalActions: {
    width: '100%',
    gap: SIZES.paddingSmall,
  },
  keepSwipingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radiusLarge,
    alignItems: 'center',
  },
  keepSwipingText: {
    fontSize: SIZES.fontLarge,
    fontWeight: '600',
    color: COLORS.white,
  },
  sendMessageButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radiusLarge,
    alignItems: 'center',
  },
  sendMessageText: {
    fontSize: SIZES.fontLarge,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default HomeScreen;
