import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { useTourBookingStore } from '@/store/tourBookingStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { replacePath } from '@/utils/navigation';

export default function TourSuccessScreen() {
  const insets = useSafeAreaInsets();
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  const lastBooking = useTourBookingStore((s) => s.lastBooking);
  const itinerary = useTourBookingStore((s) => s.itinerary);
  const reset = useTourBookingStore((s) => s.reset);
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
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing['3xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.iconWrap, animatedStyle]}>
          <Ionicons name="time-outline" size={42} color={Colors.white} />
        </Animated.View>
        <Text style={styles.title}>Request submitted</Text>
        <Text style={styles.sub}>
          Your package booking is pending. The tour operator must approve it before it is
          confirmed.
        </Text>

        <View style={styles.card}>
          <Row label="Status" value="Awaiting provider approval" />
          <Row label="Booking ID" value={booking?.bookingCode ?? id ?? '—'} />
          <Row label="Package" value={booking?.title ?? itinerary?.title ?? '—'} />
          <Row label="Destination" value={booking?.destination ?? itinerary?.destination ?? '—'} />
          <Row
            label="Start date"
            value={booking?.startDate ? formatDate(booking.startDate) : '—'}
          />
          <Row
            label="Travelers"
            value={booking ? String(booking.travelers) : '—'}
          />
          <Row label="Guest" value={booking?.guest.name ?? '—'} />
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
            title="My bookings"
            onPress={() => {
              reset();
              replacePath('/(customer)/(tabs)/bookings');
            }}
          />
          <Button
            title="Back to explore"
            variant="outline"
            onPress={() => {
              reset();
              replacePath('/(customer)/(tabs)');
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.sm,
  },
  title: { fontFamily: Fonts.display, fontSize: 26, color: Colors.dark, textAlign: 'center' },
  sub: { ...Typography.body, color: Colors.muted, textAlign: 'center', lineHeight: 22 },
  card: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  rowLabel: { ...Typography.caption, color: Colors.muted },
  rowValue: { fontFamily: Fonts.bodySemiBold, color: Colors.dark, flexShrink: 1, textAlign: 'right' },
  actions: { width: '100%', gap: Spacing.sm, marginTop: Spacing.lg },
});
