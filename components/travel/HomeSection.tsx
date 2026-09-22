import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';

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
            <Text style={[styles.action, { color: colors.primary }]}>{actionLabel}</Text>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  copy: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 4,
  },
  actionHit: {
    minHeight: 44,
    justifyContent: 'center',
  },
  action: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
  },
});
