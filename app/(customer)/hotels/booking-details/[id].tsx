import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiveLocationShareCard } from '@/components/booking/LiveLocationShareCard';
import { HotelMap } from '@/components/hotels/HotelMap';
import { ActionGrid, type ActionItem } from '@/components/ui/ActionGrid';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Modal } from '@/components/ui/Modal';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { useHotelBooking } from '@/hooks/useHotels';
import * as hotelService from '@/services/hotelService';
import { useHotelCheckInStore } from '@/store/hotelCheckInStore';
import type { Hotel, HotelRoom } from '@/types/hotel';
import {
  canOpenBookingPayment,
  openBookingPayment,
  paymentActionHint,
  paymentActionLabel,
} from '@/utils/continuePayment';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { pushPath } from '@/utils/navigation';

export default function HotelBookingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { booking, loading, setBooking } = useHotelBooking(id);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [room, setRoom] = useState<HotelRoom | null>(null);
  const checkIn = useHotelCheckInStore((s) => (id ? s.byBookingId[id] : undefined));

  useEffect(() => {
    if (!booking) return;
    let mounted = true;
    (async () => {
      const [hotelData, roomData] = await Promise.all([
        hotelService.getHotelById(booking.hotelId),
        hotelService.getRoomById(booking.roomId),
      ]);
      if (!mounted) return;
      setHotel(hotelData);
      setRoom(roomData);
    })();
    return () => {
      mounted = false;
    };
  }, [booking]);

  if (loading) return <LoadingState title="Loading booking..." />;
  if (!booking) return <ErrorState message="Hotel booking not found" />;

  const onCancel = async () => {
    setCancelling(true);
    try {
      const updated = await hotelService.cancelHotelBooking(booking.id);
      setBooking(updated);
      setConfirmCancel(false);
      Alert.alert('Cancelled', 'Your hotel booking has been cancelled.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Hotel Booking" showBack fallbackHref="/(customer)/(tabs)/bookings" />
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 24, gap: Spacing.lg }}
      >
        {checkIn?.customerVisible ? (
          <View style={styles.verifyCard}>
            <View style={styles.verifyHead}>
              <Ionicons name="shield-checkmark" size={22} color={Colors.success} />
              <Text style={styles.verifyTitle}>Checked in — verified</Text>
            </View>
            <Text style={styles.verifyBody}>
              {hotel?.name ?? 'The property'} has checked you in on{' '}
              {new Date(checkIn.checkedInAt).toLocaleString()}. Guest record: {checkIn.guestName} ·{' '}
              {checkIn.roomsAvailed} room(s) · {checkIn.days} night(s) · {checkIn.guests} guests.
              Cross-check this with the front desk if anything looks wrong.
            </Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.top}>
            <Text style={styles.code}>{booking.bookingCode}</Text>
            <Badge
              label={
                checkIn
                  ? 'checked in'
                  : booking.status === 'pending'
                    ? 'Awaiting approval'
                    : booking.status
              }
              tone={
                booking.status === 'cancelled'
                  ? 'red'
                  : checkIn || booking.status === 'completed'
                    ? 'green'
                    : booking.status === 'pending'
                      ? 'amber'
                      : 'blue'
              }
            />
          </View>
          <Text style={styles.title}>{hotel?.name ?? 'Hotel'}</Text>
          <Text style={styles.meta}>{room?.name}</Text>
          <Text style={styles.meta}>
            {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
          </Text>
          {booking.status === 'pending' ? (
            <Text style={[styles.meta, { color: '#B45309', fontWeight: '600', marginTop: 6 }]}>
              Waiting for the lodging provider to approve this stay.
            </Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Guest</Text>
          <Text style={styles.meta}>{booking.guest.name}</Text>
          <Text style={styles.meta}>{booking.guest.email}</Text>
          <Text style={styles.meta}>{booking.guest.phone}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Payment</Text>
          <Text style={styles.meta}>
            {booking.paymentMethod} · {booking.paymentStatus}
          </Text>
          <Text style={styles.meta}>
            Total {formatCurrency(booking.priceBreakdown.total, booking.priceBreakdown.currency)}
          </Text>
          <Text style={styles.meta}>{hotel?.cancellationPolicy}</Text>
        </View>

        {canOpenBookingPayment(booking) && booking.paymentId ? (
          <View style={styles.payCard}>
            <Text style={styles.payTitle}>{paymentActionLabel(booking.paymentStatus)}</Text>
            <Text style={styles.payBody}>{paymentActionHint(booking.paymentStatus)}</Text>
            <Button
              title={paymentActionLabel(booking.paymentStatus)}
              onPress={() =>
                openBookingPayment({
                  paymentId: booking.paymentId!,
                  bookingId: booking.id,
                  method: booking.paymentMethod,
                })
              }
            />
          </View>
        ) : null}

        {hotel ? <HotelMap hotels={[hotel]} height={240} /> : null}

        {(booking.status === 'confirmed' ||
          booking.status === 'completed' ||
          Boolean(checkIn)) && (
          <LiveLocationShareCard
            bookingId={booking.id}
            audience="hotel"
            role="customer"
            title="Share live location with lodging"
          />
        )}

        {booking.status !== 'pending' ? (
          <Button
            title="View Confirmation"
            onPress={() => pushPath(`/(customer)/hotels/confirmation/${booking.id}`)}
          />
        ) : null}

        <ActionGrid
          items={
            [
              booking.providerUserId
                ? {
                    key: 'message',
                    label: 'Message',
                    subtitle: 'Chat with hotel',
                    icon: 'chatbubble-outline' as const,
                    tone: 'blue' as const,
                    onPress: () =>
                      pushPath(
                        `/(customer)/messages/${booking.providerUserId}?bookingId=${booking.id}`
                      ),
                  }
                : null,
              hotel?.phone
                ? {
                    key: 'call',
                    label: 'Call',
                    subtitle: 'Hotel phone',
                    icon: 'call-outline' as const,
                    tone: 'green' as const,
                    onPress: () => Linking.openURL(`tel:${hotel.phone.replace(/\s/g, '')}`),
                  }
                : null,
              booking.status !== 'cancelled' && booking.status !== 'completed' && !checkIn
                ? {
                    key: 'cancel',
                    label: 'Cancel',
                    subtitle: cancelling ? 'Please wait…' : 'Booking',
                    icon: 'close-circle-outline' as const,
                    tone: 'amber' as const,
                    onPress: () => {
                      if (!cancelling) setConfirmCancel(true);
                    },
                  }
                : null,
            ].filter(Boolean) as ActionItem[]
          }
        />
      </ScrollView>

      <Modal
        visible={confirmCancel}
        title="Cancel hotel booking?"
        message="This action cannot be undone. Refunds follow hotel policy."
        confirmLabel={cancelling ? 'Cancelling...' : 'Yes, Cancel'}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={onCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  verifyCard: {
    backgroundColor: Colors.softGreen,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  verifyHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  verifyTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.success },
  verifyBody: { fontFamily: Fonts.body, fontSize: 13, color: Colors.dark, lineHeight: 19 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { ...Typography.bodyBold, color: Colors.secondary },
  title: { ...Typography.h2, color: Colors.primary },
  section: { ...Typography.h3, color: Colors.primary, marginBottom: 4 },
  meta: { ...Typography.body, color: Colors.muted },
  payCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  payTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.primary },
  payBody: { fontFamily: Fonts.body, fontSize: 13, color: Colors.muted, lineHeight: 18 },
});
