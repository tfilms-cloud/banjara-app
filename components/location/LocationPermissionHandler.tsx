import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

interface LocationPermissionHandlerProps {
  message: string;
  onOpenSettings?: () => void;
  onDismiss?: () => void;
}

export function LocationPermissionHandler({
  message,
  onOpenSettings,
  onDismiss,
}: LocationPermissionHandlerProps) {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{message}</Text>
      <View style={styles.actions}>
        {onOpenSettings ? (
          <Button title="Open Settings" variant="outline" onPress={onOpenSettings} />
        ) : null}
        {onDismiss ? <Button title="Select on Map" variant="ghost" onPress={onDismiss} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.softAmber,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#F6D9A8',
  },
  text: { ...Typography.caption, color: Colors.primary, lineHeight: 18 },
  actions: { gap: Spacing.xs },
});
