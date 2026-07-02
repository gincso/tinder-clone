import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SIZES, SHADOWS } from '../../config/theme';
import { RootStackParamList } from '../../types';
import { authService } from '../../services/AuthService';

type SignupNavProp = StackNavigationProp<RootStackParamList, 'Signup'>;

export default function SignupScreen() {
  const navigation = useNavigation<SignupNavProp>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = (): boolean => {
    if (!name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return false;
    }
    if (!password) {
      setError('Please enter a password');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await authService.signUp(email.trim(), password, name.trim());
      navigation.reset({ index: 0, routes: [{ name: 'ProfileSetup' }] });
    } catch (err: any) {
      const msg =
        err.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists'
          : err.code === 'auth/invalid-email'
          ? 'Invalid email address'
          : err.code === 'auth/weak-password'
          ? 'Password is too weak'
          : err.message || 'An error occurred during sign up';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Flame and find your spark</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor={COLORS.textLight}
          value={name}
          onChangeText={(t) => { setName(t); setError(''); }}
          autoCapitalize="words"
          autoCorrect={false}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={COLORS.textLight}
          value={email}
          onChangeText={(t) => { setEmail(t); setError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={COLORS.textLight}
          value={password}
          onChangeText={(t) => { setPassword(t); setError(''); }}
          secureTextEntry
          autoCapitalize="none"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor={COLORS.textLight}
          value={confirmPassword}
          onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
          secureTextEntry
          autoCapitalize="none"
          editable={!loading}
        />

        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.85}
          onPress={handleSignUp}
          disabled={loading}
        >
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.createButtonText}>Create Account</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.signInRow}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SIZES.paddingLarge,
    paddingVertical: SIZES.paddingLarge,
  },
  title: {
    fontSize: SIZES.fontXXLarge,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.paddingSmall,
  },
  subtitle: {
    fontSize: SIZES.fontLarge,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.paddingLarge,
  },
  errorContainer: {
    backgroundColor: '#FDE8E8',
    borderRadius: SIZES.radiusSmall,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.fontMedium,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding + 2,
    fontSize: SIZES.fontLarge,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.padding,
  },
  createButton: {
    width: '100%',
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
    ...SHADOWS.medium,
    marginBottom: SIZES.paddingLarge,
    marginTop: SIZES.paddingSmall,
  },
  gradientButton: {
    paddingVertical: SIZES.padding + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontLarge,
    fontWeight: '700',
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: SIZES.fontMedium,
    color: COLORS.textSecondary,
  },
  signInLink: {
    fontSize: SIZES.fontMedium,
    color: COLORS.primary,
    fontWeight: '700',
  },
});
