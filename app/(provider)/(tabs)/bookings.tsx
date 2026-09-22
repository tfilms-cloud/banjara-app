import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProviderBookingCard } from '@/components/provider/ProviderBookingCard';
import { MessagesHeaderActions } from '@/components/chat/MessagesHeaderActions';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { useProviderStore } from '@/store/providerStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { pushPath } from '@/utils/navigation';

type Category = 'all' | 'transport' | 'hotel';
type StatusTab = 'upcoming' | 'completed' | 'cancelled' | 'pending';

export default function ProviderBookingsScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const bookings = useProviderStore((s) => s.bookings);
  const provider = useProviderStore((s) => s.provider);
  const loading = useProviderStore((s) => s.loading);
  const loadProvider = useProviderStore((s) => s.loadProvider);
  const loadProviderByUser = useProviderStore((s) => s.loadProviderByUser);
  const refreshBookings = useProviderStore((s) => s.refreshBookings);
  const refreshDashboard = useProviderStore((s) => s.refreshDashboard);

  const [category, setCategory] = useState<Category>('all');
  const [status, setStatus] = useState<StatusTab>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (provider) {
      void refreshBookings();
      return;
    }
    if (user?.providerId) {
      void loadProvider(user.providerId);
    } else if (user?.id) {
      void loadProviderByUser(user.id);
    }
  }, [
    provider,
    user?.id,
    user?.providerId,
    loadProvider,
    loadProviderByUser,
    refreshBookings,
  ]);

  const filtered = useMemo(() => {
    return bookings.filter((item) => {
      if (category !== 'all' && item.kind !== category) return false;
      if (status === 'upcoming') {
        return item.status === 'upcoming' || item.status === 'confirmed' || item.status === 'pending';
      }
      return item.status === status;
    });
  }, [bookings, category, status]);

  const summary = useMemo(() => {
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const upcoming = bookings.filter((b) =>
      ['upcoming', 'confirmed', 'pending'].includes(b.status)
    ).length;
    const revenue = bookings
      .filter((b) => b.status !== 'cancelled' && b.status !== 'rejected')
      .reduce((sum, b) => sum + b.amount, 0);
    return { pending, upcoming, revenue, total: bookings.length };
  }, [bookings]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (provider) await refreshBookings();
      else await refreshDashboard();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && bookings.length === 0 && !provider) {
    return <LoadingState title="Loading bookings..." />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Bookings</Text>
          <Text style={styles.subtitle}>Manage customer requests and trips</Text>
        </View>
        <MessagesHeaderActions
          messagesHref="/(provider)/messages"
          notificationsHref="/(provider)/notifications"
        />
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: Colors.softBlue }]}>
          <Text style={[styles.summaryValue, { color: Colors.secondary }]}>{summary.total}</Text>
          <Text style={[styles.summaryLabel, { color: Colors.secondary }]}>Total</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: Colors.softAmber }]}>
          <Text style={[styles.summaryValue, { color: '#9A6700' }]}>{summary.pending}</Text>
          <Text style={[styles.summaryLabel, { color: '#9A6700' }]}>Pending</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: Colors.softGreen }]}>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>{summary.upcoming}</Text>
          <Text style={[styles.summaryLabel, { color: Colors.success }]}>Active</Text>
        </View>
      </View>

      <View style={styles.categoryRow}>
        {(
          [
            { key: 'all', label: 'All', icon: 'apps-outline' },
            { key: 'transport', label: 'Transport', icon: 'bus-outline' },
            { key: 'hotel', label: 'Hotel', icon: 'bed-outline' },
          ] as const
        ).map((item) => {
          const active = category === item.key;
          return (
            <Pressable
              key={item.key}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => setCategory(item.key)}
            >
              <Ionicons
                name={item.icon}
                size={16}
                color={active ? Colors.white : Colors.primary}
              />
              <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.statusRow}>
        {(
          [
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'pending', label: 'Pending' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' },
          ] as const
        ).map((item) => {
          const active = status === item.key;
          return (
            <Pressable
              key={item.key}
              style={[styles.statusChip, active && styles.statusChipActive]}
              onPress={() => setStatus(item.key)}
            >
              <Text style={[styles.statusText, active && styles.statusTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.secondary} />
        }
        contentContainerStyle={[
          styles.list,
          filtered.length === 0 && styles.listEmpty,
          { paddingBottom: insets.bottom + 28 },
        ]}
        ListHeaderComponent={
          filtered.length > 0 ? (
            <Text style={styles.listHeader}>
              {filtered.length} result{filtered.length === 1 ? '' : 's'} ·{' '}
              {formatCurrency(summary.revenue)} booked value
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            title="No bookings yet"
            message="When customers book your transport or hotel services, they will show up here."
            icon="calendar-outline"
          />
        }
        renderItem={({ item }) => (
          <ProviderBookingCard
            booking={item}
            onPress={() => pushPath(`/(provider)/booking/${item.id}`)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: { ...Typography.h1, color: Colors.dark },
  subtitle: { ...Typography.caption, color: Colors.muted, marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: { ...Typography.h3, fontWeight: '800' },
  summaryLabel: { ...Typography.small, fontWeight: '700' },
  categoryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  categoryChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: { ...Typography.caption, color: Colors.primary, fontWeight: '700' },
  categoryTextActive: { color: Colors.white },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  statusChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusChipActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  statusText: { ...Typography.caption, color: Colors.muted, fontWeight: '700' },
  statusTextActive: { color: Colors.primary },
  list: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  listHeader: { ...Typography.caption, color: Colors.muted, marginBottom: Spacing.xs },
});
