import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessagesHeaderActions } from '@/components/chat/MessagesHeaderActions';
import { ProviderEarningsFeeCard } from '@/components/provider/ProviderEarningsFeeCard';
import { ProviderStatCard } from '@/components/provider/ProviderStatCard';
import { TourCapacityCard } from '@/components/provider/TourCapacityCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import * as tourItineraryService from '@/services/tourItineraryService';
import { useProviderStore } from '@/store/providerStore';
import type { Provider } from '@/types/provider';
import type { TourItinerary } from '@/types/tourItinerary';
import { formatCurrency } from '@/utils/formatCurrency';
import { pushPath } from '@/utils/navigation';

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

export function TourOperatorDashboard({
  greeting,
  provider,
  userName,
}: {
  greeting: string;
  provider: Provider;
  userName?: string;
}) {
  const insets = useSafeAreaInsets();
  const { stats, loading, bookings, earnings, reviews, refreshDashboard } = useProviderStore();
  const [packages, setPackages] = useState<TourItinerary[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  const loadPackages = useCallback(async () => {
    setLoadingPackages(true);
    try {
      setPackages(await tourItineraryService.listMine());
    } catch {
      setPackages([]);
    } finally {
      setLoadingPackages(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void useProviderStore.getState().refreshDashboard();
      void loadPackages();
    }, [loadPackages])
  );

  const packageStats = useMemo(() => {
    const byId = new Map<
      string,
      { bookingCount: number; pendingCount: number; travelers: number }
    >();

    for (const booking of bookings) {
      if (booking.kind !== 'tour') continue;
      if (booking.status === 'cancelled') continue;
      const key =
        booking.itineraryId ||
        packages.find(
          (item) =>
            item.title === booking.detailLabel ||
            item.destination === booking.destination
        )?.id;
      if (!key) continue;
      const current = byId.get(key) ?? { bookingCount: 0, pendingCount: 0, travelers: 0 };
      current.bookingCount += 1;
      if (booking.status === 'pending' || booking.paymentStatus === 'pending') {
        current.pendingCount += 1;
      }
      current.travelers += Math.max(1, booking.passengerCount || booking.guestsCount || 1);
      byId.set(key, current);
    }
    return byId;
  }, [bookings, packages]);

  const totals = useMemo(() => {
    let bookingsCount = 0;
    let pending = 0;
    let travelers = 0;
    let capacity = 0;
    for (const item of packages) {
      capacity += item.maxParticipants;
      const row = packageStats.get(item.id);
      if (!row) continue;
      bookingsCount += row.bookingCount;
      pending += row.pendingCount;
      travelers += row.travelers;
    }
    return {
      packages: packages.length,
      bookingsCount,
      pending,
      travelers,
      available: Math.max(0, capacity - travelers),
      capacity,
    };
  }, [packageStats, packages]);

  const tourRequests = useMemo(
    () =>
      bookings
        .filter(
          (b) =>
            b.kind === 'tour' &&
            (b.status === 'pending' || b.paymentStatus === 'pending')
        )
        .slice(0, 6),
    [bookings]
  );

  const recentReviews = useMemo(() => reviews.slice(0, 5), [reviews]);
  const refreshing = loading || loadingPackages;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.lg,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.lg,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void refreshDashboard();
            void loadPackages();
          }}
        />
      }
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>
            {greeting}, {provider.ownerName?.split(' ')[0] ?? userName?.split(' ')[0] ?? 'Operator'}
          </Text>
          <Text style={styles.business}>
            {provider.tour?.tourName || provider.businessName || 'Tour operator'}
          </Text>
        </View>
        <MessagesHeaderActions
          messagesHref="/(provider)/messages"
          notificationsHref="/(provider)/notifications"
        />
      </View>

      {provider.verificationStatus === 'approved' ? (
        <Badge label="✓ Verified tour operator" tone="green" />
      ) : (
        <Badge label={`${provider.verificationStatus ?? 'pending'} verification`} tone="amber" />
      )}

      <View style={styles.stats}>
        <ProviderStatCard label="Packages" value={String(totals.packages)} tone="blue" />
        <ProviderStatCard label="Bookings" value={String(totals.bookingsCount)} tone="navy" />
        <ProviderStatCard label="Pending" value={String(totals.pending)} tone="amber" />
        <ProviderStatCard label="Open spots" value={String(totals.available)} tone="green" />
      </View>

      <ProviderEarningsFeeCard
        totalRevenue={earnings?.totalRevenue ?? 0}
        platformFees={earnings?.platformFees ?? 0}
        platformFeePercent={earnings?.platformFeePercent}
        netEarnings={earnings?.netEarnings}
      />

      <View style={styles.sectionCard}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Your tours & packages</Text>
          <Pressable onPress={() => pushPath('/(provider)/itineraries')}>
            <Text style={styles.link}>Manage</Text>
          </Pressable>
        </View>
        <Text style={styles.sectionSub}>
          Capacity, bookings, pending requests, and open spots for each package you added.
        </Text>

        {packages.length === 0 ? (
          <View style={{ gap: Spacing.md }}>
            <Text style={styles.sectionSub}>
              No packages yet. Add a trek, expedition, or summit itinerary to track bookings here.
            </Text>
            <Button title="Add package" onPress={() => pushPath('/(provider)/itineraries/add')} />
          </View>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {packages.map((item) => {
              const row = packageStats.get(item.id) ?? {
                bookingCount: 0,
                pendingCount: 0,
                travelers: 0,
              };
              return (
                <TourCapacityCard
                  key={item.id}
                  packageItem={item}
                  bookingCount={row.bookingCount}
                  pendingCount={row.pendingCount}
                  travelersBooked={row.travelers}
                  onPress={() => pushPath(`/(provider)/itineraries/add?id=${item.id}`)}
                />
              );
            })}
            <Button
              title="Add another package"
              variant="outline"
              onPress={() => pushPath('/(provider)/itineraries/add')}
            />
          </View>
        )}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Pending bookings</Text>
          <Pressable onPress={() => pushPath('/(provider)/(tabs)/bookings')}>
            <Text style={styles.link}>All bookings</Text>
          </Pressable>
        </View>
        {tourRequests.length === 0 ? (
          <Text style={styles.sectionSub}>No pending tour bookings right now.</Text>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {tourRequests.map((item) => (
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
                    {item.detailLabel} · {item.seatsOrRoom} · {item.date}
                  </Text>
                </View>
                <Text style={styles.requestAmount}>{formatCurrency(item.amount)}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Customer reviews</Text>
          <Pressable onPress={() => pushPath('/(provider)/reviews')}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>
        {recentReviews.length === 0 ? (
          <Text style={styles.sectionSub}>No reviews yet.</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  greeting: { ...Typography.h2, color: Colors.dark },
  business: { ...Typography.caption, color: Colors.muted },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontFamily: Fonts.display, fontSize: 18, color: Colors.dark },
  sectionSub: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  link: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.primary },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  requestTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.dark },
  requestMeta: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted, marginTop: 2 },
  requestAmount: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.primary },
  reviewCard: {
    padding: Spacing.md,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceSecondary,
    gap: 6,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  reviewBody: { fontFamily: Fonts.body, fontSize: 13, color: Colors.dark, lineHeight: 18 },
});
