import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { AuthFonts } from '@/constants/authFonts';
import { Colors, useThemeColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';

type ListRowProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  iconTone?: 'blue' | 'amber' | 'green' | 'danger' | 'navy';
  label: string;
  subtitle?: string;
  trailing?: ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  danger?: boolean;
  style?: StyleProp<ViewStyle>;
  divider?: boolean;
};

/**
 * Horizontal list row. Layout lives on an inner View (not Pressable) so
 * NativeWind/css-interop cannot collapse icon · text · chevron into a column.
 */
export function ListRow({
  icon,
  iconTone = 'blue',
  label,
  subtitle,
  trailing,
  showChevron = true,
  onPress,
  danger,
  style,
  divider,
}: ListRowProps) {
  const colors = useThemeColors();
  const iconTones = {
    blue: { bg: colors.primarySoft, fg: colors.primary },
    amber: { bg: colors.softAmber, fg: colors.accent },
    green: { bg: colors.softGreen, fg: colors.success },
    danger: { bg: colors.softDanger, fg: colors.danger },
    navy: { bg: colors.surfaceSecondary, fg: colors.dark },
  } as const;
  const tone = iconTones[danger ? 'danger' : iconTone];

  const content = (
    <View style={[styles.row, divider && styles.divider, style]}>
      {icon ? (
        <View style={[styles.icon, { backgroundColor: tone.bg }]}>
          <Ionicons name={icon} size={20} color={tone.fg} />
        </View>
      ) : null}

      <View style={styles.copy}>
        <Text style={[styles.label, danger && styles.labelDanger]} numberOfLines={1}>
          {label}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}

      {showChevron ? (
        <View style={styles.chevron}>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={danger ? Colors.danger : Colors.muted}
          />
        </View>
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 4,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  pressed: {
    opacity: 0.72,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  copy: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    marginRight: Spacing.sm,
    justifyContent: 'center',
  },
  label: {
    fontFamily: AuthFonts.bodySemiBold,
    fontSize: 15,
    color: Colors.dark,
    lineHeight: 20,
  },
  labelDanger: {
    color: Colors.danger,
  },
  subtitle: {
    fontFamily: AuthFonts.body,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  trailing: {
    flexShrink: 0,
    marginRight: Spacing.sm,
  },
  chevron: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
