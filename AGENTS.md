# Flame - Tinder Clone App

## Tech Stack
- Expo SDK 57 + React Native 0.86
- TypeScript 6
- React Navigation v7 (Stack + Bottom Tabs)
- Firebase (Auth, Firestore, Storage)
- react-native-webrtc (video calls)
- expo-camera, expo-image-picker
- react-native-reanimated (swipe animations)
- react-native-gesture-handler
- Daily.co (video call provider)

## Project Structure
- `src/config/` - Firebase config, theme (COLORS/SIZES/SHADOWS), constants (subscription plans)
- `src/types/` - TypeScript types (UserProfile, Match, Message, VideoCall, etc.)
- `src/services/` - AuthService, DatabaseService (Firestore), PremiumService, VideoCallService
- `src/components/` - SwipeCard, MatchModal, VideoCallControls, ProfileHeader, SubscriptionBadge, LoadingSpinner
- `src/screens/auth/` - WelcomeScreen, LoginScreen, SignupScreen, ProfileSetupScreen
- `src/screens/home/` - HomeScreen (swipe deck)
- `src/screens/chat/` - ChatListScreen, ChatScreen
- `src/screens/videocall/` - VideoCallScreen (WebRTC video calls)
- `src/screens/premium/` - PremiumScreen (3-tier pricing)
- `src/screens/profile/` - ProfileScreen, EditProfileScreen
- `src/navigation/` - AppNavigator (root stack), TabNavigator (4 tabs)

## Subscription Tiers
- **Free**: 25 swipes/day, 5 min video calls, 3 rewinds, 1 super like
- **Premium ($14.99/mo)**: Unlimited swipes, 30 min video calls, unlimited rewinds, 5 super likes, see who likes you, 1 boost, passport, incognito
- **Platinum ($29.99/mo)**: Everything in Premium + unlimited video calls, priority visibility, message before matching, verified badge, 10 super likes, 3 boosts, advanced filters, read receipts

## Firebase Setup Required
1. Create Firebase project
2. Enable Auth (Email/Password)
3. Enable Firestore
4. Copy config to `.env` and EAS Secrets
5. Set `EXPO_PUBLIC_FIREBASE_*` environment variables

## GitHub Actions
- Builds APK via EAS Build (needs `EXPO_TOKEN` secret)
- Falls back to direct APK build with Android SDK
- Artifacts available for download
- Trigger: push to main, PR to main, or manual dispatch

## Codespaces
- `/.devcontainer/devcontainer.json` preconfigured
- Android SDK 34, JDK 17, Node 22 included

## Commands
- `npm start` - Start Expo dev server
- `npm run android` - Start for Android
- `eas build --platform android --profile preview` - Build APK with EAS
- `npx expo prebuild --platform android` - Generate native projects
- `npx expo run:android` - Run on connected device
