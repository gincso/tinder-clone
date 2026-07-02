import { UserProfile, Match, Message, DailyUsage } from '../types';

const MOCK_USER: UserProfile = {
  id: 'user_self',
  name: 'Alex',
  age: 25,
  gender: 'Male',
  interests: ['Travel', 'Music', 'Fitness', 'Cooking'],
  bio: 'Love exploring new places and trying new cuisines! 🚀',
  photos: ['https://i.pravatar.cc/400?u=alex'],
  occupation: 'Software Engineer',
  education: 'MIT',
  location: { latitude: 40.7128, longitude: -74.006, city: 'New York' },
  verified: true,
  isPremium: true,
  isPlatinum: false,
  subscriptionTier: 'premium',
  lastActive: new Date(),
  createdAt: new Date(),
};

const MOCK_PROFILES: UserProfile[] = [
  { id: 'user_1', name: 'Sarah', age: 24, gender: 'Female', interests: ['Travel', 'Photography', 'Yoga'], bio: 'Adventure seeker 📸', photos: ['https://i.pravatar.cc/400?u=sarah'], occupation: 'Designer', education: 'RISD', location: { latitude: 40.7282, longitude: -73.794, city: 'New York' }, verified: true, isPremium: false, isPlatinum: false, subscriptionTier: 'free', lastActive: new Date(), createdAt: new Date() },
  { id: 'user_2', name: 'Emma', age: 26, gender: 'Female', interests: ['Music', 'Art', 'Reading'], bio: 'Book worm & music lover 🎵', photos: ['https://i.pravatar.cc/400?u=emma'], occupation: 'Teacher', education: 'Columbia', location: { latitude: 40.758, longitude: -73.9855, city: 'New York' }, verified: false, isPremium: true, isPlatinum: false, subscriptionTier: 'premium', lastActive: new Date(), createdAt: new Date() },
  { id: 'user_3', name: 'Jessica', age: 23, gender: 'Female', interests: ['Fitness', 'Cooking', 'Fashion'], bio: 'Foodie & fitness junkie 💪', photos: ['https://i.pravatar.cc/400?u=jessica'], occupation: 'Chef', education: 'CIA', location: { latitude: 40.7484, longitude: -73.9857, city: 'New York' }, verified: true, isPremium: false, isPlatinum: true, subscriptionTier: 'platinum', lastActive: new Date(), createdAt: new Date() },
  { id: 'user_4', name: 'Olivia', age: 27, gender: 'Female', interests: ['Technology', 'Gaming', 'Movies'], bio: 'Tech geek & gamer 🎮', photos: ['https://i.pravatar.cc/400?u=olivia'], occupation: 'Product Manager', education: 'Stanford', location: { latitude: 40.7061, longitude: -74.0087, city: 'New York' }, verified: false, isPremium: false, isPlatinum: false, subscriptionTier: 'free', lastActive: new Date(), createdAt: new Date() },
  { id: 'user_5', name: 'Mia', age: 25, gender: 'Female', interests: ['Travel', 'Photography', 'Nature'], bio: 'Nature lover 🌿', photos: ['https://i.pravatar.cc/400?u=mia'], occupation: 'Photographer', education: 'NYU', location: { latitude: 40.7282, longitude: -73.794, city: 'New York' }, verified: true, isPremium: true, isPlatinum: false, subscriptionTier: 'premium', lastActive: new Date(), createdAt: new Date() },
  { id: 'user_6', name: 'Sophie', age: 28, gender: 'Female', interests: ['Music', 'Art', 'Travel', 'Reading'], bio: 'Creative soul ✨', photos: ['https://i.pravatar.cc/400?u=sophie'], occupation: 'Artist', education: 'SVA', location: { latitude: 40.7282, longitude: -73.794, city: 'New York' }, verified: false, isPremium: false, isPlatinum: false, subscriptionTier: 'free', lastActive: new Date(), createdAt: new Date() },
  { id: 'user_7', name: 'Chloe', age: 24, gender: 'Female', interests: ['Fitness', 'Sports', 'Cooking'], bio: 'Marathon runner 🏃‍♀️', photos: ['https://i.pravatar.cc/400?u=chloe'], occupation: 'Athlete', education: 'UCLA', location: { latitude: 34.0522, longitude: -118.2437, city: 'Los Angeles' }, verified: true, isPremium: false, isPlatinum: false, subscriptionTier: 'free', lastActive: new Date(), createdAt: new Date() },
  { id: 'user_8', name: 'Luna', age: 26, gender: 'Female', interests: ['Animals', 'Nature', 'Photography'], bio: 'Animal lover 🐾', photos: ['https://i.pravatar.cc/400?u=luna'], occupation: 'Veterinarian', education: 'Cornell', location: { latitude: 40.7128, longitude: -74.006, city: 'New York' }, verified: false, isPremium: false, isPlatinum: false, subscriptionTier: 'free', lastActive: new Date(), createdAt: new Date() },
  { id: 'user_9', name: 'Zoe', age: 27, gender: 'Female', interests: ['Music', 'Fashion', 'Art'], bio: 'Fashion enthusiast 👗', photos: ['https://i.pravatar.cc/400?u=zoe'], occupation: 'Fashion Designer', education: 'Parsons', location: { latitude: 40.7282, longitude: -73.794, city: 'New York' }, verified: true, isPremium: true, isPlatinum: true, subscriptionTier: 'platinum', lastActive: new Date(), createdAt: new Date() },
  { id: 'user_10', name: 'Aria', age: 25, gender: 'Female', interests: ['Reading', 'Writing', 'Travel'], bio: 'Storyteller 📖', photos: ['https://i.pravatar.cc/400?u=aria'], occupation: 'Writer', education: 'Brown', location: { latitude: 40.7128, longitude: -74.006, city: 'New York' }, verified: false, isPremium: false, isPlatinum: false, subscriptionTier: 'free', lastActive: new Date(), createdAt: new Date() },
];

const MOCK_MATCH_PROFILES: UserProfile[] = [
  { id: 'match_1', name: 'Rachel', age: 26, gender: 'Female', interests: ['Coffee', 'Books', 'Yoga'], bio: 'Coffee addict ☕', photos: ['https://i.pravatar.cc/400?u=rachel'], occupation: 'Barista', education: 'OSU', location: { latitude: 40.7128, longitude: -74.006, city: 'New York' }, verified: false, isPremium: false, isPlatinum: false, subscriptionTier: 'free', lastActive: new Date(), createdAt: new Date() },
  { id: 'match_2', name: 'Monica', age: 28, gender: 'Female', interests: ['Cooking', 'Cleaning', 'Organization'], bio: 'Everything in its place 🧹', photos: ['https://i.pravatar.cc/400?u=monica'], occupation: 'Chef', education: 'CIA', location: { latitude: 40.758, longitude: -73.9855, city: 'New York' }, verified: true, isPremium: true, isPlatinum: false, subscriptionTier: 'premium', lastActive: new Date(), createdAt: new Date() },
  { id: 'match_3', name: 'Phoebe', age: 27, gender: 'Female', interests: ['Music', 'Massage', 'Animals'], bio: 'Smelly cat, smelly cat 🎵', photos: ['https://i.pravatar.cc/400?u=phoebe'], occupation: 'Masseuse', education: 'NYU', location: { latitude: 40.7282, longitude: -73.794, city: 'New York' }, verified: true, isPremium: false, isPlatinum: false, subscriptionTier: 'free', lastActive: new Date(), createdAt: new Date() },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  match_1: [
    { id: 'msg_1', matchId: 'match_1', senderId: 'match_1', text: 'Hey! How are you?', timestamp: new Date(Date.now() - 3600000), type: 'text', read: true },
    { id: 'msg_2', matchId: 'match_1', senderId: 'user_self', text: 'Hi Rachel! I\'m great, thanks! How about you?', timestamp: new Date(Date.now() - 3000000), type: 'text', read: true },
    { id: 'msg_3', matchId: 'match_1', senderId: 'match_1', text: 'Doing well! Would you like to grab coffee sometime?', timestamp: new Date(Date.now() - 2400000), type: 'text', read: false },
  ],
  match_2: [
    { id: 'msg_4', matchId: 'match_2', senderId: 'user_self', text: 'Love your profile! Your cooking looks amazing!', timestamp: new Date(Date.now() - 86400000), type: 'text', read: true },
    { id: 'msg_5', matchId: 'match_2', senderId: 'match_2', text: 'Thank you! I love cooking. Want to try my lasagna?', timestamp: new Date(Date.now() - 82800000), type: 'text', read: true },
  ],
  match_3: [
    { id: 'msg_6', matchId: 'match_3', senderId: 'match_3', text: 'You play guitar? That\'s so cool!', timestamp: new Date(Date.now() - 172800000), type: 'text', read: true },
  ],
};

class MockDatabaseService {
  private swipes: Set<string> = new Set();
  private matches: Match[];
  private dailyUsage: DailyUsage = {
    userId: 'user_self',
    date: new Date().toISOString().split('T')[0],
    swipesUsed: 3,
    superLikesUsed: 0,
    rewindsUsed: 0,
    videoCallMinutesUsed: 0,
  };

  constructor() {
    const now = new Date();
    this.matches = [
      { id: 'match_1', users: ['user_self', 'match_1'], matchedAt: new Date(now.getTime() - 86400000), isNew: false },
      { id: 'match_2', users: ['user_self', 'match_2'], matchedAt: new Date(now.getTime() - 172800000), isNew: false },
      { id: 'match_3', users: ['user_self', 'match_3'], matchedAt: new Date(now.getTime() - 259200000), isNew: false },
    ];
  }

  async createProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    Object.assign(MOCK_USER, profile, { id: userId });
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    if (userId === 'user_self') return MOCK_USER;
    return [...MOCK_PROFILES, ...MOCK_MATCH_PROFILES].find(p => p.id === userId) || null;
  }

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    if (userId === 'user_self') Object.assign(MOCK_USER, data);
  }

  async getProfilesForSwiping(_userId: string, _limit = 20): Promise<UserProfile[]> {
    const available = MOCK_PROFILES.filter(p => !this.swipes.has(p.id));
    return available.slice(0, _limit);
  }

  async recordSwipe(swipe: { userId: string; targetUserId: string; action: string }): Promise<void> {
    this.swipes.add(swipe.targetUserId);
    if (swipe.action === 'like' || swipe.action === 'super_like') {
      await this.checkForMatch(swipe.userId, swipe.targetUserId);
    }
  }

  private async checkForMatch(_userId: string, targetUserId: string): Promise<void> {
    const willMatch = Math.random() > 0.7 || ['user_3', 'user_5'].includes(targetUserId);
    if (willMatch) {
      const existing = this.matches.find(m => m.users.includes(targetUserId));
      if (!existing) {
        const profile = MOCK_PROFILES.find(p => p.id === targetUserId)!;
        const newMatch: Match = {
          id: `match_${Date.now()}`,
          users: ['user_self', targetUserId],
          matchedAt: new Date(),
          isNew: true,
        };
        this.matches.unshift(newMatch);
        MOCK_MATCH_PROFILES.unshift(profile);
      }
    }
  }

  async getDailyUsage(_userId: string): Promise<DailyUsage | null> {
    const today = new Date().toISOString().split('T')[0];
    if (this.dailyUsage.date !== today) {
      this.dailyUsage = { userId: 'user_self', date: today, swipesUsed: 0, superLikesUsed: 0, rewindsUsed: 0, videoCallMinutesUsed: 0 };
    }
    return { ...this.dailyUsage };
  }

  async incrementSwipesUsed(_userId: string): Promise<void> {
    this.dailyUsage.swipesUsed++;
  }

  async getMatches(_userId: string): Promise<Match[]> {
    return this.matches.map(m => ({
      ...m,
      lastMessage: this.getLastMessage(m.id),
    }));
  }

  private getLastMessage(matchId: string): Message | undefined {
    const msgs = MOCK_MESSAGES[matchId];
    if (!msgs || msgs.length === 0) return undefined;
    return msgs[msgs.length - 1];
  }

  onMatchesChanged(_userId: string, callback: (matches: Match[]) => void): () => void {
    callback(this.matches.map(m => ({ ...m, lastMessage: this.getLastMessage(m.id) })));
    const interval = setInterval(() => {}, 10000);
    return () => clearInterval(interval);
  }

  async sendMessage(matchId: string, senderId: string, text: string): Promise<void> {
    if (!MOCK_MESSAGES[matchId]) MOCK_MESSAGES[matchId] = [];
    MOCK_MESSAGES[matchId].push({
      id: `msg_${Date.now()}`,
      matchId,
      senderId,
      text,
      timestamp: new Date(),
      type: 'text',
      read: false,
    });
  }

  onMessagesChanged(matchId: string, callback: (messages: Message[]) => void): () => void {
    callback(MOCK_MESSAGES[matchId] || []);
    const interval = setInterval(() => {}, 10000);
    return () => clearInterval(interval);
  }

  async updateSubscription(userId: string, tier: 'free' | 'premium' | 'platinum'): Promise<void> {
    Object.assign(MOCK_USER, {
      subscriptionTier: tier,
      isPremium: tier === 'premium' || tier === 'platinum',
      isPlatinum: tier === 'platinum',
    });
  }

  async getSubscription(_userId: string): Promise<any> {
    return {
      userId: 'user_self',
      tier: MOCK_USER.subscriptionTier,
      startDate: new Date(),
      autoRenew: true,
      paymentProvider: 'stripe',
    };
  }

  async createVideoCall(_matchId: string, _callerId: string, _receiverId: string, roomUrl: string, roomName: string): Promise<string> {
    return `call_${Date.now()}`;
  }

  async updateVideoCallStatus(_callId: string, _status: string, _duration?: number): Promise<void> {
  }
}

export { MockDatabaseService };
