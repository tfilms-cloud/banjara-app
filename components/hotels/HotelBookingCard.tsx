import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
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
  const tone =
    booking.status === 'cancelled'
      ? 'red'
      : booking.status === 'completed'
        ? 'green'
        : 'blue';

  return (
    <Pressable onPress={onPress} style={styles.card}>
      {hotel ? (
        <Image source={{ uri: hotel.images[0] }} style={styles.image} contentFit="cover" />
      ) : null}
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.name} numberOfLines={1}>
            {hotel?.name ?? 'Hotel booking'}
          </Text>
          <Badge label={booking.status} tone={tone} />
        </View>
        <Text style={styles.meta}>{room?.name ?? 'Room'}</Text>
        <Text style={styles.meta}>
          {formatDate(booking.checkIn, false)} → {formatDate(booking.checkOut, false)}
        </Text>
        <Text style={styles.meta}>
          {booking.adults + booking.children} guests · {booking.rooms} room
          {booking.rooms > 1 ? 's' : ''}
        </Text>
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: { width: '100%', height: 120 },
  body: { padding: Spacing.lg, gap: Spacing.xs },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, alignItems: 'center' },
  name: { ...Typography.h3, color: Colors.primary, flex: 1 },
  meta: { ...Typography.caption, color: Colors.muted },
  code: { ...Typography.small, color: Colors.secondary, fontWeight: '700', marginTop: 4 },
  footer: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: { ...Typography.bodyBold, color: Colors.primary },
  link: { ...Typography.caption, color: Colors.secondary, fontWeight: '700' },
});
