import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { formatCurrency } from '@/utils/formatCurrency';

interface BarChartProps {
  title: string;
  data: { label: string; amount: number }[];
}

export function SimpleBarChart({ title, data }: BarChartProps) {
  const max = Math.max(...data.map((item) => item.amount), 1);

  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.row}>
        {data.map((item) => {
          const height = Math.max(12, Math.round((item.amount / max) * 100));
          return (
            <View key={item.label} style={styles.col}>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { height }]} />
              </View>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value}>{Math.round(item.amount / 1000)}k</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.hint}>
        Amounts in PKR · {' '}
        {formatCurrency(data.reduce((s, d) => s + d.amount, 0))} total in view
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    gap: Spacing.lg,
    ...Shadows.premium,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 21,
    lineHeight: 29,
    color: Colors.dark,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    minHeight: 140,
  },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: {
    height: 110,
    width: '100%',
    justifyContent: 'flex-end',
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderTopLeftRadius: Radius.sm,
    borderTopRightRadius: Radius.sm,
  },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    lineHeight: 18,
    color: Colors.muted,
  },
  value: { ...Typography.small, color: Colors.primary, fontSize: 10 },
  hint: { ...Typography.caption, color: Colors.muted },
});
