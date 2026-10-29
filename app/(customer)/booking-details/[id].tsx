import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookingStatusTimeline } from '@/components/booking/BookingStatusTimeline';
import { PickupMap } from '@/components/map/PickupMap';
import {
  mapTravelerFromPassenger,
  mapVehicleFromTrip,
} from '@/components/map/mapParties';
import { JourneyTypePanel } from '@/components/trip/JourneyTypePanel';
import { Badge } from '@/components/ui/Badge';
import { ActionGrid, type ActionItem } from '@/components/ui/ActionGrid';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Modal } from '@/components/ui/Modal';
import { Colors } from '@/constants/colors';
import { journeyTypeMeta } from '@/constants/journeyTypes';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useBooking } from '@/hooks/useBooking';
import { useLocation } from '@/hooks/useLocation';
import * as bookingService from '@/services/bookingService';
import * as tripService from '@/services/tripService';
import { useAuthStore } from '@/store/authStore';
import { useHotelStore } from '@/store/hotelStore';
import type { TripWithDetails } from '@/types/trip';
import {
  canOpenBookingPayment,
  openBookingPayment,
  paymentActionHint,
  paymentActionLabel,
} from '@/utils/continuePayment';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, toISODate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';
import { pushPath } from '@/utils/navigation';

export default function BookingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { booking, loading, error, setBooking } = useBooking(id);
  const { location, request } = useLocation();
  const user = useAuthStore((s) => s.user);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [trip, setTrip] = useState<TripWithDetails | null>(null);
  const setDestination = useHotelStore((s) => s.setDestination);
  const setCheckIn = useHotelStore((s) => s.setCheckIn);
  const setCheckOut = useHotelStore((s) => s.setCheckOut);

  useEffect(() => {
    void request();
  }, [request]);

  useEffect(() => {
    if (!booking?.tripId) return;
    void tripService.getTripById(booking.tripId).then(setTrip).catch(() => setTrip(null));
  }, [booking?.tripId]);

  if (loading) return <LoadingState title="Loading booking..." />;
  if (error || !booking) return <ErrorState message={error ?? 'Booking not found'} />;

  const pickup =
    trip?.pickupLocations.find((point) => point.id === booking.pickupPointId) ??
    trip?.pickupLocations[0];

  const onCancel = async () => {
    setCancelling(true);
    try {
      const updated = await bookingService.cancelBooking(booking.id);
      setBooking(updated);
      setConfirmCancel(false);
      Alert.alert('Cancelled', 'Your booking has been cancelled.');
    } finally {
      setCancelling(false);
    }
  };

  const onShare = async () => {
    const route = trip ? `${trip.from} → ${trip.to}` : 'Banjara trip';
    await Share.share({
      message: `My Banjara booking ${booking.bookingCode}\n${route}\n${formatDate(booking.date)}\nSeats: ${booking.seats.join(', ')}`,
    });
  };

  const onFindStay = () => {
    if (!trip) return;
    const checkIn = trip.date || booking.date;
    const out = new Date(checkIn);
    out.setDate(out.getDate() + 2);
    setDestination(trip.to);
    setCheckIn(checkIn);
    setCheckOut(toISODate(out));
    router.push('/(customer)/hotels/results');
  };

  return (
    <View style={styles.container}>
      <Header title="Booking Details" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 24,
          gap: Spacing.lg,
        }}
      >
        <View style={styles.card}>
          <View style={styles.top}>
            <Text style={styles.code}>{booking.bookingCode}</Text>
            <Badge
              label={booking.status}
              tone={
                booking.status === 'cancelled'
                  ? 'red'
                  : booking.status === 'completed'
                    ? 'green'
                    : 'blue'
              }
            />
          </View>
          <Text style={styles.route}>
            {trip ? `${trip.from} → ${trip.to}` : 'Trip'}
          </Text>
          <Text style={styles.meta}>{formatDate(booking.date)}</Text>
          <Text style={styles.meta}>
            {trip ? `${formatTime(trip.departureTime)} → ${formatTime(trip.arrivalTime)}` : ''}
          </Text>
          <Text style={styles.meta}>Seats: {booking.seats.join(', ')}</Text>
          <Text style={styles.meta}>Pickup: {pickup?.name ?? '—'}</Text>
          <Text style={styles.meta}>Provider: {trip?.agency.name ?? '—'}</Text>
          <Text style={styles.meta}>Vehicle: {trip?.vehicleName ?? '—'}</Text>
          {trip ? (
            <Text style={styles.meta}>
              Trip type: {journeyTypeMeta(trip.journeyType).label}
              {trip.journeyType === 'round_trip' && trip.returnDate
                ? ` · Return ${formatDate(trip.returnDate, false)}`
                : ''}
            </Text>
          ) : null}
          <Text style={styles.total}>
            {formatCurrency(booking.priceBreakdown.total)} · {booking.paymentStatus}
          </Text>
        </View>

        {trip ? (
          <JourneyTypePanel
            journeyType={trip.journeyType}
            from={trip.from}
            to={trip.to}
            returnDate={trip.returnDate}
            returnTime={trip.returnTime}
          />
        ) : null}

        <BookingStatusTimeline
          status={booking.status}
          paymentStatus={booking.paymentStatus}
          createdAt={booking.createdAt}
        />

        {canOpenBookingPayment(booking) && booking.paymentId ? (
          <View style={styles.payCard}>
            <Text style={styles.payTitle}>{paymentActionLabel(booking.paymentStatus)}</Text>
            <Text style={styles.payBody}>{paymentActionHint(booking.paymentStatus)}</Text>
            <Button
              title={paymentActionLabel(booking.paymentStatus)}
              onPress={() =>
                openBookingPayment({
                  paymentId: booking.paymentId!,
                  bookingId: booking.id,
                  method: booking.paymentMethod,
                })
              }
            />
          </View>
        ) : null}

        {pickup ? (
          <View style={styles.mapSection}>
            <Text style={styles.mapTitle}>Your pickup point</Text>
            <Text style={styles.mapSub}>
              {pickup.name} · tap Full for layers, directions, and pin details
            </Text>
            <PickupMap
              pickups={trip?.pickupLocations?.length ? trip.pickupLocations : [pickup]}
              selectedPickupId={pickup.id}
              focusPickupId={pickup.id}
              userLocation={location}
              traveler={mapTravelerFromPassenger(booking.passengerDetails, user)}
              vehicle={mapVehicleFromTrip(trip)}
              height={280}
              allowFullscreen
              showControls
              showSelectedCard
            />
          </View>
        ) : null}

        <Button title="View ticket" onPress={() => router.push(`/(customer)/ticket/${booking.id}`)} />
        <Button title="Share booking" variant="outline" onPress={() => void onShare()} />

        {trip ? (
          <View style={styles.upsell}>
            <Text style={styles.upsellTitle}>Need a stay in {trip.to}?</Text>
            <Text style={styles.upsellBody}>
              Bundle your trip with a mountain hotel near your drop-off.
            </Text>
            <Button title="Find hotels" variant="secondary" onPress={onFindStay} />
          </View>
        ) : null}

        {booking.status === 'completed' ||
        ((booking.paymentStatus === 'paid' || booking.paymentStatus === 'confirmed') &&
          booking.status !== 'cancelled') ? (
          <Button
            title="Rate payment & service"
            variant="outline"
            onPress={() => router.push(`/(customer)/rate/${booking.id}`)}
          />
        ) : null}

        <ActionGrid
          items={
            [
              booking.providerUserId
                ? {
                    key: 'message',
                    label: 'Message',
                    subtitle: 'Chat with provider',
                    icon: 'chatbubble-outline' as const,
                    tone: 'blue' as const,
                    onPress: () =>
                      pushPath(
                        `/(customer)/messages/${booking.providerUserId}?bookingId=${booking.id}`
                      ),
                  }
                : null,
              trip?.agency.phone
                ? {
                    key: 'call',
                    label: 'Call',
                    subtitle: 'Provider phone',
                    icon: 'call-outline' as const,
                    tone: 'green' as const,
                    onPress: () => Linking.openURL(`tel:${trip.agency.phone}`),
                  }
                : null,
              booking.status !== 'cancelled' && booking.status !== 'completed'
                ? {
                    key: 'cancel',
                    label: 'Cancel',
                    subtitle: 'Booking',
                    icon: 'close-circle-outline' as const,
                    tone: 'amber' as const,
                    onPress: () => setConfirmCancel(true),
                  }
                : null,
            ].filter(Boolean) as ActionItem[]
          }
        />
      </ScrollView>

      <Modal
        visible={confirmCancel}
        title="Cancel booking?"
        message="This will release your seats and update the booking status."
        confirmLabel={cancelling ? 'Cancelling...' : 'Yes, Cancel'}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={onCancel}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { ...Typography.h3, color: Colors.primary },
  route: { ...Typography.bodyBold, color: Colors.primary, marginTop: Spacing.sm },
  meta: { ...Typography.caption, color: Colors.muted },
  total: { ...Typography.bodyBold, color: Colors.secondary, marginTop: Spacing.sm },
  payCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  payTitle: { ...Typography.bodyBold, color: Colors.primary },
  payBody: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  mapSection: { gap: Spacing.sm },
  mapTitle: { ...Typography.h3, color: Colors.dark },
  mapSub: { ...Typography.caption, color: Colors.muted, marginBottom: Spacing.xs },
  upsell: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  upsellTitle: { ...Typography.bodyBold, color: Colors.primary },
  upsellBody: { ...Typography.caption, color: Colors.muted, lineHeight: 18, marginBottom: Spacing.sm },
});
