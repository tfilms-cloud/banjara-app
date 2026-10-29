import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import CreateTripScreen from '@/app/(provider)/transport/trips/create';
import { MessagesHeaderActions } from '@/components/chat/MessagesHeaderActions';
import { GuideDashboard } from '@/components/provider/GuideDashboard';
import { HospitalityDashboard } from '@/components/provider/HospitalityDashboard';
import { ProviderEarningsFeeCard } from '@/components/provider/ProviderEarningsFeeCard';
import { ProviderStatCard } from '@/components/provider/ProviderStatCard';
import { RestaurantDashboard } from '@/components/provider/RestaurantDashboard';
import { TourOperatorDashboard } from '@/components/provider/TourOperatorDashboard';
import { TripCapacityCard } from '@/components/provider/TripCapacityCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import {
  canOrganizeTripsFromList,
  isGuideService,
  isHotelService,
  isRestaurantService,
  isTourOperatorService,
} from '@/constants/providerOptions';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { useProviderStore } from '@/store/providerStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { pushPath } from '@/utils/navigation';
import { requireProviderPaymentAccounts } from '@/utils/requireProviderPaymentAccounts';
import { PaymentAccountsEmptyHero } from '@/components/provider/PaymentAccountsEmptyHero';
import { usePaymentAccountsGate } from '@/hooks/usePaymentAccountsGate';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= Math.round(rating) ? 'star' : 'star-outline'}
          size={14}
          color="#F5B83D"
        />
      ))}
    </View>
  );
}

export default function ProviderDashboardScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const {
    provider,
    stats,
    loading,
    error,
    bookings,
    earnings,
    reviews,
    trips,
    vehicles,
    rooms,
    services: catalogServices,
    loadProvider,
    loadProviderByUser,
    refreshDashboard,
  } = useProviderStore();
  const [checked, setChecked] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const {
    missingAccounts,
    checking: checkingPayments,
    ready: paymentsReady,
    recheck,
  } = usePaymentAccountsGate();

  const openCreateTrip = async () => {
    if (!(await requireProviderPaymentAccounts('create trips'))) return;
    setShowCreateForm(true);
  };

  useFocusEffect(
    useCallback(() => {
      let live = true;
      void (async () => {
        try {
          if (user?.providerId) await loadProvider(user.providerId);
          else if (user?.id) await loadProviderByUser(user.id);
          if (live) await recheck();
        } finally {
          if (live) setChecked(true);
        }
      })();
      return () => { live = false; };
    }, [user?.id, user?.providerId, loadProvider, loadProviderByUser, recheck]),
  );

  const hasOfferedService = useMemo(() => {
    if ((provider?.services?.length ?? 0) > 0) return true;
    if ((catalogServices?.length ?? 0) > 0) return true;
    if (provider?.hotel || provider?.transport || provider?.tour || provider?.restaurant) {
      return true;
    }
    if (provider?.guideDetails) return true;
    if (vehicles.length > 0 || rooms.length > 0 || trips.length > 0) return true;
    return false;
  }, [provider, catalogServices, vehicles.length, rooms.length, trips.length]);

  const effectiveServices =
    provider?.services?.length
      ? provider.services
      : catalogServices.map((s) => s.type);
  const isTransporter =
    canOrganizeTripsFromList(effectiveServices) ||
    Boolean(provider?.transport) ||
    vehicles.length > 0;
  const hasHotel =
    effectiveServices.some((s) => isHotelService(s)) || Boolean(provider?.hotel);
  const isGuide =
    effectiveServices.some((s) => isGuideService(s)) || Boolean(provider?.guideDetails);
  const isTourOperator =
    effectiveServices.some((s) => isTourOperatorService(s)) || Boolean(provider?.tour);
  const isRestaurant =
    effectiveServices.some((s) => isRestaurantService(s)) || Boolean(provider?.restaurant);

  const carRequests = useMemo(
    () =>
      bookings
        .filter(
          (item) =>
            item.kind === 'transport' &&
            (item.status === 'pending' || item.paymentStatus === 'pending'),
        )
        .slice(0, 6),
    [bookings],
  );

  const liveTrips = useMemo(() => {
    return trips
      .filter((trip) => trip.status !== 'cancelled')
      .sort((a, b) => {
        const rank = (status: string) =>
          status === 'active' ? 0 : status === 'upcoming' ? 1 : status === 'completed' ? 2 : 3;
        const byStatus = rank(a.status) - rank(b.status);
        if (byStatus !== 0) return byStatus;
        const aKey = `${a.departureDate} ${a.departureTime}`;
        const bKey = `${b.departureDate} ${b.departureTime}`;
        return aKey.localeCompare(bKey);
      });
  }, [trips]);

  const tripBookingStats = useMemo(() => {
    const statsMap = new Map<string, { bookingCount: number; pendingCount: number }>();
    for (const booking of bookings) {
      if (booking.kind !== 'transport') continue;
      if (booking.status === 'cancelled') continue;
      let tripId = booking.tripId;
      if (!tripId) {
        tripId = liveTrips.find(
          (trip) =>
            trip.origin === booking.origin &&
            trip.destination === booking.destination &&
            trip.departureDate === booking.date,
        )?.id;
      }
      if (!tripId) continue;
      const current = statsMap.get(tripId) ?? {
        bookingCount: 0,
        pendingCount: 0,
      };
      current.bookingCount += 1;
      if (booking.status === 'pending' || booking.paymentStatus === 'pending') {
        current.pendingCount += 1;
      }
      statsMap.set(tripId, current);
    }
    return statsMap;
  }, [bookings, liveTrips]);

  const seatTotals = useMemo(() => {
    const openTrips = liveTrips.filter(
      (t) => t.status === 'upcoming' || t.status === 'active',
    );
    const list = openTrips.length ? openTrips : liveTrips;
    const capacity = list.reduce((sum, t) => sum + t.totalSeats, 0);
    const booked = list.reduce((sum, t) => sum + t.bookedSeats, 0);
    const available = Math.max(0, capacity - booked);
    let bookingCount = 0;
    let pendingCount = 0;
    for (const trip of list) {
      const row = tripBookingStats.get(trip.id);
      bookingCount += row?.bookingCount ?? 0;
      pendingCount += row?.pendingCount ?? 0;
    }
    return {
      capacity,
      booked,
      available,
      bookingCount,
      pendingCount,
      tripCount: list.length,
    };
  }, [liveTrips, tripBookingStats]);

  const mostVisitedRoutes = useMemo(() => {
    if (earnings?.byRoute?.length) {
      return [...earnings.byRoute]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6)
        .map((item) => ({
          id: item.label,
          label: item.label,
          meta: formatCurrency(item.amount),
        }));
    }
    const counts = new Map<string, number>();
    for (const trip of trips) {
      const key = `${trip.origin} → ${trip.destination}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, count]) => ({
        id: label,
        label,
        meta: `${count} trip${count === 1 ? '' : 's'}`,
      }));
  }, [earnings?.byRoute, trips]);

  const recentReviews = useMemo(() => reviews.slice(0, 5), [reviews]);

  if (!checked || (loading && !provider)) {
    return <LoadingState title="Loading dashboard..." />;
  }

  // Payment status usually resolves in parallel; only briefly wait if still unknown
  if (!paymentsReady && checkingPayments) {
    return <LoadingState title="Checking payment accounts..." />;
  }

  if (!provider) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + Spacing.xl,
            padding: Spacing.lg,
            gap: Spacing.md,
          },
        ]}
      >
        <Text style={styles.heading}>{error ? 'Could not load your profile' : 'Provider profile missing'}</Text>
        <Text style={styles.sub}>{error || 'Your provider profile was not found. Retry or sign in again to refresh your account.'}</Text>
        <Button
          title="Retry"
          onPress={() => {
            if (user?.providerId) void loadProvider(user.providerId);
            else if (user?.id) void loadProviderByUser(user.id);
          }}
        />
        <Button title="Sign in again" variant="outline" onPress={async () => {
          await useAuthStore.getState().logout();
          router.replace('/(auth)/login');
        }} />
      </View>
    );
  }

  /** No receiving accounts yet — full setup hero (disappears after accounts are added). */
  if (missingAccounts) {
    return (
      <PaymentAccountsEmptyHero
        onAddAccount={() => pushPath('/(provider)/payment-accounts')}
        onRefresh={() => void recheck()}
        refreshing={checkingPayments}
      />
    );
  }

  if (!hasOfferedService) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + Spacing.xl,
            padding: Spacing.lg,
            gap: Spacing.md,
          },
        ]}
      >
        <Text style={styles.heading}>Add your service</Text>
        <Text style={styles.sub}>
          Payment accounts are ready. Add the one service you offer so travelers can find you.
        </Text>
        <Button
          title="Add your service"
          onPress={() => router.replace('/(provider)/register/services')}
        />
      </View>
    );
  }

  /** Hospitality dashboard */
  if (hasHotel && !isTransporter) {
    return (
      <HospitalityDashboard
        greeting={greeting()}
        provider={provider}
        userName={user?.name}
      />
    );
  }

  /** Hireable guide — experience profile only, no packages/trips */
  if (isGuide && !isTransporter) {
    return (
      <GuideDashboard
        greeting={greeting()}
        provider={provider!}
        userName={user?.name}
      />
    );
  }

  /** Tour operators — package capacity + bookings */
  if (isTourOperator && !isTransporter) {
    return (
      <TourOperatorDashboard
        greeting={greeting()}
        provider={provider}
        userName={user?.name}
      />
    );
  }

  /** Restaurants — dining partner with clear approval status */
  if (isRestaurant && !isTransporter) {
    return (
      <RestaurantDashboard
        greeting={greeting()}
        provider={provider!}
        userName={user?.name}
      />
    );
  }

  /** Other non-transporter providers */
  if (!isTransporter) {
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
              {greeting()},{' '}
              {provider?.ownerName?.split(' ')[0] ?? user?.name?.split(' ')[0] ?? 'Provider'}
            </Text>
            <Text style={styles.business}>{provider?.businessName ?? 'Banjara Provider'}</Text>
          </View>
          <MessagesHeaderActions
            messagesHref="/(provider)/messages"
            notificationsHref="/(provider)/notifications"
          />
        </View>
        <View style={styles.stats}>
          <ProviderStatCard label="Today's Bookings" value={String(stats?.todaysBookings ?? 0)} tone="blue" />
          <ProviderStatCard
            label="Today's Revenue"
            value={formatCurrency(stats?.todaysRevenue ?? 0)}
            tone="amber"
          />
          <ProviderStatCard label="Pending" value={String(stats?.pendingBookings ?? 0)} tone="navy" />
        </View>
        <ProviderEarningsFeeCard
          totalRevenue={earnings?.totalRevenue ?? 0}
          platformFees={earnings?.platformFees ?? 0}
          platformFeePercent={earnings?.platformFeePercent}
          netEarnings={earnings?.netEarnings}
        />
        <Button title="View bookings" onPress={() => pushPath('/(provider)/(tabs)/bookings')} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.lg,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.lg,
      }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshDashboard} />}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>
            {greeting()},{' '}
            {provider?.ownerName?.split(' ')[0] ?? user?.name?.split(' ')[0] ?? 'Driver'}
          </Text>
          <Text style={styles.business}>{provider?.businessName ?? 'Transporter'}</Text>
        </View>
        <MessagesHeaderActions
            messagesHref="/(provider)/messages"
            notificationsHref="/(provider)/notifications"
          />
      </View>

      {provider?.verificationStatus === 'approved' ? (
        <Badge label="✓ Verified transporter" tone="green" />
      ) : (
        <Badge
          label={`${provider?.verificationStatus ?? 'pending'} verification`}
          tone="amber"
        />
      )}

      <View style={styles.stats}>
        <ProviderStatCard
          label="Your trips"
          value={String(
            seatTotals.tripCount || liveTrips.length || stats?.todaysTrips || 0,
          )}
          tone="blue"
        />
        <ProviderStatCard
          label="Bookings"
          value={String(seatTotals.bookingCount)}
          tone="navy"
        />
        <ProviderStatCard
          label="Pending"
          value={String(seatTotals.pendingCount)}
          tone="amber"
        />
        <ProviderStatCard
          label="Available seats"
          value={String(seatTotals.available || stats?.availableSeats || 0)}
          tone="green"
        />
      </View>

      {/* Trip capacity analytics */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Your trips · seats & bookings</Text>
          <Pressable onPress={() => pushPath('/(provider)/(tabs)/bookings')}>
            <Text style={styles.link}>All bookings</Text>
          </Pressable>
        </View>
        <Text style={styles.sectionSub}>
          For every trip you published: capacity, bookings, pending requests, and seats still open.
        </Text>
        {liveTrips.length === 0 ? (
          <View style={{ gap: Spacing.md }}>
            <Text style={styles.sectionSub}>
              No trips yet. Create a trip below — then bookings and available seats show up here.
            </Text>
            <Button title="Create trip" onPress={() => void openCreateTrip()} />
          </View>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {liveTrips.slice(0, 10).map((trip) => {
              const vehicle = vehicles.find((v) => v.id === trip.vehicleId);
              const row = tripBookingStats.get(trip.id);
              return (
                <TripCapacityCard
                  key={trip.id}
                  trip={trip}
                  bookingCount={row?.bookingCount ?? 0}
                  pendingCount={row?.pendingCount ?? 0}
                  vehicleName={vehicle?.name}
                  onPress={() => pushPath('/(provider)/(tabs)/bookings')}
                />
              );
            })}
            {liveTrips.length > 10 ? (
              <Button
                title={`View all ${liveTrips.length} trips`}
                variant="ghost"
                onPress={() => pushPath('/(provider)/(tabs)/bookings')}
              />
            ) : null}
          </View>
        )}
      </View>

      {/* Trip capacity analytics */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Create trip</Text>
          <Pressable
            onPress={() =>
              void (async () => {
                if (showCreateForm) {
                  setShowCreateForm(false);
                  return;
                }
                await openCreateTrip();
              })()
            }
          >
            <Text style={styles.link}>{showCreateForm ? 'Hide' : 'Show'}</Text>
          </Pressable>
        </View>
        <Text style={styles.sectionSub}>
          Generate one-way trips for customers. Round trips are not available here.
        </Text>
        {showCreateForm ? (
          <CreateTripScreen
            embedded
            onPublished={() => {
              void refreshDashboard();
            }}
          />
        ) : (
          <Button title="Open create trip" onPress={() => setShowCreateForm(true)} />
        )}
      </View>

      {/* Trip capacity analytics */}
      <ProviderEarningsFeeCard
          totalRevenue={earnings?.totalRevenue ?? 0}
          platformFees={earnings?.platformFees ?? 0}
          platformFeePercent={earnings?.platformFeePercent}
          netEarnings={earnings?.netEarnings}
        />

      {/* Trip capacity analytics */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Pending booking requests</Text>
        <Text style={styles.sectionSub}>
          New trip bookings wait here until you approve or reject them.
        </Text>
        {carRequests.length === 0 ? (
          <Text style={styles.sectionSub}>No pending booking requests right now.</Text>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {carRequests.map((item) => (
              <Pressable
                key={item.id}
                style={styles.requestRow}
                onPress={() => pushPath(`/(provider)/booking/${item.id}`)}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.requestTitle} numberOfLines={1}>
                    {item.customerName}
                  </Text>
                  <Text style={styles.requestMeta} numberOfLines={1}>
                    {item.detailLabel || item.serviceLabel} · {item.date}
                  </Text>
                </View>
                <Badge label="Approve" tone="amber" />
              </Pressable>
            ))}
            <Button
              title="All bookings"
              variant="ghost"
              onPress={() => pushPath('/(provider)/(tabs)/bookings')}
            />
          </View>
        )}
      </View>

      {/* Trip capacity analytics */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Customer reviews</Text>
          <Pressable onPress={() => pushPath('/(provider)/reviews')}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>
        {recentReviews.length === 0 ? (
          <Text style={styles.sectionSub}>No reviews yet. They will appear here after trips.</Text>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {recentReviews.map((item) => (
              <View key={item.id} style={styles.reviewCard}>
                <View style={styles.reviewHead}>
                  <Text style={styles.requestTitle}>{item.customerName}</Text>
                  <Stars rating={item.rating} />
                </View>
                <Text style={styles.reviewBody} numberOfLines={3}>
                  {item.comment}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Trip capacity analytics */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Most visited routes</Text>
        <Text style={styles.sectionSub}>Corridors customers use most often on BANJARA</Text>
        {mostVisitedRoutes.length === 0 ? (
          <Text style={styles.sectionSub}>Routes will appear as customers travel.</Text>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {mostVisitedRoutes.map((route, index) => (
              <View key={route.id} style={styles.routeRow}>
                <View style={styles.routeRank}>
                  <Text style={styles.routeRankText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.requestTitle} numberOfLines={1}>
                    {route.label}
                  </Text>
                  <Text style={styles.requestMeta}>{route.meta}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  greeting: {
    fontFamily: Fonts.display,
    fontSize: 26,
    lineHeight: 36,
    letterSpacing: -0.4,
    color: Colors.dark,
    writingDirection: 'auto',
  },
  business: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 22,
    color: Colors.muted,
    marginTop: Spacing.xs,
  },
  heading: { ...Typography.h2, color: Colors.dark },
  sub: { ...Typography.body, color: Colors.muted },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.premium,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 21,
    lineHeight: 29,
    color: Colors.dark,
    flexShrink: 1,
  },
  sectionSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 21,
    color: Colors.muted,
  },
  link: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.primary,
  },
  lockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    backgroundColor: Colors.softDanger,
  },
  lockText: {
    flex: 1,
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.danger,
    lineHeight: 18,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  requestTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 23,
    color: Colors.dark,
    writingDirection: 'auto',
  },
  requestMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 20,
    color: Colors.muted,
    marginTop: Spacing.xs,
  },
  requestAmount: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.action,
  },
  reviewCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceSecondary,
    gap: Spacing.sm,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  reviewBody: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.dark,
    lineHeight: 24,
    writingDirection: 'auto',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  routeRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeRankText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.primary,
  },
});
