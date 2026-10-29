import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatConversationTime, formatPresenceLabel } from '@/components/chat/chatTime';
import { Avatar } from '@/components/ui/Avatar';
import { type ColorTokens } from '@/constants/colors';
import { Radius, Shadows, Size, Spacing } from '@/constants/spacing';
import { CustomerType, Fonts, Typography } from '@/constants/typography';
import type { ChatConversation } from '@/types/chat';

type Props = {
  item: ChatConversation;
  onPress: () => void;
};

function roleLabel(role?: string) {
  if (!role) return 'Traveler';
  const value = role.toLowerCase();
  if (value.includes('provider') || value.includes('agency') || value.includes('operator')) {
    return 'Provider';
  }
  if (value.includes('admin')) return 'Admin';
  return 'Traveler';
}

export function ConversationRow({ item, onPress }: Props) {
  const styles = useThemedStyles(createStyles);
  const unread = item.unreadCount > 0;
  const role = roleLabel(item.otherUserRole);

  return (
    <Pressable
      style={[styles.card, unread && styles.cardUnread]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${item.otherUserName}${unread ? `, ${item.unreadCount} unread` : ''}`}
    >
      <View style={styles.avatarWrap}>
        <Avatar uri={item.otherUserAvatar} name={item.otherUserName} size={Size.avatar} />
        {item.online ? <View style={styles.online} /> : null}
      </View>
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={[styles.title, unread && styles.titleUnread]} numberOfLines={1}>
            {item.otherUserName}
          </Text>
          <Text style={[styles.time, unread && styles.timeUnread]}>
            {formatConversationTime(item.updatedAt)}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{role}</Text>
          </View>
          <Text style={styles.presence} numberOfLines={1}>
            {formatPresenceLabel(item.online, item.lastSeenAt)}
          </Text>
        </View>

        <View style={styles.bottom}>
          <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={2}>
            {item.lastMessage || 'No messages yet — say hello'}
          </Text>
          {unread ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
            </View>
          ) : null}
        </View>

        {item.bookingId ? (
          <Text style={styles.bookingHint} numberOfLines={1}>
            Linked to a booking
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.soft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
  },
  cardUnread: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  avatarWrap: { position: 'relative', marginTop: 2 },
  online: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  body: { flex: 1, gap: 4, minWidth: 0 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: {
    ...CustomerType.card,
    color: colors.dark,
    flex: 1,
  },
  titleUnread: { color: colors.primaryText },
  time: { ...Typography.caption, color: colors.muted },
  timeUnread: { color: colors.primaryText, fontFamily: Fonts.bodySemiBold },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rolePill: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: colors.muted,
  },
  presence: { ...Typography.small, color: colors.muted, flex: 1 },
  bottom: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 2 },
  preview: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: colors.muted,
    flex: 1,
    lineHeight: 18,
  },
  previewUnread: { color: colors.dark, fontFamily: Fonts.bodySemiBold },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginTop: 2,
  },
  badgeText: { ...Typography.small, color: colors.white, fontWeight: '700' },
  bookingHint: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
  },
});
