import { useCallback, useMemo, useRef, useState } from 'react';
import { useBackendEffect as useEffect } from '@/hooks/useBackendData';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Href } from 'expo-router';
import {
  formatDateSeparator,
  formatPresenceLabel,
  sameCalendarDay,
} from '@/components/chat/chatTime';
import { ChatProfilePreview } from '@/components/chat/ChatProfilePreview';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { TypingDots } from '@/components/chat/TypingDots';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as uploadService from '@/services/uploadService';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import type { ChatMessage } from '@/types/chat';
import { useTravelPresentation } from '@/components/ui/TravelDesignProvider';
import { useHomeDesign } from '@/constants/homeDesign';
import { Fonts } from '@/constants/typography';
import { ChatBookingBanner, ChatQuickReplies, ChatThreadHeader } from './ChatPresentation';
import { useChatBookingContext } from '@/hooks/useChatBookingContext';
import { useBookingStore } from '@/store/bookingStore';
import { pushPath, safeBack } from '@/utils/navigation';

type ListItem =
  | { kind: 'separator'; id: string; label: string }
  | { kind: 'message'; id: string; message: ChatMessage; showAvatar: boolean; showTail: boolean };

type Props = {
  otherUserId: string;
  title?: string;
  bookingId?: string;
  backHref: string;
  avatarUri?: string;
};

export function ChatThread({ otherUserId, title = 'Chat', bookingId, backHref, avatarUri }: Props) {
  const travel = useTravelPresentation();
  const theme = useHomeDesign();
  const insets = useSafeAreaInsets();
  const me = useAuthStore((s) => s.user?.id);
  const messages = useChatStore((s) => s.messages);
  const loadingThread = useChatStore((s) => s.loadingThread);
  const error = useChatStore((s) => s.error);
  const loadingOlder = useChatStore((s) => s.loadingOlder);
  const hasMoreOlder = useChatStore((s) => s.hasMoreOlder);
  const sending = useChatStore((s) => s.sending);
  const typingUserId = useChatStore((s) => s.typingUserId);
  const connectionStatus = useChatStore((s) => s.connectionStatus);
  const presence = useChatStore((s) => s.presenceByUser[otherUserId]);
  const openThread = useChatStore((s) => s.openThread);
  const closeThread = useChatStore((s) => s.closeThread);
  const loadOlder = useChatStore((s) => s.loadOlder);
  const send = useChatStore((s) => s.send);
  const retryFailed = useChatStore((s) => s.retryFailed);
  const setTyping = useChatStore((s) => s.setTyping);

  const [text, setText] = useState('');
  const [nearBottom, setNearBottom] = useState(true);
  const [pendingNew, setPendingNew] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const booking = useChatBookingContext(bookingId, otherUserId, travel && Boolean(me));
  const selectedTrip = useBookingStore((state) => state.selectedTrip);
  const linkedAgency =
    selectedTrip?.agency.userId === otherUserId ? selectedTrip.agency : undefined;
  const listRef = useRef<FlatList>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCount = useRef(0);
  const conversation = useChatStore((s) =>
    s.conversations.find((item) => item.otherUserId === otherUserId),
  );

  useEffect(() => {
    void openThread(otherUserId, { bookingId });
    return () => {
      closeThread();
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [otherUserId, bookingId, openThread, closeThread]);

  useEffect(() => {
    if (messages.length > prevCount.current) {
      const newest = messages[messages.length - 1];
      if (newest && newest.senderId !== me) {
        if (nearBottom) {
          requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
          setPendingNew(0);
        } else {
          setPendingNew((n) => n + 1);
        }
      } else if (nearBottom) {
        requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
      }
    }
    prevCount.current = messages.length;
  }, [messages, me, nearBottom]);

  const listItems = useMemo(() => {
    const items: ListItem[] = [];
    messages.forEach((message, index) => {
      const prev = messages[index - 1];
      const next = messages[index + 1];
      if (!prev || !sameCalendarDay(prev.createdAt, message.createdAt)) {
        items.push({
          kind: 'separator',
          id: `sep-${message.createdAt}-${index}`,
          label: formatDateSeparator(message.createdAt),
        });
      }
      const showAvatar = message.senderId !== me && (!next || next.senderId !== message.senderId);
      const showTail = !next || next.senderId !== message.senderId;
      items.push({
        kind: 'message',
        id: message.id,
        message,
        showAvatar,
        showTail,
      });
    });
    return items;
  }, [messages, me]);

  const onChangeText = (value: string) => {
    setText(value);
    setTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), 1200);
  };

  const onSend = async () => {
    if (!text.trim() || sending) return;
    const value = text;
    setText('');
    setTyping(false);
    setNearBottom(true);
    setPendingNew(0);
    try {
      await send(value);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch {
      setText(value);
    }
  };

  const onAttach = async (camera = false) => {
    if (sending || uploading) return;
    setUploading(true);
    try {
      const captured = camera ? await uploadService.takePhoto({ allowsEditing: false }) : null;
      const uploaded = camera
        ? captured
          ? await uploadService.uploadImage(captured.uri, 'chat', {
              mimeType: captured.mimeType,
              fileName: captured.fileName,
            })
          : null
        : await uploadService.pickAndUpload('chat', { allowsEditing: false });
      if (!uploaded) return;
      setNearBottom(true);
      setPendingNew(0);
      await send(text.trim() || 'Photo', {
        type: 'image',
        attachments: [uploaded.url],
      });
      setText('');
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch (error) {
      Alert.alert('Could not send photo', getApiErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const presenceLabel = formatPresenceLabel(
    presence?.online ?? conversation?.online,
    presence?.lastSeenAt ?? conversation?.lastSeenAt,
  );
  const connectionLabel =
    connectionStatus === 'connecting'
      ? 'Connecting…'
      : connectionStatus === 'disconnected'
        ? 'Reconnecting…'
        : undefined;

  const onScroll = useCallback(
    (event: {
      nativeEvent: {
        contentOffset: { y: number };
        contentSize: { height: number };
        layoutMeasurement: { height: number };
      };
    }) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distance = contentSize.height - (contentOffset.y + layoutMeasurement.height);
      const atBottom = distance < 80;
      setNearBottom(atBottom);
      if (atBottom) setPendingNew(0);
      if (contentOffset.y < 48 && hasMoreOlder && !loadingOlder) {
        void loadOlder();
      }
    },
    [hasMoreOlder, loadingOlder, loadOlder],
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, travel && { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : travel ? 'height' : undefined}
    >
      {travel ? (
        <ChatThreadHeader
          title={title}
          avatar={avatarUri ?? conversation?.otherUserAvatar}
          online={presence?.online ?? conversation?.online}
          subtitle={connectionLabel ?? (typingUserId ? 'Typing…' : presenceLabel)}
          onBack={() => safeBack(backHref as Href)}
          onInfo={() => setProfileOpen(true)}
          onProfile={() => pushPath('/(customer)/(tabs)/profile')}
          onCall={
            linkedAgency?.phone
              ? () => {
                  void Linking.openURL(`tel:${linkedAgency.phone.replace(/[^+\d]/g, '')}`).catch(
                    () => Alert.alert('Call unavailable', 'Unable to open the phone app.'),
                  );
                }
              : undefined
          }
        />
      ) : (
        <Header
          title={title}
          subtitle={
            connectionLabel ?? (typingUserId ? `${title.split(' ')[0]} is typing…` : presenceLabel)
          }
          showBack
          fallbackHref={backHref as never}
          right={
            <Pressable
              onPress={() => setProfileOpen(true)}
              style={styles.headerRight}
              accessibilityRole="button"
              accessibilityLabel={`${title} profile`}
            >
              <Avatar uri={avatarUri ?? conversation?.otherUserAvatar} name={title} size={36} />
              {presence?.online ? <View style={styles.onlineDot} /> : null}
            </Pressable>
          }
        />
      )}

      {travel && booking ? (
        <ChatBookingBanner
          booking={booking}
          onDetails={() => pushPath(booking.detailHref)}
          onTicket={booking.ticketHref ? () => pushPath(booking.ticketHref!) : undefined}
        />
      ) : null}

      <ChatProfilePreview
        visible={profileOpen}
        onClose={() => setProfileOpen(false)}
        name={title}
        role={conversation?.otherUserRole}
        avatarUri={avatarUri ?? conversation?.otherUserAvatar}
        online={presence?.online ?? conversation?.online}
        lastSeenAt={presence?.lastSeenAt ?? conversation?.lastSeenAt}
        onViewProfile={
          travel && linkedAgency
            ? () => {
                setProfileOpen(false);
                pushPath(`/(customer)/agency/${linkedAgency.id}`);
              }
            : undefined
        }
      />
      {loadingThread && messages.length === 0 ? (
        <View style={styles.skeletonWrap}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[styles.skeleton, i % 2 === 0 ? styles.skeletonMine : styles.skeletonTheirs]}
            />
          ))}
        </View>
      ) : (
        <View style={[styles.chatBg, travel && { backgroundColor: theme.background }]}>
          <FlatList
            ref={listRef}
            data={listItems}
            keyExtractor={(item) => item.id}
            onScroll={onScroll}
            scrollEventThrottle={16}
            maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
            contentContainerStyle={{
              paddingHorizontal: Spacing.lg,
              paddingTop: Spacing.md,
              paddingBottom: travel ? 12 : insets.bottom + 12,
              flexGrow: 1,
              gap: Spacing.xs,
            }}
            ListHeaderComponent={
              loadingOlder ? (
                <Text style={styles.loadingOlder}>Loading older messages…</Text>
              ) : hasMoreOlder ? (
                <Pressable
                  onPress={() => void loadOlder()}
                  style={travel ? { minHeight: 44, justifyContent: 'center' } : undefined}
                >
                  <Text style={styles.loadingOlder}>Load earlier messages</Text>
                </Pressable>
              ) : undefined
            }
            ListEmptyComponent={
              travel && error ? (
                <ErrorState
                  title="Couldn't load this conversation"
                  message={error}
                  onRetry={() => void openThread(otherUserId, { bookingId })}
                />
              ) : (
                <EmptyState
                  title="Start your conversation"
                  message="Discuss trip details, pickup points, availability, seats and booking information."
                  icon="chatbubble-ellipses-outline"
                />
              )
            }
            renderItem={({ item }) => {
              if (item.kind === 'separator') {
                return (
                  <View style={[styles.separator, travel && { justifyContent: 'center' }]}>
                    {!travel ? <View style={styles.sepLine} /> : null}
                    <Text
                      style={[
                        styles.sepText,
                        travel && {
                          backgroundColor: theme.field,
                          color: theme.muted,
                          borderRadius: 12,
                          paddingHorizontal: 9,
                          paddingVertical: 4,
                          fontFamily: Fonts.bodyMedium,
                          fontSize: 10,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {!travel ? <View style={styles.sepLine} /> : null}
                  </View>
                );
              }
              const mine = item.message.senderId === me;
              return (
                <View
                  style={[
                    styles.row,
                    mine ? styles.rowMine : styles.rowTheirs,
                    travel && { alignItems: 'flex-start', marginVertical: 6 },
                  ]}
                >
                  {!mine && item.showAvatar ? (
                    <Avatar
                      uri={avatarUri ?? conversation?.otherUserAvatar}
                      name={title}
                      size={28}
                    />
                  ) : !mine ? (
                    <View style={{ width: 28 }} />
                  ) : null}
                  <MessageBubble
                    message={item.message}
                    mine={mine}
                    showTail={item.showTail}
                    onRetry={
                      item.message.status === 'failed'
                        ? () => void retryFailed(item.message.id)
                        : undefined
                    }
                  />
                </View>
              );
            }}
          />

          {typingUserId ? (
            <View style={styles.typingBar}>
              <TypingDots />
              <Text style={styles.typingText}>{title.split(' ')[0]} is typing…</Text>
            </View>
          ) : null}

          {pendingNew > 0 ? (
            <Pressable
              style={[styles.newPill, travel && { backgroundColor: theme.action }]}
              onPress={() => {
                setPendingNew(0);
                setNearBottom(true);
                listRef.current?.scrollToEnd({ animated: true });
              }}
              accessibilityRole="button"
              accessibilityLabel={`${pendingNew} new messages`}
            >
              <Text style={[styles.newPillText, travel && { color: theme.background }]}>
                ↓ {pendingNew} new message{pendingNew > 1 ? 's' : ''}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {travel ? (
        <View>
          <ChatQuickReplies
            disabled={!me || sending || uploading}
            onSelect={(reply) =>
              onChangeText((text.trim() ? `${text.trim()} ${reply}` : reply).slice(0, 4000))
            }
          />
        </View>
      ) : null}
      <MessageComposer
        value={text}
        onChangeText={onChangeText}
        onSend={() => void onSend()}
        onAttachPress={() => void onAttach()}
        sending={sending || uploading}
        disabled={travel && (!me || loadingThread)}
        onCameraPress={travel ? () => void onAttach(true) : undefined}
        placeholder={travel ? `Message ${title.split(' ')[0]}…` : undefined}
        bottomInset={insets.bottom}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  chatBg: { flex: 1, backgroundColor: Colors.background },
  headerRight: { position: 'relative' },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  skeletonWrap: { flex: 1, padding: Spacing.lg, gap: Spacing.md },
  skeleton: { height: 44, borderRadius: 16, backgroundColor: Colors.border, opacity: 0.55 },
  skeletonMine: { alignSelf: 'flex-end', width: '58%' },
  skeletonTheirs: { alignSelf: 'flex-start', width: '64%' },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 2 },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  sepLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  sepText: { ...Typography.caption, color: Colors.muted },
  typingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  typingText: { ...Typography.caption, color: Colors.muted },
  loadingOlder: {
    ...Typography.caption,
    color: Colors.muted,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  newPill: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 999,
  },
  newPillText: { ...Typography.caption, color: Colors.white, fontWeight: '600' },
});
