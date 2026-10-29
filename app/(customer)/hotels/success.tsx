import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useHotelStore } from '@/store/hotelStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { replacePath } from '@/utils/navigation';

export default function HotelSuccessScreen() {
  const insets = useSafeAreaInsets();
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  const lastBooking = useHotelStore((state) => state.lastBooking);
  const selectedHotel = useHotelStore((state) => state.selectedHotel);
  const selectedRoom = useHotelStore((state) => state.selectedRoom);
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
          Your hotel booking is pending. The lodging provider must approve it before the stay is
          confirmed.
        </Text>

        <View style={styles.card}>
          <Row label="Status" value="Awaiting provider approval" />
          <Row label="Booking ID" value={booking?.bookingCode ?? id ?? '—'} />
          <Row label="Hotel" value={selectedHotel?.name ?? '—'} />
          <Row label="Room" value={selectedRoom?.name ?? '—'} />
          <Row label="Guest" value={booking?.guest.name ?? '—'} />
          <Row label="Check-in" value={booking ? formatDate(booking.checkIn) : '—'} />
          <Row label="Check-out" value={booking ? formatDate(booking.checkOut) : '—'} />
          <Row
            label="Guests"
            value={
              booking
                ? `${booking.adults + booking.children} · ${booking.rooms} room${booking.rooms > 1 ? 's' : ''}`
                : '—'
            }
          />
          <Row
            label="Amount"
            value={
              booking
                ? formatCurrency(booking.priceBreakdown.total, booking.priceBreakdown.currency)
                : '—'
            }
          />
        </View>

        <View style={styles.actions}>
          <Button
            title="View Booking"
            onPress={() => replacePath(`/(customer)/hotels/booking-details/${id}`)}
            disabled={!id}
          />
          <Button
            title="My bookings"
            variant="outline"
            onPress={() => replacePath('/(customer)/(tabs)/bookings')}
          />
          <Button
            title="Back to Home"
            variant="ghost"
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
  title: { ...Typography.h1, color: Colors.primary, textAlign: 'center' },
  sub: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing['2xl'],
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
  value: { ...Typography.bodyBold, color: Colors.primary, flexShrink: 1, textAlign: 'right' },
  actions: { width: '100%', gap: Spacing.md, marginTop: Spacing['2xl'] },
});
