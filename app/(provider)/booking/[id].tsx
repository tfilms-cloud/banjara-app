import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Colors, useThemeColors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as providerService from '@/services/providerService';
import { useProviderStore } from '@/store/providerStore';
import type { ProviderBooking } from '@/types/provider';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';
import { pushPath } from '@/utils/navigation';

const P2P_AWAITING_PAYMENT = [
  'unpaid',
  'payment_initiated',
  'proof_submitted',
  'under_review',
  'rejected',
  'disputed',
] as const;

function isAwaitingP2PPayment(booking: ProviderBooking) {
  return Boolean(
    booking.paymentId &&
      P2P_AWAITING_PAYMENT.includes(
        booking.paymentStatus as (typeof P2P_AWAITING_PAYMENT)[number]
      )
  );
}

function statusTone(status: ProviderBooking['status']) {
  if (status === 'cancelled' || status === 'rejected') return 'red' as const;
  if (status === 'completed') return 'green' as const;
  if (status === 'pending') return 'amber' as const;
  return 'blue' as const;
}

function paymentTone(status: ProviderBooking['paymentStatus']) {
  if (status === 'paid' || status === 'confirmed') return 'green' as const;
  if (
    status === 'refunded' ||
    status === 'failed' ||
    status === 'rejected' ||
    status === 'disputed' ||
    status === 'expired'
  ) {
    return 'red' as const;
  }
  return 'amber' as const;
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
}) {
  const colors = useThemeColors();
  if (value == null || value === '') return null;
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.muted }]}>{label}</Text>
      <Text
        style={[
          styles.detailValue,
          { color: colors.dark },
          mono && { fontFamily: Fonts.bodySemiBold },
        ]}
      >
        {String(value)}
      </Text>
    </View>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHead}>
        <View style={[styles.cardIcon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={icon} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.cardTitle, { color: colors.dark }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function ProviderBookingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const refreshBookings = useProviderStore((s) => s.refreshBookings);
  const [booking, setBooking] = useState<ProviderBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setError('Booking not found');
      setBooking(null);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const result = await providerService.getProviderBookingById(String(id));
      if (!result) {
        setError('Booking not found');
        setBooking(null);
      } else {
        setBooking(result);
      }
    } catch {
      setError('Could not load booking details');
      setBooking(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  if (loading) return <LoadingState title="Loading booking..." />;
  if (error || !booking) {
    return (
      <ErrorState
        message={error ?? 'Booking not found'}
        onRetry={() => {
          setLoading(true);
          void load();
        }}
      />
    );
  }

  const updateStatus = async (status: ProviderBooking['status']) => {
    setUpdating(true);
    try {
      const updated = await providerService.updateBookingStatus(booking.id, status);
      setBooking(updated);
      await refreshBookings();
      Alert.alert('Updated', `Booking marked as ${status}.`);
    } catch (err) {
      Alert.alert('Update failed', getApiErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  const awaitingPayment = isAwaitingP2PPayment(booking);
  const proofReady =
    booking.paymentStatus === 'proof_submitted' ||
    booking.paymentStatus === 'under_review';

  const amountLabel = formatCurrency(booking.amount, booking.currency);
  const createdLabel = booking.createdAt
    ? `${formatDate(booking.createdAt, true)}`
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Booking Details" showBack fallbackHref="/(provider)/(tabs)/bookings" />
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 40,
          gap: Spacing.md,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heroTop}>
            <Text style={[styles.code, { color: colors.muted }]}>{booking.bookingCode}</Text>
            <Badge label={booking.status} tone={statusTone(booking.status)} />
          </View>
          <Text style={[styles.customerName, { color: colors.dark }]}>{booking.customerName}</Text>
          <Text style={[styles.heroMeta, { color: colors.muted }]}>
            {booking.serviceLabel}
            {booking.routeLabel ? ` · ${booking.routeLabel}` : ''}
          </Text>
          <View style={styles.heroBadges}>
            <Badge label={`Payment · ${booking.paymentStatus}`} tone={paymentTone(booking.paymentStatus)} />
            {booking.seats.length ? (
              <Badge
                label={`${booking.seats.length} seat${booking.seats.length === 1 ? '' : 's'}`}
                tone="blue"
              />
            ) : null}
          </View>
          <Text style={[styles.amount, { color: colors.action }]}>{amountLabel}</Text>
        </View>

        {booking.paymentId &&
        ['proof_submitted', 'under_review', 'payment_initiated', 'unpaid', 'rejected', 'disputed'].includes(
          booking.paymentStatus
        ) ? (
          <Pressable
            style={[styles.verifyCard, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
            onPress={() =>
              pushPath(`/(provider)/payments/verify/${booking.paymentId}`)
            }
          >
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.verifyTitle, { color: colors.primary }]}>
                {booking.paymentStatus === 'proof_submitted' || booking.paymentStatus === 'under_review'
                  ? 'Verify customer payment'
                  : 'Open payment transaction'}
              </Text>
              <Text style={[styles.verifySub, { color: colors.muted }]}>
                Review receipt, chat, and confirm or report an issue
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </Pressable>
        ) : null}

        <SectionCard title="Customer" icon="person-outline">
          <DetailRow label="Name" value={booking.customerName} />
          <DetailRow label="Phone" value={booking.customerPhone || undefined} />
          <DetailRow label="Email" value={booking.customerEmail} />
          <View style={styles.actionRow}>
            {booking.customerPhone ? (
              <Pressable
                style={[styles.miniBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
                onPress={() => Linking.openURL(`tel:${booking.customerPhone.replace(/\s/g, '')}`)}
              >
                <Ionicons name="call-outline" size={16} color={colors.primary} />
                <Text style={[styles.miniBtnText, { color: colors.primary }]}>Call</Text>
              </Pressable>
            ) : null}
            {booking.customerId ? (
              <Pressable
                style={[styles.miniBtn, { borderColor: colors.primarySoft, backgroundColor: colors.primarySoft }]}
                onPress={() =>
                  pushPath(`/(provider)/messages/${booking.customerId}?bookingId=${booking.id}`)
                }
              >
                <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                <Text style={[styles.miniBtnText, { color: colors.primary }]}>Message</Text>
              </Pressable>
            ) : null}
          </View>
        </SectionCard>

        <SectionCard title="Trip / service" icon={booking.kind === 'tour' ? 'compass-outline' : 'bus-outline'}>
          <DetailRow label="Service type" value={booking.serviceLabel} />
          <DetailRow label="Package" value={booking.kind === 'tour' ? booking.detailLabel : undefined} />
          <DetailRow label="Route" value={booking.kind === 'tour' ? undefined : booking.routeLabel} />
          <DetailRow label="From" value={booking.origin} />
          <DetailRow label="To" value={booking.destination} />
          <DetailRow
            label={booking.kind === 'tour' ? 'Start date' : 'Travel date'}
            value={booking.date ? formatDate(booking.date, false) : undefined}
          />
          <DetailRow
            label="Departure"
            value={booking.time ? formatTime(booking.time) : undefined}
          />
          <DetailRow
            label="Arrival"
            value={booking.arrivalTime ? formatTime(booking.arrivalTime) : undefined}
          />
          <DetailRow label="Journey" value={booking.journeyType?.replace(/_/g, ' ')} />
          <DetailRow label="Booking mode" value={booking.bookingMode} />
          <DetailRow label="Hotel" value={booking.hotelName} />
          <DetailRow label="Room" value={booking.roomName} />
          <DetailRow
            label="Check-in"
            value={booking.checkIn ? formatDate(booking.checkIn, false) : undefined}
          />
          <DetailRow
            label="Check-out"
            value={booking.checkOut ? formatDate(booking.checkOut, false) : undefined}
          />
          <DetailRow label="Nights" value={booking.nights} />
          <DetailRow
            label={booking.kind === 'tour' ? 'Travelers' : 'Guests'}
            value={booking.guestsCount ?? (booking.kind === 'tour' ? booking.passengerCount : undefined)}
          />
          <DetailRow label="Rooms" value={booking.roomsCount} />
        </SectionCard>

        {(booking.pickup || booking.dropoff) && (
          <SectionCard title="Pickup & drop-off" icon="location-outline">
            <DetailRow label="Pickup" value={booking.pickup} />
            <DetailRow label="Pickup address" value={booking.pickupAddress} />
            <DetailRow label="Drop-off" value={booking.dropoff} />
            <DetailRow label="Drop-off address" value={booking.dropoffAddress} />
          </SectionCard>
        )}

        {booking.kind === 'transport' ? (
          <SectionCard title="Seats & passengers" icon="people-outline">
            <DetailRow label="Passengers" value={booking.passengerCount} />
            <DetailRow
              label="Selected seats"
              value={booking.seats.length ? booking.seats.join(', ') : undefined}
              mono
            />
            {booking.seats.length ? (
              <View style={styles.seatChips}>
                {booking.seats.map((seat) => (
                  <View
                    key={seat}
                    style={[styles.seatChip, { backgroundColor: colors.actionSoft }]}
                  >
                    <Text style={[styles.seatChipText, { color: colors.actionDark }]}>{seat}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {booking.passengers.length ? (
              <View style={styles.passengerList}>
                {booking.passengers.map((passenger, index) => (
                  <View
                    key={`${passenger.name}-${index}`}
                    style={[styles.passengerCard, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
                  >
                    <Text style={[styles.passengerName, { color: colors.dark }]}>
                      {passenger.name}
                      {passenger.seat ? ` · Seat ${passenger.seat}` : ''}
                    </Text>
                    {passenger.phone ? (
                      <Text style={[styles.passengerMeta, { color: colors.muted }]}>
                        {passenger.phone}
                      </Text>
                    ) : null}
                    {(passenger.age || passenger.gender) && (
                      <Text style={[styles.passengerMeta, { color: colors.muted }]}>
                        {[passenger.gender, passenger.age != null ? `Age ${passenger.age}` : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ) : null}
          </SectionCard>
        ) : null}

        {(booking.vehicleName || booking.vehiclePlate || booking.vehicleType) && (
          <SectionCard title="Vehicle" icon="car-outline">
            <DetailRow label="Name" value={booking.vehicleName} />
            <DetailRow label="Type" value={booking.vehicleType} />
            <DetailRow label="Plate" value={booking.vehiclePlate} mono />
          </SectionCard>
        )}

        <SectionCard title="Payment" icon="card-outline">
          <DetailRow label="Payment status" value={booking.paymentStatus} />
          <DetailRow label="Subtotal" value={booking.subtotal != null ? formatCurrency(booking.subtotal, booking.currency) : undefined} />
          <DetailRow label="Tax" value={booking.tax != null ? formatCurrency(booking.tax, booking.currency) : undefined} />
          <DetailRow label="Service fee" value={booking.serviceFee != null ? formatCurrency(booking.serviceFee, booking.currency) : undefined} />
          <DetailRow label="Discount" value={booking.discount != null && booking.discount > 0 ? formatCurrency(booking.discount, booking.currency) : undefined} />
          <DetailRow label="Total" value={amountLabel} />
        </SectionCard>

        <SectionCard title="Booking record" icon="document-text-outline">
          <DetailRow label="Booking ID" value={booking.id} mono />
          <DetailRow label="Booking code" value={booking.bookingCode} mono />
          <DetailRow label="Status" value={booking.status} />
          <DetailRow label="Created" value={createdLabel} />
          <DetailRow
            label="Updated"
            value={booking.updatedAt ? formatDate(booking.updatedAt, true) : undefined}
          />
          <DetailRow label="Trip notes" value={booking.tripDescription || booking.notes} />
          <DetailRow label="Special requests" value={booking.specialRequests} />
        </SectionCard>

        {booking.status === 'pending' && awaitingPayment ? (
          <>
            <Text style={[styles.sectionLabel, { color: colors.dark }]}>
              {proofReady ? 'Confirm payment to book seats' : 'Waiting for payment'}
            </Text>
            <Text style={[styles.statusHint, { color: colors.muted }]}>
              {proofReady
                ? 'Customer submitted payment proof. Confirm you received the money to book the seats and approve this booking.'
                : 'Seats are only on hold. This booking is confirmed after you verify the customer’s payment — not by Approve.'}
            </Text>
            <Button
              title={proofReady ? 'Verify & confirm payment' : 'Open payment'}
              loading={updating}
              onPress={() => pushPath(`/(provider)/payments/verify/${booking.paymentId}`)}
            />
            <Button
              title="Reject booking"
              variant="outline"
              loading={updating}
              onPress={() =>
                Alert.alert(
                  'Reject booking?',
                  'Seats will be released and the customer will be notified.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Reject',
                      style: 'destructive',
                      onPress: () => void updateStatus('rejected'),
                    },
                  ]
                )
              }
            />
          </>
        ) : booking.status === 'pending' ? (
          <>
            <Text style={[styles.sectionLabel, { color: colors.dark }]}>Approve request</Text>
            <Text style={[styles.statusHint, { color: colors.muted }]}>
              {booking.kind === 'hotel'
                ? 'This stay request stays pending until you approve. Rooms are held for the guest meanwhile.'
                : booking.kind === 'tour'
                  ? 'This package request stays pending until you approve.'
                  : 'This booking stays pending until you approve. Seats are held for the customer meanwhile.'}
            </Text>
            <View style={styles.statusRow}>
              <Button
                title="Approve"
                loading={updating}
                onPress={() =>
                  Alert.alert(
                    'Approve booking?',
                    'The customer will be notified that their booking is confirmed.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Approve', onPress: () => void updateStatus('confirmed') },
                    ]
                  )
                }
                style={{ flex: 1 }}
                fullWidth={false}
              />
              <Button
                title="Reject"
                variant="outline"
                loading={updating}
                onPress={() =>
                  Alert.alert(
                    'Reject booking?',
                    booking.kind === 'hotel'
                      ? 'Held rooms will be released and the guest will be notified.'
                      : booking.kind === 'tour'
                        ? 'The customer will be notified that the package request was rejected.'
                        : 'Seats will be released and the customer will be notified.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Reject',
                        style: 'destructive',
                        onPress: () => void updateStatus('rejected'),
                      },
                    ]
                  )
                }
                style={{ flex: 1 }}
                fullWidth={false}
              />
            </View>
          </>
        ) : booking.status === 'confirmed' || booking.status === 'upcoming' ? (
          <>
            <Text style={[styles.sectionLabel, { color: colors.dark }]}>Update status</Text>
            <Text style={[styles.statusHint, { color: colors.muted }]}>
              This booking is already accepted.
            </Text>
            <Button
              title="Mark completed"
              variant="secondary"
              loading={updating}
              onPress={() => void updateStatus('completed')}
            />
            <Button
              title="Cancel booking"
              variant="ghost"
              loading={updating}
              onPress={() => void updateStatus('cancelled')}
            />
          </>
        ) : (
          <View
            style={[
              styles.finalStatus,
              { backgroundColor: colors.inputBg, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name={
                booking.status === 'completed'
                  ? 'checkmark-circle'
                  : 'close-circle'
              }
              size={18}
              color={
                booking.status === 'completed' ? colors.success : colors.danger
              }
            />
            <Text style={[styles.finalStatusText, { color: colors.dark }]}>
              Booking is {booking.status}. No further accept action needed.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  code: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  customerName: {
    fontFamily: Fonts.displayBold,
    fontSize: 24,
    letterSpacing: -0.3,
  },
  heroMeta: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  amount: {
    fontFamily: Fonts.displayBold,
    fontSize: 22,
    marginTop: 4,
  },
  verifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.lg,
  },
  verifyTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
  },
  verifySub: {
    ...Typography.caption,
    marginTop: 2,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: Fonts.display,
    fontSize: 17,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: 4,
  },
  detailLabel: {
    ...Typography.caption,
    flex: 1,
  },
  detailValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    flex: 1.2,
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  miniBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  miniBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
  seatChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  seatChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  seatChipText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
  passengerList: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  passengerCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 2,
  },
  passengerName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  passengerMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  sectionLabel: {
    ...Typography.h3,
    marginTop: Spacing.sm,
  },
  statusHint: {
    fontFamily: Fonts.body,
    fontSize: 13,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  finalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  finalStatusText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    flex: 1,
  },
});
