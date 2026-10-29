import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';

interface StatCardProps {
  label: string;
  value: string;
  tone?: 'blue' | 'amber' | 'green' | 'navy';
  style?: ViewStyle;
}

export function ProviderStatCard({
  label,
  value,
  tone = 'blue',
  style,
}: StatCardProps) {
  const colors = useThemeColors();
  const tones = {
    blue: colors.primary,
    amber: colors.warning,
    green: colors.action,
    navy: colors.primary,
  };
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
    >
      <View style={styles.heading}>
        <View style={[styles.dot, { backgroundColor: tones[tone] }]} />
        <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      </View>
      <Text
        style={[
          styles.value,
          { color: tone === 'green' ? colors.action : colors.dark },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: '45%',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
    ...Shadows.premium,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dot: { width: 6, height: 6, borderRadius: Radius.full },
  value: {
    fontFamily: Fonts.display,
    fontSize: 28,
    lineHeight: 38,
    letterSpacing: -0.5,
    writingDirection: 'auto',
  },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 20,
    flex: 1,
  },
});
