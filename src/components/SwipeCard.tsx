import React, { useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { COLORS, SIZES, SHADOWS } from '../config/theme';
import { UserProfile } from '../types';
import ProfileHeader from './ProfileHeader';

interface SwipeCardProps {
  profile: UserProfile;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSuperLike: () => void;
}

const SWIPE_THRESHOLD = SIZES.cardWidth * 0.3;

const SwipeCard: React.FC<SwipeCardProps> = ({ profile, onSwipeLeft, onSwipeRight, onSuperLike }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const isSwiped = useSharedValue(false);

  const triggerSwipeLeft = useCallback(() => {
    if (!isSwiped.value) {
      isSwiped.value = true;
      onSwipeLeft();
    }
  }, [onSwipeLeft]);

  const triggerSwipeRight = useCallback(() => {
    if (!isSwiped.value) {
      isSwiped.value = true;
      onSwipeRight();
    }
  }, [onSwipeRight]);

  const triggerSuperLike = useCallback(() => {
    if (!isSwiped.value) {
      isSwiped.value = true;
      onSuperLike();
    }
  }, [onSuperLike]);

  const panGesture = Gesture.Pan()
    .minDistance(10)
    .onStart(() => {
      scale.value = withSpring(1.05);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      scale.value = withSpring(1);
      const isVertical = Math.abs(event.translationY) > Math.abs(event.translationX) * 1.5;
      if (isVertical && event.translationY < -120) {
        translateY.value = withTiming(-SIZES.height, { duration: 350 });
        runOnJS(triggerSuperLike)();
      } else if (Math.abs(event.translationX) > SWIPE_THRESHOLD || Math.abs(event.velocityX) > 800) {
        const isRight = event.translationX > 0;
        const targetX = isRight ? SIZES.width * 1.5 : -SIZES.width * 1.5;
        translateX.value = withTiming(targetX, { duration: 250 });
        if (isRight) {
          runOnJS(triggerSwipeRight)();
        } else {
          runOnJS(triggerSwipeLeft)();
        }
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = `${translateX.value * 0.1}deg`;
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate },
        { scale: scale.value },
      ],
    };
  });

  const likeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1]);
    return { opacity, transform: [{ rotate: '-25deg' }] };
  });

  const nopeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0]);
    return { opacity, transform: [{ rotate: '25deg' }] };
  });

  const superLikeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateY.value, [-120, 0], [1, 0]);
    return { opacity, transform: [{ rotate: '-15deg' }] };
  });

  const photo = profile.photos[0] || 'https://via.placeholder.com/400x600';

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, cardStyle, SHADOWS.large]}>
        <Image source={{ uri: photo }} style={styles.image} />
        <View style={styles.stampContainer}>
          <Animated.View style={[styles.stamp, styles.nopeStamp, nopeStyle]}>
            <Text style={styles.stampText}>NOPE</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.likeStamp, likeStyle]}>
            <Text style={styles.stampText}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.superLikeStamp, superLikeStyle]}>
            <Text style={[styles.stampText, styles.superLikeStampText]}>SUPER LIKE</Text>
          </Animated.View>
        </View>
        <View style={styles.gradientOverlay} />
        <View style={styles.infoSection}>
          <ProfileHeader profile={profile} />
          {profile.interests.length > 0 && (
            <View style={styles.interestsContainer}>
              {profile.interests.slice(0, 5).map((interest, index) => (
                <View key={index} style={styles.interestChip}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.superLikeButton} onPress={triggerSuperLike} activeOpacity={0.7}>
          <Text style={styles.superLikeIcon}>⭐</Text>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    width: SIZES.cardWidth,
    height: SIZES.cardHeight,
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  stampContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  stamp: {
    position: 'absolute',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 4,
    borderRadius: 8,
  },
  likeStamp: {
    borderColor: COLORS.success,
    right: 30,
    top: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  nopeStamp: {
    borderColor: COLORS.error,
    left: 30,
    top: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  superLikeStamp: {
    borderColor: COLORS.superLike,
    alignSelf: 'center',
    top: 120,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  stampText: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 4,
  },
  superLikeStampText: {
    color: COLORS.superLike,
    fontSize: 24,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  infoSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SIZES.padding,
    paddingBottom: SIZES.padding + 10,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  interestChip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  interestText: {
    color: COLORS.white,
    fontSize: SIZES.fontSmall,
    fontWeight: '500',
  },
  superLikeButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.superLike,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
    zIndex: 20,
  },
  superLikeIcon: {
    fontSize: 20,
  },
});

export default SwipeCard;
