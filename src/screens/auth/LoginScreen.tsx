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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SIZES, SHADOWS } from '../../config/theme';
import { RootStackParamList } from '../../types';
import { authService } from '../../services/AuthService';

type LoginNavProp = StackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginNavProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      await authService.signIn(email.trim(), password);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (err: any) {
      const msg =
        err.code === 'auth/user-not-found'
          ? 'No account found with this email'
          : err.code === 'auth/wrong-password'
          ? 'Incorrect password'
          : err.code === 'auth/invalid-email'
          ? 'Invalid email address'
          : err.code === 'auth/invalid-credential'
          ? 'Invalid email or password'
          : err.message || 'An error occurred during sign in';
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
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

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

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => Alert.alert('Forgot Password', 'Reset link feature coming soon')}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signInButton}
          activeOpacity={0.85}
          onPress={handleSignIn}
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
              <Text style={styles.signInButtonText}>Sign In</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.signUpRow}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.replace('Signup')}>
            <Text style={styles.signUpLink}>Sign Up</Text>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SIZES.paddingLarge,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: SIZES.fontMedium,
    fontWeight: '600',
  },
  signInButton: {
    width: '100%',
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
    ...SHADOWS.medium,
    marginBottom: SIZES.paddingLarge,
  },
  gradientButton: {
    paddingVertical: SIZES.padding + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontLarge,
    fontWeight: '700',
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: SIZES.fontMedium,
    color: COLORS.textSecondary,
  },
  signUpLink: {
    fontSize: SIZES.fontMedium,
    color: COLORS.primary,
    fontWeight: '700',
  },
});
