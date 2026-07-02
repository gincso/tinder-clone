export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  interests: string[];
  bio: string;
  photos: string[];
  occupation?: string;
  education?: string;
  location: {
    latitude: number;
    longitude: number;
    city: string;
  };
  verified: boolean;
  isPremium: boolean;
  isPlatinum: boolean;
  subscriptionTier: 'free' | 'premium' | 'platinum';
  subscriptionExpiry?: Date;
  lastActive: Date;
  createdAt: Date;
}

export interface SwipeAction {
  id: string;
  userId: string;
  targetUserId: string;
  action: 'like' | 'nope' | 'super_like';
  timestamp: Date;
}

export interface Match {
  id: string;
  users: string[];
  matchedAt: Date;
  lastMessage?: Message;
  isNew: boolean;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  text: string;
  timestamp: Date;
  type: 'text' | 'image' | 'video_call';
  read: boolean;
}

export interface VideoCall {
  id: string;
  matchId: string;
  callerId: string;
  receiverId: string;
  roomUrl: string;
  roomName: string;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  status: 'pending' | 'active' | 'completed' | 'missed' | 'rejected';
}

export interface Subscription {
  id: string;
  userId: string;
  tier: 'free' | 'premium' | 'platinum';
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  paymentProvider: string;
  paymentId: string;
}

export interface DailyUsage {
  userId: string;
  date: string;
  swipesUsed: number;
  superLikesUsed: number;
  rewindsUsed: number;
  videoCallMinutesUsed: number;
}

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  ProfileSetup: undefined;
  MainTabs: undefined;
  Home: undefined;
  ChatList: undefined;
  Chat: { matchId: string; userName: string };
  VideoCall: { roomUrl: string; matchId: string };
  Premium: undefined;
  Settings: undefined;
  EditProfile: undefined;
  MatchModal: { userName: string; userPhoto: string };
};
