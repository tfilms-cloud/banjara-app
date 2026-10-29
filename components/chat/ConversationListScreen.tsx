import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConversationRow } from '@/components/chat/ConversationRow';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useChatStore } from '@/store/chatStore';
import { pushPath } from '@/utils/navigation';

type Props = {
  threadBasePath: string;
  backHref: string;
};

export function ConversationListScreen({ threadBasePath, backHref }: Props) {
  const insets = useSafeAreaInsets();
  const conversations = useChatStore((s) => s.conversations);
  const loadingInbox = useChatStore((s) => s.loadingInbox);
  const error = useChatStore((s) => s.error);
  const connectionStatus = useChatStore((s) => s.connectionStatus);
  const loadInbox = useChatStore((s) => s.loadInbox);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      void loadInbox();
    }, [loadInbox])
  );

  const filtered = conversations.filter((item) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      item.otherUserName.toLowerCase().includes(q) ||
      item.lastMessage.toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      <Header
        title="Messages"
        subtitle={
          connectionStatus === 'connected'
            ? undefined
            : connectionStatus === 'connecting'
              ? 'Connecting…'
              : 'Reconnecting…'
        }
        showBack
        fallbackHref={backHref as never}
      />
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search messages..."
          placeholderTextColor={Colors.muted}
          style={styles.search}
          accessibilityLabel="Search messages"
        />
      </View>
      {loadingInbox && conversations.length === 0 ? (
        <LoadingState title="Loading messages..." />
      ) : error && conversations.length === 0 ? (
        <ErrorState message={error} onRetry={() => void loadInbox()} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.otherUserId}
          contentContainerStyle={{
            padding: Spacing.lg,
            gap: Spacing.md,
            paddingBottom: insets.bottom + 24,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl refreshing={loadingInbox} onRefresh={() => void loadInbox()} />
          }
          ListEmptyComponent={
            <EmptyState
              title="Start a conversation"
              message="Message providers about trip details, seats, pickup points, and bookings."
              icon="chatbubble-ellipses-outline"
            />
          }
          renderItem={({ item }) => (
            <ConversationRow
              item={item}
              onPress={() =>
                pushPath(
                  `${threadBasePath}/${item.otherUserId}${
                    item.bookingId ? `?bookingId=${item.bookingId}` : ''
                  }`
                )
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchWrap: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  search: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.dark,
  },
});
