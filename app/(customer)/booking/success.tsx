import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing['3xl'] },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces
      >
        <Animated.View style={[styles.iconWrap, animatedStyle]}>
          <Ionicons name="time-outline" size={42} color={Colors.white} />
        </Animated.View>
        <Text style={styles.title}>Request submitted</Text>
        <Text style={styles.sub}>
          Your trip booking is pending. The service provider must approve it before seats are
          confirmed. You will get a notification when they respond.
        </Text>

        <View style={styles.card}>
          <Row label="Status" value="Awaiting provider approval" />
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
            title="View booking"
            onPress={() => router.replace('/(customer)/(tabs)/bookings')}
          />
          <Button
            title="Back home"
            variant="outline"
            onPress={() => router.replace('/(customer)/(tabs)')}
          />
        </View>
      </ScrollView>
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
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['3xl'],
    alignItems: 'center',
    flexGrow: 1,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.warning,
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
  upsellBody: {
    ...Typography.caption,
    color: Colors.muted,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  actions: { width: '100%', gap: Spacing.md, marginTop: Spacing['2xl'] },
});
