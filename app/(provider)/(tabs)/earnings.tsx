import { Ionicons } from '@expo/vector-icons';
import { type ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SimpleBarChart } from '@/components/provider/SimpleBarChart';
import { LoadingState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { useProviderStore } from '@/store/providerStore';
import { formatCurrency } from '@/utils/formatCurrency';

type ExpandKey = 'day' | 'month' | 'route' | null;

function ExpandSection({
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <View style={[styles.expandCard, open && styles.expandCardOpen]}>
      <Pressable style={styles.expandHead} onPress={onToggle}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.expandTitle}>{title}</Text>
          <Text style={styles.expandSub}>{subtitle}</Text>
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.primary}
        />
      </Pressable>
      {open ? <View style={styles.expandBody}>{children}</View> : null}
    </View>
  );
}

export default function ProviderEarningsScreen() {
  const insets = useSafeAreaInsets();
  const earnings = useProviderStore((s) => s.earnings);
  const loading = useProviderStore((s) => s.loading);
  const [expanded, setExpanded] = useState<ExpandKey>(null);

  const toggle = (key: ExpandKey) => {
    setExpanded((prev) => (prev === key ? null : key));
  };

  if (loading && !earnings) return <LoadingState title="Loading earnings..." />;
  if (!earnings) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + Spacing.xl, padding: Spacing.lg }]}>
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.sub}>No earnings data yet.</Text>
      </View>
    );
  }

  const earned = earnings.totalRevenue;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.lg,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.lg,
      }}
    >
      <Text style={styles.title}>Earnings</Text>
      <Text style={styles.sub}>
        Gross booking revenue and BANJARA commission for your service type.
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Earning summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Gross earned</Text>
            <Text style={[styles.summaryValue, { color: Colors.action }]}>
              {formatCurrency(earned)}
            </Text>
            <Text style={styles.summaryMeta}>Booking revenue</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>
              BANJARA fee
              {earnings.platformFeePercent != null
                ? ` · ${earnings.platformFeePercent}%`
                : ''}
            </Text>
            <Text style={[styles.summaryValue, { color: Colors.danger }]}>
              −{formatCurrency(earnings.platformFees)}
            </Text>
            <Text style={styles.summaryMeta}>Service commission</Text>
          </View>
        </View>
        <View style={styles.netBox}>
          <Text style={styles.owedLabel}>Your net</Text>
          <Text style={[styles.owedValue, { color: Colors.success }]}>
            {formatCurrency(earnings.netEarnings)}
          </Text>
          <Text style={styles.owedHint}>After BANJARA fee on your service type</Text>
        </View>
        <View style={styles.miniStats}>
          <Text style={styles.miniStat}>Today {formatCurrency(earnings.today)}</Text>
          <Text style={styles.miniStat}>Week {formatCurrency(earnings.thisWeek)}</Text>
          <Text style={styles.miniStat}>Month {formatCurrency(earnings.thisMonth)}</Text>
        </View>
      </View>

      {/* Clickable expandable revenue sections — no tabs */}
      <Text style={styles.groupLabel}>Revenue breakdown</Text>
      <Text style={styles.sectionSub}>Tap a section to enlarge. Only one opens at a time.</Text>

      <ExpandSection
        title="Revenue by date"
        subtitle={
          expanded === 'day'
            ? 'Day-by-day revenue'
            : `${earnings.byDay.length} days · tap to enlarge`
        }
        open={expanded === 'day'}
        onToggle={() => toggle('day')}
      >
        {earnings.byDay.length ? (
          <SimpleBarChart title="" data={earnings.byDay} />
        ) : (
          <Text style={styles.sectionSub}>No daily data yet.</Text>
        )}
        <View style={styles.listBlock}>
          {earnings.byDay.map((item) => (
            <View key={item.label} style={styles.row}>
              <Text style={styles.meta}>{item.label}</Text>
              <Text style={styles.value}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>
      </ExpandSection>

      <ExpandSection
        title="Revenue by month"
        subtitle={
          expanded === 'month'
            ? 'Monthly revenue'
            : `${earnings.byMonth.length} months · tap to enlarge`
        }
        open={expanded === 'month'}
        onToggle={() => toggle('month')}
      >
        {earnings.byMonth.length ? (
          <SimpleBarChart title="" data={earnings.byMonth} />
        ) : (
          <Text style={styles.sectionSub}>No monthly data yet.</Text>
        )}
        <View style={styles.listBlock}>
          {earnings.byMonth.map((item) => (
            <View key={item.label} style={styles.row}>
              <Text style={styles.meta}>{item.label}</Text>
              <Text style={styles.value}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>
      </ExpandSection>

      <ExpandSection
        title="Revenue by routes"
        subtitle={
          expanded === 'route'
            ? 'Route corridors'
            : `${earnings.byRoute.length} routes · tap to enlarge`
        }
        open={expanded === 'route'}
        onToggle={() => toggle('route')}
      >
        {earnings.byRoute.length === 0 ? (
          <Text style={styles.sectionSub}>No route revenue yet.</Text>
        ) : (
          <View style={styles.listBlock}>
            {earnings.byRoute.map((item) => (
              <View key={item.label} style={styles.row}>
                <Text style={styles.meta}>{item.label}</Text>
                <Text style={styles.value}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}
          </View>
        )}
      </ExpandSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { ...Typography.h1, color: Colors.dark },
  sub: { ...Typography.body, color: Colors.muted },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  sectionTitle: { fontFamily: Fonts.display, fontSize: 18, color: Colors.dark },
  sectionSub: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  summaryRow: { flexDirection: 'row', alignItems: 'stretch' },
  summaryItem: { flex: 1, gap: 4 },
  divider: { width: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  summaryLabel: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted },
  summaryValue: { fontFamily: Fonts.display, fontSize: 22 },
  summaryMeta: { fontFamily: Fonts.body, fontSize: 11, color: Colors.muted },
  netBox: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: 2,
  },
  owedLabel: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted },
  owedValue: { fontFamily: Fonts.bodySemiBold, fontSize: 18, color: Colors.dark },
  owedHint: { ...Typography.caption, color: Colors.muted, marginTop: 2 },
  miniStats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  miniStat: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.muted,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  groupLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.dark },
  expandCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  expandCardOpen: {
    borderColor: Colors.primary,
  },
  expandHead: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  expandTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.dark },
  expandSub: { ...Typography.caption, color: Colors.muted, marginTop: 2 },
  expandBody: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  listBlock: { gap: 2 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  meta: { ...Typography.body, color: Colors.muted, flex: 1, paddingRight: 8 },
  value: { ...Typography.bodyBold, color: Colors.primary },
});
