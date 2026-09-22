import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProviderStatCard } from '@/components/provider/ProviderStatCard';
import { SimpleBarChart } from '@/components/provider/SimpleBarChart';
import { LoadingState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useProviderStore } from '@/store/providerStore';
import { formatCurrency } from '@/utils/formatCurrency';

export default function ProviderEarningsScreen() {
  const insets = useSafeAreaInsets();
  const earnings = useProviderStore((s) => s.earnings);
  const loading = useProviderStore((s) => s.loading);

  if (loading && !earnings) return <LoadingState title="Loading earnings..." />;
  if (!earnings) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + Spacing.xl, padding: Spacing.lg }]}>
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.sub}>No earnings data yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.lg,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.lg,
      }}
    >
      <Text style={styles.title}>Earnings</Text>
      <View style={styles.stats}>
        <ProviderStatCard label="Total Revenue" value={formatCurrency(earnings.totalRevenue)} tone="navy" />
        <ProviderStatCard label="Today" value={formatCurrency(earnings.today)} tone="blue" />
        <ProviderStatCard label="This Week" value={formatCurrency(earnings.thisWeek)} tone="amber" />
        <ProviderStatCard label="This Month" value={formatCurrency(earnings.thisMonth)} tone="green" />
        <ProviderStatCard label="Pending Payout" value={formatCurrency(earnings.pendingPayout)} />
        <ProviderStatCard label="Completed Payout" value={formatCurrency(earnings.completedPayout)} tone="green" />
        <ProviderStatCard label="Platform Fees" value={formatCurrency(earnings.platformFees)} tone="amber" />
        <ProviderStatCard label="Net Earnings" value={formatCurrency(earnings.netEarnings)} tone="navy" />
      </View>

      <SimpleBarChart title="Revenue by day" data={earnings.byDay} />
      <SimpleBarChart title="Revenue by month" data={earnings.byMonth} />

      <View style={styles.card}>
        <Text style={styles.section}>By service</Text>
        {earnings.byService.map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={styles.meta}>{item.label}</Text>
            <Text style={styles.value}>{formatCurrency(item.amount)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>By route</Text>
        {earnings.byRoute.map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={styles.meta}>{item.label}</Text>
            <Text style={styles.value}>{formatCurrency(item.amount)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { ...Typography.h1, color: Colors.dark },
  sub: { ...Typography.body, color: Colors.muted },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  section: { ...Typography.h3, color: Colors.primary, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  meta: { ...Typography.body, color: Colors.muted },
  value: { ...Typography.bodyBold, color: Colors.primary },
});
