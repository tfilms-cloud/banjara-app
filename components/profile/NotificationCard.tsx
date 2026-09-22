import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { AppNotification } from '@/types/booking';
import { formatRelativeTime } from '@/utils/formatDate';

interface NotificationCardProps {
  notification: AppNotification;
  onPress?: () => void;
}

const iconMap: Record<AppNotification['type'], keyof typeof Ionicons.glyphMap> = {
  booking_confirmed: 'checkmark-circle',
  trip_reminder: 'time',
  pickup_reminder: 'location',
  booking_cancelled: 'close-circle',
  payment_received: 'card',
  new_offer: 'pricetag',
};

export function NotificationCard({ notification, onPress }: NotificationCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, !notification.read && styles.unread]}
    >
      <View style={styles.icon}>
        <Ionicons
          name={iconMap[notification.type]}
          size={20}
          color={Colors.secondary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.top}>
          <Text style={styles.title}>{notification.title}</Text>
          {!notification.read ? <View style={styles.dot} /> : null}
        </View>
        <Text style={styles.message}>{notification.message}</Text>
        <Text style={styles.time}>{formatRelativeTime(notification.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unread: {
    borderColor: Colors.softBlue,
    backgroundColor: '#F7FBFF',
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.bodyBold,
    color: Colors.primary,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  message: {
    ...Typography.caption,
    color: Colors.muted,
    marginTop: 4,
    lineHeight: 18,
  },
  time: {
    ...Typography.small,
    color: Colors.muted,
    marginTop: 8,
  },
});
