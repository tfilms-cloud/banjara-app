import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useThemeColors } from '@/constants/colors';

type IconButtonProps = {
  onPress?: () => void;
  accessibilityLabel: string;
  children: ReactNode;
  style?: ViewStyle;
  size?: number;
  badge?: boolean;
};

export function IconButton({
  onPress,
  accessibilityLabel,
  children,
  style,
  size = 44,
  badge = false,
}: IconButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.inputBg,
          borderColor: colors.border,
          opacity: pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      <View pointerEvents="none">{children}</View>
      {badge ? <View style={[styles.badge, { backgroundColor: colors.accent }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
