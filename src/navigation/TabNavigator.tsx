import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home/HomeScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import PremiumScreen from '../screens/premium/PremiumScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { COLORS, SIZES } from '../config/theme';

type TabParamList = {
  HomeTab: undefined;
  MatchesTab: undefined;
  PremiumTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

interface TabIconProps {
  label: string;
  icon: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ label, icon, focused }) => (
  <View style={styles.tabIconContainer}>
    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
  </View>
);

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen as React.ComponentType<any>}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Home" icon="🔥" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="MatchesTab"
        component={ChatListScreen as React.ComponentType<any>}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Matches" icon="💬" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="PremiumTab"
        component={PremiumScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Premium" icon="⭐" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Profile" icon="👤" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  tabIconActive: {
    fontSize: 24,
  },
  tabLabel: {
    fontSize: SIZES.fontSmall,
    color: COLORS.textLight,
    marginTop: 2,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default TabNavigator;
