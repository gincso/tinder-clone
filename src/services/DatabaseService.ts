import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  arrayUnion,
  arrayRemove,
  increment,
  Firestore,
} from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../config/firebase';
import {
  UserProfile,
  SwipeAction,
  Match,
  Message,
  DailyUsage,
} from '../types';

class DatabaseService {
  private db: Firestore;

  constructor() {
    this.db = getFirestore();
  }

  // ====== User Profiles ======
  async createProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    const ref = doc(this.db, FIRESTORE_COLLECTIONS.PROFILES, userId);
    await setDoc(ref, {
      ...profile,
      id: userId,
      createdAt: Timestamp.now(),
      lastActive: Timestamp.now(),
      isPremium: false,
      isPlatinum: false,
      subscriptionTier: 'free',
      verified: false,
    });
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const ref = doc(this.db, FIRESTORE_COLLECTIONS.PROFILES, userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as UserProfile;
  }

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    const ref = doc(this.db, FIRESTORE_COLLECTIONS.PROFILES, userId);
    await updateDoc(ref, { ...data, lastActive: Timestamp.now() });
  }

  async getProfilesForSwiping(userId: string, limit_count = 20): Promise<UserProfile[]> {
    const profilesRef = collection(this.db, FIRESTORE_COLLECTIONS.PROFILES);
    const q = query(profilesRef, where('id', '!=', userId), limit(limit_count));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
  }

  // ====== Swipes ======
  async recordSwipe(swipe: Omit<SwipeAction, 'id' | 'timestamp'>): Promise<void> {
    const ref = doc(collection(this.db, FIRESTORE_COLLECTIONS.SWIPES));
    await setDoc(ref, { ...swipe, id: ref.id, timestamp: Timestamp.now() });

    // Check for match if liked
    if (swipe.action === 'like' || swipe.action === 'super_like') {
      await this.checkForMatch(swipe.userId, swipe.targetUserId);
    }
  }

  private async checkForMatch(userId: string, targetUserId: string): Promise<void> {
    // Check if the other user already liked this user
    const swipesRef = collection(this.db, FIRESTORE_COLLECTIONS.SWIPES);
    const q = query(
      swipesRef,
      where('userId', '==', targetUserId),
      where('targetUserId', '==', userId),
      where('action', 'in', ['like', 'super_like'])
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // It's a match!
      const matchRef = doc(collection(this.db, FIRESTORE_COLLECTIONS.MATCHES));
      await setDoc(matchRef, {
        id: matchRef.id,
        users: [userId, targetUserId],
        matchedAt: Timestamp.now(),
        isNew: true,
      });
    }
  }

  // ====== Daily Usage ======
  async getDailyUsage(userId: string): Promise<DailyUsage | null> {
    const today = new Date().toISOString().split('T')[0];
    const ref = doc(this.db, FIRESTORE_COLLECTIONS.USERS, userId, 'daily', today);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { userId, ...snap.data() } as DailyUsage;
  }

  async incrementSwipesUsed(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const ref = doc(this.db, FIRESTORE_COLLECTIONS.USERS, userId, 'daily', today);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        swipesUsed: 1,
        superLikesUsed: 0,
        rewindsUsed: 0,
        videoCallMinutesUsed: 0,
        date: today,
      });
    } else {
      await updateDoc(ref, { swipesUsed: increment(1) });
    }
  }

  // ====== Matches ======
  async getMatches(userId: string): Promise<Match[]> {
    const matchesRef = collection(this.db, FIRESTORE_COLLECTIONS.MATCHES);
    const q = query(
      matchesRef,
      where('users', 'array-contains', userId),
      orderBy('matchedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
  }

  onMatchesChanged(userId: string, callback: (matches: Match[]) => void): () => void {
    const matchesRef = collection(this.db, FIRESTORE_COLLECTIONS.MATCHES);
    const q = query(
      matchesRef,
      where('users', 'array-contains', userId),
      orderBy('matchedAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
      callback(matches);
    });
  }

  // ====== Messages ======
  async sendMessage(matchId: string, senderId: string, text: string): Promise<void> {
    const ref = doc(collection(this.db, FIRESTORE_COLLECTIONS.MESSAGES));
    await setDoc(ref, {
      id: ref.id,
      matchId,
      senderId,
      text,
      timestamp: Timestamp.now(),
      type: 'text',
      read: false,
    });

    // Update last message in match
    const matchRef = doc(this.db, FIRESTORE_COLLECTIONS.MATCHES, matchId);
    await updateDoc(matchRef, {
      lastMessage: { text, senderId, timestamp: Timestamp.now() },
    });
  }

  onMessagesChanged(matchId: string, callback: (messages: Message[]) => void): () => void {
    const messagesRef = collection(this.db, FIRESTORE_COLLECTIONS.MESSAGES);
    const q = query(
      messagesRef,
      where('matchId', '==', matchId),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      callback(messages);
    });
  }

  // ====== Subscription ======
  async updateSubscription(userId: string, tier: 'free' | 'premium' | 'platinum'): Promise<void> {
    const ref = doc(this.db, FIRESTORE_COLLECTIONS.SUBSCRIPTIONS, userId);
    await setDoc(ref, {
      userId,
      tier,
      startDate: Timestamp.now(),
      autoRenew: true,
      paymentProvider: 'stripe',
    });

    // Update profile
    const profileRef = doc(this.db, FIRESTORE_COLLECTIONS.PROFILES, userId);
    await updateDoc(profileRef, {
      subscriptionTier: tier,
      isPremium: tier === 'premium' || tier === 'platinum',
      isPlatinum: tier === 'platinum',
    });
  }

  async getSubscription(userId: string): Promise<any | null> {
    const ref = doc(this.db, FIRESTORE_COLLECTIONS.SUBSCRIPTIONS, userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data();
  }

  // ====== Video Calls ======
  async createVideoCall(
    matchId: string,
    callerId: string,
    receiverId: string,
    roomUrl: string,
    roomName: string
  ): Promise<string> {
    const ref = doc(collection(this.db, FIRESTORE_COLLECTIONS.VIDEO_CALLS));
    await setDoc(ref, {
      id: ref.id,
      matchId,
      callerId,
      receiverId,
      roomUrl,
      roomName,
      status: 'pending',
      startedAt: Timestamp.now(),
    });
    return ref.id;
  }

  async updateVideoCallStatus(callId: string, status: string, duration?: number): Promise<void> {
    const ref = doc(this.db, FIRESTORE_COLLECTIONS.VIDEO_CALLS, callId);
    const updates: any = { status };
    if (status === 'completed' || status === 'rejected' || status === 'missed') {
      updates.endedAt = Timestamp.now();
    }
    if (duration) updates.duration = duration;
    await updateDoc(ref, updates);
  }
}

export const databaseService = new DatabaseService();
