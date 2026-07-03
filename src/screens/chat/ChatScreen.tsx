import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from '@expo/vector-icons/Ionicons';
import { COLORS, SIZES, SHADOWS } from '../../config/theme';
import { databaseService } from '../../services/DatabaseService';
import { authService } from '../../services/AuthService';
import { Message, RootStackParamList } from '../../types';

type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;
type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface ChatScreenProps {
  navigation: ChatScreenNavigationProp;
  route: ChatScreenRouteProp;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const { matchId, userName } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) return;

    navigation.setOptions({
      headerShown: true,
      headerTitle: () => (
        <View style={styles.headerContent}>
          <View style={styles.headerAvatar}>
            <Icon name="person-circle-outline" size={32} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.headerName}>{userName}</Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={styles.videoCallButton}
          onPress={handleVideoCall}
        >
          <Icon name="videocam-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      ),
      headerLeft: () => (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-back-outline" size={28} color={COLORS.text} />
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: COLORS.white,
        ...SHADOWS.small,
      },
    });
  }, [navigation, userName, currentUser]);

  useEffect(() => {
    if (!matchId || !currentUser) return;

    setLoading(true);
    const unsubscribe = databaseService.onMessagesChanged(matchId, msgs => {
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsubscribe();
  }, [matchId, currentUser]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !currentUser || !matchId || sending) return;

    setSending(true);
    try {
      await databaseService.sendMessage(matchId, currentUser.uid, text);
      setInputText('');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }, [inputText, currentUser, matchId, sending]);

  const handleVideoCall = useCallback(() => {
    if (!currentUser || !matchId) return;
    const roomUrl = `https://meet.tinder-clone.app/${matchId}`;
    navigation.navigate('VideoCall', { roomUrl, matchId });
  }, [currentUser, matchId, navigation]);

  const formatMessageTime = (timestamp: Date): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    if (isToday) {
      return `${hours}:${minutes}`;
    }
    return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`;
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isSentByMe = item.senderId === currentUser?.uid;
    const showTimestamp =
      index === 0 ||
      new Date(item.timestamp).getTime() -
        new Date(messages[index - 1].timestamp).getTime() >
        300000;

    return (
      <View>
        {showTimestamp && (
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>
              {new Date(item.timestamp).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <View style={styles.dateLine} />
          </View>
        )}
        <View
          style={[
            styles.messageRow,
            isSentByMe ? styles.sentRow : styles.receivedRow,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isSentByMe ? styles.sentBubble : styles.receivedBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isSentByMe ? styles.sentText : styles.receivedText,
              ]}
            >
              {item.text}
            </Text>
          </View>
        </View>
        <Text
          style={[
            styles.messageTime,
            isSentByMe ? styles.sentTime : styles.receivedTime,
          ]}
        >
          {formatMessageTime(item.timestamp)}
          {isSentByMe && (
            <Icon
              name={item.read ? 'checkmark-done-outline' : 'checkmark-outline'}
              size={14}
              color={item.read ? COLORS.accent : COLORS.textLight}
              style={{ marginLeft: 4 }}
            />
          )}
        </Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="chatbubble-ellipses-outline" size={64} color={COLORS.textLight} />
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptySubtitle}>
        Say hello to {userName}!
      </Text>
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={
          messages.length === 0 ? styles.emptyListContainer : styles.messageList
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textLight}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            <Icon
              name="send-outline"
              size={20}
              color={inputText.trim() && !sending ? COLORS.white : COLORS.textLight}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.paddingSmall,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerName: {
    fontSize: SIZES.fontLarge,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerStatus: {
    fontSize: SIZES.fontSmall,
    color: COLORS.success,
  },
  videoCallButton: {
    marginRight: SIZES.padding,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginLeft: SIZES.paddingSmall,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SIZES.padding,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dateText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.textLight,
    marginHorizontal: SIZES.paddingSmall,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  sentRow: {
    justifyContent: 'flex-end',
  },
  receivedRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall + 2,
    borderRadius: SIZES.radiusLarge,
  },
  sentBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: SIZES.fontLarge,
    lineHeight: 22,
  },
  sentText: {
    color: COLORS.white,
  },
  receivedText: {
    color: COLORS.text,
  },
  messageTime: {
    fontSize: SIZES.fontSmall - 1,
    marginTop: 2,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sentTime: {
    textAlign: 'right',
    color: COLORS.textLight,
    marginRight: 4,
  },
  receivedTime: {
    textAlign: 'left',
    color: COLORS.textLight,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: SIZES.paddingLarge,
  },
  emptyTitle: {
    fontSize: SIZES.fontXLarge,
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
  inputContainer: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLarge,
    paddingLeft: SIZES.padding,
    paddingRight: 4,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    fontSize: SIZES.fontLarge,
    color: COLORS.text,
    maxHeight: 100,
    paddingVertical: SIZES.paddingSmall,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.paddingSmall,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.surface,
  },
});

export default ChatScreen;
