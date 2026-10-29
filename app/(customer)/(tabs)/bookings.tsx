import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookingCard } from '@/components/booking/BookingCard';
import { GuideBookingCard } from '@/components/booking/GuideBookingCard';
import { PackageBookingCard } from '@/components/booking/PackageBookingCard';
import { HotelBookingCard } from '@/components/hotels/HotelBookingCard';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
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

type Category = 'all' | 'transport' | 'hotels' | 'tours' | 'guides';
type StatusTab = 'upcoming' | 'completed' | 'cancelled';

type UnifiedItem =
  | { kind: 'transport'; data: Booking }
  | { kind: 'hotel'; data: HotelBooking }
  | { kind: 'tour'; data: PackageBooking }
  | { kind: 'guide'; data: GuideBooking };

function matchStatus(status: string, tab: StatusTab) {
  if (tab === 'upcoming') {
    return status === 'upcoming' || status === 'confirmed' || status === 'pending';
  }
  return status === tab;
}

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const { bookings, loading, error, refresh } = useBookings();
  const {
    bookings: hotelBookings,
    loading: hotelLoading,
    error: hotelError,
    refresh: refreshHotels,
  } = useHotelBookings();
  const [tourBookings, setTourBookings] = useState<PackageBooking[]>([]);
  const [tourLoading, setTourLoading] = useState(true);
  const [tourError, setTourError] = useState<string | null>(null);
  const [guideBookings, setGuideBookings] = useState<GuideBooking[]>([]);
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

  const transportBookings = useMemo(() => {
    if (status === 'upcoming') {
      return bookings.filter(
        (item) =>
          item.status === 'upcoming' ||
          item.status === 'confirmed' ||
          item.status === 'pending'
      );
    }
    return bookings.filter((item) => item.status === status);
  }, [bookings, status]);

  const items = useMemo(() => {
    const transport: UnifiedItem[] = (
      category === 'hotels' || category === 'tours' || category === 'guides'
        ? []
        : transportBookings
    ).map((data) => ({ kind: 'transport', data }));

    const hotels: UnifiedItem[] = (
      category === 'transport' || category === 'tours' || category === 'guides'
        ? []
        : hotelBookings.filter((item) => matchStatus(item.status, status))
    ).map((data) => ({ kind: 'hotel', data }));

    const tours: UnifiedItem[] = (
      category === 'transport' || category === 'hotels' || category === 'guides'
        ? []
        : tourBookings.filter((item) => matchStatus(item.status, status))
    ).map((data) => ({ kind: 'tour', data }));

    const guides: UnifiedItem[] = (
      category === 'transport' || category === 'hotels' || category === 'tours'
        ? []
        : guideBookings.filter((item) => matchStatus(item.status, status))
    ).map((data) => ({ kind: 'guide', data }));

    return [...transport, ...hotels, ...tours, ...guides].sort(
      (a, b) =>
        new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime()
    );
  }, [category, guideBookings, hotelBookings, status, tourBookings, transportBookings]);

  useEffect(() => {
    let cancelled = false;

    const tripIds = Array.from(
      new Set(
        items.filter((i) => i.kind === 'transport').map((i) => i.data.tripId).filter(Boolean)
      )
    );
    const hotelIds = Array.from(
      new Set(
        items
          .filter((i) => i.kind === 'hotel')
          .map((i) => (i.data as HotelBooking).hotelId)
          .filter(Boolean)
      )
    );
    const roomIds = Array.from(
      new Set(
        items
          .filter((i) => i.kind === 'hotel')
          .map((i) => (i.data as HotelBooking).roomId)
          .filter(Boolean)
      )
    );

    const missingTrips = tripIds.filter((id) => !(id in tripMap));
    const missingHotels = hotelIds.filter((id) => !(id in hotelMap));
    const missingRooms = roomIds.filter((id) => !(id in roomMap));
    if (!missingTrips.length && !missingHotels.length && !missingRooms.length) return;

    void (async () => {
      const [trips, hotels, rooms] = await Promise.all([
        Promise.all(
          missingTrips.map(async (id) => [id, await tripService.getTripById(id)] as const)
        ),
        Promise.all(
          missingHotels.map(async (id) => [id, await hotelService.getHotelById(id)] as const)
        ),
        Promise.all(
          missingRooms.map(async (id) => [id, await hotelService.getRoomById(id)] as const)
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

  const isLoading = loading || hotelLoading || tourLoading || guideLoading;
  const combinedError = error || hotelError || tourError || guideError;

  const refreshAll = () => {
    void refresh();
    void refreshHotels();
    void refreshTours();
    void refreshGuides();
  };

  if (!isLoading && combinedError && items.length === 0) {
    return <ErrorState message={combinedError} onRetry={refreshAll} />;
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title="Bookings" />

      <View style={styles.content}>
        <View style={styles.segment}>
          {(
            [
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'completed', label: 'Completed' },
              { key: 'cancelled', label: 'Cancelled' },
            ] as const
          ).map((item) => (
            <Pressable
              key={item.key}
              style={[styles.segmentItem, status === item.key && styles.segmentItemActive]}
              onPress={() => setStatus(item.key)}
            >
              <Text
                style={[
                  styles.segmentText,
                  status === item.key && styles.segmentTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.chips}>
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'transport', label: 'Transport' },
              { key: 'hotels', label: 'Hotels' },
              { key: 'tours', label: 'Tours' },
              { key: 'guides', label: 'Guides' },
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

        {isLoading ? (
          <LoadingState title="Loading bookings..." />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => `${item.kind}-${item.data.id}`}
            contentContainerStyle={{
              paddingBottom: insets.bottom + 24,
              gap: Spacing.md,
              flexGrow: 1,
            }}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refreshAll} />
            }
            ListEmptyComponent={
              <EmptyState
                title="No bookings yet"
                message="Your transport, hotel, tour, and guide bookings will appear here."
                icon="ticket-outline"
              />
            }
            renderItem={({ item }) => {
              if (item.kind === 'transport') {
                return (
                  <BookingCard
                    booking={item.data}
                    trip={tripMap[item.data.tripId] ?? null}
                    onPress={() => router.push(`/(customer)/booking-details/${item.data.id}`)}
                    onViewTicket={() => router.push(`/(customer)/ticket/${item.data.id}`)}
                  />
                );
              }
              if (item.kind === 'tour') {
                return (
                  <PackageBookingCard
                    booking={item.data}
                    onPress={() => pushPath(`/(customer)/agency/${item.data.providerId}`)}
                  />
                );
              }
              if (item.kind === 'guide') {
                return (
                  <GuideBookingCard
                    booking={item.data}
                    onPress={() => pushPath(`/(customer)/guides/${item.data.providerId}`)}
                  />
                );
              }
              return (
                <HotelBookingCard
                  booking={item.data}
                  hotel={hotelMap[item.data.hotelId] ?? undefined}
                  room={roomMap[item.data.roomId] ?? undefined}
                  onPress={() =>
                    pushPath(`/(customer)/hotels/booking-details/${item.data.id}`)
                  }
                />
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screen,
    gap: Spacing.md,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  segmentItemActive: { backgroundColor: Colors.action },
  segmentText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.muted,
  },
  segmentTextActive: { color: Colors.white },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.actionSoft,
    borderColor: Colors.action,
  },
  chipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.muted,
  },
  chipTextActive: { color: Colors.action },
});
