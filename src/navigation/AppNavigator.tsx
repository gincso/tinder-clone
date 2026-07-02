import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import { type RootStackParamList } from '../types';
import { authService } from '../services/AuthService';
import { COLORS } from '../config/theme';
import LoadingSpinner from '../components/LoadingSpinner';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import VideoCallScreen from '../screens/videocall/VideoCallScreen';
import PremiumScreen from '../screens/premium/PremiumScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import MatchModalComponent from '../components/MatchModal';
import TabNavigator from './TabNavigator';

const Stack = createStackNavigator<RootStackParamList>();

const defaultScreenOptions: StackNavigationOptions = {
  headerStyle: {
    backgroundColor: COLORS.white,
  },
  headerTintColor: COLORS.primary,
  headerTitleStyle: {
    fontWeight: '600',
  },
};

interface MatchModalScreenProps {
  route: { params: { userName: string; userPhoto: string } };
  navigation: { goBack: () => void };
}

const MatchModalScreen: React.FC<MatchModalScreenProps> = ({ route, navigation }) => {
  const { userName, userPhoto } = route.params;

  return (
    <View style={{ flex: 1 }}>
      <MatchModalComponent
        visible={true}
        userName={userName}
        userPhoto={userPhoto}
        onClose={() => navigation.goBack()}
        onSendMessage={() => navigation.goBack()}
        onKeepSwiping={() => navigation.goBack()}
      />
    </View>
  );
};

const AppNavigator: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthChanged((user) => {
      setIsAuthenticated(user !== null);
    });
    return unsubscribe;
  }, []);

  if (isAuthenticated === null) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  return (
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'MainTabs' : 'Welcome'}
        screenOptions={defaultScreenOptions}
      >
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />
        <Stack.Screen
          name="Signup"
          component={SignupScreen}
        />
        <Stack.Screen
          name="ProfileSetup"
          component={ProfileSetupScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen as React.ComponentType<any>}
        />
        <Stack.Screen
          name="VideoCall"
          component={VideoCallScreen}
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="Premium"
          component={PremiumScreen}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
        />
        <Stack.Screen
          name="MatchModal"
          component={MatchModalScreen}
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
  );
};

export default AppNavigator;
