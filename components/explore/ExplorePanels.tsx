import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ExploreFilterChips, ThumbnailGrid } from '@/components/explore/ThumbnailGrid';
import { HomeSection } from '@/components/travel/HomeSection';
import { DestinationCard } from '@/components/travel/DestinationCard';
import { AgencyTripSummaryCard } from '@/components/trip/AgencyTripSummaryCard';
import { LocationPinSheet, formatPickedCity } from '@/components/location/LocationPinSheet';
import { useThemeColors } from '@/constants/colors';
import {
  GUIDE_GENDERS,
  RESIDENCE_CLASSES,
  TOUR_TYPES,
  VEHICLE_CLASSES,
  mapHotelResidenceClass,
  mapTripVehicleClass,
  type ExploreServiceTab,
  type ExploreThumb,
  type GuideGender,
  type ResidenceClass,
  type TourType,
  type VehicleClass,
} from '@/constants/exploreCatalog';
import { POPULAR_DESTINATIONS, FEATURED_STORIES } from '@/constants/destinations';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { useBestTourOperators, useTourCatalog } from '@/hooks/useTourItineraries';
import { useLocation } from '@/hooks/useLocation';
import { groupTripsByAgency } from '@/utils/groupTripsByAgency';
import type { Hotel } from '@/types/hotel';
import type { Provider } from '@/types/provider';
import type { Restaurant } from '@/types/restaurant';
import type { TourItinerary } from '@/types/tourItinerary';
import type { TripWithDetails } from '@/types/trip';
import { formatCurrency } from '@/utils/formatCurrency';
import { pushPath } from '@/utils/navigation';
import {
  rankMostVisited,
  rankRestaurantsByOffers,
  rankRestaurantsNearOffers,
} from '@/services/restaurantService';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80&auto=format&fit=crop';
const RESTO_FALLBACK =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80&auto=format&fit=crop';

type ExplorePanelsProps = {
  tab: ExploreServiceTab;
  trips?: TripWithDetails[];
  hotels?: Hotel[];
  restaurants?: Restaurant[];
  guides?: Provider[];
  tourProviders?: Provider[];
  compact?: boolean;
  onOpenDestination?: (name: string) => void;
  onSearchRestaurants?: (city: string) => void;
};

function EmptyCatalog({ title, message }: { title: string; message: string }) {
  const colors = useThemeColors();
  return (
    <View style={[styles.emptyBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <Text style={[styles.emptyTitle, { color: colors.dark }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: colors.muted }]}>{message}</Text>
    </View>
  );
}

function hotelThumbs(hotels: Hotel[], residence: ResidenceClass): ExploreThumb[] {
  return hotels
    .filter((h) => mapHotelResidenceClass(h.hotelType) === residence)
    .sort((a, b) => b.rating - a.rating)
    .map((h) => ({
      id: h.id,
      title: h.name,
      subtitle: h.location.city,
      image: h.images[0] || FALLBACK_IMAGE,
      rating: h.rating,
      href: `/(customer)/hotels/${h.id}`,
      badge: residence === 'lodge' ? 'Lodge' : residence === 'guest_house' ? 'Guest' : 'Hotel',
      meta: h.priceFrom > 0 ? `From ${formatCurrency(h.priceFrom)}` : undefined,
    }));
}

/** Vehicle listings published by transporters (from live trips). */
function tripVehicleThumbs(trips: TripWithDetails[]): Array<ExploreThumb & { vehicleClass: VehicleClass }> {
  const byVehicle = new Map<string, ExploreThumb & { vehicleClass: VehicleClass }>();
  for (const trip of trips) {
    const vehicleClass = mapTripVehicleClass(trip.vehicleType);
    const key = `${trip.agencyId}-${trip.vehicleType}-${trip.vehicleName || trip.vehicleId || trip.id}`;
    if (byVehicle.has(key)) continue;
    byVehicle.set(key, {
      id: key,
      title: trip.vehicleName || trip.vehicleType || 'Vehicle',
      subtitle: trip.agency?.name || 'Transporter',
      image: trip.image || trip.vehicleImages?.[0] || FALLBACK_IMAGE,
      rating: trip.agency?.rating || trip.rating,
      badge: vehicleClass.replace('_', ' '),
      href: `/(customer)/agency/${trip.agencyId}`,
      meta: `${trip.from} → ${trip.to}`,
      vehicleClass,
    });
  }
  return Array.from(byVehicle.values());
}

function tripProviderThumbs(trips: TripWithDetails[]): ExploreThumb[] {
  return groupTripsByAgency(trips).map((g) => ({
    id: g.agencyId,
    title: g.agency.name,
    subtitle: `${g.tripCount} trip${g.tripCount === 1 ? '' : 's'}`,
    image: g.agency.logo || g.trips[0]?.image || g.trips[0]?.vehicleImages?.[0] || FALLBACK_IMAGE,
    rating: g.agency.rating,
    meta: g.routes[0],
    href: `/(customer)/agency/${g.agencyId}`,
  }));
}

/** Deals / offerings from lodging providers (featured, popular, breakfast, free cancel). */
function hotelOfferThumbs(hotels: Hotel[], residence?: ResidenceClass): ExploreThumb[] {
  let list = [...hotels];
  if (residence) {
    list = list.filter((h) => mapHotelResidenceClass(h.hotelType) === residence);
  }
  return list
    .filter(
      (h) =>
        h.featured ||
        h.popular ||
        h.breakfastIncluded ||
        h.freeCancellation ||
        h.amenities?.includes('Breakfast')
    )
    .sort((a, b) => b.rating - a.rating || a.priceFrom - b.priceFrom)
    .map((h) => ({
      id: `offer-${h.id}`,
      title: h.name,
      subtitle: [
        h.breakfastIncluded || h.amenities?.includes('Breakfast') ? 'Breakfast' : null,
        h.freeCancellation ? 'Free cancel' : null,
        h.location.city,
      ]
        .filter(Boolean)
        .join(' · '),
      image: h.images[0] || FALLBACK_IMAGE,
      rating: h.rating,
      badge: h.featured || h.popular ? 'Deal' : 'Offer',
      href: `/(customer)/hotels/${h.id}`,
      meta: h.priceFrom > 0 ? `From ${formatCurrency(h.priceFrom)}` : undefined,
    }));
}

function restaurantThumbs(list: Restaurant[], badge?: string): ExploreThumb[] {
  return list.map((r) => {
    const topOffer = r.offers.find((o) => o.active);
    const offerBadge =
      badge ||
      (topOffer?.type === 'sale'
        ? 'Sale'
        : topOffer?.type === 'discount'
          ? topOffer.discountPercent
            ? `${topOffer.discountPercent}% off`
            : 'Deal'
          : topOffer
            ? 'Offer'
            : undefined);
    return {
      id: r.id,
      title: r.name,
      subtitle: r.cuisine.slice(0, 2).join(' · ') || r.city,
      image: r.images[0] || RESTO_FALLBACK,
      rating: r.rating || undefined,
      badge: offerBadge,
      href: `/(customer)/restaurants/${r.id}`,
      meta: topOffer?.title || r.city,
    };
  });
}

function providerThumbs(list: Provider[], hrefPrefix: string): ExploreThumb[] {
  return list.map((p) => ({
    id: p.id,
    title: p.businessName,
    subtitle: p.city,
    image: p.logo || p.tour?.images?.[0] || FALLBACK_IMAGE,
    rating: p.rating || undefined,
    href: `${hrefPrefix}${p.id}`,
    meta: p.tour?.destination || p.description?.slice(0, 40),
  }));
}

function guideDisplayName(p: Provider) {
  const owner = String(p.ownerName ?? '').trim();
  if (owner) return owner.split(/\s+/)[0] || owner;
  return p.businessName || 'Guide';
}

function guideThumbs(list: Provider[], gender: GuideGender): ExploreThumb[] {
  return list
    .filter((p) => {
      const g = String(p.tour?.gender ?? '').toLowerCase();
      if (!g) return true;
      return g === gender;
    })
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0))
    .map((p) => {
      const reg = p.tour?.regionalLanguages?.length ?? 0;
      const intl = p.tour?.internationalLanguages?.length ?? 0;
      const years = p.tour?.yearsExperience ?? p.yearsExperience;
      const langLine = `Languages ${reg} reg. ${intl} intl.`;
      return {
        id: p.id,
        title: guideDisplayName(p),
        subtitle: years ? `${years} yrs · ${langLine}` : langLine,
        image: p.logo || p.tour?.images?.[0] || FALLBACK_IMAGE,
        rating: p.rating || undefined,
        badge: p.tour?.gender === 'female' ? 'Female' : p.tour?.gender === 'male' ? 'Male' : undefined,
        href: `/(customer)/guides/${p.id}`,
        meta: langLine,
      };
    });
}

function itineraryThumbs(list: TourItinerary[], badge?: string): ExploreThumb[] {
  return list.map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: item.destination,
    image: item.coverImage || item.images[0] || FALLBACK_IMAGE,
    rating: item.provider?.rating || undefined,
    badge: badge || item.tourType,
    href: `/(customer)/tours/${item.id}`,
    meta:
      item.pricePerPerson > 0
        ? `${item.durationDays}d · ${formatCurrency(item.pricePerPerson)}`
        : `${item.durationDays} days`,
  }));
}

function ToursPanel({ compact }: { compact?: boolean }) {
  const [tourType, setTourType] = useState<TourType>('trek');
  const { catalog } = useTourCatalog(tourType);
  const { operators } = useBestTourOperators(12);

  const featured = itineraryThumbs(catalog?.featured ?? [], 'Featured');
  const popular = itineraryThumbs(catalog?.popular ?? [], 'Popular');
  const newest = itineraryThumbs(catalog?.newest ?? [], 'New');
  const bestOps: ExploreThumb[] = operators.map((op) => ({
    id: op.id,
    title: op.businessName,
    subtitle: op.city || undefined,
    image: op.logo || FALLBACK_IMAGE,
    rating: op.rating || undefined,
    badge: op.verified ? 'Verified' : undefined,
    href: `/(customer)/agency/${op.id}`,
    meta: op.itineraryCount
      ? `${op.itineraryCount} package${op.itineraryCount === 1 ? '' : 's'}`
      : op.yearsExperience
        ? `${op.yearsExperience} yrs`
        : undefined,
  }));

  return (
    <>
      <HomeSection title="Tour type" subtitle="Treks, expeditions & summits from operators">
        <ExploreFilterChips options={TOUR_TYPES} value={tourType} onChange={setTourType} />
      </HomeSection>

      <HomeSection
        title="Featured itineraries"
        subtitle={`${TOUR_TYPES.find((t) => t.id === tourType)?.label ?? 'Tour'} packages highlighted by BANJARA`}
      >
        {featured.length ? (
          <ThumbnailGrid items={featured} columns={4} rows={compact ? 2 : 3} showMoreLabel="Show more" />
        ) : (
          <EmptyCatalog
            title="No featured packages yet"
            message="Featured itineraries appear after operators publish and admin features them."
          />
        )}
      </HomeSection>

      <HomeSection title="Popular" subtitle="Great value packages travelers can open">
        {popular.length ? (
          <ThumbnailGrid items={popular} columns={4} rows={compact ? 2 : 3} showMoreLabel="Show more" />
        ) : (
          <EmptyCatalog
            title="No popular packages yet"
            message="Published itineraries for this tour type will show here."
          />
        )}
      </HomeSection>

      <HomeSection title="Newest" subtitle="Recently published by tour operators">
        {newest.length ? (
          <ThumbnailGrid items={newest} columns={4} rows={compact ? 2 : 3} showMoreLabel="Show more" />
        ) : (
          <EmptyCatalog
            title="Nothing new yet"
            message="When operators add packages and admin approves them, they land here."
          />
        )}
      </HomeSection>

      <HomeSection title="Best tour operators" subtitle="Ranked by experience, ratings and live packages">
        {bestOps.length ? (
          <ThumbnailGrid items={bestOps} columns={4} rows={compact ? 2 : 3} showMoreLabel="Show more" />
        ) : (
          <EmptyCatalog
            title="No operators ranked yet"
            message="Operators with published itineraries appear in this row."
          />
        )}
      </HomeSection>
    </>
  );
}

export function ExplorePanels({
  tab,
  trips = [],
  hotels = [],
  restaurants = [],
  guides = [],
  tourProviders = [],
  compact,
  onOpenDestination,
  onSearchRestaurants,
}: ExplorePanelsProps) {
  const colors = useThemeColors();
  const [vehicleClass, setVehicleClass] = useState<VehicleClass | 'all'>('all');
  const [residence, setResidence] = useState<ResidenceClass>('hotel');
  const [guideGender, setGuideGender] = useState<GuideGender>('male');
  const [restoCity, setRestoCity] = useState('');
  const [searchedCity, setSearchedCity] = useState('');
  const { location: userLocation, request: requestLocation } = useLocation();
  const [destinationMapOpen, setDestinationMapOpen] = useState(false);

  useEffect(() => {
    if (tab === 'restaurants') void requestLocation();
  }, [tab, requestLocation]);

  const allVehicles = useMemo(() => tripVehicleThumbs(trips), [trips]);

  const availableClasses = useMemo(() => {
    const present = new Set(allVehicles.map((v) => v.vehicleClass));
    return VEHICLE_CLASSES.filter((v) => present.has(v.id));
  }, [allVehicles]);

  const vehicleItems = useMemo(() => {
    if (vehicleClass === 'all') return allVehicles;
    return allVehicles.filter((v) => v.vehicleClass === vehicleClass);
  }, [allVehicles, vehicleClass]);

  const transporterItems = useMemo(() => tripProviderThumbs(trips), [trips]);

  const residenceClassesWithData = useMemo(() => {
    const present = new Set(hotels.map((h) => mapHotelResidenceClass(h.hotelType)));
    return RESIDENCE_CLASSES.filter((r) => present.has(r.id));
  }, [hotels]);

  const activeResidence =
    residenceClassesWithData.some((r) => r.id === residence)
      ? residence
      : residenceClassesWithData[0]?.id ?? residence;

  const residenceItems = useMemo(
    () => hotelThumbs(hotels, activeResidence),
    [hotels, activeResidence]
  );

  const stayOffers = useMemo(
    () => hotelOfferThumbs(hotels, activeResidence),
    [hotels, activeResidence]
  );

  const offerRestaurants = useMemo(
    () =>
      rankRestaurantsNearOffers(
        restaurants.filter((r) => r.offers.some((o) => o.active)),
        userLocation
      ),
    [restaurants, userLocation]
  );

  const mostVisitedRestaurants = useMemo(
    () => rankMostVisited(restaurants, userLocation).slice(0, 12),
    [restaurants, userLocation]
  );

  const topRestaurantProviders = useMemo(
    () =>
      [...restaurants]
        .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
        .slice(0, 8)
        .map((r) => ({
          id: `top-${r.id}`,
          title: r.name,
          subtitle: r.city,
          image: r.images[0] || RESTO_FALLBACK,
          rating: r.rating || undefined,
          href: `/(customer)/restaurants/${r.id}`,
          meta: r.cuisine.slice(0, 2).join(' · ') || undefined,
          badge: r.rating >= 4.5 ? 'Top' : undefined,
        })),
    [restaurants]
  );

  const liveDestinations = useMemo(() => {
    const names = new Set<string>();
    for (const trip of trips) {
      if (trip.from) names.add(trip.from.trim());
      if (trip.to) names.add(trip.to.trim());
    }
    for (const hotel of hotels) {
      if (hotel.location?.city) names.add(hotel.location.city.trim());
    }
    for (const r of restaurants) {
      if (r.city) names.add(r.city.trim());
    }
    for (const g of guides) {
      if (g.city) names.add(g.city.trim());
    }
    for (const t of tourProviders) {
      if (t.city) names.add(t.city.trim());
      if (t.tour?.destination) names.add(t.tour.destination.trim());
    }
    return POPULAR_DESTINATIONS.filter((d) =>
      [...names].some(
        (n) =>
          n.toLowerCase().includes(d.name.toLowerCase()) ||
          d.name.toLowerCase().includes(n.toLowerCase())
      )
    );
  }, [trips, hotels, restaurants, guides, tourProviders]);

  const agencyGroups = useMemo(() => groupTripsByAgency(trips).slice(0, 4), [trips]);

  const guideItems = useMemo(
    () => guideThumbs(guides, guideGender),
    [guides, guideGender]
  );

  const openDest = (name: string) => {
    if (onOpenDestination) onOpenDestination(name);
    else router.push('/(customer)/(tabs)/search');
  };

  const runRestaurantSearch = () => {
    const q = restoCity.trim();
    setSearchedCity(q);
    onSearchRestaurants?.(q);
  };

  return (
    <View style={styles.root}>
      <LocationPinSheet
        visible={destinationMapOpen}
        title="Restaurant destination"
        confirmLabel="Use destination"
        onClose={() => setDestinationMapOpen(false)}
        onConfirm={picked => {
          const city = formatPickedCity(picked);
          setRestoCity(city);
          setSearchedCity(city);
          onSearchRestaurants?.(city);
          setDestinationMapOpen(false);
        }}
      />
      {tab === 'transport' ? (
        <>
          <HomeSection
            title="Diverse vehicles"
            subtitle="Vehicle types published by transporters on BANJARA"
          >
            {availableClasses.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.classRow}
              >
                <Pressable
                  onPress={() => setVehicleClass('all')}
                  style={[
                    styles.miniChip,
                    {
                      backgroundColor: vehicleClass === 'all' ? colors.primary : colors.inputBg,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: vehicleClass === 'all' ? colors.white : colors.dark,
                      fontFamily: Fonts.bodySemiBold,
                      fontSize: 12,
                    }}
                  >
                    All
                  </Text>
                </Pressable>
                {availableClasses.map((v) => (
                  <Pressable
                    key={v.id}
                    onPress={() => setVehicleClass(v.id)}
                    style={[
                      styles.miniChip,
                      {
                        backgroundColor: vehicleClass === v.id ? colors.primary : colors.inputBg,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: vehicleClass === v.id ? colors.white : colors.dark,
                        fontFamily: Fonts.bodyMedium,
                        fontSize: 12,
                      }}
                    >
                      {v.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
            {vehicleItems.length ? (
              <ThumbnailGrid
                items={vehicleItems}
                columns={4}
                rows={compact ? 3 : 5}
                showMoreLabel="Explore More"
                onShowMore={() => router.push('/(customer)/results')}
              />
            ) : (
              <EmptyCatalog
                title="No vehicles yet"
                message="Vehicles appear here when transporters add fleet and publish trips."
              />
            )}
          </HomeSection>

          <HomeSection
            title="Transporters offering trips"
            subtitle="Live trips from verified providers"
          >
            {transporterItems.length ? (
              <ThumbnailGrid
                items={transporterItems}
                columns={4}
                rows={3}
                showMoreLabel="Show more"
                onShowMore={() => router.push('/(customer)/results')}
              />
            ) : (
              <EmptyCatalog
                title="No transporters yet"
                message="When providers publish trips, they show up here."
              />
            )}
          </HomeSection>

          {agencyGroups.length ? (
            <HomeSection title="Trips by agency" subtitle="Book from live schedules">
              <View style={styles.stack}>
                {agencyGroups.map((group) => (
                  <AgencyTripSummaryCard
                    key={group.agencyId}
                    group={group}
                    onPress={() => pushPath(`/(customer)/agency/${group.agencyId}`)}
                  />
                ))}
              </View>
            </HomeSection>
          ) : null}
        </>
      ) : null}

      {tab === 'hotels' ? (
        <>
          {residenceClassesWithData.length ? (
            <HomeSection title="Residence type" subtitle="From lodging providers on BANJARA">
              <ExploreFilterChips
                options={residenceClassesWithData}
                value={activeResidence}
                onChange={setResidence}
              />
            </HomeSection>
          ) : null}
          <HomeSection
            title={`Best ${RESIDENCE_CLASSES.find((r) => r.id === activeResidence)?.label ?? 'stays'}`}
            subtitle="Listed by lodging providers"
          >
            {residenceItems.length ? (
              <ThumbnailGrid
                items={residenceItems}
                columns={4}
                rows={3}
                showMoreLabel="Show more"
                onShowMore={() => router.push('/(customer)/(tabs)/hotels')}
              />
            ) : (
              <EmptyCatalog
                title="No stays yet"
                message="Hotels, guest houses and lodges appear when lodging providers complete sign-up."
              />
            )}
          </HomeSection>
          <HomeSection
            title="Offerings & deals"
            subtitle="Offers from lodging providers"
          >
            {stayOffers.length ? (
              <ThumbnailGrid
                items={stayOffers}
                columns={4}
                rows={3}
                showMoreLabel="Show more"
                onShowMore={() => router.push('/(customer)/(tabs)/hotels')}
              />
            ) : (
              <EmptyCatalog
                title="No deals yet"
                message="Deals appear when lodging providers mark breakfast, free cancel, or featured stays."
              />
            )}
          </HomeSection>
        </>
      ) : null}

      {tab === 'guides' ? (
        <>
          <HomeSection
            title="Guides"
            subtitle="Choose Male or Female — best-rated guides on BANJARA"
          >
            <ExploreFilterChips options={GUIDE_GENDERS} value={guideGender} onChange={setGuideGender} />
          </HomeSection>
          {guideItems.length ? (
            <HomeSection
              title={`Top ${guideGender === 'female' ? 'female' : 'male'} guides`}
              subtitle="Name and languages (regional & international)"
            >
              <ThumbnailGrid
                items={guideItems}
                columns={4}
                rows={compact ? 3 : 4}
                showMoreLabel="Show more"
                onShowMore={() => pushPath('/(customer)/guides/index')}
              />
            </HomeSection>
          ) : (
            <EmptyCatalog
              title={`No ${guideGender} guides listed yet`}
              message="Guide profiles appear here after travel guides register with gender and languages."
            />
          )}
        </>
      ) : null}

      {tab === 'tours' ? <ToursPanel compact={compact} /> : null}

      {tab === 'restaurants' ? (
        <>
          <HomeSection
            title="Search restaurants by destination"
            subtitle="Enter a city — deals nearest to you show first"
          >
            <View style={styles.restoSearchCol}>
              <View
                style={[
                  styles.searchField,
                  styles.restoSearchFieldFull,
                  { borderColor: colors.border, backgroundColor: colors.inputBg },
                ]}
              >
                <Ionicons name="location-outline" size={18} color={colors.muted} />
                <TextInput
                  value={restoCity}
                  onChangeText={setRestoCity}
                  placeholder="e.g. Hunza, Skardu, Gilgit"
                  placeholderTextColor={colors.muted}
                  style={[styles.searchInput, { color: colors.dark }]}
                  onSubmitEditing={runRestaurantSearch}
                  returnKeyType="search"
                />
                <Pressable onPress={() => setDestinationMapOpen(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Pin restaurant destination on map">
                  <Ionicons name="map-outline" size={20} color={colors.primary} />
                </Pressable>
                {restoCity.length > 0 ? (
                  <Pressable
                    onPress={() => {
                      setRestoCity('');
                      setSearchedCity('');
                      onSearchRestaurants?.('');
                    }}
                    hitSlop={8}
                    accessibilityLabel="Clear destination"
                  >
                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                onPress={runRestaurantSearch}
                style={[styles.searchBtnWide, { backgroundColor: colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel="Search restaurants by destination"
              >
                <Ionicons name="search" size={18} color="#fff" />
                <Text style={styles.searchBtnText}>Search restaurants by destination</Text>
              </Pressable>
              {userLocation ? (
                <Text style={[styles.nearHint, { color: colors.muted }]}>
                  Ranking deals nearest to your current location
                </Text>
              ) : null}
            </View>
          </HomeSection>

          <HomeSection
            title={searchedCity ? `Offers near ${searchedCity}` : 'Sales, offers & discounts'}
            subtitle="Updated by restaurant owners on their profiles · deals first"
          >
            {offerRestaurants.length ? (
              <ThumbnailGrid
                items={restaurantThumbs(offerRestaurants)}
                columns={4}
                rows={compact ? 2 : 3}
                showMoreLabel="Show more"
              />
            ) : (
              <EmptyCatalog
                title="No offers yet"
                message={
                  searchedCity
                    ? `No sales or discounts listed near ${searchedCity} yet.`
                    : 'When restaurants add sales and discounts, they appear here first.'
                }
              />
            )}
          </HomeSection>

          <HomeSection
            title="Most visited restaurants"
            subtitle="Menu variety, ratings & nearest to you — 4 per row"
          >
            {mostVisitedRestaurants.length ? (
              <ThumbnailGrid
                items={restaurantThumbs(mostVisitedRestaurants)}
                columns={4}
                rows={compact ? 2 : 3}
                showMoreLabel="Show more"
              />
            ) : (
              <EmptyCatalog
                title="No restaurants yet"
                message="Restaurants will list here after food partners join and add their venues."
              />
            )}
          </HomeSection>

          {topRestaurantProviders.length ? (
            <HomeSection title="Top providers" subtitle="Highest-rated dining partners on BANJARA">
              <ThumbnailGrid
                items={topRestaurantProviders}
                columns={4}
                rows={2}
                showMoreLabel="Show more"
              />
            </HomeSection>
          ) : null}

          <HomeSection title="Travel inspirations" subtitle="Food stops on iconic northern routes">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hRow}
            >
              {FEATURED_STORIES.map((story, index) => (
                <DestinationCard
                  key={story.id}
                  name={story.title}
                  subtitle={story.subtitle}
                  image={story.image}
                  tag="Dine"
                  featured={index === 0}
                  onPress={() => {
                    setRestoCity(story.to);
                    setSearchedCity(story.to);
                    onSearchRestaurants?.(story.to);
                  }}
                />
              ))}
            </ScrollView>
          </HomeSection>
        </>
      ) : null}

      {liveDestinations.length > 0 ? (
        <HomeSection title="Popular destinations" subtitle="From live trips, stays and dining">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hRow}
          >
            {liveDestinations.map((item, index) => (
              <DestinationCard
                key={item.id}
                name={item.name}
                subtitle={item.subtitle}
                image={item.image}
                tag={item.tag}
                featured={index === 0}
                onPress={() => openDest(item.name)}
              />
            ))}
          </ScrollView>
        </HomeSection>
      ) : null}
    </View>
  );
}

/** Volatile cross-sell per tab: ride→stay, hotels→ride, tours→guides, guides→restaurants. */
export function FloatingCrossSell({
  tab,
  trips = [],
  hotels = [],
  restaurants = [],
  guides = [],
}: {
  tab: ExploreServiceTab;
  trips?: TripWithDetails[];
  hotels?: Hotel[];
  restaurants?: Restaurant[];
  guides?: Provider[];
}) {
  const stayItems = useMemo(() => {
    const offers = hotelOfferThumbs(hotels);
    if (offers.length) return offers.slice(0, 8);
    return hotels.slice(0, 8).map((h) => ({
      id: h.id,
      title: h.name,
      subtitle: h.location.city,
      image: h.images[0] || FALLBACK_IMAGE,
      rating: h.rating,
      href: `/(customer)/hotels/${h.id}`,
      badge: mapHotelResidenceClass(h.hotelType),
      meta: h.priceFrom > 0 ? `From ${formatCurrency(h.priceFrom)}` : undefined,
    }));
  }, [hotels]);

  const rideItems = useMemo(() => tripVehicleThumbs(trips).slice(0, 8), [trips]);
  const guideItems = useMemo(() => guideThumbs(guides, 'male').slice(0, 8), [guides]);
  const restoItems = useMemo(
    () => restaurantThumbs(rankRestaurantsByOffers(restaurants).slice(0, 8), 'Eat'),
    [restaurants]
  );

  if (tab === 'transport') {
    if (!stayItems.length) return null;
    return (
      <HomeSection
        title="Looking for a place to stay?"
        subtitle="Hotels & lodges after your ride — from lodging providers"
        actionLabel="Browse"
        onAction={() => router.push('/(customer)/(tabs)/hotels')}
      >
        <ThumbnailGrid
          items={stayItems}
          columns={4}
          rows={2}
          showMoreLabel="Show more"
          onShowMore={() => router.push('/(customer)/(tabs)/hotels')}
        />
      </HomeSection>
    );
  }

  if (tab === 'hotels') {
    if (!rideItems.length) return null;
    return (
      <HomeSection
        title="Need a ride there?"
        subtitle="Vehicles & trips from transporters"
        actionLabel="Search rides"
        onAction={() => router.push('/(customer)/results')}
      >
        <ThumbnailGrid
          items={rideItems}
          columns={4}
          rows={2}
          showMoreLabel="Show more"
          onShowMore={() => router.push('/(customer)/results')}
        />
      </HomeSection>
    );
  }

  if (tab === 'tours') {
    if (!guideItems.length) return null;
    return (
      <HomeSection
        title="Need a guide?"
        subtitle="Local guides after you pick a tour operator"
        actionLabel="Browse guides"
        onAction={() => router.push('/(customer)/(tabs)/search')}
      >
        <ThumbnailGrid items={guideItems} columns={4} rows={2} showMoreLabel="Show more" />
      </HomeSection>
    );
  }

  if (tab === 'guides') {
    if (!restoItems.length) return null;
    return (
      <HomeSection
        title="Where to eat?"
        subtitle="Restaurants near your guide’s destination"
        actionLabel="Browse dining"
      >
        <ThumbnailGrid items={restoItems} columns={4} rows={2} showMoreLabel="Show more" />
      </HomeSection>
    );
  }

  // Restaurants tab → suggest a local guide for the rest of the trip
  if (tab === 'restaurants') {
    if (!guideItems.length) return null;
    return (
      <HomeSection
        title="Explore with a guide"
        subtitle="Local guides after you pick where to eat"
        actionLabel="Browse guides"
        onAction={() => pushPath('/(customer)/guides/index')}
      >
        <ThumbnailGrid
          items={guideItems}
          columns={4}
          rows={2}
          showMoreLabel="Show more"
          onShowMore={() => pushPath('/(customer)/guides/index')}
        />
      </HomeSection>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  root: { gap: 0 },
  classRow: {
    paddingHorizontal: Spacing.screen,
    gap: 8,
    paddingBottom: Spacing.sm,
  },
  miniChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  stack: {
    paddingHorizontal: Spacing.screen,
    gap: Spacing.sm,
  },
  hRow: { paddingHorizontal: Spacing.screen },
  searchField: {
    marginHorizontal: Spacing.screen,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    minHeight: 46,
  },
  restoSearchRow: {
    paddingHorizontal: Spacing.screen,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  restoSearchCol: {
    paddingHorizontal: Spacing.screen,
    gap: 10,
    marginBottom: Spacing.sm,
  },
  restoSearchField: {
    flex: 1,
    marginHorizontal: 0,
    marginBottom: 0,
  },
  restoSearchFieldFull: {
    marginHorizontal: 0,
    marginBottom: 0,
  },
  searchBtnWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
  },
  nearHint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    paddingHorizontal: 4,
  },
  searchBtn: {
    paddingHorizontal: 16,
    minHeight: 46,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: '#fff',
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    paddingVertical: 8,
  },
  emptyBox: {
    marginHorizontal: Spacing.screen,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 6,
  },
  emptyTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 15 },
  emptyBody: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 18 },
});
