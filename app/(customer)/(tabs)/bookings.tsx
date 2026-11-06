import { useBackendState, useBackendEffect as useEffect } from '@/hooks/useBackendData';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookingCard } from '@/components/booking/BookingCard';
import { GuideBookingCard } from '@/components/booking/GuideBookingCard';
import { PackageBookingCard } from '@/components/booking/PackageBookingCard';
import { HotelBookingCard } from '@/components/hotels/HotelBookingCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { useBookings } from '@/hooks/useBooking';
import { useHotelBookings } from '@/hooks/useHotels';
import * as hotelService from '@/services/hotelService';
import * as guideBookingService from '@/services/guideBookingService';
import * as tourBookingService from '@/services/tourBookingService';
import * as tripService from '@/services/tripService';
import type { Booking } from '@/types/booking';
import type { Hotel, HotelBooking, HotelRoom } from '@/types/hotel';
import type { GuideBooking } from '@/types/guideBooking';
import type { PackageBooking } from '@/types/tourBooking';
import type { TripWithDetails } from '@/types/trip';
import { pushPath } from '@/utils/navigation';

import { TravelDesignProvider } from '@/components/ui/TravelDesignProvider';
import { BookingHelp, TravelBookingsLayout } from '@/components/booking/BookingsPresentation';
import { useHomeDesign } from '@/constants/homeDesign';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import {
  bookingMatchesQuery,
  filterBookingItems,
  matchesBookingStatus,
  type BookingCategory as Category,
  type BookingStatusTab as StatusTab,
  type UnifiedBookingItem,
} from '@/utils/bookingPresentation';

export default function BookingsScreen() {
  return (
    <TravelDesignProvider>
      <BookingsContent />
    </TravelDesignProvider>
  );
}
function BookingsContent() {
  const theme = useHomeDesign();
  const user = useAuthStore((state) => state.user);
  const notifications = useUserStore((state) => state.notifications);
  const [searchVisible, setSearchVisible] = useState(false);
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();
  const { bookings, loading, error, refresh } = useBookings();
  const {
    bookings: hotelBookings,
    loading: hotelLoading,
    error: hotelError,
    refresh: refreshHotels,
  } = useHotelBookings();
  const [tourBookings, setTourBookings] = useBackendState<PackageBooking[]>([]);
  const [tourLoading, setTourLoading] = useState(true);
  const [tourError, setTourError] = useState<string | null>(null);
  const [guideBookings, setGuideBookings] = useBackendState<GuideBooking[]>([]);
  const [guideLoading, setGuideLoading] = useState(true);
  const [guideError, setGuideError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>('all');
  const [status, setStatus] = useState<StatusTab>('upcoming');
  const [tripMap, setTripMap] = useState<Record<string, TripWithDetails | null>>({});
  const [hotelMap, setHotelMap] = useState<Record<string, Hotel | null>>({});
  const [roomMap, setRoomMap] = useState<Record<string, HotelRoom | null>>({});

  const refreshTours = useCallback(async () => {
    setTourLoading(true);
    setTourError(null);
    try {
      setTourBookings(await tourBookingService.getPackageBookings());
    } catch (err) {
      setTourError(err instanceof Error ? err.message : 'Failed to load tour bookings');
      setTourBookings([]);
    } finally {
      setTourLoading(false);
    }
  }, []);

  const refreshGuides = useCallback(async () => {
    setGuideLoading(true);
    setGuideError(null);
    try {
      setGuideBookings(await guideBookingService.getGuideBookings());
    } catch (err) {
      setGuideError(err instanceof Error ? err.message : 'Failed to load guide bookings');
      setGuideBookings([]);
    } finally {
      setGuideLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshTours();
    void refreshGuides();
  }, [refreshTours, refreshGuides]);

  const allItems = useMemo<UnifiedBookingItem[]>(
    () => [
      ...bookings.map((data) => ({ kind: 'transport' as const, data })),
      ...hotelBookings.map((data) => ({ kind: 'hotel' as const, data })),
      ...tourBookings.map((data) => ({ kind: 'tour' as const, data })),
      ...guideBookings.map((data) => ({ kind: 'guide' as const, data })),
    ],
    [bookings, hotelBookings, tourBookings, guideBookings],
  );
  const items = useMemo(
    () => filterBookingItems(allItems, category, status),
    [allItems, category, status],
  );

  useEffect(() => {
    let cancelled = false;

    const tripIds = Array.from(
      new Set(
        items
          .filter((i) => i.kind === 'transport')
          .map((i) => i.data.tripId)
          .filter(Boolean),
      ),
    );
    const hotelIds = Array.from(
      new Set(
        items
          .filter((i) => i.kind === 'hotel')
          .map((i) => (i.data as HotelBooking).hotelId)
          .filter(Boolean),
      ),
    );
    const roomIds = Array.from(
      new Set(
        items
          .filter((i) => i.kind === 'hotel')
          .map((i) => (i.data as HotelBooking).roomId)
          .filter(Boolean),
      ),
    );

    const missingTrips = tripIds.filter((id) => !(id in tripMap));
    const missingHotels = hotelIds.filter((id) => !(id in hotelMap));
    const missingRooms = roomIds.filter((id) => !(id in roomMap));
    if (!missingTrips.length && !missingHotels.length && !missingRooms.length) return;

    void (async () => {
      const [trips, hotels, rooms] = await Promise.all([
        Promise.all(
          missingTrips.map(async (id) => [id, await tripService.getTripById(id)] as const),
        ),
        Promise.all(
          missingHotels.map(async (id) => [id, await hotelService.getHotelById(id)] as const),
        ),
        Promise.all(
          missingRooms.map(async (id) => [id, await hotelService.getRoomById(id)] as const),
        ),
      ]);
      if (cancelled) return;
      if (trips.length) {
        setTripMap((prev) => ({ ...prev, ...Object.fromEntries(trips) }));
      }
      if (hotels.length) {
        setHotelMap((prev) => ({ ...prev, ...Object.fromEntries(hotels) }));
      }
      if (rooms.length) {
        setRoomMap((prev) => ({ ...prev, ...Object.fromEntries(rooms) }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items, tripMap, hotelMap, roomMap]);

  const visibleItems = useMemo(
    () =>
      items.filter((item) =>
        bookingMatchesQuery(item, query, {
          trip: item.kind === 'transport' ? tripMap[item.data.tripId] : undefined,
          hotel: item.kind === 'hotel' ? hotelMap[item.data.hotelId] : undefined,
          room: item.kind === 'hotel' ? roomMap[item.data.roomId] : undefined,
        }),
      ),
    [items, query, tripMap, hotelMap, roomMap],
  );
  const activeCount = allItems.filter((item) =>
    matchesBookingStatus(item.data.status, 'upcoming'),
  ).length;
  const isLoading =
    category === 'all'
      ? loading || hotelLoading || tourLoading || guideLoading
      : category === 'transport'
        ? loading
        : category === 'hotels'
          ? hotelLoading
          : category === 'tours'
            ? tourLoading
            : guideLoading;
  const combinedError =
    category === 'all'
      ? error || hotelError || tourError || guideError
      : category === 'transport'
        ? error
        : category === 'hotels'
          ? hotelError
          : category === 'tours'
            ? tourError
            : guideError;
  const refreshAll = () => {
    void refresh();
    void refreshHotels();
    void refreshTours();
    void refreshGuides();
  };
  return (
    <TravelBookingsLayout
      status={status}
      onStatus={setStatus}
      category={category}
      onCategory={setCategory}
      count={user ? visibleItems.length : 0}
      activeCount={user ? activeCount : 0}
      query={query}
      onQuery={setQuery}
      searchVisible={searchVisible}
      onSearch={() => {
        setSearchVisible((visible) => !visible);
        setQuery('');
      }}
      userName={user?.name}
      userAvatar={user?.avatar}
      unread={notifications.some((item) => !item.read)}
      onNotifications={() => pushPath('/(customer)/(tabs)/notifications')}
      onProfile={() => pushPath('/(customer)/(tabs)/profile')}
    >
      <FlatList
        data={user ? visibleItems : []}
        keyExtractor={(item) => `${item.kind}-${item.data.id}`}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 24,
          gap: 12,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && allItems.length > 0}
            onRefresh={refreshAll}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListHeaderComponent={
          combinedError && allItems.length ? (
            <Text style={[styles.notice, { color: theme.muted, backgroundColor: theme.field }]}>
              Some bookings could not refresh. Pull down to try again.
            </Text>
          ) : undefined
        }
        ListEmptyComponent={
          !user ? (
            <EmptyState
              title="Sign in to view bookings"
              message="Your transport, hotel, tour, and guide reservations will appear here."
              icon="ticket-outline"
              actionLabel="Sign in"
              onAction={() => pushPath('/(auth)/login')}
            />
          ) : isLoading ? (
            <LoadingState title="Loading bookings…" />
          ) : combinedError ? (
            <ErrorState message={combinedError} onRetry={refreshAll} />
          ) : (
            <EmptyState
              title={
                query.trim()
                  ? 'No matching bookings'
                  : status === 'upcoming'
                    ? 'No upcoming bookings'
                    : `No ${status} bookings`
              }
              message={
                query.trim()
                  ? 'Try a provider, destination, or booking code.'
                  : 'Your reservations will appear here when they match this status and service.'
              }
              icon="ticket-outline"
            />
          )
        }
        ListFooterComponent={<BookingHelp onPress={() => pushPath('/(customer)/settings')} />}
        renderItem={({ item }) => {
          if (item.kind === 'transport')
            return (
              <BookingCard
                booking={item.data}
                trip={tripMap[item.data.tripId] ?? null}
                onPress={() => router.push(`/(customer)/booking-details/${item.data.id}`)}
                onViewTicket={() => router.push(`/(customer)/ticket/${item.data.id}`)}
              />
            );
          if (item.kind === 'tour')
            return (
              <PackageBookingCard
                booking={item.data}
                onPress={() => pushPath(`/(customer)/agency/${item.data.providerId}`)}
              />
            );
          if (item.kind === 'guide')
            return (
              <GuideBookingCard
                booking={item.data}
                onPress={() => pushPath(`/(customer)/guides/${item.data.providerId}`)}
                onMessage={
                  item.data.providerUserId
                    ? () =>
                        pushPath(
                          `/(customer)/messages/${item.data.providerUserId}?bookingId=${item.data.id}`,
                        )
                    : undefined
                }
              />
            );
          return (
            <HotelBookingCard
              booking={item.data}
              hotel={hotelMap[item.data.hotelId] ?? undefined}
              room={roomMap[item.data.roomId] ?? undefined}
              onPress={() => pushPath(`/(customer)/hotels/booking-details/${item.data.id}`)}
            />
          );
        }}
      />
    </TravelBookingsLayout>
  );
}
const styles = StyleSheet.create({
  notice: { padding: 12, borderRadius: 16, fontSize: 12, lineHeight: 18 },
});
