import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { HomeTopBar } from '@/components/home/HomeDiscovery';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { TravelTextField } from '@/components/ui/TravelForm';
import { useHomeDesign } from '@/constants/homeDesign';
import { Fonts } from '@/constants/typography';
import type { ChatConversation } from '@/types/chat';
import { conversationRole, filterConversations, type InboxFilter } from '@/utils/chatPresentation';
import { formatConversationTime, formatPresenceLabel } from './chatTime';
import { ChatInboxFilters, ChatInboxFooter, ChatInboxHeading } from './ChatPresentation';

export function TravelConversationCard({
  item,
  onPress,
}: {
  item: ChatConversation;
  onPress: () => void;
}) {
  const theme = useHomeDesign();
  const unread = item.unreadCount > 0;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${item.otherUserName}${unread ? `, ${item.unreadCount} unread` : ''}`}
      style={[
        s.card,
        {
          backgroundColor: unread ? theme.soft : theme.surface,
          borderColor: unread ? theme.soft : theme.border,
        },
      ]}
    >
      <View style={s.avatar}>
        <Avatar uri={item.otherUserAvatar} name={item.otherUserName} size={50} />
        <View
          style={[
            s.presenceDot,
            {
              backgroundColor: item.online ? theme.primary : theme.border,
              borderColor: unread ? theme.soft : theme.surface,
            },
          ]}
        />
      </View>
      <View style={s.flex}>
        <View style={s.top}>
          <Text style={[s.name, { color: unread ? theme.primary : theme.text }]} numberOfLines={1}>
            {item.otherUserName}
          </Text>
          <Text style={[s.time, { color: item.online && unread ? theme.primary : theme.muted }]}>
            {formatConversationTime(item.updatedAt)}
          </Text>
        </View>
        <View style={s.meta}>
          <View style={[s.role, { backgroundColor: theme.field }]}>
            <Text style={[s.roleText, { color: theme.text }]}>
              {conversationRole(item.otherUserRole)}
            </Text>
          </View>
          <Text
            style={[s.presenceText, { color: item.online ? theme.primary : theme.muted }]}
            numberOfLines={1}
          >
            {formatPresenceLabel(item.online, item.lastSeenAt)}
          </Text>
        </View>
        {item.bookingId ? (
          <View style={[s.booking, { backgroundColor: unread ? theme.background : theme.field }]}>
            <Ionicons name="ticket-outline" size={12} color={theme.primary} />
            <Text style={[s.bookingText, { color: theme.primary }]} numberOfLines={1}>
              Booking #{item.bookingId.slice(-8)}
            </Text>
          </View>
        ) : null}
        <View style={s.previewRow}>
          <Text
            style={[
              s.preview,
              {
                color: unread ? theme.text : theme.muted,
                fontFamily: unread ? Fonts.bodySemiBold : Fonts.body,
              },
            ]}
            numberOfLines={2}
          >
            {item.lastMessage || 'No messages yet — say hello'}
          </Text>
          {unread ? (
            <View style={[s.unread, { backgroundColor: theme.action }]}>
              <Text style={[s.unreadText, { color: theme.background }]}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

type InboxProps = {
  conversations: ChatConversation[];
  loading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  onRefresh: () => void;
  onOpen: (item: ChatConversation) => void;
  onNotifications: () => void;
  onProfile: () => void;
  onHelp: () => void;
  onBack?: () => void;
  onSignIn?: () => void;
  userName?: string;
  userAvatar?: string;
  notificationUnread?: boolean;
};

export function TravelConversationInbox({
  conversations,
  loading,
  error,
  connectionStatus,
  onRefresh,
  onOpen,
  onNotifications,
  onProfile,
  onHelp,
  onBack,
  onSignIn,
  userName,
  userAvatar,
  notificationUnread = false,
}: InboxProps) {
  const theme = useHomeDesign();
  const searchRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<InboxFilter>('all');
  const items = useMemo(
    () => filterConversations(conversations, query, filter),
    [conversations, query, filter],
  );
  const unread = conversations.filter((item) => item.unreadCount > 0).length;
  const unreadTotal = conversations.reduce(
    (total, item) => total + Math.max(0, item.unreadCount),
    0,
  );
  const filtered = Boolean(query.trim()) || filter !== 'all';
  return (
    <View style={[s.root, { backgroundColor: theme.background }]}>
      <HomeTopBar
        name={userName}
        avatar={userAvatar}
        unread={notificationUnread}
        onSearch={() => searchRef.current?.focus()}
        onNotifications={onNotifications}
        onProfile={onProfile}
      />
      <ChatInboxHeading
        unread={unreadTotal}
        status={onSignIn ? 'signed_out' : connectionStatus}
        onBack={onBack}
      />
      <View style={s.search}>
        <TravelTextField
          compact
          inputRef={searchRef}
          label="Search messages"
          value={query}
          onChangeText={setQuery}
          placeholder="Search chats, bookings, or guides…"
        />
      </View>
      <View>
        <ChatInboxFilters
          value={filter}
          onChange={setFilter}
          total={conversations.length}
          unread={unread}
        />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.otherUserId}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        renderItem={({ item }) => (
          <TravelConversationCard item={item} onPress={() => onOpen(item)} />
        )}
        ListEmptyComponent={
          onSignIn ? (
            <EmptyState
              title="Sign in to view messages"
              message="Your conversations and booking updates will appear here."
              icon="chatbubbles-outline"
              actionLabel="Sign in"
              onAction={onSignIn}
            />
          ) : loading && !conversations.length ? (
            <LoadingState title="Loading messages…" />
          ) : error && !conversations.length ? (
            <ErrorState message={error} onRetry={onRefresh} />
          ) : (
            <EmptyState
              title={filtered ? 'No matching conversations' : 'Start a conversation'}
              message={
                filtered
                  ? 'Try another search or filter to find your chat.'
                  : 'Message providers about trip details, seats, pickup points, and bookings.'
              }
              icon="chatbubbles-outline"
            />
          )
        }
        ListHeaderComponent={
          error && conversations.length ? (
            <View style={[s.notice, { backgroundColor: theme.field }]}>
              <Text style={[s.noticeText, { color: theme.muted }]}>
                Could not refresh messages. Pull down to try again.
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={<ChatInboxFooter onHelp={onHelp} />}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  search: { paddingHorizontal: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12, flexGrow: 1 },
  card: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: { marginTop: 2 },
  presenceDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flex: 1, fontFamily: Fonts.bodyBold, fontSize: 14, lineHeight: 20 },
  time: { fontFamily: Fonts.body, fontSize: 10, maxWidth: 68 },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 3 },
  role: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  roleText: { fontFamily: Fonts.bodyMedium, fontSize: 10 },
  presenceText: { flexShrink: 1, fontFamily: Fonts.body, fontSize: 10 },
  booking: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    gap: 4,
    borderRadius: 7,
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginTop: 6,
  },
  bookingText: { flexShrink: 1, fontFamily: Fonts.bodyMedium, fontSize: 10 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  preview: { flex: 1, fontSize: 13, lineHeight: 20 },
  unread: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: { fontFamily: Fonts.bodyBold, fontSize: 10 },
  notice: { padding: 12, borderRadius: 16 },
  noticeText: { fontFamily: Fonts.body, fontSize: 11, lineHeight: 17 },
});
