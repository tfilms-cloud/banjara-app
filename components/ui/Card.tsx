import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Colors, useThemeColors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';

type CardProps = {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  elevated?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function Card({
  children,
  style,
  padded = true,
  elevated = true,
  onPress,
  accessibilityLabel,
}: CardProps) {
  const colors = useThemeColors();
  const body = (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        padded && styles.padded,
        elevated ? Shadows.card : undefined,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius['3xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  padded: {
    padding: Spacing.lg,
  },
});
