import React, { useEffect, useRef, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../config/theme';
import { APP_NAME } from '../config/constants';

interface MatchModalProps {
  visible: boolean;
  userName: string;
  userPhoto: string;
  onClose: () => void;
  onSendMessage: () => void;
  onKeepSwiping: () => void;
}

const { width, height } = Dimensions.get('window');

const PARTICLE_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.premium,
  COLORS.superLike,
  COLORS.boost,
];

interface Particle {
  x: number;
  y: number;
  animY: Animated.Value;
  animX: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
  size: number;
  rotation: Animated.Value;
}

const MatchModal: React.FC<MatchModalProps> = ({
  visible,
  userName,
  userPhoto,
  onClose,
  onSendMessage,
  onKeepSwiping,
}) => {
  const particles = useRef<Particle[]>([]);
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const particleCount = 25;

  const initParticles = () => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        x: Math.random() * width,
        y: -50 - Math.random() * 200,
        animY: new Animated.Value(0),
        animX: new Animated.Value(0),
        opacity: new Animated.Value(1),
        scale: new Animated.Value(Math.random() * 0.5 + 0.5),
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        size: Math.random() * 14 + 6,
        rotation: new Animated.Value(0),
      });
    }
    particles.current = newParticles;
  };

  useEffect(() => {
    if (visible) {
      initParticles();
      fadeAnim.setValue(0);
      bounceAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
      particles.current.forEach((p, index) => {
        Animated.parallel([
          Animated.timing(p.animY, {
            toValue: height + 100,
            duration: 2500 + Math.random() * 2000,
            delay: index * 30,
            useNativeDriver: true,
          }),
          Animated.timing(p.animX, {
            toValue: (Math.random() - 0.5) * width * 0.6,
            duration: 2000 + Math.random() * 1500,
            delay: index * 30,
            useNativeDriver: true,
          }),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: 2000,
            delay: 500 + index * 30,
            useNativeDriver: true,
          }),
          Animated.timing(p.rotation, {
            toValue: Math.random() * 720 - 360,
            duration: 3000,
            delay: index * 30,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [visible]);

  const contentScale = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <Animated.View style={[styles.particleLayer, { opacity: fadeAnim }]}>
          {particles.current.map((p, index) => (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  left: p.x,
                  top: p.y,
                  width: p.size,
                  height: p.size,
                  borderRadius: p.size / 2,
                  backgroundColor: p.color,
                  opacity: p.opacity,
                  transform: [
                    { translateY: p.animY },
                    { translateX: p.animX },
                    { scale: p.scale },
                    { rotate: p.rotation.interpolate({
                      inputRange: [-360, 360],
                      outputRange: ['-360deg', '360deg'],
                    })},
                  ],
                },
              ]}
            />
          ))}
        </Animated.View>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: contentScale }],
            },
          ]}
        >
          <Text style={styles.title}>It's a Match!</Text>
          <Text style={styles.subtitle}>
            You and {userName} liked each other on {APP_NAME}
          </Text>
          <View style={styles.photoRow}>
            <View style={styles.photoWrapper}>
              <Image source={{ uri: userPhoto }} style={styles.photo} />
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.sendMessageButton}
              onPress={onSendMessage}
              activeOpacity={0.85}
            >
              <Text style={styles.sendMessageText}>Say Hi</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.keepSwipingButton}
              onPress={onKeepSwiping}
              activeOpacity={0.85}
            >
              <Text style={styles.keepSwipingText}>Keep Swiping</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particleLayer: {
    ...StyleSheet.absoluteFill,
  },
  particle: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: SIZES.paddingLarge,
    zIndex: 10,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(255,107,107,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: SIZES.fontLarge,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  photoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 32,
  },
  photoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.white,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  sendMessageButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: SIZES.radiusLarge,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  sendMessageText: {
    color: COLORS.white,
    fontSize: SIZES.fontXLarge,
    fontWeight: '700',
  },
  keepSwipingButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: SIZES.radiusLarge,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.textLight,
  },
  keepSwipingText: {
    color: COLORS.white,
    fontSize: SIZES.fontXLarge,
    fontWeight: '600',
  },
});

export default MatchModal;
