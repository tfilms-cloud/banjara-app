import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useHomeDesign } from '@/constants/homeDesign';
import { Fonts } from '@/constants/typography';
import type { ChatMessage } from '@/types/chat';
import { normalizeMediaUrl } from '@/utils/mediaUrl';
import { formatMessageTime } from './chatTime';

function ChatImage({ uri, width }: { uri: string; width: number }) {
  const theme = useHomeDesign();
  const [failed, setFailed] = useState(false);
  return failed ? (
    <View style={[s.imageFallback, { width, backgroundColor: theme.field }]}>
      <Ionicons name="image-outline" size={24} color={theme.muted} />
      <Text style={[s.fallbackText, { color: theme.muted }]}>Photo unavailable</Text>
    </View>
  ) : (
    <Image
      source={{ uri: normalizeMediaUrl(uri) ?? uri }}
      style={{ width, aspectRatio: 16 / 9, borderRadius: 4 }}
      contentFit="cover"
      onError={() => setFailed(true)}
      accessibilityLabel="Shared photo"
    />
  );
}

export function TravelMessageBubble({
  message,
  mine,
  showTail,
  onRetry,
}: {
  message: ChatMessage;
  mine: boolean;
  showTail: boolean;
  onRetry?: () => void;
}) {
  const theme = useHomeDesign();
  const { width } = useWindowDimensions();
  const maxWidth = Math.min(width - (mine ? 64 : 92), 360);
  const attachments = (message.attachments ?? []).filter(Boolean);
  const showText = Boolean(message.text && !(message.type === 'image' && message.text === 'Photo'));
  const failed = message.status === 'failed';
  return (
    <View style={{ maxWidth, gap: 3, alignItems: mine ? 'flex-end' : 'flex-start' }}>
      <View
        style={[
          s.bubble,
          {
            maxWidth,
            backgroundColor: mine ? theme.primary : theme.surface,
            borderColor: failed ? theme.coral : mine ? theme.primary : theme.border,
            borderBottomRightRadius: mine && showTail ? 3 : 12,
            borderBottomLeftRadius: !mine && showTail ? 3 : 12,
          },
        ]}
      >
        {message.type === 'trip' ? (
          <View style={s.updateHeading}>
            <Ionicons
              name="trail-sign-outline"
              size={14}
              color={mine ? theme.background : theme.primary}
            />
            <Text style={[s.updateLabel, { color: mine ? theme.background : theme.primary }]}>
              Trip update
            </Text>
          </View>
        ) : null}
        {attachments.map((uri, index) =>
          message.type === 'image' ? (
            <ChatImage key={`${uri}-${index}`} uri={uri} width={maxWidth - 20} />
          ) : (
            <Pressable
              key={`${uri}-${index}`}
              onPress={() => {
                if (/^https?:\/\//i.test(uri)) void Linking.openURL(uri).catch(() => undefined);
              }}
              accessibilityRole="link"
              accessibilityLabel="Open attachment"
              style={[s.attachment, { backgroundColor: mine ? theme.soft : theme.field }]}
            >
              <Ionicons name="document-attach-outline" size={18} color={theme.primary} />
              <Text style={[s.attachmentText, { color: theme.primary }]}>
                Attachment {index + 1}
              </Text>
            </Pressable>
          ),
        )}
        {showText ? (
          <Text style={[s.text, { color: mine ? theme.background : theme.text }]}>
            {message.text}
          </Text>
        ) : null}
      </View>
      <View style={s.meta}>
        <Text style={[s.time, { color: theme.muted }]}>{formatMessageTime(message.createdAt)}</Text>
        {mine ? (
          <Ionicons
            name={
              message.status === 'failed'
                ? 'alert-circle-outline'
                : message.status === 'sending'
                  ? 'time-outline'
                  : message.status === 'read' || message.status === 'delivered'
                    ? 'checkmark-done'
                    : 'checkmark'
            }
            size={13}
            color={failed ? theme.coral : theme.primary}
            accessibilityLabel={message.status}
          />
        ) : null}
        {!mine && message.status === 'read' ? (
          <Text style={[s.time, { color: theme.primary }]}>· Read</Text>
        ) : null}
      </View>
      {failed && onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry sending message"
          style={s.retry}
        >
          <Ionicons name="refresh-outline" size={14} color={theme.coral} />
          <Text style={[s.retryText, { color: theme.coral }]}>Tap to retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  updateHeading: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  updateLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 11, lineHeight: 17 },
  bubble: { padding: 9, borderWidth: 1, borderRadius: 12, gap: 7 },
  text: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 21 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  time: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 16 },
  imageFallback: {
    aspectRatio: 16 / 9,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fallbackText: { fontFamily: Fonts.body, fontSize: 11 },
  attachment: {
    minHeight: 44,
    borderRadius: 8,
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attachmentText: { fontFamily: Fonts.bodyMedium, fontSize: 12 },
  retry: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 6,
  },
  retryText: { fontFamily: Fonts.bodySemiBold, fontSize: 11 },
});
