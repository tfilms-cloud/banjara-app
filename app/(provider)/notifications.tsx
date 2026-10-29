import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationCard } from '@/components/profile/NotificationCard';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { useThemeColors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as notificationService from '@/services/notification.service';
import { useAuthStore } from '@/store/authStore';
import type { AppNotification } from '@/types/booking';
import { openFromNotificationData } from '@/utils/notificationRouting';
import { pushPath } from '@/utils/navigation';

export default function ProviderNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const role = useAuthStore((s) => s.user?.role);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await notificationService.getNotifications();
      setItems(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unread = items.filter((n) => !n.read).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Notifications"
        showBack
        fallbackHref={'/(provider)/(tabs)' as never}
        right={
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => pushPath('/(provider)/notification-settings')}
              hitSlop={8}
              accessibilityLabel="Push settings"
            >
              <Ionicons name="options-outline" size={22} color={colors.primary} />
            </Pressable>
            {unread > 0 ? (
              <Pressable
                onPress={() => {
                  void notificationService.markAllRead().then(() =>
                    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
                  );
                }}
                hitSlop={8}
              >
                <Text style={[styles.link, { color: colors.action }]}>Mark all</Text>
              </Pressable>
            ) : null}
          </View>
        }
      />

      {loading && items.length === 0 ? (
        <LoadingState />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{
            padding: Spacing.lg,
            gap: Spacing.sm,
            paddingBottom: insets.bottom + 24,
          }}
          ListEmptyComponent={
            <EmptyState
              title="No notifications yet"
              message="New booking requests and updates will appear here."
              icon="notifications-outline"
            />
          }
          ListHeaderComponent={
            error ? (
              <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onPress={() => {
                void notificationService.markRead(item.id).then(() => {
                  setItems((prev) =>
                    prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
                  );
                });
                openFromNotificationData(
                  {
                    type: item.type,
                    bookingId: item.bookingId,
                    conversationId: item.conversationId,
                    otherUserId: item.otherUserId,
                  },
                  role ?? 'provider'
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
  container: { flex: 1 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  link: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },
  error: {
    fontFamily: Fonts.body,
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
});
