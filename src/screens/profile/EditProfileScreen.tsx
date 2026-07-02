import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES, SHADOWS } from '../../config/theme';
import { databaseService } from '../../services/DatabaseService';
import { authService } from '../../services/AuthService';
import { UserProfile } from '../../types';

const INTEREST_OPTIONS = [
  'Travel', 'Music', 'Fitness', 'Cooking', 'Art',
  'Photography', 'Hiking', 'Reading', 'Gaming', 'Movies',
  'Yoga', 'Dancing', 'Coffee', 'Wine', 'Food',
  'Sports', 'Fashion', 'Technology', 'Pets', 'Nature',
];

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Other'];

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [initialProfile, setInitialProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const profile = await databaseService.getProfile(user.uid);
      if (profile) {
        setInitialProfile(profile);
        setName(profile.name || '');
        setBio(profile.bio || '');
        setAge(profile.age?.toString() || '');
        setGender(profile.gender || '');
        setLocation(profile.location?.city || '');
        setSelectedInterests(profile.interests || []);
        setPhotos(profile.photos || []);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      Alert.alert('Error', 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera roll permission is needed to change your photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos([result.assets[0].uri, ...photos.filter((_, i) => i > 0 || photos.length === 0)]);
      }
    } catch (err) {
      console.error('Image picker error:', err);
      Alert.alert('Error', 'Failed to select image.');
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const hasChanges = useCallback(() => {
    if (!initialProfile) return true;
    return (
      name !== initialProfile.name ||
      bio !== initialProfile.bio ||
      age !== initialProfile.age?.toString() ||
      gender !== initialProfile.gender ||
      location !== initialProfile.location?.city ||
      JSON.stringify(selectedInterests) !== JSON.stringify(initialProfile.interests) ||
      JSON.stringify(photos) !== JSON.stringify(initialProfile.photos)
    );
  }, [initialProfile, name, bio, age, gender, location, selectedInterests, photos]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name is required.');
      return;
    }

    const ageNum = parseInt(age, 10);
    if (age && (isNaN(ageNum) || ageNum < 18 || ageNum > 120)) {
      Alert.alert('Validation', 'Please enter a valid age (18-120).');
      return;
    }

    setSaving(true);
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in.');
        return;
      }

      const updateData: Partial<UserProfile> = {
        name: name.trim(),
        bio: bio.trim(),
        age: ageNum || initialProfile?.age || 18,
        gender,
        interests: selectedInterests,
        photos,
        location: {
          latitude: initialProfile?.location?.latitude || 0,
          longitude: initialProfile?.location?.longitude || 0,
          city: location.trim() || initialProfile?.location?.city || '',
        },
      };

      await databaseService.updateProfile(user.uid, updateData);
      Alert.alert('Saved', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error('Failed to save profile:', err);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || !hasChanges()}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text
                style={[
                  styles.saveText,
                  !hasChanges() && styles.saveTextDisabled,
                ]}
              >
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.photoContainer}
            onPress={handlePickPhoto}
            activeOpacity={0.8}
          >
            {photos[0] ? (
              <Image source={{ uri: photos[0] }} style={styles.profilePhoto} />
            ) : (
              <View style={[styles.profilePhoto, styles.photoPlaceholder]}>
                <Text style={styles.photoPlaceholderIcon}>+</Text>
              </View>
            )}
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>

          <View style={styles.formSection}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={COLORS.textLight}
              maxLength={50}
            />
          </View>

          <View style={styles.formRow}>
            <View style={styles.formHalf}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="Age"
                placeholderTextColor={COLORS.textLight}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
            <View style={styles.formHalf}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderPicker}>
                {GENDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.genderOption,
                      gender === option && styles.genderOptionSelected,
                    ]}
                    onPress={() => setGender(option)}
                  >
                    <Text
                      style={[
                        styles.genderOptionText,
                        gender === option && styles.genderOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="City"
              placeholderTextColor={COLORS.textLight}
              maxLength={100}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor={COLORS.textLight}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{bio.length}/500</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Interests</Text>
            <Text style={styles.subLabel}>Select your interests</Text>
            <View style={styles.interestsContainer}>
              {INTEREST_OPTIONS.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.interestChip,
                    selectedInterests.includes(interest) &&
                      styles.interestChipSelected,
                  ]}
                  onPress={() => toggleInterest(interest)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.interestText,
                      selectedInterests.includes(interest) &&
                        styles.interestTextSelected,
                    ]}
                  >
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, (!hasChanges() || saving) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving || !hasChanges()}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cancelText: {
    fontSize: SIZES.fontLarge,
    color: COLORS.textSecondary,
  },
  headerTitle: {
    fontSize: SIZES.fontXLarge,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  saveText: {
    fontSize: SIZES.fontLarge,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  saveTextDisabled: {
    color: COLORS.textLight,
  },
  scrollContent: {
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.paddingLarge,
    paddingBottom: 40,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: SIZES.paddingLarge,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  photoPlaceholderIcon: {
    fontSize: 40,
    color: COLORS.textLight,
    fontWeight: '300',
  },
  changePhotoText: {
    fontSize: SIZES.fontMedium,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: SIZES.paddingSmall,
  },
  formSection: {
    marginBottom: SIZES.padding,
  },
  label: {
    fontSize: SIZES.fontMedium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  subLabel: {
    fontSize: SIZES.fontSmall,
    color: COLORS.textSecondary,
    marginBottom: SIZES.paddingSmall,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    fontSize: SIZES.fontLarge,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  charCount: {
    textAlign: 'right',
    fontSize: SIZES.fontSmall,
    color: COLORS.textLight,
    marginTop: 4,
  },
  formRow: {
    flexDirection: 'row',
    gap: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  formHalf: {
    flex: 1,
  },
  genderPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  genderOption: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: SIZES.radiusSmall,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  genderOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  genderOptionText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.text,
  },
  genderOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  interestChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  interestText: {
    fontSize: SIZES.fontMedium,
    color: COLORS.text,
  },
  interestTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: SIZES.paddingLarge,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: SIZES.radiusLarge,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    ...SHADOWS.medium,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: SIZES.fontLarge,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  bottomPadding: {
    height: 40,
  },
});

export default EditProfileScreen;
