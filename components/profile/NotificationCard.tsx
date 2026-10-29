import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import type { AppNotification } from '@/types/booking';
import { formatRelativeTime } from '@/utils/formatDate';

interface NotificationCardProps {
  notification: AppNotification;
  onPress?: () => void;
}

const iconMap: Record<AppNotification['type'], keyof typeof Ionicons.glyphMap> = {
  booking_confirmed: 'checkmark-circle',
  booking_pending: 'hourglass',
  booking_request: 'calendar',
  booking_reminder: 'alarm',
  trip_reminder: 'time',
  pickup_reminder: 'location',
  booking_cancelled: 'close-circle',
  payment_received: 'card',
  payment_failed: 'alert-circle',
  payment_expired: 'timer-outline',
  new_offer: 'pricetag',
  new_review: 'star',
  new_message: 'chatbubble',
  vehicle: 'bus',
  cnic_verified: 'shield-checkmark',
  cnic_failed: 'shield',
  system: 'notifications',
};

export function NotificationCard({ notification, onPress }: NotificationCardProps) {
  const colors = useThemeColors();
  const unread = !notification.read;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: unread ? `${colors.primary}08` : colors.card,
          borderColor: unread ? `${colors.primary}44` : colors.border,
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: `${colors.primary}14` }]}>
        <Ionicons
          name={iconMap[notification.type] ?? 'notifications'}
          size={20}
          color={colors.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.top}>
          <Text style={[styles.title, { color: colors.dark }]} numberOfLines={1}>
            {notification.title}
          </Text>
          {unread ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
        </View>
        <Text style={[styles.message, { color: colors.muted }]} numberOfLines={3}>
          {notification.message}
        </Text>
        <Text style={[styles.time, { color: colors.muted }]}>
          {formatRelativeTime(notification.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  message: {
    ...Typography.body,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  time: {
    fontFamily: Fonts.body,
    fontSize: 11,
    marginTop: 6,
  },
});
