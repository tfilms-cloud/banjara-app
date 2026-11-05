import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useTravelPresentation } from '@/components/ui/TravelDesignProvider';
import { TravelSurface } from '@/components/ui/TravelPrimitives';
import { useHotelDesign } from '@/constants/hotelDesign';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import type { HotelPriceBreakdown } from '@/types/hotel';
import { formatCurrency } from '@/utils/formatCurrency';

interface HotelPriceBreakdownCardProps {
  breakdown: HotelPriceBreakdown;
  guests?: number;
  freeCancellation?: boolean;
  estimated?: boolean;
}

export function HotelPriceBreakdownCard(props: HotelPriceBreakdownCardProps) {
  const travel = useTravelPresentation();
  const { breakdown } = props;
  if (travel) return <TravelHotelPriceBreakdown {...props} />;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Price breakdown</Text>
      <Row
        label={`${formatCurrency(breakdown.pricePerNight)} × ${breakdown.nights} nights × ${breakdown.rooms} room${breakdown.rooms > 1 ? 's' : ''}`}
        value={formatCurrency(breakdown.roomSubtotal, breakdown.currency)}
      />
      <Row label="Taxes" value={formatCurrency(breakdown.tax, breakdown.currency)} />
      <Row label="Service fee" value={formatCurrency(breakdown.serviceFee, breakdown.currency)} />
      {breakdown.discount > 0 ? (
        <Row
          label="Discount"
          value={`- ${formatCurrency(breakdown.discount, breakdown.currency)}`}
          valueColor={Colors.success}
        />
      ) : null}
      <View style={styles.divider} />
      <Row label="Total" value={formatCurrency(breakdown.total, breakdown.currency)} bold />
    </View>
  );
}

function TravelHotelPriceBreakdown({
  breakdown: b,
  guests,
  freeCancellation,
  estimated,
}: HotelPriceBreakdownCardProps) {
  const theme = useHotelDesign();
  const money = (amount: number) => formatCurrency(amount, b.currency);
  return (
    <TravelSurface style={[travelStyles.card, { backgroundColor: theme.neutral }]}>
      <View style={travelStyles.heading}>
        <View style={travelStyles.headingTitle}>
          <Ionicons name="receipt-outline" size={17} color={theme.primary} />
          <Text style={[travelStyles.title, { color: theme.text }]}>Price breakdown</Text>
        </View>
        <View style={[travelStyles.badge, { backgroundColor: theme.field }]}>
          <Text style={[travelStyles.badgeText, { color: theme.muted }]}>
            {b.nights} night{b.nights === 1 ? '' : 's'}
            {guests ? ` · ${guests} guest${guests === 1 ? '' : 's'}` : ''}
          </Text>
        </View>
      </View>
      <TravelPriceRow
        label={`${money(b.pricePerNight)} × ${b.nights} night${b.nights === 1 ? '' : 's'} × ${b.rooms} room${b.rooms === 1 ? '' : 's'}`}
        value={money(b.roomSubtotal)}
      />
      <TravelPriceRow label="Taxes" value={money(b.tax)} />
      <TravelPriceRow label="Banjara service fee" value={money(b.serviceFee)} />
      {b.discount > 0 ? (
        <TravelPriceRow label="Wallet discount" value={`− ${money(b.discount)}`} accent />
      ) : null}
      <View style={[travelStyles.divider, { backgroundColor: theme.border }]} />
      <TravelPriceRow
        label={estimated ? 'Estimated total' : 'Total amount'}
        value={`${money(b.total)} ${b.currency}`}
        total
      />
      {freeCancellation ? (
        <Text style={[travelStyles.policy, { color: theme.primary }]}>
          Free cancellation available · see property policy
        </Text>
      ) : null}
      {estimated ? (
        <Text style={[travelStyles.policy, { color: theme.muted }]}>
          Live pricing is unavailable. This estimate will be checked before booking.
        </Text>
      ) : null}
    </TravelSurface>
  );
}
function TravelPriceRow({
  label,
  value,
  accent,
  total,
}: {
  label: string;
  value: string;
  accent?: boolean;
  total?: boolean;
}) {
  const theme = useHotelDesign();
  return (
    <View style={travelStyles.row}>
      <Text style={[travelStyles.label, { color: accent ? theme.primary : theme.muted }]}>
        {label}
      </Text>
      <Text
        style={[
          travelStyles.value,
          { color: accent || total ? theme.primary : theme.text },
          total && travelStyles.total,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}
const travelStyles = StyleSheet.create({
  card: { borderRadius: 30, padding: 16, gap: 9 },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  headingTitle: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  title: { fontFamily: Fonts.bodyBold, fontSize: 13, lineHeight: 20 },
  badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 15 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  label: { flex: 1, minWidth: 0, fontFamily: Fonts.body, fontSize: 12, lineHeight: 19 },
  value: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    lineHeight: 19,
    maxWidth: '48%',
    textAlign: 'right',
  },
  total: { fontFamily: Fonts.displayBold, fontSize: 16, lineHeight: 22 },
  divider: { height: 1, marginVertical: 3 },
  policy: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 16 },
});

function Row({
  label,
  value,
  bold,
  valueColor,
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueColor?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.value, bold && styles.bold, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: { ...Typography.h3, color: Colors.primary, marginBottom: Spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  label: { ...Typography.body, color: Colors.muted, flex: 1 },
  value: { ...Typography.bodyBold, color: Colors.primary },
  bold: { ...Typography.h3, color: Colors.primary },
  divider: { height: 1, backgroundColor: Colors.border },
});
