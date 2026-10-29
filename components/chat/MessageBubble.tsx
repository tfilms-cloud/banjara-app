import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMessageTime } from '@/components/chat/chatTime';
import { useThemeColors, type ColorTokens } from '@/constants/colors';
import { Radius, Shadows, Size, Spacing } from '@/constants/spacing';
import { CustomerType, Typography } from '@/constants/typography';
import type { ChatMessage } from '@/types/chat';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

type Props = {
  message: ChatMessage;
  mine: boolean;
  showTail: boolean;
  onRetry?: () => void;
};

function Receipt({ status }: { status: ChatMessage['status'] }) {
  const colors = useThemeColors();
  if (status === 'sending') {
    return <Ionicons name="time-outline" size={12} color={colors.white} />;
  }
  if (status === 'failed') {
    return <Ionicons name="alert-circle" size={13} color={colors.danger} />;
  }
  if (status === 'read') {
    return <Ionicons name="checkmark-done" size={14} color={colors.softBlue} />;
  }
  if (status === 'delivered') {
    return <Ionicons name="checkmark-done" size={14} color={colors.white} />;
  }
  return <Ionicons name="checkmark" size={13} color={colors.white} />;
}

function MessageBubbleComponent({ message, mine, showTail, onRetry }: Props) {
  const styles = useThemedStyles(createStyles);

  const failed = message.status === 'failed';
  const images = (message.attachments ?? []).filter(Boolean);
  const showText = Boolean(message.text && message.text !== 'Photo');

  const content = (
    <View
      style={[
        styles.bubble,
        mine ? styles.mine : styles.theirs,
        showTail ? (mine ? styles.mineTail : styles.theirsTail) : null,
        failed && styles.failed,
        images.length ? styles.mediaBubble : null,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${mine ? 'You' : 'Them'}: ${message.text}`}
    >
      {images.map((uri) => (
        <Image
          key={uri}
          source={{ uri: normalizeMediaUrl(uri) ?? uri }}
          style={styles.image}
          contentFit="cover"
        />
      ))}
      {showText ? <Text style={[styles.text, mine && styles.mineText]}>{message.text}</Text> : null}
      <View style={styles.metaRow}>
        <Text style={[styles.time, mine && styles.mineTime]}>{formatMessageTime(message.createdAt)}</Text>
        {mine ? <Receipt status={message.status} /> : null}
      </View>
    </View>
  );

  if (failed && onRetry) {
    return (
      <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel="Retry sending message">
        {content}
        <Text style={styles.retry}>Tap to retry</Text>
      </Pressable>
    );
  }

  return content;
}

export const MessageBubble = memo(MessageBubbleComponent);

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm + 2,
    paddingBottom: Spacing.sm,
    borderRadius: Radius.xl,
    ...Shadows.soft,
    gap: 4,
  },
  mediaBubble: {
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 6,
  },
  mineTail: { borderBottomRightRadius: 6 },
  theirsTail: { borderBottomLeftRadius: 6 },
  failed: { opacity: 0.92 },
  image: {
    width: Size.hero,
    height: Size.hero,
    borderRadius: Radius.lg,
    backgroundColor: colors.border,
  },
  text: { ...CustomerType.body, color: colors.dark, lineHeight: 20, paddingHorizontal: Spacing.sm },
  mineText: { color: colors.white },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 2,
    paddingHorizontal: Spacing.sm,
  },
  time: { ...Typography.small, color: colors.muted, fontSize: 11 },
  mineTime: { color: colors.white },
  retry: {
    ...Typography.caption,
    color: colors.danger,
    alignSelf: 'flex-end',
    marginTop: 4,
    marginRight: 4,
  },
});
