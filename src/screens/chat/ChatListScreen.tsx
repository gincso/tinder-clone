import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Swipeable } from 'react-native-gesture-handler';
import Icon from '@expo/vector-icons/Ionicons';
import { getFirestore, doc, deleteDoc, collection } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../../config/firebase';
import { COLORS, SIZES, SHADOWS } from '../../config/theme';
import { databaseService } from '../../services/DatabaseService';
import { authService } from '../../services/AuthService';
import { Match, UserProfile, RootStackParamList } from '../../types';

type ChatListNavigationProp = StackNavigationProp<RootStackParamList, 'ChatList'>;
type ChatListRouteProp = RouteProp<RootStackParamList, 'ChatList'>;

interface ChatListScreenProps {
  navigation: ChatListNavigationProp;
  route: ChatListRouteProp;
}

interface MatchWithProfile extends Match {
  userProfile: UserProfile | null;
  otherUserId: string;
}

const ChatListScreen: React.FC<ChatListScreenProps> = ({ navigation, route }) => {
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [profilesCache, setProfilesCache] = useState<Record<string, UserProfile>>({});

  const currentUser = authService.getCurrentUser();

  const fetchProfileForMatch = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      if (profilesCache[userId]) return profilesCache[userId];
      try {
        const profile = await databaseService.getProfile(userId);
        if (profile) {
          setProfilesCache(prev => ({ ...prev, [userId]: profile }));
          return profile;
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
      return null;
    },
    [profilesCache]
  );

  const enrichMatches = useCallback(
    async (rawMatches: Match[]) => {
      if (!currentUser) return;
      const enriched: MatchWithProfile[] = [];
      for (const match of rawMatches) {
        const otherUserId = match.users.find(id => id !== currentUser.uid);
        if (!otherUserId) continue;
        const profile = await fetchProfileForMatch(otherUserId);
        enriched.push({
          ...match,
          userProfile: profile,
          otherUserId,
        });
      }
      setMatches(enriched);
      setLoading(false);
    },
    [currentUser, fetchProfileForMatch]
  );

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = databaseService.onMatchesChanged(currentUser.uid, rawMatches => {
      enrichMatches(rawMatches);
    });

    return () => unsubscribe();
  }, [currentUser, enrichMatches]);

  const handleUnmatch = useCallback(
    (matchId: string, userName: string) => {
      Alert.alert(
        'Unmatch',
        `Are you sure you want to unmatch with ${userName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unmatch',
            style: 'destructive',
            onPress: async () => {
              try {
                const db = getFirestore();
              const ref = doc(db, FIRESTORE_COLLECTIONS.MATCHES, matchId);
              await deleteDoc(ref);
                setMatches(prev => prev.filter(m => m.id !== matchId));
              } catch (error) {
                console.error('Error unmatching:', error);
              }
            },
          },
        ]
      );
    },
    []
  );

  const renderTimeAgo = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const renderRightActions = (matchId: string, userName: string) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleUnmatch(matchId, userName)}
      >
        <Icon name="trash-outline" size={24} color={COLORS.white} />
        <Text style={styles.deleteActionText}>Unmatch</Text>
      </TouchableOpacity>
    );
  };

  const renderMatchItem = ({ item }: { item: MatchWithProfile }) => {
    const hasUnread = item.isNew;
    const lastMessageText = item.lastMessage?.text || 'Start chatting!';
    const lastMessageTime = item.lastMessage?.timestamp
      ? renderTimeAgo(item.lastMessage.timestamp)
      : renderTimeAgo(item.matchedAt);

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item.id, item.userProfile?.name || 'User')}
        overshootRight={false}
      >
        <TouchableOpacity
          style={styles.matchItem}
          onPress={() =>
            navigation.navigate('Chat', {
              matchId: item.id,
              userName: item.userProfile?.name || 'User',
            })
          }
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            {item.userProfile?.photos?.[0] ? (
              <Image
                source={{ uri: item.userProfile.photos[0] }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Icon name="person-outline" size={28} color={COLORS.textLight} />
              </View>
            )}
            {hasUnread && <View style={styles.unreadDot} />}
          </View>
          <View style={styles.matchInfo}>
            <View style={styles.matchHeader}>
              <Text style={[styles.matchName, hasUnread && styles.unreadName]}>
                {item.userProfile?.name || 'Unknown User'}
              </Text>
              <Text style={styles.matchTime}>{lastMessageTime}</Text>
            </View>
            <Text
              style={[styles.lastMessage, hasUnread && styles.unreadMessage]}
              numberOfLines={1}
            >
              {lastMessageText}
            </Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="chatbubbles-outline" size={80} color={COLORS.textLight} />
      <Text style={styles.emptyTitle}>No matches yet</Text>
      <Text style={styles.emptySubtitle}>Keep swiping to find your match!</Text>
      <TouchableOpacity
        style={styles.keepSwipingButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Icon name="heart-outline" size={20} color={COLORS.white} />
        <Text style={styles.keepSwipingText}>Keep Swiping</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Matches</Text>
        <Text style={styles.headerSubtitle}>{matches.length} match{matches.length !== 1 ? 'es' : ''}</Text>
      </View>
      <FlatList
        data={matches}
        keyExtractor={item => item.id}
        renderItem={renderMatchItem}
        contentContainerStyle={matches.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.paddingLarge,
    paddingBottom: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: SIZES.fontTitle,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: SIZES.fontMedium,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: SIZES.paddingLarge,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    backgroundColor: COLORS.background,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SIZES.padding,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  matchInfo: {
    flex: 1,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchName: {
    fontSize: SIZES.fontLarge,
    fontWeight: '600',
    color: COLORS.text,
  },
  unreadName: {
    fontWeight: 'bold',
  },
  matchTime: {
    fontSize: SIZES.fontSmall,
    color: COLORS.textLight,
  },
  lastMessage: {
    fontSize: SIZES.fontMedium,
    color: COLORS.textSecondary,
  },
  unreadMessage: {
    fontWeight: '600',
    color: COLORS.text,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 92,
  },
  deleteAction: {
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    gap: 4,
  },
  deleteActionText: {
    color: COLORS.white,
    fontSize: SIZES.fontSmall,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: SIZES.paddingLarge,
  },
  emptyTitle: {
    fontSize: SIZES.fontXXLarge,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.padding,
  },
  emptySubtitle: {
    fontSize: SIZES.fontLarge,
    color: COLORS.textSecondary,
    marginTop: SIZES.paddingSmall,
    textAlign: 'center',
  },
  keepSwipingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.paddingLarge,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radiusLarge,
    marginTop: SIZES.paddingLarge,
    gap: SIZES.paddingSmall,
  },
  keepSwipingText: {
    fontSize: SIZES.fontLarge,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default ChatListScreen;
