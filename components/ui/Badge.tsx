import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';

interface BadgeProps {
  label: string;
  tone?: 'navy' | 'blue' | 'amber' | 'green' | 'gray' | 'red';
  style?: ViewStyle;
}

export function Badge({ label, tone = 'blue', style }: BadgeProps) {
  const colors = useThemeColors();
  const tones = {
    navy: { bg: colors.primary, fg: colors.white },
    blue: { bg: colors.filterBg, fg: colors.filterText },
    amber: { bg: colors.softAmber, fg: colors.warning },
    green: { bg: colors.actionSoft, fg: colors.action },
    gray: { bg: colors.surfaceSecondary, fg: colors.dark },
    red: { bg: colors.softDanger, fg: colors.danger },
  };
  const palette = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }, style]}>
      <Text style={[styles.text, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: Fonts.secondarySemiBold,
    fontSize: 12,
  },
});
