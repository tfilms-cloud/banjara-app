import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMessageTime } from '@/components/chat/chatTime';
import { Colors, useIsDarkMode } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { ChatMessage } from '@/types/chat';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

type Props = {
  message: ChatMessage;
  mine: boolean;
  showTail: boolean;
  onRetry?: () => void;
};

function Receipt({ status }: { status: ChatMessage['status'] }) {
  if (status === 'sending') {
    return <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.75)" />;
  }
  if (status === 'failed') {
    return <Ionicons name="alert-circle" size={13} color={Colors.danger} />;
  }
  if (status === 'read') {
    return <Ionicons name="checkmark-done" size={14} color="#B8D4FF" />;
  }
  if (status === 'delivered') {
    return <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.85)" />;
  }
  return <Ionicons name="checkmark" size={13} color="rgba(255,255,255,0.85)" />;
}

function MessageBubbleComponent({ message, mine, showTail, onRetry }: Props) {
  useIsDarkMode();
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

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm + 2,
    paddingBottom: Spacing.sm,
    borderRadius: 18,
    gap: 4,
  },
  mediaBubble: {
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.action,
    borderBottomRightRadius: 6,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 6,
  },
  mineTail: { borderBottomRightRadius: 6 },
  theirsTail: { borderBottomLeftRadius: 6 },
  failed: { opacity: 0.92 },
  image: {
    width: 220,
    height: 220,
    borderRadius: 14,
    backgroundColor: Colors.border,
  },
  text: { ...Typography.body, color: Colors.dark, lineHeight: 20, paddingHorizontal: Spacing.sm },
  mineText: { color: Colors.white },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 2,
    paddingHorizontal: Spacing.sm,
  },
  time: { ...Typography.small, color: Colors.muted, fontSize: 11 },
  mineTime: { color: 'rgba(255,255,255,0.75)' },
  retry: {
    ...Typography.caption,
    color: Colors.danger,
    alignSelf: 'flex-end',
    marginTop: 4,
    marginRight: 4,
  },
});
