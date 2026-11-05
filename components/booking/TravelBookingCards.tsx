import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useHomeDesign } from '@/constants/homeDesign';
import { Fonts } from '@/constants/typography';
import { journeyTypeMeta } from '@/constants/journeyTypes';
import type { Booking } from '@/types/booking';
import type { TripWithDetails } from '@/types/trip';
import type { Hotel, HotelBooking, HotelRoom } from '@/types/hotel';
import type { PackageBooking } from '@/types/tourBooking';
import type { GuideBooking } from '@/types/guideBooking';
import {
  bookingNeedsPaymentAction,
  canOpenBookingPayment,
  openBookingPayment,
  paymentActionHint,
  paymentActionLabel,
} from '@/utils/continuePayment';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { formatDuration, formatTime } from '@/utils/formatTime';
import { normalizeMediaUrl } from '@/utils/mediaUrl';
import {
  BookingAction,
  BookingNotice,
  BookingStatusChip,
  BookingSurface,
} from './BookingsPresentation';

function ShortDate({ value }: { value?: string }) {
  return <>{value ? formatDate(value, false) : 'Date to be confirmed'}</>;
}

export function TravelTransportBookingCard({
  booking,
  trip,
  onPress,
  onViewTicket,
}: {
  booking: Booking;
  trip?: TripWithDetails | null;
  onPress?: () => void;
  onViewTicket?: () => void;
}) {
  const theme = useHomeDesign();
  const needsPay = bookingNeedsPaymentAction(booking);
  const canPay = canOpenBookingPayment(booking);
  const canTicket =
    booking.status !== 'cancelled' &&
    booking.status !== 'pending' &&
    !needsPay &&
    Boolean(onViewTicket);
  return (
    <BookingSurface>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View trip booking ${booking.bookingCode || booking.id}`}
        style={s.summary}
      >
        <View style={s.top}>
          <View style={s.flex}>
            <Text style={[s.kicker, { color: theme.muted }]} numberOfLines={2}>
              {[trip?.agency.name || 'Transport booking', trip?.vehicleName]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            <Text style={[s.title, { color: theme.text }]}>
              {trip ? `${trip.from} to ${trip.to}` : 'Trip details'}
            </Text>
          </View>
          <View style={s.badges}>
            {trip ? (
              <Text style={[s.journey, { backgroundColor: theme.field, color: theme.muted }]}>
                {journeyTypeMeta(trip.journeyType).label}
              </Text>
            ) : null}
            <BookingStatusChip status={booking.status} />
          </View>
        </View>
        <View style={[s.metaPanel, { backgroundColor: theme.field }]}>
          <View style={s.metaRow}>
            <Ionicons name="bus-outline" size={15} color={theme.primary} />
            <Text style={[s.metaValue, { color: theme.text }]}>
              <ShortDate value={booking.date} />
              {trip?.departureTime ? ` · ${formatTime(trip.departureTime)}` : ''}
            </Text>
            {trip && trip.durationMinutes > 0 ? (
              <Text style={[s.small, { color: theme.muted }]}>
                ({formatDuration(trip.durationMinutes)})
              </Text>
            ) : null}
          </View>
          {booking.seats.length ? (
            <View style={[s.seatPill, { backgroundColor: theme.surface }]}>
              <Ionicons name="people-outline" size={12} color={theme.primary} />
              <Text style={[s.small, { color: theme.text }]}>Seats {booking.seats.join(', ')}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      {canPay && booking.paymentId ? (
        <>
          <BookingNotice
            text={needsPay ? 'Payment action needed' : 'Payment update'}
            action={paymentActionLabel(booking.paymentStatus)}
            onAction={() =>
              openBookingPayment({
                paymentId: booking.paymentId!,
                bookingId: booking.id,
                method: booking.paymentMethod,
              })
            }
          />
          <Text style={[s.small, { color: theme.muted }]}>
            {paymentActionHint(booking.paymentStatus)}
          </Text>
        </>
      ) : booking.status === 'pending' ? (
        <BookingNotice text="Awaiting provider approval" />
      ) : null}
      <View style={s.footer}>
        <Price
          label="Total fare"
          total={booking.priceBreakdown.total}
          currency={booking.priceBreakdown.currency}
        />
        <BookingAction
          label={canTicket ? 'Ticket' : 'View details'}
          icon={canTicket ? 'qr-code-outline' : 'arrow-forward'}
          soft={canTicket}
          onPress={canTicket ? onViewTicket : onPress}
        />
      </View>
    </BookingSurface>
  );
}

function HotelBookingCover({ booking, hotel }: { booking: HotelBooking; hotel?: Hotel | null }) {
  const theme = useHomeDesign();
  const [failed, setFailed] = useState(false);
  const uri = normalizeMediaUrl(hotel?.images[0]);
  return (
    <View style={[s.cover, { backgroundColor: theme.soft }]}>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          onError={() => setFailed(true)}
          accessibilityLabel={hotel?.name || 'Booked stay'}
        />
      ) : (
        <View style={s.coverFallback}>
          <Ionicons name="bed-outline" size={38} color={theme.primary} />
        </View>
      )}
      <LinearGradient
        colors={['rgba(8,28,27,0.08)', 'transparent', 'rgba(8,28,27,0.75)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.coverTop}>
        <Text style={[s.coverTag, { color: theme.primary, backgroundColor: theme.surface }]}>
          Hotel stay
        </Text>
        <BookingStatusChip status={booking.status} />
      </View>
      <View style={s.coverBottom}>
        <Text style={s.coverCode} numberOfLines={1}>
          {booking.bookingCode ? `CODE: ${booking.bookingCode}` : 'Stay reservation'}
        </Text>
        {booking.priceBreakdown.nights > 0 ? (
          <Text style={s.nights}>
            {booking.priceBreakdown.nights}{' '}
            {booking.priceBreakdown.nights === 1 ? 'night' : 'nights'}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function TravelHotelBookingCard({
  booking,
  hotel,
  room,
  onPress,
}: {
  booking: HotelBooking;
  hotel?: Hotel | null;
  room?: HotelRoom | null;
  onPress?: () => void;
}) {
  const theme = useHomeDesign();
  return (
    <BookingSurface padding={false}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View stay booking ${booking.bookingCode || booking.id}`}
      >
        <HotelBookingCover key={hotel?.images[0] ?? 'no-photo'} booking={booking} hotel={hotel} />
        <View style={s.hotelCopy}>
          <Text style={[s.title, { color: theme.primary }]}>{hotel?.name || 'Hotel booking'}</Text>
          <Text style={[s.body, { color: theme.text }]}>{room?.name || 'Room details'}</Text>
          <View style={s.metaRow}>
            <Ionicons name="calendar-outline" size={14} color={theme.primary} />
            <Text style={[s.small, { color: theme.muted }]}>
              <ShortDate value={booking.checkIn} /> – <ShortDate value={booking.checkOut} />
            </Text>
          </View>
          <View style={s.metaRow}>
            <Ionicons name="people-outline" size={14} color={theme.primary} />
            <Text style={[s.small, { color: theme.muted }]}>
              {booking.adults + booking.children}{' '}
              {booking.adults + booking.children === 1 ? 'guest' : 'guests'} · {booking.rooms}{' '}
              {booking.rooms === 1 ? 'room' : 'rooms'}
            </Text>
          </View>
        </View>
      </Pressable>
      <View style={s.hotelFooter}>
        {booking.status === 'pending' ? (
          <BookingNotice text="Awaiting lodging provider approval" />
        ) : null}
        <View style={s.footer}>
          <Price
            label="Total stay"
            total={booking.priceBreakdown.total}
            currency={booking.priceBreakdown.currency}
            accent
          />
          <BookingAction label="View details" onPress={onPress} />
        </View>
      </View>
    </BookingSurface>
  );
}

export function TravelPackageBookingCard({
  booking,
  onPress,
}: {
  booking: PackageBooking;
  onPress?: () => void;
}) {
  const theme = useHomeDesign();
  return (
    <BookingSurface>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View tour booking ${booking.bookingCode || booking.id}`}
        style={s.serviceTop}
      >
        <ServiceIcon name="compass-outline" />
        <View style={s.flex}>
          <Text style={[s.kicker, { color: theme.muted }]}>
            {booking.tourType?.replace(/_/g, ' ') || 'Tour package'}
          </Text>
          <Text style={[s.title, { color: theme.text }]}>{booking.title}</Text>
          <Text style={[s.small, { color: theme.muted }]}>
            {[
              booking.destination,
              booking.startDate ? `Starts ${formatDate(booking.startDate, false)}` : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
        <BookingStatusChip status={booking.status} />
      </Pressable>
      {booking.status === 'pending' ? (
        <BookingNotice text="Awaiting tour provider approval" />
      ) : null}
      <View style={s.footer}>
        <View style={[s.flex, s.codeStack]}>
          <Text style={[s.countPill, { color: theme.muted, backgroundColor: theme.field }]}>
            {booking.travelers} {booking.travelers === 1 ? 'traveler' : 'travelers'}
          </Text>
          {booking.bookingCode ? (
            <Text style={[s.code, { color: theme.muted }]} numberOfLines={1}>
              {booking.bookingCode}
            </Text>
          ) : null}
        </View>
        <Price total={booking.priceBreakdown.total} currency={booking.priceBreakdown.currency} />
        <BookingAction label="View tour" onPress={onPress} icon="chevron-forward" soft />
      </View>
    </BookingSurface>
  );
}

export function TravelGuideBookingCard({
  booking,
  onPress,
  onMessage,
}: {
  booking: GuideBooking;
  onPress?: () => void;
  onMessage?: () => void;
}) {
  const theme = useHomeDesign();
  return (
    <BookingSurface>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View guide booking ${booking.bookingCode || booking.id}`}
        style={s.serviceTop}
      >
        <ServiceIcon name="id-card-outline" />
        <View style={s.flex}>
          <Text style={[s.kicker, { color: theme.muted }]}>Guide service</Text>
          <Text style={[s.title, { color: theme.text }]}>{booking.serviceName}</Text>
          <Text style={[s.body, { color: theme.primary }]}>{booking.providerName}</Text>
        </View>
        {booking.status !== 'pending' ? <BookingStatusChip status={booking.status} /> : null}
      </Pressable>
      {booking.bookingCode ? (
        <Text style={[s.code, { color: theme.muted }]}>{booking.bookingCode}</Text>
      ) : null}
      <View style={[s.guideMeta, { backgroundColor: theme.field }]}>
        <Ionicons name="calendar-outline" size={15} color={theme.primary} />
        <Text style={[s.guideDate, { color: theme.muted }]}>
          <ShortDate value={booking.date} />
          {booking.startTime ? ` · ${formatTime(booking.startTime)}` : ''}
        </Text>
        <Text style={[s.body, { color: theme.text }]}>
          {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}
        </Text>
      </View>
      {booking.status === 'pending' ? <BookingNotice text="Awaiting guide approval" /> : null}
      <View style={s.footer}>
        <Price
          label="Guide fee"
          total={booking.priceBreakdown.total}
          currency={booking.priceBreakdown.currency}
        />
        <BookingAction
          label={onMessage ? 'Message guide' : 'View guide'}
          onPress={onMessage ?? onPress}
          icon={onMessage ? 'chatbubble-outline' : undefined}
          soft
        />
      </View>
    </BookingSurface>
  );
}

function ServiceIcon({ name }: { name: 'compass-outline' | 'id-card-outline' }) {
  const theme = useHomeDesign();
  return (
    <View style={[s.serviceIcon, { backgroundColor: theme.soft }]}>
      <Ionicons name={name} size={23} color={theme.primary} />
    </View>
  );
}
function Price({
  label,
  total,
  currency,
  accent = false,
}: {
  label?: string;
  total: number;
  currency: string;
  accent?: boolean;
}) {
  const theme = useHomeDesign();
  return (
    <View style={s.priceCopy}>
      {label ? <Text style={[s.small, { color: theme.muted }]}>{label}</Text> : null}
      <Text style={[s.price, { color: accent ? theme.primary : theme.text }]}>
        {formatCurrency(total, currency)}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  summary: { gap: 12 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  badges: { alignItems: 'flex-end', gap: 5, maxWidth: '40%' },
  kicker: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 16 },
  title: { fontFamily: Fonts.displayBold, fontSize: 15, lineHeight: 21 },
  body: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 18 },
  small: { fontFamily: Fonts.body, fontSize: 10, lineHeight: 16 },
  journey: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  metaPanel: { borderRadius: 24, padding: 12, gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  metaValue: { flexShrink: 1, fontFamily: Fonts.bodySemiBold, fontSize: 12, lineHeight: 18 },
  seatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
  },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  priceCopy: { flexShrink: 1, minWidth: 0, gap: 2 },
  price: { fontFamily: Fonts.displayBold, fontSize: 17, lineHeight: 23 },
  cover: { height: 124, overflow: 'hidden' },
  coverFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  coverTop: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  coverTag: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  coverBottom: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  coverCode: { flex: 1, fontFamily: Fonts.bodyBold, fontSize: 10, color: 'rgb(255, 255, 255)' },
  nights: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    color: 'rgb(255, 255, 255)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hotelCopy: { padding: 16, gap: 5 },
  hotelFooter: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  serviceTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeStack: { gap: 4 },
  countPill: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontFamily: Fonts.body,
    fontSize: 10,
  },
  code: { fontFamily: Fonts.bodySemiBold, fontSize: 9, letterSpacing: 0.4, lineHeight: 14 },
  guideMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    borderRadius: 24,
    padding: 10,
  },
  guideDate: { flex: 1, minWidth: 140, fontFamily: Fonts.body, fontSize: 11, lineHeight: 17 },
});
