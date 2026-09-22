import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Colors, useThemeColors } from '@/constants/colors';
import { journeyTypeMeta } from '@/constants/journeyTypes';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import type { Booking } from '@/types/booking';
import type { TripWithDetails } from '@/types/trip';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';

interface BookingCardProps {
  booking: Booking;
  trip?: TripWithDetails | null;
  onPress?: () => void;
  onViewTicket?: () => void;
}

export function BookingCard({ booking, trip, onPress, onViewTicket }: BookingCardProps) {
  const colors = useThemeColors();
  const tone =
    booking.status === 'cancelled'
      ? 'red'
      : booking.status === 'completed'
        ? 'green'
        : 'blue';
  const journey = trip ? journeyTypeMeta(trip.journeyType) : null;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessibilityRole="button"
    >
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.provider, { color: colors.muted }]} numberOfLines={1}>
            {trip?.agency.name ?? 'Provider'}
          </Text>
          <Text style={[styles.route, { color: colors.dark }]}>
            {trip ? `${trip.from} → ${trip.to}` : 'Trip details'}
          </Text>
        </View>
        <View style={styles.badges}>
          {journey ? (
            <Badge
              label={journey.label}
              tone={journey.value === 'round_trip' ? 'blue' : 'gray'}
            />
          ) : null}
          <Badge label={booking.status} tone={tone} />
        </View>
      </View>
      {journey ? <Text style={styles.journeyHint}>{journey.customerHint}</Text> : null}
      <Text style={styles.meta}>
        {formatDate(booking.date)}
        {trip ? ` · ${formatTime(trip.departureTime)}` : ''}
        {booking.seats?.length ? ` · Seat ${booking.seats.join(', ')}` : ''}
      </Text>
      <View style={styles.footer}>
        <Text style={[styles.price, { color: colors.dark }]}>
          {formatCurrency(booking.priceBreakdown.total, booking.priceBreakdown.currency)}
        </Text>
        <View style={styles.actions}>
          {booking.status !== 'cancelled' && onViewTicket ? (
            <Pressable onPress={onViewTicket} hitSlop={8}>
              <Text style={styles.link}>Ticket</Text>
            </Pressable>
          ) : null}
          <Text style={[styles.cta, { color: colors.action }]}>View details</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  badges: {
    alignItems: 'flex-end',
    gap: 6,
  },
  provider: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.muted,
  },
  route: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.dark,
    marginTop: 2,
  },
  journeyHint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
  },
  footer: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.action,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  link: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.primary,
  },
  cta: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.action,
  },
});
