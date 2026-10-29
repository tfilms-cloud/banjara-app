import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useThemeColors, type ColorTokens } from '@/constants/colors';
import { Radius, Size, Spacing } from '@/constants/spacing';
import { CustomerType } from '@/constants/typography';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
  disabled?: boolean;
  bottomInset?: number;
  onAttachPress?: () => void;
};

export function MessageComposer({
  value,
  onChangeText,
  onSend,
  sending,
  disabled,
  bottomInset = 0,
  onAttachPress,
}: Props) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const canSend = Boolean(value.trim()) && !sending && !disabled;

  return (
    <View style={[styles.wrap, { paddingBottom: bottomInset + Spacing.md }]}>
      <Pressable
        style={styles.attach}
        onPress={onAttachPress}
        disabled={!onAttachPress}
        accessibilityRole="button"
        accessibilityLabel="Attachments"
        hitSlop={8}
      >
        <Ionicons name="add" size={22} color={onAttachPress ? colors.action : colors.muted} />
      </Pressable>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Type a message..."
        placeholderTextColor={colors.muted}
        editable={!disabled && !sending}
        multiline
        maxLength={4000}
        accessibilityLabel="Message input"
        blurOnSubmit={false}
      />

      <Pressable
        style={[styles.send, !canSend && styles.sendDisabled]}
        onPress={onSend}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel={sending ? 'Sending' : 'Send message'}
        hitSlop={6}
      >
        <Ionicons name={sending ? 'hourglass-outline' : 'send'} size={18} color={colors.white} />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  attach: {
    width: Size.touch,
    height: Size.touch,
    borderRadius: Radius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: Size.touch,
    maxHeight: 120,
    backgroundColor: colors.inputBg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    textAlignVertical: 'top',
    includeFontPadding: false,
    ...CustomerType.body,
    color: colors.dark,
  },
  send: {
    width: Size.touch,
    height: Size.touch,
    borderRadius: Radius.full,
    backgroundColor: colors.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    backgroundColor: colors.border,
  },
});
