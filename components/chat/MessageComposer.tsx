import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTravelPresentation } from '@/components/ui/TravelDesignProvider';
import { useHomeDesign } from '@/constants/homeDesign';
import { Fonts } from '@/constants/typography';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
  disabled?: boolean;
  bottomInset?: number;
  onAttachPress?: () => void;
  onCameraPress?: () => void;
  placeholder?: string;
};

export function MessageComposer({
  value,
  onChangeText,
  onSend,
  sending,
  disabled,
  bottomInset = 0,
  onAttachPress,
  onCameraPress,
  placeholder = 'Type a message…',
}: Props) {
  const travel = useTravelPresentation();
  const theme = useHomeDesign();
  const canSend = Boolean(value.trim()) && !sending && !disabled;

  if (travel)
    return (
      <View
        style={[
          styles.wrap,
          {
            paddingBottom: Math.max(bottomInset, 10),
            paddingTop: 8,
            backgroundColor: theme.surface,
            borderTopWidth: 0,
            gap: 5,
          },
        ]}
      >
        <Pressable
          onPress={onAttachPress}
          disabled={!onAttachPress || sending || disabled}
          accessibilityRole="button"
          accessibilityLabel="Attachments"
          accessibilityState={{ disabled: !onAttachPress || sending || disabled }}
          style={[styles.attach, { backgroundColor: theme.field, borderColor: theme.border }]}
        >
          <Ionicons name="add" size={22} color={theme.text} />
        </Pressable>
        {onCameraPress ? (
          <Pressable
            onPress={onCameraPress}
            disabled={sending || disabled}
            accessibilityRole="button"
            accessibilityLabel="Take a photo"
            style={[styles.attach, { backgroundColor: theme.field, borderColor: theme.border }]}
          >
            <Ionicons name="camera-outline" size={21} color={theme.text} />
          </Pressable>
        ) : null}
        <TextInput
          style={[
            styles.input,
            {
              minWidth: 0,
              backgroundColor: theme.field,
              borderColor: theme.border,
              color: theme.text,
              fontFamily: Fonts.body,
              fontSize: 13,
              borderRadius: 24,
              paddingHorizontal: 12,
              paddingVertical: 11,
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          editable={!disabled && !sending}
          multiline
          maxLength={4000}
          accessibilityLabel="Message input"
          blurOnSubmit={false}
        />
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={sending ? 'Sending' : 'Send message'}
          accessibilityState={{ disabled: !canSend }}
          style={[styles.send, { backgroundColor: canSend ? theme.primary : theme.border }]}
        >
          <Ionicons
            name={sending ? 'hourglass-outline' : 'send-outline'}
            size={19}
            color={canSend ? theme.background : theme.muted}
          />
        </Pressable>
      </View>
    );

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
