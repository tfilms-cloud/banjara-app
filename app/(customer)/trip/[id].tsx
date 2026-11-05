import { useBackendState, useBackendEffect as useEffect } from '@/hooks/useBackendData';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExpandableText } from '@/components/agency/ExpandableText';
import { PickupCard } from '@/components/map/PickupCard';
import { PickupMap } from '@/components/map/PickupMap';
import { mapTravelerFromUser, mapVehicleFromTrip } from '@/components/map/mapParties';
import { AgencyCard } from '@/components/trip/AgencyCard';
import { TripRouteTimeline } from '@/components/trip/TripRouteTimeline';
import { VehicleCard } from '@/components/trip/VehicleCard';
import {
  TripAmenities,
  TripBookingBar,
  TripDetailBadges,
  TripDetailsHeader,
  TripFactGrid,
  TripJourneySummary,
  TripPanel,
  TripPhotoHero,
  TripPriceSummary,
  TripReviewCard,
} from '@/components/trip/TripDetailsPresentation';
import { ErrorState } from '@/components/ui/EmptyState';
import { TripDetailsSkeleton } from '@/components/ui/Skeleton';
import { TravelDesignProvider } from '@/components/ui/TravelDesignProvider';
import { TravelSection } from '@/components/ui/TravelPrimitives';
import { useHomeDesign } from '@/constants/homeDesign';
import { journeyTypeMeta } from '@/constants/journeyTypes';
import { Fonts } from '@/constants/typography';
import { useLocation } from '@/hooks/useLocation';
import { useTrip } from '@/hooks/useTrips';
import * as tripService from '@/services/tripService';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';
import type { Review } from '@/types/trip';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';
import { paramId, pushPath, safeBack } from '@/utils/navigation';
import { tripAvailability, tripPhotos } from '@/utils/tripDetails';

export default function TripDetailsScreen() {
  return (
    <TravelDesignProvider>
      <TripDetailsContent />
    </TravelDesignProvider>
  );
}

function TripDetailsContent() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = paramId(params.id);
  const theme = useHomeDesign();
  const insets = useSafeAreaInsets();
  const { trip, loading, error, refresh } = useTrip(id);
  const setTrip = useBookingStore((state) => state.setTrip);
  const user = useAuthStore((state) => state.user);
  const { location, request } = useLocation();
  const [reviews, setReviews] = useBackendState<Review[]>([]);
  const [previewPickupId, setPreviewPickupId] = useState<string>();
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroFailed, setHeroFailed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void request();
  }, [request]);
  useEffect(() => {
    setPreviewPickupId(undefined);
    setHeroIndex(0);
    setHeroFailed({});
    setReviews([]);
  }, [id]);

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

  const photos = useMemo(() => (trip ? tripPhotos(trip) : []), [trip]);
  const visiblePhotos = photos.filter((uri) => !heroFailed[uri]);
  const onBack = () => safeBack('/(customer)/results');
  const onProfile = () => pushPath('/(customer)/(tabs)/profile');

  if (loading && !trip)
    return (
      <View style={[s.root, { backgroundColor: theme.background }]}>
        <TripDetailsHeader onBack={onBack} onProfile={onProfile} />
        <TripDetailsSkeleton />
      </View>
    );

  if (error || !trip)
    return (
      <View style={[s.root, { backgroundColor: theme.background }]}>
        <TripDetailsHeader onBack={onBack} onProfile={onProfile} />
        <ErrorState
          title="Couldn't load this trip"
          message={error ?? 'This trip is no longer available.'}
          onRetry={() => void refresh(true)}
        />
      </View>
    );

  const { unavailable, canBook } = tripAvailability(trip);
  const selectedPickup =
    trip.pickupLocations.find((point) => point.id === previewPickupId) ?? trip.pickupLocations[0];
  const hasRating = trip.agency.rating > 0 || trip.rating > 0;
  const reviewCount = trip.agency.reviewCount || reviews.length;
  const reviewSummary = hasRating
    ? `${(trip.agency.rating || trip.rating).toFixed(1)} · ${reviewCount} reviews`
    : undefined;

  const onShare = async () => {
    const journey = journeyTypeMeta(trip.journeyType);
    await Share.share({
      message: `Check this Banjara trip (${journey.label}): ${trip.from} → ${trip.to}\n${trip.date ? formatDate(trip.date) : 'Date to be confirmed'} · ${trip.departureTime ? formatTime(trip.departureTime) : 'Time to be confirmed'}\n${journey.customerHint}\nFrom ${formatCurrency(trip.price, trip.currency)} with ${trip.agency.name}`,
    });
  };

  const continueBooking = () => {
    if (!canBook) return;
    setTrip(trip);
    pushPath(`/(customer)/pickup/${trip.id}`);
  };

  return (
    <View style={[s.root, { backgroundColor: theme.background }]}>
      <TripDetailsHeader onBack={onBack} onProfile={onProfile} onShare={() => void onShare()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 132 }}
      >
        <TripPhotoHero
          trip={trip}
          photos={visiblePhotos}
          photoIndex={heroIndex}
          onPhoto={setHeroIndex}
          onPhotoError={(uri) => {
            setHeroFailed((current) => ({ ...current, [uri]: true }));
            setHeroIndex(0);
          }}
        />
        <View style={s.body}>
          <TripDetailBadges trip={trip} unavailable={unavailable} />
          <TripJourneySummary trip={trip} />
          <TripFactGrid trip={trip} />

          <TravelSection compact contained title="Route & transit stops">
            <TripRouteTimeline
              from={trip.from}
              to={trip.to}
              departureTime={trip.departureTime}
              arrivalTime={trip.arrivalTime}
              pickups={trip.pickupLocations}
              stops={trip.stops}
            />
          </TravelSection>

          <TravelSection
            compact
            contained
            title="Choose pickup point"
            accessory={
              <Text style={[s.small, { color: theme.muted }]}>
                {trip.pickupLocations.length}{' '}
                {trip.pickupLocations.length === 1 ? 'location' : 'locations'}
              </Text>
            }
          >
            {trip.pickupLocations.length ? (
              <>
                <View style={[s.map, { borderColor: theme.border }]}>
                  <PickupMap
                    pickups={trip.pickupLocations}
                    selectedPickupId={selectedPickup?.id}
                    onSelectPickup={(point) => setPreviewPickupId(point.id)}
                    userLocation={location}
                    traveler={mapTravelerFromUser(user)}
                    vehicle={mapVehicleFromTrip(trip)}
                    height={196}
                    allowFullscreen
                    showControls
                    showSelectedCard={false}
                    title="Boarding points"
                  />
                </View>
                <View style={s.stack}>
                  {trip.pickupLocations.map((point, index) => (
                    <PickupCard
                      key={point.id}
                      pickup={point}
                      index={index + 1}
                      selected={selectedPickup?.id === point.id}
                      onPress={() => setPreviewPickupId(point.id)}
                    />
                  ))}
                </View>
              </>
            ) : (
              <TripPanel>
                <Text style={[s.empty, { color: theme.muted }]}>
                  Boarding points will appear when the provider publishes them.
                </Text>
              </TripPanel>
            )}
          </TravelSection>

          {trip.amenities.length ? (
            <TravelSection compact contained title="Vehicle amenities">
              <TripAmenities amenities={trip.amenities} />
            </TravelSection>
          ) : null}

          <TravelSection compact contained title="Assigned vehicle">
            <VehicleCard
              vehicle={{
                name: trip.vehicleName,
                type: trip.vehicleType,
                category: trip.vehicleCategory,
                plateNumber: trip.vehiclePlate,
                brand: trip.vehicleBrand,
                model: trip.vehicleModel,
                capacity: trip.vehicleCapacity ?? trip.totalSeats,
                image: trip.image,
                images: visiblePhotos,
              }}
              availableSeats={trip.availableSeats}
              tripTotalSeats={trip.totalSeats}
            />
          </TravelSection>

          <View style={s.provider}>
            <AgencyCard
              agency={trip.agency}
              onPress={() => pushPath(`/(customer)/agency/${trip.agencyId}`)}
              onMessage={
                trip.agency.userId
                  ? () => pushPath(`/(customer)/messages/${trip.agency.userId}`)
                  : undefined
              }
            />
          </View>

          <TravelSection
            compact
            contained
            title="Reviews"
            subtitle={reviewSummary}
            actionLabel="See all"
            onAction={() => pushPath(`/(customer)/agency/${trip.agencyId}`)}
          >
            {reviews.length ? (
              <View style={s.stack}>
                {reviews.slice(0, 3).map((review) => (
                  <TripReviewCard key={review.id} review={review} />
                ))}
              </View>
            ) : (
              <TripPanel>
                <Text style={[s.empty, { color: theme.muted }]}>No reviews yet for this trip.</Text>
              </TripPanel>
            )}
          </TravelSection>

          {trip.description ? (
            <TripPanel style={s.notes}>
              <View style={s.noteHeading}>
                <Ionicons name="information-circle-outline" size={18} color={theme.primary} />
                <Text style={[s.noteTitle, { color: theme.text }]}>Important trip notes</Text>
              </View>
              <ExpandableText text={trip.description} />
            </TripPanel>
          ) : null}

          <TripPriceSummary trip={trip} />
        </View>
      </ScrollView>
      <TripBookingBar
        trip={trip}
        canBook={canBook}
        unavailable={unavailable}
        onContinue={continueBooking}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  body: { padding: 16 },
  small: { fontFamily: Fonts.body, fontSize: 11 },
  stack: { gap: 8 },
  map: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  empty: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 19 },
  provider: { marginTop: 24 },
  notes: { marginTop: 24 },
  noteHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noteTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 13 },
});
