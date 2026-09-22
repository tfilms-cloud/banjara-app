import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Brand, Typography } from '@/constants/typography';
import type { Hotel, HotelBooking, HotelRoom } from '@/types/hotel';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

interface HotelConfirmationProps {
  booking: HotelBooking;
  hotel: Hotel;
  room: HotelRoom;
  onDownload?: () => void;
  onShare?: () => void;
}

export function HotelConfirmation({
  booking,
  hotel,
  room,
  onDownload,
  onShare,
}: HotelConfirmationProps) {
  return (
    <View style={styles.card}>
      <LinearGradient colors={[Colors.primary, Colors.softNavy]} style={styles.header}>
        <Text style={styles.brand}>{Brand.name}</Text>
        <Text style={styles.tagline}>Hotel Confirmation</Text>
      </LinearGradient>

      <View style={styles.qrWrap}>
        <View style={styles.qr}>
          {booking.qrPayload.startsWith('http') ? (
            <Image source={{ uri: booking.qrPayload }} style={styles.qrImage} contentFit="contain" />
          ) : (
            <Ionicons name="qr-code" size={88} color={Colors.primary} />
          )}
        </View>
        <Text style={styles.code}>{booking.bookingCode}</Text>
        <Text style={styles.qrHint}>Show this QR at check-in</Text>
      </View>

      <View style={styles.body}>
        <Row label="Hotel" value={hotel.name} />
        <Row label="Address" value={hotel.location.address} />
        <Row label="Guest" value={booking.guest.name} />
        <Row label="Room" value={room.name} />
        <Row
          label="Guests"
          value={`${booking.adults + booking.children} · ${booking.rooms} room${booking.rooms > 1 ? 's' : ''}`}
        />
        <Row label="Check-in" value={formatDate(booking.checkIn)} />
        <Row label="Check-out" value={formatDate(booking.checkOut)} />
        <Row label="Nights" value={`${booking.priceBreakdown.nights}`} />
        <Row label="Payment" value={booking.paymentStatus} />
        <Row
          label="Total"
          value={formatCurrency(booking.priceBreakdown.total, booking.priceBreakdown.currency)}
        />
        <Row label="Policy" value={hotel.cancellationPolicy} />
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={onDownload}>
          <Ionicons name="download-outline" size={18} color={Colors.secondary} />
          <Text style={styles.actionText}>Download</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={onShare}>
          <Ionicons name="share-outline" size={18} color={Colors.secondary} />
          <Text style={styles.actionText}>Share</Text>
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
  header: { padding: Spacing['2xl'] },
  brand: { ...Typography.brand, color: Colors.white, fontSize: 28 },
  tagline: { ...Typography.caption, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  qrWrap: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.md },
  qr: {
    width: 140,
    height: 140,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  qrImage: { width: '100%', height: '100%' },
  code: { ...Typography.h3, color: Colors.primary, letterSpacing: 1 },
  qrHint: { ...Typography.small, color: Colors.muted },
  body: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing.lg, gap: Spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.lg },
  label: { ...Typography.caption, color: Colors.muted },
  value: { ...Typography.bodyBold, color: Colors.primary, flexShrink: 1, textAlign: 'right' },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  actionText: { ...Typography.caption, color: Colors.secondary, fontWeight: '700' },
});
