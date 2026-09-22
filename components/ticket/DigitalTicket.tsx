import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { journeyTypeMeta } from '@/constants/journeyTypes';
import { Radius, Spacing } from '@/constants/spacing';
import { Brand, Fonts, Typography } from '@/constants/typography';
import type { Booking } from '@/types/booking';
import type { PickupPoint } from '@/types/route';
import type { TripWithDetails } from '@/types/trip';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';

interface DigitalTicketProps {
  booking: Booking;
  trip: TripWithDetails;
  pickup?: PickupPoint | null;
  qrCode?: string | null;
  offlineSaved?: boolean;
  onDownload?: () => void;
  onShare?: () => void;
}

export function DigitalTicket({
  booking,
  trip,
  pickup,
  qrCode,
  offlineSaved,
  onDownload,
  onShare,
}: DigitalTicketProps) {
  const qrUri = qrCode || booking.qrPayload;
  const showImage = typeof qrUri === 'string' && (qrUri.startsWith('data:') || qrUri.startsWith('http'));
  const journey = journeyTypeMeta(trip.journeyType);

  return (
    <View style={styles.card}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <Text style={styles.brand}>{Brand.name}</Text>
        <Text style={styles.tagline}>{Brand.tagline}</Text>
        {offlineSaved ? <Text style={styles.offlineBadge}>Saved for offline</Text> : null}
      </LinearGradient>

      <View style={styles.qrWrap}>
        <View style={styles.qr}>
          {showImage ? (
            <Image source={{ uri: qrUri }} style={styles.qrImage} contentFit="contain" />
          ) : (
            <Ionicons name="qr-code" size={88} color={Colors.primary} />
          )}
        </View>
        <Text style={styles.code}>{booking.bookingCode}</Text>
        <Text style={styles.hint}>Show this code at boarding</Text>
      </View>

      <View style={styles.body}>
        <Row label="Passenger" value={booking.passengerDetails.name} />
        <Row label="Agency" value={trip.agency.name} />
        <Row label="Vehicle" value={trip.vehicleName} />
        <Row label="Trip type" value={`${journey.label} · ${journey.customerHint}`} />
        <Row label="Route" value={`${trip.from} → ${trip.to}`} />
        <Row label="Date" value={formatDate(booking.date)} />
        <Row
          label="Departure"
          value={`${formatTime(trip.departureTime)} → ${formatTime(trip.arrivalTime)}`}
        />
        {journey.value === 'round_trip' ? (
          <Row
            label="Return"
            value={
              [trip.returnDate ? formatDate(trip.returnDate, false) : null, trip.returnTime ? formatTime(trip.returnTime) : null]
                .filter(Boolean)
                .join(' · ') || `${trip.to} → ${trip.from}`
            }
          />
        ) : null}
        <Row label="Pickup" value={pickup?.name ?? 'Selected pickup'} />
        <Row label="Seat" value={booking.seats.join(', ')} />
        <Row
          label="Amount"
          value={formatCurrency(booking.priceBreakdown.total, booking.priceBreakdown.currency)}
        />
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={onDownload}>
          <Ionicons name="download-outline" size={18} color={Colors.action} />
          <Text style={styles.actionText}>Save offline</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={onShare}>
          <Ionicons name="share-outline" size={18} color={Colors.action} />
          <Text style={styles.actionText}>Share ticket</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    padding: Spacing['2xl'],
  },
  brand: {
    ...Typography.brand,
    color: Colors.white,
    fontSize: 28,
  },
  tagline: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  offlineBadge: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.accent,
  },
  qrWrap: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.sm,
  },
  qr: {
    width: 160,
    height: 160,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    padding: 10,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  code: {
    ...Typography.h3,
    color: Colors.primary,
    letterSpacing: 1,
  },
  hint: {
    ...Typography.caption,
    color: Colors.muted,
  },
  body: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.lg,
  },
  label: {
    ...Typography.caption,
    color: Colors.muted,
  },
  value: {
    ...Typography.bodyBold,
    color: Colors.primary,
    flexShrink: 1,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  actionText: {
    ...Typography.caption,
    color: Colors.action,
    fontWeight: '700',
  },
});
