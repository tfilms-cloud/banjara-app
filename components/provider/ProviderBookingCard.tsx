import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { ProviderBooking } from '@/types/provider';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

interface Props {
  booking: ProviderBooking;
  onPress?: () => void;
}

function toneFor(status: ProviderBooking['status']) {
  if (status === 'cancelled' || status === 'rejected') return 'red' as const;
  if (status === 'completed') return 'green' as const;
  if (status === 'pending') return 'amber' as const;
  return 'blue' as const;
}

function serviceIcon(kind: ProviderBooking['kind']): keyof typeof Ionicons.glyphMap {
  if (kind === 'hotel') return 'bed-outline';
  if (kind === 'tour') return 'map-outline';
  return 'bus-outline';
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function ProviderBookingCard({ booking, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.top}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(booking.customerName)}</Text>
        </View>
        <View style={styles.topCopy}>
          <Text style={styles.customer}>{booking.customerName}</Text>
          <Text style={styles.code}>{booking.bookingCode}</Text>
        </View>
        <Badge label={booking.status} tone={toneFor(booking.status)} />
      </View>

      <View style={styles.serviceRow}>
        <View style={styles.serviceIcon}>
          <Ionicons name={serviceIcon(booking.kind)} size={16} color={Colors.secondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.service}>{booking.serviceLabel}</Text>
          <Text style={styles.detail}>
            {booking.routeLabel || booking.detailLabel}
          </Text>
          {booking.pickup ? (
            <Text style={styles.pickup}>Pickup · {booking.pickup}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={Colors.muted} />
          <Text style={styles.meta}>{formatDate(booking.date, false)}</Text>
        </View>
        {booking.time ? (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={Colors.muted} />
            <Text style={styles.meta}>{booking.time}</Text>
          </View>
        ) : null}
        <View style={styles.metaItem}>
          <Ionicons
            name={booking.kind === 'hotel' ? 'bed-outline' : 'people-outline'}
            size={14}
            color={Colors.muted}
          />
          <Text style={styles.meta}>{booking.seatsOrRoom}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amount}>{formatCurrency(booking.amount)}</Text>
        </View>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.secondary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    shadowColor: Colors.primary,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  top: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: { ...Typography.bodyBold, color: Colors.secondary },
  topCopy: { flexGrow: 1, flexShrink: 1, flexBasis: 0, marginRight: Spacing.sm },
  customer: { ...Typography.h3, color: Colors.primary },
  code: { ...Typography.caption, color: Colors.muted },
  serviceRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  serviceIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  service: { ...Typography.caption, color: Colors.muted },
  detail: { ...Typography.bodyBold, color: Colors.primary },
  pickup: { ...Typography.small, color: Colors.muted, marginTop: 2 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { ...Typography.caption, color: Colors.muted, flexShrink: 1 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  amountLabel: { ...Typography.small, color: Colors.muted },
  amount: { ...Typography.h3, color: Colors.primary },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ctaText: { ...Typography.bodyBold, color: Colors.secondary },
});
