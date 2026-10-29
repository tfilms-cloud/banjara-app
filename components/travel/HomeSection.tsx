import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { CustomerType, Fonts } from '@/constants/typography';

type HomeSectionProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
};

export function HomeSection({
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
}: HomeSectionProps) {
  const colors = useThemeColors();
  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.dark }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedLight }]}>{subtitle}</Text> : null}
        </View>
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            style={styles.actionHit}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <View style={styles.actionRow}>
              <Text style={[styles.action, { color: colors.primaryText }]}>{actionLabel}</Text>
              <ChevronRight size={14} color={colors.primaryText} strokeWidth={2.4} />
            </View>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: Spacing['2xl'],
    gap: Spacing.md,
  },
  head: {
    paddingHorizontal: Spacing.screen,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  copy: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  title: {
    ...CustomerType.section,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 3,
  },
  actionHit: {
    minHeight: Spacing['5xl'],
    justifyContent: 'center',
    paddingLeft: Spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  action: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },
});
