import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SIZES, SHADOWS } from '../../config/theme';
import { RootStackParamList } from '../../types';

type WelcomeNavProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeNavProp>();

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.topSection}>
        <Text style={styles.emoji}>🔥</Text>
        <Text style={styles.title}>Flame</Text>
        <Text style={styles.tagline}>Find Your Spark</Text>
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.createAccountButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Signup')}
        >
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.createAccountText}>Create Account</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signInButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.paddingLarge,
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 80,
    marginBottom: SIZES.padding,
  },
  title: {
    fontSize: SIZES.fontTitle,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: SIZES.fontXLarge,
    color: COLORS.white,
    marginTop: SIZES.paddingSmall,
    opacity: 0.9,
  },
  bottomSection: {
    width: '100%',
    paddingBottom: SIZES.paddingLarge * 2,
    gap: SIZES.padding,
  },
  createAccountButton: {
    width: '100%',
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  gradientButton: {
    paddingVertical: SIZES.padding + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createAccountText: {
    color: COLORS.white,
    fontSize: SIZES.fontLarge,
    fontWeight: '700',
  },
  signInButton: {
    width: '100%',
    paddingVertical: SIZES.padding + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.radiusLarge,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  signInText: {
    color: COLORS.white,
    fontSize: SIZES.fontLarge,
    fontWeight: '700',
  },
});
