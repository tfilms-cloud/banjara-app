import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';

export type CapacityMetric = {
  value: string | number;
  label: string;
  color?: string;
};

type Props = {
  title: string;
  subtitle?: string;
  statusLabel?: string;
  statusTone?: 'ok' | 'warn' | 'full' | 'muted';
  metrics: CapacityMetric[];
  fillPct: number;
  fillCaption: string;
  trailingCaption?: string;
  onPress?: () => void;
};

function fillTone(pct: number) {
  if (pct >= 90) return Colors.danger;
  if (pct >= 70) return '#B45309';
  return Colors.primary;
}

const statusStyles = {
  ok: { bg: Colors.primarySoft, text: Colors.primary },
  warn: { bg: Colors.softAmber, text: '#B45309' },
  full: { bg: Colors.softDanger, text: Colors.danger },
  muted: { bg: Colors.surfaceSecondary, text: Colors.muted },
};

export function InventoryCapacityCard({
  title,
  subtitle,
  statusLabel,
  statusTone = 'ok',
  metrics,
  fillPct,
  fillCaption,
  trailingCaption,
  onPress,
}: Props) {
  const tone = statusStyles[statusTone];
  const pct = Math.min(100, Math.max(0, fillPct));

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${title}, ${fillCaption}`}
    >
      <View style={styles.head}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {statusLabel ? (
          <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
            <Text style={[styles.statusText, { color: tone.text }]}>{statusLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.metrics}>
        {metrics.map((metric, index) => (
          <View key={`${metric.label}-${index}`} style={styles.metricWrap}>
            {index > 0 ? <View style={styles.metricDivider} /> : null}
            <View style={styles.metric}>
              <Text
                style={[
                  styles.metricValue,
                  metric.color ? { color: metric.color } : null,
                ]}
              >
                {metric.value}
              </Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${pct}%`, backgroundColor: fillTone(pct) },
          ]}
        />
      </View>
      <View style={styles.footer}>
        <Text style={styles.fillLabel}>{fillCaption}</Text>
        {trailingCaption ? (
          <Text style={styles.trailing}>{trailingCaption}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 25,
    color: Colors.dark,
    writingDirection: 'auto',
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 20,
    color: Colors.muted,
    marginTop: Spacing.xs,
  },
  statusPill: {
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  metricWrap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: Colors.border,
  },
  metric: { flex: 1, alignItems: 'center', gap: 2 },
  metricValue: {
    fontFamily: Fonts.display,
    fontSize: 23,
    lineHeight: 32,
    color: Colors.dark,
  },
  metricLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    lineHeight: 18,
    color: Colors.muted,
    textAlign: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.inputBg,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  fillLabel: { ...Typography.small, color: Colors.muted, flex: 1 },
  trailing: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.primary,
  },
});
