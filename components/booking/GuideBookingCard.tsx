import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { useThemeColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import type { GuideBooking } from '@/types/guideBooking';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

type Props = {
  booking: GuideBooking;
  onPress?: () => void;
};

export function GuideBookingCard({ booking, onPress }: Props) {
  const colors = useThemeColors();
  const pending = booking.status === 'pending';
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="walk-outline" size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.title, { color: colors.dark }]} numberOfLines={1}>
          {booking.serviceName}
        </Text>
        <Text style={[styles.meta, { color: colors.muted }]} numberOfLines={1}>
          {booking.providerName}
        </Text>
        <Text style={[styles.meta, { color: colors.muted }]}>
          {formatDate(booking.date)} · {booking.startTime}
          {booking.guests > 1 ? ` · ${booking.guests} guests` : ''}
        </Text>
        {pending ? (
          <Text style={[styles.pending, { color: colors.warning }]}>Awaiting guide approval</Text>
        ) : null}
        <Text style={[styles.price, { color: colors.primary }]}>
          {formatCurrency(booking.priceBreakdown.total, booking.priceBreakdown.currency)}
        </Text>
      </View>
      <View style={styles.right}>
        <Badge label={pending ? 'Pending' : booking.status} tone={pending ? 'amber' : 'blue'} />
        <Text style={[styles.code, { color: colors.muted }]}>{booking.bookingCode}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: Fonts.bodySemiBold, fontSize: 15 },
  meta: { fontFamily: Fonts.body, fontSize: 12 },
  pending: { fontFamily: Fonts.bodyMedium, fontSize: 12, marginTop: 2 },
  price: { fontFamily: Fonts.bodySemiBold, fontSize: 14, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 8 },
  code: { fontFamily: Fonts.bodyMedium, fontSize: 11 },
});
