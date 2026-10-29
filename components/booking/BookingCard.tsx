import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { useThemeColors, type ColorTokens } from '@/constants/colors';
import { journeyTypeMeta } from '@/constants/journeyTypes';
import { Radius, Shadows, Spacing, Size } from '@/constants/spacing';
import { CustomerType, Fonts, TypeSize, Leading } from '@/constants/typography';
import type { Booking } from '@/types/booking';
import type { TripWithDetails } from '@/types/trip';
import {
  bookingNeedsPaymentAction,
  canOpenBookingPayment,
  openBookingPayment,
  paymentActionHint,
  paymentActionLabel,
} from '@/utils/continuePayment';
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
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const needsPay = bookingNeedsPaymentAction(booking);
  const canOpenPay = canOpenBookingPayment(booking);
  const tone =
    booking.status === 'cancelled'
      ? 'red'
      : booking.status === 'completed'
        ? 'green'
        : needsPay || booking.status === 'pending'
          ? 'amber'
          : 'blue';
  const statusLabel = needsPay
    ? paymentActionLabel(booking.paymentStatus)
    : booking.status === 'pending'
      ? 'Awaiting approval'
      : booking.status;
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
          <Badge label={statusLabel} tone={tone} />
        </View>
      </View>
      {canOpenPay ? (
        <Text style={[styles.pendingHint, { color: colors.warning }]}>
          {paymentActionHint(booking.paymentStatus)}
        </Text>
      ) : booking.status === 'pending' ? (
        <Text style={[styles.pendingHint, { color: colors.warning ?? '#B45309' }]}>
          Waiting for the provider to approve this booking.
        </Text>
      ) : null}
      {journey ? <Text style={styles.journeyHint}>{journey.customerHint}</Text> : null}
      <Text style={styles.meta}>
        {formatDate(booking.date)}
        {trip ? ` · ${formatTime(trip.departureTime)}` : ''}
        {booking.seats?.length ? ` · Seat ${booking.seats.join(', ')}` : ''}
      </Text>
      <View style={styles.footer}>
        <Text style={[styles.price, { color: colors.action }]}>
          {formatCurrency(booking.priceBreakdown.total, booking.priceBreakdown.currency)}
        </Text>
        <View style={styles.actions}>
          {canOpenPay && booking.paymentId ? (
            <Pressable
              onPress={() =>
                openBookingPayment({
                  paymentId: booking.paymentId!,
                  bookingId: booking.id,
                  method: booking.paymentMethod,
                })
              }
              hitSlop={8}
            >
              <Text style={[styles.link, { color: colors.action }]}>
                {paymentActionLabel(booking.paymentStatus)}
              </Text>
            </Pressable>
          ) : null}
          {booking.status !== 'cancelled' && booking.status !== 'pending' && !needsPay && onViewTicket ? (
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

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  card: {
    ...Shadows.soft,
    backgroundColor: colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: Size.border,
    borderColor: colors.border,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  badges: {
    alignItems: 'flex-start',
    flexShrink: 1,
    maxWidth: '48%',
    gap: Spacing.xs,
  },
  provider: {
    fontFamily: Fonts.bodyMedium,
    fontSize: TypeSize.caption,
    color: colors.muted,
  },
  route: {
    ...CustomerType.card,
    color: colors.dark,
    marginTop: Spacing.xxs,
  },
  journeyHint: {
    fontFamily: Fonts.body,
    fontSize: TypeSize.caption,
    color: colors.muted,
  },
  pendingHint: {
    fontFamily: Fonts.bodyMedium,
    fontSize: TypeSize.caption,
    marginTop: Spacing.xs,
    lineHeight: Leading.compact,
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: TypeSize.label,
    color: colors.muted,
  },
  footer: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  price: {
    fontFamily: Fonts.bodyBold,
    fontSize: TypeSize.card,
    color: colors.action,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.md,
  },
  link: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: TypeSize.label,
    color: colors.primaryText,
  },
  cta: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: TypeSize.label,
    color: colors.action,
  },
});
