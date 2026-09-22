import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';

interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  /** Password field: hides text and shows a show/hide control. */
  password?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    hint,
    error,
    leftIcon,
    rightIcon,
    onRightPress,
    password = false,
    secureTextEntry,
    autoComplete,
    style,
    onFocus,
    onBlur,
    editable = true,
    ...props
  },
  ref
) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const disabled = editable === false;
  const colors = useThemeColors();

  const isPassword =
    password ||
    secureTextEntry === true ||
    autoComplete === 'password' ||
    autoComplete === 'new-password' ||
    autoComplete === 'current-password';

  const hideSecret = isPassword && !revealed;
  const showToggle = isPassword && !onRightPress;
  const resolvedRightIcon = showToggle
    ? revealed
      ? 'eye-off-outline'
      : 'eye-outline'
    : rightIcon;
  const onTogglePress = showToggle
    ? () => setRevealed((prev) => !prev)
    : onRightPress;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: colors.dark }]}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          { backgroundColor: colors.inputBg, borderColor: colors.border },
          focused && !error && !disabled
            ? { borderColor: colors.action, backgroundColor: colors.card }
            : null,
          error ? { borderColor: colors.danger, backgroundColor: colors.softDanger } : null,
          disabled ? { backgroundColor: colors.inputBg, opacity: 0.72 } : null,
        ]}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={18}
            color={error ? colors.danger : focused ? colors.action : colors.mutedLight}
            style={styles.icon}
          />
        ) : null}
        <TextInput
          ref={ref}
          editable={editable}
          placeholderTextColor={colors.mutedLight}
          accessibilityLabel={label}
          accessibilityState={{ disabled }}
          {...props}
          style={[styles.input, { color: colors.dark }, disabled && { color: colors.muted }, style]}
          secureTextEntry={hideSecret}
          autoComplete={autoComplete ?? (isPassword ? 'password' : undefined)}
          autoCorrect={isPassword ? false : props.autoCorrect}
          autoCapitalize={isPassword ? 'none' : props.autoCapitalize}
          textContentType={
            isPassword
              ? autoComplete === 'new-password'
                ? 'newPassword'
                : 'password'
              : props.textContentType
          }
          returnKeyType={props.returnKeyType ?? 'done'}
          blurOnSubmit={props.blurOnSubmit ?? true}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {resolvedRightIcon ? (
          <Pressable
            onPress={onTogglePress}
            hitSlop={10}
            accessibilityRole={onTogglePress ? 'button' : undefined}
            accessibilityLabel={
              showToggle
                ? revealed
                  ? 'Hide password'
                  : 'Show password'
                : onRightPress
                  ? `${label ?? 'Field'} action`
                  : undefined
            }
            style={styles.rightHit}
          >
            <Ionicons
              name={resolvedRightIcon}
              size={18}
              color={focused ? colors.action : colors.muted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={[styles.error, { color: colors.danger }]} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: colors.muted }]}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.sm,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    letterSpacing: 0.1,
  },
  field: {
    minHeight: 56,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 16,
    paddingVertical: Spacing.md,
    marginLeft: Spacing.sm,
  },
  icon: {
    marginRight: 2,
  },
  rightHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    ...Typography.small,
  },
  hint: {
    ...Typography.small,
  },
});
