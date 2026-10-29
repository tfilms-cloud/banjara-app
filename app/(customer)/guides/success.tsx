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
import { useGuideBookingStore } from '@/store/guideBookingStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { pushPath, replacePath } from '@/utils/navigation';

export default function GuideSuccessScreen() {
  const insets = useSafeAreaInsets();
  const { bookingId, providerUserId } = useLocalSearchParams<{
    bookingId?: string;
    providerUserId?: string;
  }>();
  const lastBooking = useGuideBookingStore((s) => s.lastBooking);
  const service = useGuideBookingStore((s) => s.service);
  const storedUserId = useGuideBookingStore((s) => s.providerUserId);
  const reset = useGuideBookingStore((s) => s.reset);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12 });
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const booking = lastBooking;
  const id = bookingId ?? booking?.id;
  const chatUserId = providerUserId ?? storedUserId;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['3xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.iconWrap, animatedStyle]}>
          <Ionicons name="time-outline" size={42} color={Colors.white} />
        </Animated.View>
        <Text style={styles.title}>Request submitted</Text>
        <Text style={styles.sub}>
          Your guide hire request is pending. The guide must approve it before it is confirmed.
        </Text>

        <View style={styles.card}>
          <Row label="Status" value="Awaiting guide approval" />
          <Row label="Booking ID" value={booking?.bookingCode ?? id ?? '—'} />
          <Row label="Service" value={booking?.serviceName ?? service?.name ?? '—'} />
          <Row label="Date" value={booking?.date ? formatDate(booking.date) : '—'} />
          <Row label="Time" value={booking?.startTime ?? '—'} />
          <Row label="Guests" value={booking ? String(booking.guests) : '—'} />
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
          {chatUserId && id ? (
            <Button
              title="Message guide"
              onPress={() => {
                pushPath(`/(customer)/messages/${chatUserId}?bookingId=${id}`);
              }}
            />
          ) : null}
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
