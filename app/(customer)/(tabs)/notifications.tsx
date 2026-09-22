import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { NotificationCard } from '@/components/profile/NotificationCard';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { useUserStore } from '@/store/userStore';
import type { AppNotification } from '@/types/booking';
import { pushPath } from '@/utils/navigation';

type Category = 'all' | 'bookings' | 'messages' | 'offers';

function matchCategory(type: AppNotification['type'], category: Category) {
  if (category === 'all') return true;
  if (category === 'bookings') {
    return (
      type === 'booking_confirmed' ||
      type === 'trip_reminder' ||
      type === 'pickup_reminder' ||
      type === 'booking_cancelled' ||
      type === 'payment_received'
    );
  }
  if (category === 'offers') return type === 'new_offer';
  if (category === 'messages') return false;
  return true;
}

function openNotification(item: AppNotification) {
  if (item.bookingId) {
    pushPath(`/(customer)/booking-details/${item.bookingId}`);
    return;
  }
  if (item.type === 'new_offer') {
    router.push('/(customer)/(tabs)/search');
  }
}

export default function NotificationsScreen() {
  const { notifications, loadNotifications, markRead, markAllRead, isLoading } = useUserStore();
  const [category, setCategory] = useState<Category>('all');

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const filtered = useMemo(
    () => notifications.filter((n) => matchCategory(n.type, category)),
    [notifications, category]
  );

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Notifications"
        right={
          <Pressable onPress={() => void markAllRead()} hitSlop={8}>
            <Text style={styles.link}>Mark all read</Text>
          </Pressable>
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
        ).map((item) => (
          <Pressable
            key={item.key}
            style={[styles.chip, category === item.key && styles.chipActive]}
            onPress={() => setCategory(item.key)}
          >
            <Text style={[styles.chipText, category === item.key && styles.chipTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
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
              message="New trip updates and offers will show here."
            />
          }
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onPress={() => {
                void markRead(item.id);
                openNotification(item);
              }}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  link: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.action,
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
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.action,
    borderColor: Colors.action,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.muted,
  },
  chipTextActive: {
    color: Colors.white,
  },
  list: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.sm,
  },
});
