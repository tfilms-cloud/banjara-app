import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useBookingStore } from '@/store/bookingStore';
import { useHotelStore } from '@/store/hotelStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, toISODate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';

export default function BookingSuccessScreen() {
  const insets = useSafeAreaInsets();
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  const lastBooking = useBookingStore((state) => state.lastBooking);
  const selectedTrip = useBookingStore((state) => state.selectedTrip);
  const selectedPickup = useBookingStore((state) => state.selectedPickup);
  const selectedSeats = useBookingStore((state) => state.selectedSeats);
  const setDestination = useHotelStore((s) => s.setDestination);
  const setCheckIn = useHotelStore((s) => s.setCheckIn);
  const setCheckOut = useHotelStore((s) => s.setCheckOut);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12 });
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const booking = lastBooking;
  const id = bookingId ?? booking?.id;

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing['3xl'], paddingBottom: insets.bottom + Spacing['2xl'] }]}>
      <Animated.View style={[styles.iconWrap, animatedStyle]}>
        <Ionicons name="checkmark" size={42} color={Colors.white} />
      </Animated.View>
      <Text style={styles.title}>Booking confirmed</Text>
      <Text style={styles.sub}>
        {selectedTrip?.journeyType === 'round_trip'
          ? 'Your return trip is confirmed. Show your digital ticket at boarding.'
          : 'Your ride is confirmed. Show your digital ticket at boarding.'}
      </Text>

      <View style={styles.card}>
        <Row label="Booking ID" value={booking?.bookingCode ?? id ?? '—'} />
        <Row
          label={selectedTrip?.journeyType === 'round_trip' ? 'Trip' : 'Ride'}
          value={selectedTrip ? `${selectedTrip.from} → ${selectedTrip.to}` : '—'}
        />
        <Row label="Date" value={selectedTrip ? formatDate(selectedTrip.date) : '—'} />
        <Row
          label="Time"
          value={selectedTrip ? formatTime(selectedTrip.departureTime) : '—'}
        />
        <Row label="Seat" value={selectedSeats.join(', ') || booking?.seats.join(', ') || '—'} />
        <Row label="Pickup" value={selectedPickup?.name ?? '—'} />
        <Row
          label="Amount"
          value={
            booking
              ? formatCurrency(booking.priceBreakdown.total, booking.priceBreakdown.currency)
              : '—'
          }
        />
      </View>

      {selectedTrip ? (
        <View style={styles.upsell}>
          <Text style={styles.upsellTitle}>Services where you arrive · {selectedTrip.to}</Text>
          <Text style={styles.upsellBody}>
            Transport gets you there. Add a hotel stay near your drop-off — more local services
            coming later on BANJARA.
          </Text>
          <Button
            title="Browse hotels"
            variant="secondary"
            onPress={() => {
              const checkIn = selectedTrip.date;
              const out = new Date(checkIn);
              out.setDate(out.getDate() + 2);
              setDestination(selectedTrip.to);
              setCheckIn(checkIn);
              setCheckOut(toISODate(out));
              router.push('/(customer)/hotels/results');
            }}
          />
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="View ticket"
          onPress={() => router.replace(`/(customer)/ticket/${id}`)}
          disabled={!id}
        />
        <Button
          title="View booking"
          variant="outline"
          onPress={() => router.replace('/(customer)/(tabs)/bookings')}
        />
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: { ...Typography.h1, color: Colors.dark, textAlign: 'center' },
  sub: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing['2xl'],
    lineHeight: 22,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  label: { ...Typography.caption, color: Colors.muted },
  value: { ...Typography.bodyBold, color: Colors.dark, flexShrink: 1, textAlign: 'right' },
  upsell: {
    width: '100%',
    marginTop: Spacing.lg,
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  upsellTitle: { ...Typography.bodyBold, color: Colors.primary },
  upsellBody: { ...Typography.caption, color: Colors.muted, lineHeight: 18, marginBottom: Spacing.sm },
  actions: { width: '100%', gap: Spacing.md, marginTop: 'auto' },
});
