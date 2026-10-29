import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as p2p from '@/services/p2pPaymentService';
import * as uploadService from '@/services/uploadService';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

type Props = {
  paymentId: string;
  myRole: 'customer' | 'provider';
  compact?: boolean;
  /** Parent should scroll this composer into view above the keyboard. */
  onComposerFocus?: () => void;
};

export function PaymentChat({ paymentId, myRole, compact, onComposerFocus }: Props) {
  const [messages, setMessages] = useState<p2p.PaymentChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setMessages(await p2p.listPaymentMessages(paymentId));
    } catch (error) {
      Alert.alert('Chat', getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 8000);
    return () => clearInterval(id);
  }, [load]);

  const send = async (payload: { text?: string; imageUrl?: string }) => {
    setSending(true);
    try {
      const msg = await p2p.sendPaymentMessage(paymentId, payload);
      setMessages((prev) => [...prev, msg]);
      setText('');
    } catch (error) {
      Alert.alert('Could not send', getApiErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const onAttach = async () => {
    try {
      setSending(true);
      const picked = await uploadService.pickImage();
      if (!picked) return;
      const uploaded = await uploadService.uploadImage(picked.uri, 'payments', {
        mimeType: picked.mimeType,
        fileName: picked.fileName,
      });
      if (!uploaded.storageRef) throw new Error('Update the server to support private payment attachments.');
      await send({ imageUrl: uploaded.storageRef, text: text.trim() || undefined });
    } catch (error) {
      Alert.alert('Upload failed', getApiErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const handleFocus = () => {
    // Delay so KeyboardAvoidingView / keyboard height settle before scrolling.
    requestAnimationFrame(() => {
      setTimeout(() => onComposerFocus?.(), 120);
    });
  };

  return (
    <View style={[styles.wrap, compact && { minHeight: 220 }]}>
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.lg }} />
      ) : (
        <View style={[styles.messageList, compact && { maxHeight: 200 }]}>
          {messages.length === 0 ? (
            <Text style={styles.empty}>
              No messages yet. Use this chat for payment verification only.
            </Text>
          ) : (
            messages.map((item) => {
              const mine =
                (myRole === 'customer' && item.senderRole === 'customer') ||
                (myRole === 'provider' && item.senderRole === 'provider');
              const system = item.senderRole === 'system';
              return (
                <View
                  key={item.id}
                  style={[
                    styles.bubble,
                    system && styles.systemBubble,
                    mine && !system && styles.mineBubble,
                    !mine && !system && styles.theirsBubble,
                  ]}
                >
                  {!system ? (
                    <Text style={styles.role}>
                      {item.senderRole === 'customer'
                        ? 'Customer'
                        : item.senderRole === 'provider'
                          ? 'Provider'
                          : 'Support'}
                    </Text>
                  ) : null}
                  {item.text ? <Text style={styles.msgText}>{item.text}</Text> : null}
                  {item.referenceNumber ? (
                    <Text style={styles.ref}>Ref: {item.referenceNumber}</Text>
                  ) : null}
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: normalizeMediaUrl(item.imageUrl) ?? item.imageUrl }}
                      style={styles.img}
                      contentFit="cover"
                    />
                  ) : null}
                  <Text style={styles.time}>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      )}

      <View style={styles.composer}>
        <Pressable style={styles.attach} onPress={() => void onAttach()} disabled={sending}>
          <Ionicons name="image-outline" size={20} color={Colors.primary} />
        </Pressable>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          onFocus={handleFocus}
          placeholder="Message about this payment…"
          placeholderTextColor={Colors.muted}
          multiline
          textAlignVertical="top"
          blurOnSubmit={false}
        />
        <Pressable
          style={styles.send}
          disabled={sending || !text.trim()}
          onPress={() => void send({ text: text.trim() })}
        >
          {sending ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Ionicons name="send" size={16} color={Colors.white} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  messageList: { gap: Spacing.sm, paddingVertical: Spacing.sm },
  empty: { ...Typography.caption, color: Colors.muted, textAlign: 'center', padding: Spacing.md },
  bubble: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    maxWidth: '92%',
  },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: Colors.primarySoft,
  },
  mineBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.actionSoft,
  },
  theirsBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.inputBg,
  },
  role: { ...Typography.caption, color: Colors.muted, marginBottom: 2 },
  msgText: { ...Typography.body, color: Colors.dark },
  ref: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.primary, marginTop: 4 },
  img: { width: 160, height: 160, borderRadius: Radius.md, marginTop: 6 },
  time: { ...Typography.caption, color: Colors.muted, marginTop: 4, fontSize: 10 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  attach: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySoft,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: Colors.dark,
    fontFamily: Fonts.bodyMedium,
    backgroundColor: Colors.inputBg,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
});
