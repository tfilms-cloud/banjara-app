import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { formatCurrency } from '@/utils/formatCurrency';

interface BarChartProps {
  title: string;
  data: { label: string; amount: number }[];
}

export function SimpleBarChart({ title, data }: BarChartProps) {
  const max = Math.max(...data.map((item) => item.amount), 1);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
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
      <Text style={styles.hint}>Amounts in PKR · {formatCurrency(data.reduce((s, d) => s + d.amount, 0))} total in view</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  title: { ...Typography.h3, color: Colors.primary },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, minHeight: 140 },
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
    backgroundColor: Colors.secondary,
    borderTopLeftRadius: Radius.sm,
    borderTopRightRadius: Radius.sm,
  },
  label: { ...Typography.small, color: Colors.muted, fontWeight: '700' },
  value: { ...Typography.small, color: Colors.primary, fontSize: 10 },
  hint: { ...Typography.caption, color: Colors.muted },
});
