import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { formatConversationTime } from '@/components/chat/chatTime';
import { Avatar } from '@/components/ui/Avatar';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useChatStore } from '@/store/chatStore';
import { pushPath } from '@/utils/navigation';

type Props = {
  messagesHref: string;
  notificationsHref?: string;
  hideMessages?: boolean;
  light?: boolean;
};

export function MessagesHeaderActions({
  messagesHref,
  notificationsHref,
  hideMessages,
  light,
}: Props) {
  const [open, setOpen] = useState(false);
  const conversations = useChatStore((s) => s.conversations);
  const unreadTotal = useChatStore((s) => s.unreadTotal);
  const connect = useChatStore((s) => s.connect);
  const loadInbox = useChatStore((s) => s.loadInbox);
  const iconColor = light ? Colors.white : Colors.primary;

  useFocusEffect(
    useCallback(() => {
      void connect();
      void loadInbox();
    }, [connect, loadInbox])
  );

  useEffect(() => {
    void connect();
  }, [connect]);

  const preview = conversations.slice(0, 5);

  return (
    <View style={styles.row}>
      {notificationsHref ? (
        <Pressable
          onPress={() => pushPath(notificationsHref)}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          hitSlop={8}
        >
          <Ionicons name="notifications-outline" size={22} color={iconColor} />
        </Pressable>
      ) : null}

      {!hideMessages ? (
        <Pressable
          onPress={() => setOpen(true)}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel={unreadTotal > 0 ? `Messages, ${unreadTotal} unread` : 'Messages'}
          hitSlop={8}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={iconColor} />
          {unreadTotal > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadTotal > 99 ? '99+' : unreadTotal}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.panelTitle}>Messages</Text>
            {preview.length === 0 ? (
              <Text style={styles.empty}>No conversations yet</Text>
            ) : (
              preview.map((item) => (
                <Pressable
                  key={item.otherUserId}
                  style={styles.item}
                  onPress={() => {
                    setOpen(false);
                    pushPath(
                      `${messagesHref}/${item.otherUserId}${
                        item.bookingId ? `?bookingId=${item.bookingId}` : ''
                      }`
                    );
                  }}
                >
                  <Avatar uri={item.otherUserAvatar} name={item.otherUserName} size={40} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.itemTop}>
                      <Text style={styles.name} numberOfLines={1}>
                        {item.otherUserName}
                      </Text>
                      <Text style={styles.time}>{formatConversationTime(item.updatedAt)}</Text>
                    </View>
                    <Text style={styles.previewText} numberOfLines={1}>
                      {item.lastMessage || 'No messages yet'}
                    </Text>
                  </View>
                  {item.unreadCount > 0 ? (
                    <View style={styles.itemBadge}>
                      <Text style={styles.badgeText}>{item.unreadCount}</Text>
                    </View>
                  ) : null}
                </Pressable>
              ))
            )}
            <Pressable
              style={styles.viewAll}
              onPress={() => {
                setOpen(false);
                pushPath(messagesHref);
              }}
            >
              <Text style={styles.viewAllText}>View all messages</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-start',
    paddingTop: 72,
    paddingHorizontal: Spacing.lg,
  },
  panel: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '70%',
  },
  panelTitle: { ...Typography.h3, color: Colors.primary, marginBottom: Spacing.sm },
  empty: { ...Typography.body, color: Colors.muted, paddingVertical: Spacing.md },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  name: { ...Typography.body, color: Colors.primary, fontWeight: '600', flex: 1 },
  time: { ...Typography.caption, color: Colors.muted },
  previewText: { ...Typography.caption, color: Colors.muted, marginTop: 2 },
  itemBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  viewAll: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  viewAllText: { ...Typography.body, color: Colors.secondary, fontWeight: '700' },
});
