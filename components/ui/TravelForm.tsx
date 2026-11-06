import type { TextInputInstance } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode, type Ref } from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useHomeDesign } from '@/constants/homeDesign';
import { Fonts } from '@/constants/typography';
import { TravelSurface, type TravelIcon } from './TravelPrimitives';

export function TravelFormCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useHomeDesign();
  return (
    <TravelSurface style={[s.card, { borderColor: theme.border }, style]}>{children}</TravelSurface>
  );
}

export function TravelSelectField({
  label,
  value,
  icon,
  onPress,
  compact,
  style,
  chevron = true,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  onPress: () => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  chevron?: boolean;
}) {
  const theme = useHomeDesign();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}
      style={[
        s.field,
        { backgroundColor: theme.field, borderColor: theme.border },
        compact && s.compact,
        style,
      ]}
    >
      <View style={[s.icon, !compact && { backgroundColor: theme.soft }]}>{icon}</View>
      <View style={s.copy}>
        <Text style={[s.label, { color: theme.muted }]}>{label}</Text>
        <Text style={[s.value, { color: theme.text }]} numberOfLines={2}>
          {value}
        </Text>
      </View>
      {chevron && !compact ? <Ionicons name="chevron-down" size={14} color={theme.muted} /> : null}
    </Pressable>
  );
}

export function TravelTextField({
  label,
  value,
  onChangeText,
  placeholder,
  icon = 'search-outline',
  onSubmit,
  trailing,
  compact = false,
  inputRef,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon?: TravelIcon;
  onSubmit?: () => void;
  trailing?: ReactNode;
  compact?: boolean;
  inputRef?: Ref<TextInputInstance>;
}) {
  const theme = useHomeDesign();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        s.field,
        compact && { minHeight: 48, borderRadius: 28, paddingVertical: 8 },
        { backgroundColor: theme.field, borderColor: focused ? theme.primary : theme.border },
      ]}
    >
      <View style={[s.icon, { backgroundColor: compact ? 'transparent' : theme.soft }]}>
        <Ionicons name={icon} size={19} color={theme.primary} />
      </View>
      <View style={s.copy}>
        {!compact ? <Text style={[s.label, { color: theme.muted }]}>{label}</Text> : null}
        <TextInput
          ref={inputRef}
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          style={[s.input, { color: theme.text }]}
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {value ? (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel={`Clear ${label.toLowerCase()}`}
          style={s.clear}
        >
          <Ionicons name="close-circle" size={19} color={theme.muted} />
        </Pressable>
      ) : null}
      {trailing}
    </View>
  );
}

export function TravelSearchButton({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useHomeDesign();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        Keyboard.dismiss();
        onPress();
      }}
      style={[s.button, { backgroundColor: theme.action, opacity: disabled ? 0.45 : 1 }]}
    >
      <Ionicons name="search-outline" size={19} color={theme.background} />
      <Text style={[s.buttonText, { color: theme.background }]}>{title}</Text>
    </Pressable>
  );
}

/** Labeled settings stay within the form instead of becoming separate full-width bars. */
export function TravelOptionRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ id: T; label: string; accessibilityLabel?: string }>;
  onChange: (value: T) => void;
}) {
  const theme = useHomeDesign();
  return (
    <View style={s.optionRow}>
      <Text style={[s.optionLabel, { color: theme.muted }]}>{label}</Text>
      <View style={s.options}>
        {options.map((option) => (
          <Pressable
            key={option.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: option.id === value }}
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            onPress={() => onChange(option.id)}
            style={[
              s.option,
              {
                backgroundColor: option.id === value ? theme.soft : theme.surface,
                borderColor: option.id === value ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[s.optionText, { color: option.id === value ? theme.primary : theme.muted }]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    padding: 16,
    gap: 12,
    borderWidth: 1,
    overflow: 'visible',
    shadowColor: '#0f9b98',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 66,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  compact: { flex: 1, minHeight: 62, paddingHorizontal: 10, gap: 6 },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  icon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 14 },
  value: { fontFamily: Fonts.bodySemiBold, fontSize: 13, lineHeight: 19 },
  input: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    lineHeight: 20,
    padding: 0,
    minHeight: 24,
    textAlignVertical: 'center',
  },
  clear: { width: 32, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  button: {
    minHeight: 48,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  buttonText: { fontFamily: Fonts.bodySemiBold, fontSize: 13 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 },
  optionLabel: { width: 58, fontFamily: Fonts.bodyMedium, fontSize: 11 },
  options: { flex: 1, flexDirection: 'row', gap: 6 },
  option: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 6,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  optionText: { fontFamily: Fonts.bodySemiBold, fontSize: 11, textAlign: 'center' },
});
