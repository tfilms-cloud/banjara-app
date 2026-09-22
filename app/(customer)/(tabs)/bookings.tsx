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
import { HotelBookingCard } from '@/components/hotels/HotelBookingCard';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { useBookings } from '@/hooks/useBooking';
import { useHotelBookings } from '@/hooks/useHotels';
import * as hotelService from '@/services/hotelService';
import * as tripService from '@/services/tripService';
import type { Booking } from '@/types/booking';
import type { Hotel, HotelBooking, HotelRoom } from '@/types/hotel';
import type { TripWithDetails } from '@/types/trip';
import { pushPath } from '@/utils/navigation';

type Category = 'all' | 'transport' | 'hotels';
type StatusTab = 'upcoming' | 'completed' | 'cancelled';

type UnifiedItem =
  | { kind: 'transport'; data: Booking }
  | { kind: 'hotel'; data: HotelBooking };

function matchStatus(status: string, tab: StatusTab) {
  if (tab === 'upcoming') return status === 'upcoming' || status === 'confirmed';
  return status === tab;
}

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const { loading, error, refresh, byStatus } = useBookings();
  const {
    bookings: hotelBookings,
    loading: hotelLoading,
    error: hotelError,
    refresh: refreshHotels,
  } = useHotelBookings();
  const [category, setCategory] = useState<Category>('all');
  const [status, setStatus] = useState<StatusTab>('upcoming');
  const [tripMap, setTripMap] = useState<Record<string, TripWithDetails | null>>({});
  const [hotelMap, setHotelMap] = useState<Record<string, Hotel | null>>({});
  const [roomMap, setRoomMap] = useState<Record<string, HotelRoom | null>>({});

  const items = useMemo(() => {
    const transport: UnifiedItem[] = (
      category === 'hotels' ? [] : byStatus(status)
    ).map((data) => ({ kind: 'transport', data }));

    const hotels: UnifiedItem[] = (
      category === 'transport'
        ? []
        : hotelBookings.filter((item) => matchStatus(item.status, status))
    ).map((data) => ({ kind: 'hotel', data }));

    return [...transport, ...hotels].sort(
      (a, b) =>
        new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime()
    );
  }, [byStatus, category, hotelBookings, status]);

  const loadRelated = useCallback(async () => {
    const tripIds = Array.from(
      new Set(items.filter((i) => i.kind === 'transport').map((i) => i.data.tripId))
    );
    const hotelIds = Array.from(
      new Set(items.filter((i) => i.kind === 'hotel').map((i) => (i.data as HotelBooking).hotelId))
    );
    const roomIds = Array.from(
      new Set(items.filter((i) => i.kind === 'hotel').map((i) => (i.data as HotelBooking).roomId))
    );

    const [trips, hotels, rooms] = await Promise.all([
      Promise.all(tripIds.map(async (id) => [id, await tripService.getTripById(id)] as const)),
      Promise.all(hotelIds.map(async (id) => [id, await hotelService.getHotelById(id)] as const)),
      Promise.all(roomIds.map(async (id) => [id, await hotelService.getRoomById(id)] as const)),
    ]);

    setTripMap(Object.fromEntries(trips));
    setHotelMap(Object.fromEntries(hotels));
    setRoomMap(Object.fromEntries(rooms));
  }, [items]);

  useEffect(() => {
    void loadRelated();
  }, [loadRelated]);

  const isLoading = loading || hotelLoading;
  const combinedError = error || hotelError;

  if (!isLoading && combinedError && items.length === 0) {
    return (
      <ErrorState
        message={combinedError}
        onRetry={() => {
          void refresh();
          void refreshHotels();
        }}
      />
    );
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
              <RefreshControl
                refreshing={isLoading}
                onRefresh={() => {
                  void refresh();
                  void refreshHotels();
                }}
              />
            }
            ListEmptyComponent={
              <EmptyState
                title="No bookings yet"
                message="Your transport and hotel bookings will appear here."
                icon="ticket-outline"
              />
            }
            renderItem={({ item }) =>
              item.kind === 'transport' ? (
                <BookingCard
                  booking={item.data}
                  trip={tripMap[item.data.tripId] ?? null}
                  onPress={() => router.push(`/(customer)/booking-details/${item.data.id}`)}
                  onViewTicket={() => router.push(`/(customer)/ticket/${item.data.id}`)}
                />
              ) : (
                <HotelBookingCard
                  booking={item.data}
                  hotel={hotelMap[item.data.hotelId] ?? undefined}
                  room={roomMap[item.data.roomId] ?? undefined}
                  onPress={() =>
                    pushPath(`/(customer)/hotels/booking-details/${item.data.id}`)
                  }
                />
              )
            }
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
  chips: { flexDirection: 'row', gap: Spacing.sm },
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
