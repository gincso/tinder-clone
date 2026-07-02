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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SIZES, SHADOWS } from '../../config/theme';
import { RootStackParamList } from '../../types';
import { authService } from '../../services/AuthService';
import { databaseService } from '../../services/DatabaseService';

type ProfileSetupNavProp = StackNavigationProp<RootStackParamList, 'ProfileSetup'>;

const INTERESTS_LIST = [
  'Travel', 'Music', 'Food', 'Fitness', 'Art', 'Reading', 'Gaming',
  'Photography', 'Cooking', 'Sports', 'Movies', 'Fashion', 'Nature',
  'Technology', 'Animals',
];

const GENDERS = ['Male', 'Female', 'Other'];

export default function ProfileSetupScreen() {
  const navigation = useNavigation<ProfileSetupNavProp>();
  const currentUser = authService.getCurrentUser();

  const [name, setName] = useState(currentUser?.displayName || '');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Camera roll permission is required to add a photo');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setError('');
    }
  };

  const validate = (): boolean => {
    if (!name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!age.trim() || isNaN(Number(age)) || Number(age) < 18) {
      setError('Please enter a valid age (18+)');
      return false;
    }
    if (!gender) {
      setError('Please select your gender');
      return false;
    }
    if (!photoUri) {
      setError('Please add a profile photo');
      return false;
    }
    return true;
  };

  const handleComplete = async () => {
    setError('');
    if (!validate()) return;

    const user = authService.getCurrentUser();
    if (!user) {
      setError('You must be logged in');
      return;
    }

    if (photoUri) {
      await authService.updateProfile(undefined, photoUri);
    }

    setLoading(true);
    try {
      const profileData = {
        name: name.trim(),
        age: Number(age),
        gender,
        bio: bio.trim(),
        interests,
        photos: photoUri ? [photoUri] : [],
        location: { latitude: 0, longitude: 0, city: '' },
      };

      await databaseService.createProfile(user.uid, profileData);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
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
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Tell us about yourself</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.photoContainer} onPress={pickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderIcon}>+</Text>
              <Text style={styles.photoPlaceholderText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor={COLORS.textLight}
          value={name}
          onChangeText={(t) => { setName(t); setError(''); }}
          autoCapitalize="words"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Age"
          placeholderTextColor={COLORS.textLight}
          value={age}
          onChangeText={(t) => { setAge(t.replace(/[^0-9]/g, '')); setError(''); }}
          keyboardType="numeric"
          maxLength={2}
          editable={!loading}
        />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderRow}>
          {GENDERS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[
                styles.genderButton,
                gender === g && styles.genderButtonActive,
              ]}
              onPress={() => { setGender(g); setError(''); }}
              disabled={loading}
            >
              <Text
                style={[
                  styles.genderButtonText,
                  gender === g && styles.genderButtonTextActive,
                ]}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.bioInput}
          placeholder="Write a short bio..."
          placeholderTextColor={COLORS.textLight}
          value={bio}
          onChangeText={(t) => { setBio(t); setError(''); }}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={!loading}
        />

        <Text style={styles.label}>Interests</Text>
        <View style={styles.interestsContainer}>
          {INTERESTS_LIST.map((interest) => {
            const selected = interests.includes(interest);
            return (
              <TouchableOpacity
                key={interest}
                style={[styles.chip, selected && styles.chipActive]}
                onPress={() => toggleInterest(interest)}
                disabled={loading}
              >
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                  {interest}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.completeButton}
          activeOpacity={0.85}
          onPress={handleComplete}
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
              <Text style={styles.completeButtonText}>Complete Profile</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
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
  photoContainer: {
    alignSelf: 'center',
    marginBottom: SIZES.paddingLarge,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderIcon: {
    fontSize: 36,
    color: COLORS.textLight,
    fontWeight: '300',
    marginBottom: 2,
  },
  photoPlaceholderText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.textLight,
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
  label: {
    fontSize: SIZES.fontLarge,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.paddingSmall,
  },
  genderRow: {
    flexDirection: 'row',
    gap: SIZES.paddingSmall,
    marginBottom: SIZES.padding,
  },
  genderButton: {
    flex: 1,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  genderButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF0F0',
  },
  genderButtonText: {
    fontSize: SIZES.fontMedium,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  genderButtonTextActive: {
    color: COLORS.primary,
  },
  bioInput: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    fontSize: SIZES.fontLarge,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.padding,
    minHeight: 100,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.paddingSmall,
    marginBottom: SIZES.paddingLarge,
  },
  chip: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall + 2,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF0F0',
  },
  chipText: {
    fontSize: SIZES.fontMedium,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  completeButton: {
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
  completeButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontLarge,
    fontWeight: '700',
  },
});
