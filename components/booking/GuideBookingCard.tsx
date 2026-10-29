import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { useThemeColors } from '@/constants/colors';
import { Radius, Shadows, Spacing, Size } from '@/constants/spacing';
import { CustomerType, Fonts, TypeSize } from '@/constants/typography';
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
        <Ionicons name="walk-outline" size={Size.iconLg} color={colors.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: Spacing.xs }}>
        <Text style={[styles.title, { color: colors.dark }]} numberOfLines={2}>
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
        <Text style={[styles.price, { color: colors.action }]}>
          {formatCurrency(booking.priceBreakdown.total, booking.priceBreakdown.currency)}
        </Text>
      </View>
      <View style={styles.right}>
        <Badge label={pending ? 'Pending' : booking.status} tone={pending ? 'amber' : 'blue'} />
        <Text style={[styles.code, { color: colors.muted }]}>{booking.bookingCode}</Text>
        <Ionicons name="chevron-forward" size={Size.iconMd} color={colors.muted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...Shadows.soft,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: Spacing.md,
    borderWidth: Size.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  icon: {
    width: Size.touch,
    height: Size.touch,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...CustomerType.card },
  meta: { fontFamily: Fonts.body, fontSize: TypeSize.caption },
  pending: { fontFamily: Fonts.bodyMedium, fontSize: TypeSize.caption, marginTop: Spacing.xxs },
  price: { ...CustomerType.section, marginTop: Spacing.sm },
  right: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, paddingTop: Spacing.sm },
  code: { fontFamily: Fonts.bodyMedium, fontSize: TypeSize.micro },
});
