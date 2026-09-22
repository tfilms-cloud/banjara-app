import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ProviderStatCard } from '@/components/provider/ProviderStatCard';
import { MessagesHeaderActions } from '@/components/chat/MessagesHeaderActions';
import { ActionGrid, type ActionItem } from '@/components/ui/ActionGrid';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import { canOrganizeTripsFromList, isHotelService, isTransportService } from '@/constants/providerOptions';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { useProviderStore } from '@/store/providerStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { pushPath } from '@/utils/navigation';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function ProviderDashboardScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const {
    provider,
    stats,
    loading,
    loadProvider,
    loadProviderByUser,
    refreshDashboard,
  } = useProviderStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        if (user?.providerId) {
          await loadProvider(user.providerId);
        } else if (user?.id) {
          await loadProviderByUser(user.id);
        }
      } finally {
        if (live) setChecked(true);
      }
    })();
    return () => {
      live = false;
    };
  }, [user?.id, user?.providerId, loadProvider, loadProviderByUser]);

  if (!checked || (loading && !provider)) return <LoadingState title="Loading dashboard..." />;

  if (!provider?.services?.length) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + Spacing.xl, padding: Spacing.lg, gap: Spacing.md },
        ]}
      >
        <Text style={styles.heading}>Add your service</Text>
        <Text style={styles.sub}>
          Your account is ready. Add the one service you offer so travelers can find you. You can edit it later, but you cannot add a second service.
        </Text>
        <Button title="Add your service" onPress={() => router.replace('/(provider)/register/services')} />
      </View>
    );
  }

  const hasTransport = provider.services.some((s) => isTransportService(s) || s === 'carRental');
  const canCreateTrips = canOrganizeTripsFromList(provider?.services ?? []);
  const hasHotel = provider?.services.some((s) => isHotelService(s));

  const actions: ActionItem[] = [
    ...(hasTransport
      ? [
          {
            key: 'vehicle',
            label: 'Add vehicle',
            icon: 'bus-outline' as const,
            tone: 'blue' as const,
            onPress: () => pushPath('/(provider)/vehicles/add'),
          },
        ]
      : []),
    ...(canCreateTrips
      ? [
          {
            key: 'trip',
            label: 'Create trip',
            icon: 'map-outline' as const,
            tone: 'navy' as const,
            onPress: () => pushPath('/(provider)/transport/trips/create'),
          },
        ]
      : []),
    ...(hasHotel
      ? [
          {
            key: 'room',
            label: 'Add room',
            icon: 'bed-outline' as const,
            tone: 'green' as const,
            onPress: () => pushPath('/(provider)/rooms/add'),
          },
          {
            key: 'availability',
            label: 'Availability',
            icon: 'calendar-outline' as const,
            tone: 'amber' as const,
            onPress: () => pushPath('/(provider)/hotel/availability'),
          },
        ]
      : []),
    {
      key: 'bookings',
      label: 'Bookings',
      icon: 'ticket-outline',
      tone: 'blue',
      onPress: () => pushPath('/(provider)/(tabs)/bookings'),
    },
    {
      key: 'earnings',
      label: 'Earnings',
      icon: 'wallet-outline',
      tone: 'amber',
      onPress: () => pushPath('/(provider)/(tabs)/earnings'),
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.lg,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.lg,
      }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshDashboard} />}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>
            {greeting()}, {provider?.ownerName?.split(' ')[0] ?? user?.name?.split(' ')[0] ?? 'Provider'}
          </Text>
          <Text style={styles.business}>{provider?.businessName ?? 'Banjara Provider'}</Text>
        </View>
        <MessagesHeaderActions
          messagesHref="/(provider)/messages"
          notificationsHref="/(provider)/notifications"
        />
      </View>

      {provider?.verificationStatus === 'approved' ? (
        <Badge label="✓ Verified Provider" tone="green" />
      ) : (
        <Badge label={`${provider?.verificationStatus ?? 'pending'} verification`} tone="amber" />
      )}

      <View style={styles.stats}>
        <ProviderStatCard label="Today's Bookings" value={String(stats?.todaysBookings ?? 0)} tone="blue" />
        <ProviderStatCard
          label="Today's Revenue"
          value={formatCurrency(stats?.todaysRevenue ?? 0)}
          tone="amber"
        />
        <ProviderStatCard label="Pending" value={String(stats?.pendingBookings ?? 0)} tone="navy" />
        {canCreateTrips ? (
          <>
            <ProviderStatCard label="Today's Trips" value={String(stats?.todaysTrips ?? 0)} />
            <ProviderStatCard label="Available Seats" value={String(stats?.availableSeats ?? 0)} tone="green" />
            <ProviderStatCard label="Occupied Seats" value={String(stats?.occupiedSeats ?? 0)} />
          </>
        ) : null}
        {hasHotel ? (
          <>
            <ProviderStatCard label="Check-ins" value={String(stats?.todaysCheckIns ?? 0)} tone="green" />
            <ProviderStatCard label="Available Rooms" value={String(stats?.availableRooms ?? 0)} />
            <ProviderStatCard label="Occupied Rooms" value={String(stats?.occupiedRooms ?? 0)} tone="amber" />
          </>
        ) : null}
      </View>

      <Text style={styles.section}>Quick actions</Text>
      <ActionGrid items={actions} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  greeting: { ...Typography.h2, color: Colors.dark },
  business: { ...Typography.caption, color: Colors.muted },
  heading: { ...Typography.h2, color: Colors.dark },
  sub: { ...Typography.body, color: Colors.muted },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  section: { ...Typography.h3, color: Colors.dark },
});
