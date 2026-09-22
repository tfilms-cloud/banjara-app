import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { PriceBreakdown } from '@/types/booking';
import { formatCurrency } from '@/utils/formatCurrency';

interface PriceCardProps {
  breakdown: PriceBreakdown;
}

export function PriceCard({ breakdown }: PriceCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Price breakdown</Text>
      <Row label="Ticket price" value={formatCurrency(breakdown.ticketPrice, breakdown.currency)} />
      <Row label="Service fee" value={formatCurrency(breakdown.serviceFee, breakdown.currency)} />
      {breakdown.discount > 0 ? (
        <Row
          label="Discount"
          value={`- ${formatCurrency(breakdown.discount, breakdown.currency)}`}
          valueColor={Colors.success}
        />
      ) : null}
      <View style={styles.divider} />
      <Row
        label="Total"
        value={formatCurrency(breakdown.total, breakdown.currency)}
        bold
      />
    </View>
  );
}

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
  title: {
    ...Typography.h3,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...Typography.body,
    color: Colors.muted,
  },
  value: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  bold: {
    ...Typography.h3,
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
});
