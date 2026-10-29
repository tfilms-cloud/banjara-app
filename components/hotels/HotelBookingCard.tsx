import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import type { ColorTokens } from '@/constants/colors';
import { Radius, Shadows, Spacing, Size } from '@/constants/spacing';
import { CustomerType, Typography } from '@/constants/typography';
import type { Hotel, HotelBooking, HotelRoom } from '@/types/hotel';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

interface HotelBookingCardProps {
  booking: HotelBooking;
  hotel?: Hotel | null;
  room?: HotelRoom | null;
  onPress?: () => void;
}

export function HotelBookingCard({ booking, hotel, room, onPress }: HotelBookingCardProps) {
  const styles = useThemedStyles(createStyles);
  const pending = booking.status === 'pending';
  const tone =
    booking.status === 'cancelled'
      ? 'red'
      : booking.status === 'completed'
        ? 'green'
        : pending
          ? 'amber'
          : 'blue';

  return (
    <Pressable onPress={onPress} style={styles.card}>
      {hotel ? (
        <Image source={{ uri: hotel.images[0] }} style={styles.image} contentFit="cover" />
      ) : null}
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.name} numberOfLines={2}>
            {hotel?.name ?? 'Hotel booking'}
          </Text>
          <Badge label={pending ? 'Awaiting approval' : booking.status} tone={tone} />
        </View>
        <Text style={styles.meta}>{room?.name ?? 'Room'}</Text>
        <Text style={styles.meta}>
          {formatDate(booking.checkIn, false)} → {formatDate(booking.checkOut, false)}
        </Text>
        <Text style={styles.meta}>
          {booking.adults + booking.children} guests · {booking.rooms} room
          {booking.rooms > 1 ? 's' : ''}
        </Text>
        {pending ? (
          <Text style={styles.pendingHint}>Waiting for the lodging provider to approve.</Text>
        ) : null}
        <Text style={styles.code}>{booking.bookingCode}</Text>
        <View style={styles.footer}>
          <Text style={styles.price}>
            {formatCurrency(booking.priceBreakdown.total, booking.priceBreakdown.currency)}
          </Text>
          <Text style={styles.link}>View Details</Text>
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
    overflow: 'hidden',
    borderWidth: Size.border,
    borderColor: colors.border,
  },
  image: { width: '100%', height: Size.photoSmall },
  body: { padding: Spacing.lg, gap: Spacing.xs },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, alignItems: 'center' },
  name: { ...CustomerType.card, color: colors.dark, flex: 1 },
  meta: { ...Typography.caption, color: colors.muted },
  pendingHint: {
    ...Typography.caption,
    color: colors.warning,
    fontWeight: '600',
    marginTop: Spacing.xxs,
  },
  code: { ...Typography.small, color: colors.secondary, fontWeight: '700', marginTop: Spacing.xs },
  footer: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: { ...CustomerType.section, color: colors.action },
  link: { ...Typography.caption, color: colors.secondary, fontWeight: '700' },
});
