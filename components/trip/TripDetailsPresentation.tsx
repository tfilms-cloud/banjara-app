import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Rating } from '@/components/ui/Rating';
import { TravelIconAction, TravelSurface, type TravelIcon } from '@/components/ui/TravelPrimitives';
import { useHomeDesign } from '@/constants/homeDesign';
import { journeyTypeMeta } from '@/constants/journeyTypes';
import { Fonts } from '@/constants/typography';
import { VEHICLE_TYPE_OPTIONS } from '@/constants/providerOptions';
import { exploreVehicleClass } from '@/utils/exploreTransport';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { formatDuration, formatTime } from '@/utils/formatTime';
import type { Review, TripWithDetails } from '@/types/trip';

export function TripPanel({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useHomeDesign();
  return (
    <TravelSurface style={[s.panel, { borderColor: theme.border }, style]}>
      {children}
    </TravelSurface>
  );
}

export function TripDetailsHeader({
  onBack,
  onShare,
  onProfile,
  title = 'Trip Details',
  shareLabel = 'Share trip',
  onMore,
}: {
  onBack: () => void;
  onShare?: () => void;
  onProfile: () => void;
  title?: string;
  shareLabel?: string;
  onMore?: () => void;
}) {
  const theme = useHomeDesign();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        s.header,
        {
          paddingTop: insets.top + 6,
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <TravelIconAction icon="arrow-back" label="Go back" onPress={onBack} filled />
      <Text
        accessibilityRole="header"
        style={[
          s.headerTitle,
          { color: theme.text },
          onMore && { marginLeft: 0, textAlign: 'left' },
        ]}
      >
        {title}
      </Text>
      <View style={s.headerActions}>
        {onShare ? (
          <TravelIconAction
            icon="share-social-outline"
            label={shareLabel}
            onPress={onShare}
            filled
          />
        ) : (
          <View style={s.actionSpacer} />
        )}
        {onMore ? (
          <TravelIconAction icon="ellipsis-vertical" label="More driver details" onPress={onMore} />
        ) : null}
        <View style={{ backgroundColor: theme.action, borderRadius: 22 }}>
          <TravelIconAction
            icon="person-outline"
            label="Your profile"
            onPress={onProfile}
            color={theme.background}
          />
        </View>
      </View>
    </View>
  );
}

export function TripPhotoHero({
  trip,
  photos,
  photoIndex,
  onPhoto,
  onPhotoError,
}: {
  trip: TripWithDetails;
  photos: string[];
  photoIndex: number;
  onPhoto: (index: number) => void;
  onPhotoError: (uri: string) => void;
}) {
  const theme = useHomeDesign();
  const uri = photos[Math.min(photoIndex, Math.max(photos.length - 1, 0))];
  return (
    <View style={[s.hero, { backgroundColor: theme.action }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          onError={() => onPhotoError(uri)}
          accessibilityLabel={`${trip.vehicleName || 'Vehicle'} for ${trip.from} to ${trip.to}`}
        />
      ) : (
        <View style={s.heroFallback}>
          <Ionicons name="bus-outline" size={70} color={theme.background} />
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(7,27,29,0.24)', 'rgba(7,27,29,0.92)']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      {photos.length > 1 ? (
        <View
          style={s.photoDots}
          accessibilityLabel={`Vehicle photo ${photoIndex + 1} of ${photos.length}`}
        >
          {photos.map((photo, index) => (
            <Pressable
              key={photo}
              onPress={() => onPhoto(index)}
              accessibilityRole="button"
              accessibilityLabel={`Vehicle photo ${index + 1}`}
              accessibilityState={{ selected: photoIndex === index }}
              style={s.photoTarget}
            >
              <View style={[s.dot, { opacity: photoIndex === index ? 1 : 0.45 }]} />
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={s.heroCopy}>
        <Text style={s.heroTitle}>
          {trip.from} → {trip.to}
        </Text>
        <Text style={s.heroDate}>
          {[
            trip.date ? formatDate(trip.date, false) : '',
            trip.departureTime ? formatTime(trip.departureTime) : '',
          ]
            .filter(Boolean)
            .join(' · ') || 'Departure to be confirmed'}
        </Text>
        <View style={s.heroBottom}>
          <Text style={s.heroPrice}>{formatCurrency(trip.price, trip.currency)}</Text>
          <View style={s.seatBadge}>
            <View style={s.seatDot} />
            <Text style={s.seatBadgeText}>
              {trip.availableSeats > 0 ? `${trip.availableSeats} seats available` : 'Sold out'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function DetailBadge({
  label,
  icon,
  coral = false,
}: {
  label: string;
  icon: TravelIcon;
  coral?: boolean;
}) {
  const theme = useHomeDesign();
  return (
    <View style={[s.badge, { backgroundColor: coral ? theme.coralSoft : theme.soft }]}>
      <Ionicons name={icon} size={12} color={coral ? theme.coral : theme.primary} />
      <Text style={[s.badgeText, { color: coral ? theme.coral : theme.primary }]}>{label}</Text>
    </View>
  );
}

export function TripDetailBadges({
  trip,
  unavailable,
}: {
  trip: TripWithDetails;
  unavailable: boolean;
}) {
  const vehicleClass = exploreVehicleClass(trip);
  const vehicle =
    VEHICLE_TYPE_OPTIONS.find((item) => item.value === vehicleClass)?.label ?? 'Vehicle';
  return (
    <View style={s.badges}>
      {trip.agency.verified ? (
        <DetailBadge icon="shield-checkmark" label="Verified provider" />
      ) : null}
      <DetailBadge
        icon={trip.journeyType === 'round_trip' ? 'swap-horizontal' : 'arrow-forward'}
        label={journeyTypeMeta(trip.journeyType).label}
      />
      <DetailBadge icon="bus-outline" label={vehicle} coral />
      {unavailable ? (
        <DetailBadge icon="alert-circle-outline" label={trip.status || 'Unavailable'} coral />
      ) : null}
    </View>
  );
}

export function TripJourneySummary({ trip }: { trip: TripWithDetails }) {
  const theme = useHomeDesign();
  return (
    <TripPanel style={s.journey}>
      <View style={s.journeyEnd}>
        <Text style={[s.city, { color: theme.primary }]}>{trip.from}</Text>
        <Text style={[s.time, { color: theme.text }]}>
          {trip.departureTime ? formatTime(trip.departureTime) : 'TBC'}
        </Text>
        {trip.pickupLocations[0]?.name ? (
          <Text style={[s.small, { color: theme.muted }]} numberOfLines={2}>
            {trip.pickupLocations[0].name}
          </Text>
        ) : null}
      </View>
      <View style={s.journeyMiddle}>
        <View style={s.routeLine}>
          <View style={[s.routeDot, { backgroundColor: theme.action }]} />
          <View style={[s.routeStroke, { backgroundColor: theme.action }]} />
          <Ionicons name="arrow-forward" size={13} color={theme.primary} />
        </View>
        <Text style={[s.journeyDuration, { color: theme.muted }]}>
          {trip.durationMinutes > 0 ? formatDuration(trip.durationMinutes) : 'Duration TBC'}
        </Text>
      </View>
      <View style={[s.journeyEnd, { alignItems: 'flex-end' }]}>
        <Text style={[s.city, { color: theme.primary, textAlign: 'right' }]}>{trip.to}</Text>
        <Text style={[s.time, { color: theme.text }]}>
          {trip.arrivalTime ? formatTime(trip.arrivalTime) : 'TBC'}
        </Text>
        <Text style={[s.small, { color: theme.muted }]}>Arrival</Text>
      </View>
    </TripPanel>
  );
}

export function TripFactGrid({ trip }: { trip: TripWithDetails }) {
  const theme = useHomeDesign();
  const facts: Array<{ label: string; value: string; icon: TravelIcon; accent?: boolean }> = [
    {
      label: 'Travel date',
      value: trip.date ? formatDate(trip.date, false) : 'To be confirmed',
      icon: 'calendar-outline',
    },
    {
      label: 'Departs',
      value: trip.departureTime ? formatTime(trip.departureTime) : 'To be confirmed',
      icon: 'time-outline',
    },
    {
      label: 'Arrives (est.)',
      value: trip.arrivalTime ? formatTime(trip.arrivalTime) : 'To be confirmed',
      icon: 'moon-outline',
    },
    {
      label: 'Total duration',
      value: trip.durationMinutes > 0 ? formatDuration(trip.durationMinutes) : 'To be confirmed',
      icon: 'hourglass-outline',
    },
    {
      label: 'Seat inventory',
      value: `${Math.max(0, trip.availableSeats)} available`,
      icon: 'people-outline',
      accent: true,
    },
    {
      label: 'Base fare',
      value: `${formatCurrency(trip.price, trip.currency)} / ${trip.bookingMode === 'vehicle' ? 'vehicle' : 'seat'}`,
      icon: 'cash-outline',
    },
  ];
  return (
    <View style={s.facts}>
      {facts.map((fact) => (
        <TripPanel key={fact.label} style={s.fact}>
          <View style={s.factLabelRow}>
            <Ionicons name={fact.icon} size={12} color={theme.muted} />
            <Text style={[s.factLabel, { color: theme.muted }]}>{fact.label}</Text>
          </View>
          <Text style={[s.factValue, { color: fact.accent ? theme.primary : theme.text }]}>
            {fact.value}
          </Text>
        </TripPanel>
      ))}
    </View>
  );
}

const AMENITY_ICONS: Record<string, TravelIcon> = {
  AC: 'snow-outline',
  WiFi: 'wifi-outline',
  Charging: 'battery-charging-outline',
  'Charging ports': 'battery-charging-outline',
  Luggage: 'bag-handle-outline',
  'Luggage space': 'bag-handle-outline',
  Refreshments: 'cafe-outline',
  Entertainment: 'play-circle-outline',
  'Comfortable Seats': 'accessibility-outline',
};
export function TripAmenities({ amenities }: { amenities: TripWithDetails['amenities'] }) {
  const theme = useHomeDesign();
  return (
    <View style={s.amenities}>
      {amenities.map((amenity) => (
        <View
          key={amenity}
          style={[s.amenity, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Ionicons
            name={AMENITY_ICONS[amenity] ?? 'checkmark-circle-outline'}
            size={15}
            color={theme.primary}
          />
          <Text style={[s.amenityText, { color: theme.text }]}>{amenity}</Text>
        </View>
      ))}
    </View>
  );
}

export function TripReviewCard({ review }: { review: Review }) {
  const theme = useHomeDesign();
  const name = review.userName && review.userName !== 'Guest' ? review.userName : 'Customer';
  return (
    <TripPanel>
      <View style={s.reviewHeader}>
        <Avatar uri={review.userAvatar} name={name} size={38} />
        <View style={s.flex}>
          <Text style={[s.reviewName, { color: theme.text }]}>{name}</Text>
          {review.date ? (
            <Text style={[s.small, { color: theme.muted }]}>{formatDate(review.date, false)}</Text>
          ) : null}
        </View>
        {review.rating > 0 ? <Rating value={review.rating} size={13} /> : null}
      </View>
      {review.comment.trim() ? (
        <Text style={[s.reviewBody, { color: theme.muted }]}>{review.comment}</Text>
      ) : null}
      {review.providerReply ? (
        <View style={[s.reply, { backgroundColor: theme.field }]}>
          <Text style={[s.replyLabel, { color: theme.primary }]}>Provider replied</Text>
          <Text style={[s.replyBody, { color: theme.muted }]}>{review.providerReply}</Text>
        </View>
      ) : null}
    </TripPanel>
  );
}

export function TripPriceSummary({ trip }: { trip: TripWithDetails }) {
  const theme = useHomeDesign();
  const journey = journeyTypeMeta(trip.journeyType);
  return (
    <TripPanel style={s.pricePanel}>
      <View style={s.priceJourney}>
        <View style={s.flex}>
          <Text style={[s.priceJourneyTitle, { color: theme.text }]}>
            Going: {trip.from} → {trip.to}
          </Text>
          <Text style={[s.small, { color: theme.muted }]}>
            {[
              trip.date ? formatDate(trip.date, false) : '',
              trip.departureTime ? `${formatTime(trip.departureTime)} departure` : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
        <DetailBadge
          icon={journey.value === 'round_trip' ? 'swap-horizontal' : 'arrow-forward'}
          label={journey.label}
        />
      </View>
      {journey.value === 'round_trip' ? (
        <Text style={[s.small, { color: theme.muted }]}>
          Return:{' '}
          {[
            trip.returnDate ? formatDate(trip.returnDate, false) : 'Date to be confirmed',
            trip.returnTime ? formatTime(trip.returnTime) : '',
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      ) : null}
      <View style={[s.priceDivider, { backgroundColor: theme.border }]} />
      <View style={s.priceRow}>
        <Text style={[s.priceLabel, { color: theme.muted }]}>
          {trip.bookingMode === 'vehicle' ? 'Price per vehicle' : 'Price per passenger'}
        </Text>
        <Text style={[s.priceValue, { color: theme.text }]}>
          {formatCurrency(trip.price, trip.currency)}
        </Text>
      </View>
      <View style={s.factLabelRow}>
        <Ionicons name="information-circle-outline" size={14} color={theme.primary} />
        <Text style={[s.priceHint, { color: theme.primary }]}>
          Review the final total before confirming your booking.
        </Text>
      </View>
    </TripPanel>
  );
}

export function TripBookingBar({
  trip,
  canBook,
  unavailable,
  onContinue,
}: {
  trip: TripWithDetails;
  canBook: boolean;
  unavailable: boolean;
  onContinue: () => void;
}) {
  const theme = useHomeDesign();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        s.bookingBar,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <View style={s.flex}>
        <Text style={[s.bookingLabel, { color: theme.muted }]}>
          {canBook ? 'FROM' : 'AVAILABILITY'}
        </Text>
        <Text style={[s.bookingPrice, { color: theme.text }]}>
          {unavailable
            ? 'Unavailable'
            : trip.availableSeats <= 0
              ? 'Sold out'
              : formatCurrency(trip.price, trip.currency)}
        </Text>
        {canBook ? (
          <Text style={[s.small, { color: theme.muted }]}>
            / {trip.bookingMode === 'vehicle' ? 'vehicle' : 'seat'}
          </Text>
        ) : null}
      </View>
      <Button
        title={canBook ? 'Choose pickup' : unavailable ? 'Unavailable' : 'No seats'}
        onPress={onContinue}
        disabled={!canBook}
        fullWidth={false}
        style={s.bookingButton}
        icon={<Ionicons name="arrow-forward" size={16} color={theme.background} />}
        iconPosition="right"
      />
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  panel: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 10 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    flex: 1,
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    textAlign: 'center',
    marginLeft: 44,
  },
  headerActions: { flexDirection: 'row', gap: 4 },
  actionSpacer: { width: 44 },
  hero: { height: 240, overflow: 'hidden' },
  heroFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { position: 'absolute', left: 16, right: 16, bottom: 18, gap: 5 },
  heroTitle: {
    fontFamily: Fonts.displayBold,
    fontSize: 25,
    lineHeight: 31,
    color: 'rgb(255, 255, 255)',
  },
  heroDate: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 18, color: 'rgb(255, 255, 255)' },
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  heroPrice: { fontFamily: Fonts.bodyBold, fontSize: 18, color: 'rgb(255, 255, 255)' },
  seatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  seatDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#99e6dc' },
  seatBadgeText: { fontFamily: Fonts.bodyMedium, fontSize: 10, color: 'rgb(255, 255, 255)' },
  photoDots: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    backgroundColor: 'rgba(7,27,29,0.35)',
    borderRadius: 22,
  },
  photoTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgb(255, 255, 255)' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeText: { fontFamily: Fonts.bodySemiBold, fontSize: 10, textTransform: 'uppercase' },
  journey: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 8 },
  journeyEnd: { flex: 1, minWidth: 0, gap: 3 },
  city: { fontFamily: Fonts.bodySemiBold, fontSize: 13, lineHeight: 18 },
  time: { fontFamily: Fonts.displayBold, fontSize: 19, lineHeight: 25 },
  small: { fontFamily: Fonts.body, fontSize: 10, lineHeight: 15 },
  journeyMiddle: { width: 64, alignItems: 'center', gap: 6 },
  routeLine: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  routeDot: { width: 6, height: 6, borderRadius: 3 },
  routeStroke: { height: 1, width: 34 },
  journeyDuration: { fontFamily: Fonts.bodyMedium, fontSize: 10, textAlign: 'center' },
  facts: { marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fact: {
    width: '48%',
    flexGrow: 1,
    minWidth: 0,
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 5,
  },
  factLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  factLabel: { fontFamily: Fonts.body, fontSize: 10 },
  factValue: { fontFamily: Fonts.bodySemiBold, fontSize: 12, lineHeight: 18 },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  amenityText: { fontFamily: Fonts.bodyMedium, fontSize: 12 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewName: { fontFamily: Fonts.bodySemiBold, fontSize: 13 },
  reviewBody: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 21 },
  reply: { borderRadius: 22, padding: 12, gap: 5 },
  replyLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 11 },
  replyBody: { fontFamily: Fonts.body, fontSize: 11, lineHeight: 17 },
  pricePanel: { marginTop: 24 },
  priceJourney: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceJourneyTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 12, lineHeight: 18 },
  priceDivider: { height: StyleSheet.hairlineWidth, marginVertical: 3 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceLabel: { flex: 1, fontFamily: Fonts.body, fontSize: 12 },
  priceValue: { fontFamily: Fonts.displayBold, fontSize: 19 },
  priceHint: { flexShrink: 1, fontFamily: Fonts.body, fontSize: 10, lineHeight: 16 },
  bookingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
  },
  bookingLabel: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 15 },
  bookingPrice: { fontFamily: Fonts.displayBold, fontSize: 19, lineHeight: 25 },
  bookingButton: { borderRadius: 18, minHeight: 48, paddingHorizontal: 18 },
});
