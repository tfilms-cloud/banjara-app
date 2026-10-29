import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useThemeColors } from '@/constants/colors';
import { Radius, Spacing, Size } from '@/constants/spacing';
import { Fonts, TypeSize, Leading } from '@/constants/typography';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'tertiary' | 'accent' | 'danger';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textColor?: string;
  fullWidth?: boolean;
  compact?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textColor: textColorProp,
  fullWidth = true,
  compact = false,
  icon,
  iconPosition = 'left',
}: ButtonProps) {
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;
  const resolvedVariant = variant === 'tertiary' ? 'ghost' : variant;
  const colors = useThemeColors();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const background =
    resolvedVariant === 'primary'
      ? colors.action
      : resolvedVariant === 'accent'
        ? colors.accent
        : resolvedVariant === 'secondary'
          ? colors.primarySoft
          : resolvedVariant === 'danger'
            ? colors.danger
            : resolvedVariant === 'outline'
              ? colors.card
              : colors.transparent;

  const textColor =
    textColorProp ??
    (resolvedVariant === 'outline'
      ? colors.action
      : resolvedVariant === 'ghost'
        ? colors.primaryText
        : resolvedVariant === 'secondary'
          ? colors.primaryText
          : resolvedVariant === 'accent'
            ? colors.dark
            : colors.white);

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      onPressIn={() => {
        if (isDisabled) return;
        scale.value = withSpring(0.98, { damping: 18, stiffness: 280 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, stiffness: 280 });
      }}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.base,
        compact ? styles.compact : null,
        {
          backgroundColor: background,
          borderColor: resolvedVariant === 'outline' ? colors.border : colors.transparent,
          borderWidth: resolvedVariant === 'outline' ? Size.borderStrong : 0,
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' ? icon : null}
          <Text style={[styles.title, compact && styles.compactTitle, { color: textColor }]}>{title}</Text>
          {icon && iconPosition === 'right' ? icon : null}
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: Size.button,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  compact: {
    minHeight: Size.compactControl,
    paddingHorizontal: Spacing.md,
  },
  title: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: TypeSize.body,
    lineHeight: Leading.caption,
    letterSpacing: 0,
  },
  compactTitle: {
    fontSize: TypeSize.label,
    lineHeight: Leading.compact,
  },
});
