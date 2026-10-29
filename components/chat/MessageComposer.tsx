import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

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
        <Ionicons name="add" size={22} color={onAttachPress ? Colors.action : Colors.muted} />
      </Pressable>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Type a message..."
        placeholderTextColor={Colors.muted}
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
        <Ionicons name={sending ? 'hourglass-outline' : 'send'} size={18} color={Colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  attach: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    ...Typography.body,
    color: Colors.dark,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    backgroundColor: Colors.border,
  },
});
