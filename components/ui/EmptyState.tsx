import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { Button } from './Button';

interface StateProps {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  message,
  icon = 'file-tray-outline',
  actionLabel,
  onAction,
}: StateProps) {
  const colors = useThemeColors();
  return (
    <View style={styles.container} accessibilityRole="summary">
      <View style={[styles.iconWrap, { backgroundColor: colors.actionSoft }]}>
        <Ionicons name={icon} size={28} color={colors.action} />
      </View>
      <Text style={[styles.title, { color: colors.dark }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: colors.muted }]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button title={actionLabel} onPress={onAction} fullWidth={false} />
        </View>
      ) : null}
    </View>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this right now. Please try again.',
  onRetry,
}: Partial<StateProps> & { message?: string; onRetry?: () => void }) {
  const colors = useThemeColors();
  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={[styles.iconWrap, { backgroundColor: colors.softDanger }]}>
        <Ionicons name="alert-circle-outline" size={28} color={colors.danger} />
      </View>
      <Text style={[styles.title, { color: colors.dark }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.muted }]}>{message}</Text>
      {onRetry ? (
        <View style={styles.action}>
          <Button title="Try again" onPress={onRetry} fullWidth={false} />
        </View>
      ) : null}
    </View>
  );
}

export function LoadingState({ title = 'Loading' }: { title?: string }) {
  const colors = useThemeColors();
  return (
    <View style={styles.container} accessibilityLabel={title} accessibilityState={{ busy: true }}>
      <View style={[styles.skeletonCard, { backgroundColor: colors.elevated }]} />
      <View style={[styles.skeletonCard, { width: '80%', backgroundColor: colors.elevated }]} />
      <Text style={[styles.message, { color: colors.muted }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.h3,
    textAlign: 'center',
  },
  message: {
    ...Typography.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
  skeletonCard: {
    width: '100%',
    height: 88,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  action: {
    marginTop: Spacing.md,
  },
});
