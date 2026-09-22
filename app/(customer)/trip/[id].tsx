import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExpandableText } from '@/components/agency/ExpandableText';
import { PickupMap } from '@/components/map/PickupMap';
import { PickupCard } from '@/components/map/PickupCard';
import { mapTravelerFromUser, mapVehicleFromTrip } from '@/components/map/mapParties';
import { AgencyCard } from '@/components/trip/AgencyCard';
import { JourneyTypePanel } from '@/components/trip/JourneyTypePanel';
import { TripRouteTimeline } from '@/components/trip/TripRouteTimeline';
import { VehicleCard } from '@/components/trip/VehicleCard';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Rating } from '@/components/ui/Rating';
import { TripDetailsSkeleton } from '@/components/ui/Skeleton';
import { Colors } from '@/constants/colors';
import { journeyTypeMeta } from '@/constants/journeyTypes';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { useLocation } from '@/hooks/useLocation';
import { useTrip } from '@/hooks/useTrips';
import * as tripService from '@/services/tripService';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';
import type { Review } from '@/types/trip';
import type { PickupPoint } from '@/types/route';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { formatDuration, formatTime } from '@/utils/formatTime';
import { vehicleTypeLabel } from '@/utils/helpers';
import { normalizeMediaUrl } from '@/utils/mediaUrl';
import { paramId, pushPath, safeBack } from '@/utils/navigation';

const UNAVAILABLE_STATUSES = new Set(['cancelled', 'completed', 'departed']);

export default function TripDetailsScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = paramId(params.id);
  const insets = useSafeAreaInsets();
  const { trip, loading, error, refresh } = useTrip(id);
  const setTrip = useBookingStore((state) => state.setTrip);
  const user = useAuthStore((s) => s.user);
  const { location, request } = useLocation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [previewPickupId, setPreviewPickupId] = useState<string | undefined>();
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroFailed, setHeroFailed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void request();
  }, [request]);

  useEffect(() => {
    if (!id || !trip) return;
    let mounted = true;
    void tripService
      .getTripReviews(id, trip)
      .then((data) => {
        if (mounted) setReviews(data);
      })
      .catch(() => {
        if (mounted) setReviews([]);
      });
    return () => {
      mounted = false;
    };
  }, [id, trip?.id]);

  useEffect(() => {
    if (trip?.pickupLocations?.[0] && !previewPickupId) {
      setPreviewPickupId(trip.pickupLocations[0].id);
    }
  }, [trip?.pickupLocations, previewPickupId]);

  const heroImages = useMemo(() => {
    if (!trip) return [];
    const collected = [...(trip.vehicleImages ?? [])];
    if (trip.image) collected.unshift(trip.image);
    return collected
      .map((uri) => normalizeMediaUrl(uri) ?? uri)
      .filter((uri, index, list) => Boolean(uri) && list.indexOf(uri) === index);
  }, [trip]);

  const visibleHero = heroImages.filter((uri) => !heroFailed[uri]);
  const heroUri = visibleHero[Math.min(heroIndex, Math.max(visibleHero.length - 1, 0))];

  if (loading && !trip) {
    return (
      <View style={styles.container}>
        <Header title="Trip" showBack onBack={() => safeBack('/(customer)/results')} />
        <TripDetailsSkeleton />
      </View>
    );
  }

  if (error || !trip) {
    return (
      <View style={styles.container}>
        <Header title="Trip" showBack onBack={() => safeBack('/(customer)/results')} />
        <ErrorState
          title="Couldn't load this trip"
          message={error ?? 'This trip is no longer available.'}
          onRetry={() => void refresh(true)}
        />
      </View>
    );
  }

  const journey = journeyTypeMeta(trip.journeyType);
  const hasRating = trip.agency.rating > 0 || trip.agency.reviewCount > 0 || trip.rating > 0;
  const reviewCount = trip.agency.reviewCount || reviews.length;
  const unavailable = UNAVAILABLE_STATUSES.has(String(trip.status ?? '').toLowerCase());
  const soldOut = trip.availableSeats <= 0;
  const canBook = !unavailable && !soldOut;
  const departureLabel = [trip.date ? formatDate(trip.date, false) : '', trip.departureTime ? formatTime(trip.departureTime) : '']
    .filter(Boolean)
    .join(' · ');
  const durationLabel = trip.durationMinutes > 0 ? formatDuration(trip.durationMinutes) : '';
  const canMessage = Boolean(trip.agency.userId);

  const onShare = async () => {
    await Share.share({
      message: `Check this Banjara trip (${journey.label}): ${trip.from} → ${trip.to}\n${formatDate(trip.date)} · ${formatTime(trip.departureTime)}\n${journey.customerHint}\nFrom ${formatCurrency(trip.price, trip.currency)} with ${trip.agency.name}`,
    });
  };

  const continueBooking = () => {
    if (!canBook) return;
    setTrip(trip);
    pushPath(`/(customer)/pickup/${trip.id}`);
  };

  return (
    <View style={styles.container}>
      <Header
        title={trip.from && trip.to ? `${trip.from} → ${trip.to}` : 'Trip'}
        showBack
        onBack={() => safeBack('/(customer)/results')}
        right={
          <Pressable onPress={() => void onShare()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Share trip">
            <Ionicons name="share-outline" size={22} color={Colors.dark} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 118 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {heroUri ? (
            <Image
              source={{ uri: heroUri }}
              style={styles.heroImage}
              contentFit="cover"
              transition={200}
              onError={() => setHeroFailed((current) => ({ ...current, [heroUri]: true }))}
              accessibilityLabel={`${trip.vehicleName || 'Vehicle'} on the ${trip.from} to ${trip.to} trip`}
            />
          ) : (
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.heroImage} />
          )}
          <LinearGradient colors={['transparent', 'rgba(11, 31, 51, 0.88)']} style={styles.heroOverlay}>
            <Text style={styles.heroRoute}>
              {trip.from} → {trip.to}
            </Text>
            {departureLabel ? <Text style={styles.heroMeta}>{departureLabel}</Text> : null}
            <View style={styles.heroFacts}>
              <Text style={styles.heroPrice}>{formatCurrency(trip.price, trip.currency)}</Text>
              <Text style={styles.heroSeats}>
                {soldOut ? 'No seats available' : `${trip.availableSeats} seats available`}
              </Text>
            </View>
          </LinearGradient>
          {visibleHero.length > 1 ? (
            <View style={styles.heroDots} accessibilityLabel="Vehicle photos">
              {visibleHero.map((uri, index) => (
                <Pressable
                  key={uri}
                  onPress={() => setHeroIndex(index)}
                  style={[styles.dot, index === heroIndex && styles.dotActive]}
                  accessibilityRole="button"
                  accessibilityLabel={`Photo ${index + 1}`}
                />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.content}>
          <View style={styles.badgeRow}>
            {trip.agency.verified ? <Badge label="Verified provider" tone="green" /> : null}
            <Badge
              label={journey.label}
              tone={journey.value === 'round_trip' ? 'blue' : 'gray'}
            />
            <Badge label={vehicleTypeLabel(trip.vehicleType)} tone="amber" />
            {unavailable ? <Badge label={trip.status ?? 'Unavailable'} tone="red" /> : null}
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryCol}>
              <Text style={styles.city}>{trip.from}</Text>
              {trip.departureTime ? (
                <Text style={styles.time}>{formatTime(trip.departureTime)}</Text>
              ) : null}
            </View>
            <View style={styles.summaryMid}>
              <View style={styles.summaryLine} />
              {durationLabel ? <Text style={styles.duration}>{durationLabel}</Text> : null}
            </View>
            <View style={[styles.summaryCol, styles.summaryEnd]}>
              <Text style={styles.city}>{trip.to}</Text>
              {trip.arrivalTime ? (
                <Text style={styles.time}>{formatTime(trip.arrivalTime)}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.facts}>
            {trip.date ? (
              <Fact label="Date" value={formatDate(trip.date, false)} />
            ) : null}
            {trip.departureTime ? (
              <Fact label="Departs" value={formatTime(trip.departureTime)} />
            ) : null}
            {trip.arrivalTime ? (
              <Fact label="Arrives" value={formatTime(trip.arrivalTime)} />
            ) : null}
            {durationLabel ? <Fact label="Duration" value={durationLabel} /> : null}
            <Fact
              label="Seats"
              value={soldOut ? 'None left' : `${trip.availableSeats} available`}
            />
            <Fact label="Price" value={formatCurrency(trip.price, trip.currency)} />
          </View>

          <Text style={styles.section}>Route</Text>
          <TripRouteTimeline
            from={trip.from}
            to={trip.to}
            departureTime={trip.departureTime}
            arrivalTime={trip.arrivalTime}
            pickups={trip.pickupLocations}
          />

          <Text style={styles.section}>Pickup points</Text>
          {trip.pickupLocations.length > 0 ? (
            <>
              <PickupMap
                pickups={trip.pickupLocations}
                selectedPickupId={previewPickupId}
                onSelectPickup={(point: PickupPoint) => setPreviewPickupId(point.id)}
                userLocation={location}
                traveler={mapTravelerFromUser(user)}
                vehicle={mapVehicleFromTrip(trip)}
                height={240}
                allowFullscreen
                showControls
                showSelectedCard
                title="Boarding points"
              />
              <View style={styles.pickupList}>
                {trip.pickupLocations.map((point, index) => (
                  <PickupCard
                    key={point.id}
                    pickup={point}
                    index={index + 1}
                    selected={previewPickupId === point.id}
                    onPress={() => setPreviewPickupId(point.id)}
                  />
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.emptyCopy}>
              Boarding points will appear here when the provider publishes them.
            </Text>
          )}

          {trip.amenities.length ? (
            <>
              <Text style={styles.section}>Amenities</Text>
              <View style={styles.amenities}>
                {trip.amenities.map((item) => (
                  <View key={item} style={styles.amenity}>
                    <Text style={styles.amenityText}>{item}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.section}>Vehicle</Text>
          <VehicleCard
            vehicle={{
              name: trip.vehicleName,
              type: trip.vehicleType,
              plateNumber: trip.vehiclePlate,
              brand: trip.vehicleBrand,
              model: trip.vehicleModel,
              capacity: trip.vehicleCapacity ?? trip.totalSeats,
              image: trip.image,
              images: trip.vehicleImages,
            }}
            availableSeats={trip.availableSeats}
            tripTotalSeats={trip.totalSeats}
          />

          <Text style={styles.section}>Provider</Text>
          <AgencyCard
            agency={trip.agency}
            linkLabel="View provider"
            onPress={() => pushPath(`/(customer)/agency/${trip.agencyId}`)}
          />
          {canMessage ? (
            <Button
              title="Message provider"
              variant="secondary"
              onPress={() => pushPath(`/(customer)/messages/${trip.agency.userId}`)}
            />
          ) : null}

          <Text style={styles.section}>Reviews</Text>
          {hasRating ? (
            <View style={styles.reviewSummary}>
              <Rating
                value={trip.agency.rating || trip.rating}
                count={reviewCount || undefined}
                size={16}
              />
            </View>
          ) : null}
          {reviews.length ? (
            <View style={styles.reviewList}>
              {reviews.slice(0, 3).map((review) => {
                const displayName =
                  review.userName && review.userName !== 'Guest' ? review.userName : 'Customer';
                return (
                  <Card key={review.id} elevated={false}>
                    <View style={styles.reviewHead}>
                      <Avatar uri={review.userAvatar} name={displayName} size={40} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reviewName}>{displayName}</Text>
                        {review.date ? (
                          <Text style={styles.reviewDate}>{formatDate(review.date, false)}</Text>
                        ) : null}
                      </View>
                      {review.rating > 0 ? <Rating value={review.rating} /> : null}
                    </View>
                    {review.comment.trim() ? (
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    ) : null}
                    {review.providerReply ? (
                      <View style={styles.reply}>
                        <Text style={styles.replyLabel}>Provider reply</Text>
                        <Text style={styles.reviewComment}>{review.providerReply}</Text>
                      </View>
                    ) : null}
                  </Card>
                );
              })}
              <Button
                title="View provider reviews"
                variant="ghost"
                onPress={() => pushPath(`/(customer)/agency/${trip.agencyId}`)}
              />
            </View>
          ) : (
            <Text style={styles.emptyCopy}>No reviews yet for this trip.</Text>
          )}

          {trip.description ? (
            <>
              <Text style={styles.section}>Trip notes</Text>
              <ExpandableText text={trip.description} />
            </>
          ) : null}

          <Text style={styles.section}>Journey</Text>
          <JourneyTypePanel
            journeyType={trip.journeyType}
            from={trip.from}
            to={trip.to}
            returnDate={trip.returnDate}
            returnTime={trip.returnTime}
          />

          <Text style={styles.section}>Price</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Price per passenger</Text>
              <Text style={styles.priceValue}>{formatCurrency(trip.price, trip.currency)}</Text>
            </View>
            <Text style={styles.priceHint}>
              Seat count and the final total are confirmed after you choose seats.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.ctaLabel}>{soldOut ? 'Availability' : 'From'}</Text>
          <Text style={styles.ctaPrice} numberOfLines={1}>
            {soldOut ? 'Sold out' : formatCurrency(trip.price, trip.currency)}
          </Text>
        </View>
        <Button
          title={canBook ? 'Choose pickup' : unavailable ? 'Unavailable' : 'No seats'}
          fullWidth={false}
          disabled={!canBook}
          style={styles.ctaButton}
          onPress={continueBooking}
        />
      </View>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: {
    height: 240,
    backgroundColor: Colors.primary,
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    padding: Spacing.lg,
    gap: 4,
  },
  heroRoute: {
    fontFamily: Fonts.displayBold,
    fontSize: 26,
    lineHeight: 32,
    color: Colors.white,
  },
  heroMeta: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.86)',
  },
  heroFacts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  heroPrice: {
    fontFamily: Fonts.bodyBold,
    fontSize: 20,
    color: Colors.white,
  },
  heroSeats: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.white,
    flexShrink: 1,
    textAlign: 'right',
  },
  heroDots: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    backgroundColor: Colors.white,
  },
  content: {
    padding: Spacing.screen,
    gap: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.soft,
  },
  summaryCol: { flex: 1, minWidth: 0 },
  summaryEnd: { alignItems: 'flex-end' },
  city: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  time: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.dark,
    marginTop: 4,
  },
  summaryMid: {
    alignItems: 'center',
    width: 72,
  },
  summaryLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.action,
    borderRadius: 1,
  },
  duration: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.muted,
    marginTop: 6,
    textAlign: 'center',
  },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  fact: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  factLabel: { ...Typography.small, color: Colors.muted },
  factValue: { ...Typography.bodyBold, color: Colors.dark, marginTop: 4 },
  section: {
    ...Typography.section,
    color: Colors.primary,
    marginTop: Spacing.sm,
  },
  pickupList: { gap: Spacing.sm },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  amenity: {
    backgroundColor: Colors.actionSoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  amenityText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.action,
  },
  emptyCopy: {
    ...Typography.caption,
    color: Colors.muted,
    lineHeight: 20,
  },
  reviewSummary: { marginBottom: 2 },
  reviewList: { gap: Spacing.md },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  reviewName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.dark,
  },
  reviewDate: {
    ...Typography.small,
    color: Colors.muted,
    marginTop: 2,
  },
  reviewComment: {
    ...Typography.body,
    color: Colors.muted,
    lineHeight: 22,
  },
  reply: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 4,
  },
  replyLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.primary,
  },
  priceCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  priceLabel: {
    ...Typography.body,
    color: Colors.muted,
    flex: 1,
  },
  priceValue: {
    ...Typography.h3,
    color: Colors.primary,
  },
  priceHint: {
    ...Typography.caption,
    color: Colors.muted,
    lineHeight: 18,
  },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.md,
    ...Shadows.float,
  },
  ctaLabel: { ...Typography.small, color: Colors.muted },
  ctaPrice: { ...Typography.h3, color: Colors.primary },
  ctaButton: { minWidth: 150, maxWidth: 200 },
});
