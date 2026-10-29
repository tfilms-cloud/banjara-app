import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { NotificationCard } from '@/components/profile/NotificationCard';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { useThemeColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import type { AppNotification } from '@/types/booking';
import { openFromNotificationData } from '@/utils/notificationRouting';

type Category = 'all' | 'bookings' | 'messages' | 'offers';

function matchCategory(type: AppNotification['type'], category: Category) {
  if (category === 'all') return true;
  if (category === 'bookings') {
    return (
      type === 'booking_confirmed' ||
      type === 'booking_pending' ||
      type === 'booking_request' ||
      type === 'booking_reminder' ||
      type === 'trip_reminder' ||
      type === 'pickup_reminder' ||
      type === 'booking_cancelled' ||
      type === 'payment_received' ||
      type === 'payment_failed' ||
      type === 'payment_expired'
    );
  }
  if (category === 'offers') return type === 'new_offer';
  if (category === 'messages') return type === 'new_message';
  return true;
}

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const role = useAuthStore((s) => s.user?.role);
  const { notifications, loadNotifications, markRead, markAllRead, isLoading } = useUserStore();
  const [category, setCategory] = useState<Category>('all');

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const filtered = useMemo(
    () => notifications.filter((n) => matchCategory(n.type, category)),
    [notifications, category]
  );

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Notifications"
        right={
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push('/(customer)/notification-settings' as never)}
              hitSlop={8}
              accessibilityLabel="Notification settings"
            >
              <Ionicons name="options-outline" size={22} color={colors.primary} />
            </Pressable>
            {unread > 0 ? (
              <Pressable onPress={() => void markAllRead()} hitSlop={8}>
                <Text style={[styles.link, { color: colors.action }]}>Mark all read</Text>
              </Pressable>
            ) : null}
          </View>
        }
      />

      <View style={styles.chips}>
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'bookings', label: 'Bookings' },
            { key: 'messages', label: 'Messages' },
            { key: 'offers', label: 'Offers' },
          ] as const
        ).map((item) => {
          const active = category === item.key;
          return (
            <Pressable
              key={item.key}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.action : colors.card,
                  borderColor: active ? colors.action : colors.border,
                },
              ]}
              onPress={() => setCategory(item.key)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? colors.white : colors.muted },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading && notifications.length === 0 ? (
        <LoadingState />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title="You're all caught up"
              message="Booking updates, messages, and offers will show here."
              icon="notifications-outline"
            />
          }
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onPress={() => {
                void markRead(item.id);
                openFromNotificationData(
                  {
                    type: item.type,
                    bookingId: item.bookingId,
                    conversationId: item.conversationId,
                    offerId: item.offerId,
                    otherUserId: item.otherUserId,
                  },
                  role
                );
              }}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  link: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
  },
  list: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.sm,
  },
});
