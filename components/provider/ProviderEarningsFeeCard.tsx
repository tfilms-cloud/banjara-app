import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { formatCurrency } from '@/utils/formatCurrency';
import { pushPath } from '@/utils/navigation';

type Props = {
  totalRevenue?: number;
  platformFees?: number;
  platformFeePercent?: number;
  netEarnings?: number;
};

/** Shows gross earnings and BANJARA service commission (no cash remit limit). */
export function ProviderEarningsFeeCard({
  totalRevenue = 0,
  platformFees = 0,
  platformFeePercent,
  netEarnings,
}: Props) {
  const feeLabel =
    platformFeePercent != null && Number.isFinite(platformFeePercent)
      ? `${platformFeePercent}%`
      : null;
  const providerNet =
    netEarnings != null ? netEarnings : Math.max(0, totalRevenue - platformFees);

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Earnings · BANJARA fee</Text>
      <Text style={styles.sectionSub}>
        BANJARA takes a commission based on your service type
        {feeLabel ? ` (${feeLabel})` : ''}. Your net is what remains after that cut.
      </Text>
      <View style={styles.cashRow}>
        <View style={styles.cashItem}>
          <Text style={styles.cashLabel}>Gross earned</Text>
          <Text style={styles.cashValue}>{formatCurrency(totalRevenue)}</Text>
        </View>
        <View style={styles.cashItem}>
          <Text style={styles.cashLabel}>
            BANJARA fee{feeLabel ? ` · ${feeLabel}` : ''}
          </Text>
          <Text style={[styles.cashValue, { color: Colors.danger }]}>
            −{formatCurrency(platformFees)}
          </Text>
        </View>
        <View style={styles.cashItem}>
          <Text style={styles.cashLabel}>Your net</Text>
          <Text style={[styles.cashValue, { color: Colors.success }]}>
            {formatCurrency(providerNet)}
          </Text>
        </View>
      </View>
      <Button
        title="View earnings"
        variant="outline"
        onPress={() => pushPath('/(provider)/(tabs)/earnings')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionTitle: { fontFamily: Fonts.display, fontSize: 18, color: Colors.dark },
  sectionSub: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  cashRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  cashItem: { flexGrow: 1, flexBasis: '28%', minWidth: 90, gap: 2 },
  cashLabel: { fontFamily: Fonts.body, fontSize: 11, color: Colors.muted },
  cashValue: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.dark },
});
