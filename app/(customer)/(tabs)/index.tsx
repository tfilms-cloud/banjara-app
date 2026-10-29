import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { HotelCard } from '@/components/hotels/HotelCard';
import { HotelSearchCard } from '@/components/hotels/HotelSearchCard';
import { LocationPinSheet, formatPickedCity } from '@/components/location/LocationPinSheet';
import { DestinationCard } from '@/components/travel/DestinationCard';
import { HomeHeroHeader } from '@/components/travel/HomeHeroHeader';
import { TrustGrid } from '@/components/travel/TrustGrid';
import { groupTripsByAgency } from '@/utils/groupTripsByAgency';
import { HomeSection } from '@/components/travel/HomeSection';
import { HomeSearchKindTabs, NameSearchCard, type HomeSearchKind } from '@/components/travel/NameSearchCard';
import { TransportSearchCard } from '@/components/travel/SearchCard';
import { ExplorePanels, FloatingCrossSell } from '@/components/explore/ExplorePanels';
import { TripCard } from '@/components/trip/TripCard';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { PassengerPicker } from '@/components/ui/PassengerPicker';
import { EmptyState } from '@/components/ui/EmptyState';
import { HotelCardSkeleton, TripCardSkeleton } from '@/components/ui/Skeleton';
import { Colors, useThemeColors } from '@/constants/colors';
import {
  POPULAR_DESTINATIONS,
  POPULAR_ROUTE_SUGGESTIONS,
  destinationImageFor,
  destinationMetaFor,
} from '@/constants/destinations';
import {
  type HomeServiceCategory,
  type TransportBookingKind,
  type TransportPanel,
  todayIsoDate,
} from '@/constants/productModes';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { usePopularHotels } from '@/hooks/useHotels';
import { useGuides, useRestaurants, useTourOperators } from '@/hooks/useRestaurants';
import { useRecommendedTrips } from '@/hooks/useTrips';
import { invalidatePopularHotelsCache } from '@/services/hotelService';
import { invalidateRecommendedTripsCache } from '@/services/tripService';
import { useAuthStore } from '@/store/authStore';
import { useHotelStore } from '@/store/hotelStore';
import { useSearchStore } from '@/store/searchStore';
import { useBookingStore } from '@/store/bookingStore';
import { useUserStore } from '@/store/userStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { formatDuration } from '@/utils/formatTime';
import { pushPath } from '@/utils/navigation';
import type { LocationPickerValue } from '@/types/location';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type HomeMode = HomeServiceCategory;

function SegmentChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
}) {
  const colors = useThemeColors();
  return (
    <View style={[styles.segmentTrack, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            style={[styles.segmentChip, active && { backgroundColor: colors.primary, ...Shadows.soft }]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text
              style={[styles.segmentChipText, {
                color: active ? colors.white : colors.muted,
                fontFamily: active ? Fonts.bodySemiBold : Fonts.bodyMedium,
              }]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function shortDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return formatDate(iso, false);
  }
}

function RecentHotelRow({
  item,
  meta,
  nights,
  onPress,
}: {
  item: any;
  meta: any;
  nights: number;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.985, { damping: 16, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 300 });
      }}
      style={[
        styles.recentRowCard,
        { backgroundColor: colors.card, borderColor: colors.border },
        animStyle,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Continue hotel search in ${item.destination}`}
    >
      <Image
        source={{ uri: meta.image }}
        style={styles.recentThumb}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.recentBody}>
        <View style={styles.recentTitleRow}>
          <Text style={[styles.recentPlace, { color: colors.dark }]} numberOfLines={1}>
            {item.destination}
          </Text>
          <View style={[styles.recentTypeChip, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.recentTypeText, { color: colors.primary }]}>STAY</Text>
          </View>
        </View>
        <Text style={[styles.recentDetails, { color: colors.muted }]} numberOfLines={1}>
          {shortDate(item.checkIn)} → {shortDate(item.checkOut)} · {nights} night{nights === 1 ? '' : 's'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={17} color={colors.mutedLight} />
    </AnimatedPressable>
  );
}

function RecentRideRow({ item, onPress }: { item: any; onPress: () => void }) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.985, { damping: 16, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 300 });
      }}
      style={[
        styles.recentRowCard,
        { backgroundColor: colors.card, borderColor: colors.border },
        animStyle,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Continue search ${item.from} to ${item.to}`}
    >
      <Image
        source={{ uri: destinationImageFor(item.to) }}
        style={styles.recentThumb}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.recentBody}>
        <View style={styles.recentTitleRow}>
          <Text style={[styles.recentPlace, { color: colors.dark }]} numberOfLines={1}>
            {item.from} → {item.to}
          </Text>
          <View style={[styles.recentTypeChip, { backgroundColor: colors.softGreen }]}>
            <Text style={[styles.recentTypeText, { color: colors.action }]}>
              {item.productMode === 'trips' ? 'TRIP' : 'RIDE'}
            </Text>
          </View>
        </View>
        <Text style={[styles.recentDetails, { color: colors.muted }]} numberOfLines={1}>
          {shortDate(item.date)} · {item.passengers} passenger{item.passengers === 1 ? '' : 's'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={17} color={colors.mutedLight} />
    </AnimatedPressable>
  );
}

function PopularRouteCard({
  route,
  onPress,
}: {
  route: Omit<(typeof POPULAR_ROUTE_SUGGESTIONS)[number], 'fromPrice'> & {
    tripCount: number;
    fromPrice: number | null;
    currency: string;
  };
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const dest = POPULAR_DESTINATIONS.find((d) => d.name === route.to);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.985, { damping: 16, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 300 });
      }}
      style={[
        styles.routeCard,
        { backgroundColor: colors.card, borderColor: colors.border },
        animStyle,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Search ${route.from} to ${route.to}`}
    >
      <Image
        source={{ uri: dest?.image ?? POPULAR_DESTINATIONS[0].image }}
        style={styles.routeThumb}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.routeCopy}>
        <View style={styles.routeHeaderRow}>
          <Text style={[styles.routeTitle, { color: colors.dark }]} numberOfLines={1}>
            {route.from} → {route.to}
          </Text>
          <View style={[styles.routeDurationBadge, { backgroundColor: colors.inputBg }]}>
            <Text style={[styles.routeDurationText, { color: colors.muted }]}>{route.duration}</Text>
          </View>
        </View>

        {route.tripCount > 0 ? (
          <View style={styles.routeLiveRow}>
            <View style={styles.routeLiveDot} />
            <Text style={[styles.routeLive, { color: colors.action }]}>
              {route.tripCount} live trip{route.tripCount === 1 ? '' : 's'}
              {route.fromPrice != null
                ? ` · from ${formatCurrency(route.fromPrice, route.currency)}`
                : ''}
            </Text>
          </View>
        ) : (
          <Text style={[styles.routeMeta, { color: colors.mutedLight }]}>Explore corridor</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={17} color={colors.mutedLight} />
    </AnimatedPressable>
  );
}

const HOME_FOCUS_STALE_MS = 45_000;
let lastHomeFocusRefreshAt = 0;

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const from = useSearchStore((s) => s.from);
  const to = useSearchStore((s) => s.to);
  const date = useSearchStore((s) => s.date);
  const returnDate = useSearchStore((s) => s.returnDate);
  const passengers = useSearchStore((s) => s.passengers);
  const productMode = useSearchStore((s) => s.productMode);
  const query = useSearchStore((s) => s.query);
  const setFrom = useSearchStore((s) => s.setFrom);
  const setTo = useSearchStore((s) => s.setTo);
  const setDate = useSearchStore((s) => s.setDate);
  const setReturnDate = useSearchStore((s) => s.setReturnDate);
  const setPassengers = useSearchStore((s) => s.setPassengers);
  const setProductMode = useSearchStore((s) => s.setProductMode);
  const swapLocations = useSearchStore((s) => s.swapLocations);
  const saveRecentSearch = useSearchStore((s) => s.saveRecentSearch);
  const setQuery = useSearchStore((s) => s.setQuery);
  const [mode, setMode] = useState<HomeMode>('transport');
  const [transportPanel, setTransportPanel] = useState<TransportPanel>('available');
  const [bookingKind, setBookingKind] = useState<TransportBookingKind>('seat');
  const [journeyKind, setJourneyKind] = useState<'one_way' | 'round_trip'>(
    productMode === 'trips' ? 'round_trip' : 'one_way'
  );
  const [searchKind, setSearchKind] = useState<HomeSearchKind>('route');
  const [showDate, setShowDate] = useState(false);
  const [showReturnDate, setShowReturnDate] = useState(false);
  const [showPassengers, setShowPassengers] = useState(false);
  const [locationField, setLocationField] = useState<'from' | 'to' | null>(null);
  const [routePins, setRoutePins] = useState<Partial<Record<'from' | 'to', { name: string; value: LocationPickerValue }>>>({});
  const checkIn = useHotelStore((s) => s.checkIn);
  const checkOut = useHotelStore((s) => s.checkOut);
  const hotelDestination = useHotelStore((s) => s.destination);
  const setDestination = useHotelStore((s) => s.setDestination);
  const saveHotelSearch = useHotelStore((s) => s.saveRecentSearch);
  const hotelRecent = useHotelStore((s) => s.recentSearches);
  const { trips, loading, error, refresh: refreshTrips } = useRecommendedTrips();
  const { hotels, loading: hotelsLoading, refresh: refreshHotels } = usePopularHotels();
  const {
    restaurants,
    refresh: refreshRestos,
    searchByDestination,
  } = useRestaurants('', { autoLoad: false });
  const { guides, refresh: refreshGuides } = useGuides('', { autoLoad: false });
  const { tours: tourProviders, refresh: refreshTours } = useTourOperators('', {
    autoLoad: false,
  });
  const setTrip = useBookingStore((state) => state.setTrip);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const colors = useThemeColors();
  const notifications = useUserStore((state) => state.notifications);
  const loadNotifications = useUserStore((state) => state.loadNotifications);
  const hasUnread = notifications.some((item) => !item.read);

  useEffect(() => {
    if (!from) setFrom('Islamabad');
    if (!to) setTo('Hunza');
  }, [from, to, setFrom, setTo]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (mode === 'restaurants') void refreshRestos({ silent: true });
    if (mode === 'guides') void refreshGuides({ silent: true });
    if (mode === 'tours') void refreshTours({ silent: true });
  }, [mode, refreshRestos, refreshGuides, refreshTours]);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const stale = now - lastHomeFocusRefreshAt >= HOME_FOCUS_STALE_MS;
      if (!stale) return;
      lastHomeFocusRefreshAt = now;
      void refreshTrips({ silent: true });
      void refreshHotels({ silent: true });
      if (mode === 'restaurants') void refreshRestos({ silent: true });
      if (mode === 'guides') void refreshGuides({ silent: true });
      if (mode === 'tours') void refreshTours({ silent: true });
    }, [mode, refreshTrips, refreshHotels, refreshRestos, refreshGuides, refreshTours])
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [mode]);

  const oneWayTrips = useMemo(
    () => trips.filter((trip) => trip.journeyType !== 'round_trip'),
    [trips]
  );
  const roundTrips = useMemo(
    () => trips.filter((trip) => trip.journeyType === 'round_trip'),
    [trips]
  );
  const journeyTrips = journeyKind === 'round_trip' ? roundTrips : oneWayTrips;

  /** Seat booking = shared vans/buses; vehicle = car/private/taxi style inventory. */
  const modeTrips = useMemo(() => {
    if (bookingKind === 'vehicle') {
      return journeyTrips.filter((trip) => {
        if (trip.bookingMode === 'vehicle') return true;
        if (trip.bookingMode === 'seat') return false;
        const type = String(trip.vehicleType || '').toLowerCase();
        return type.includes('car') || type.includes('private') || type.includes('taxi');
      });
    }
    return journeyTrips.filter((trip) => trip.bookingMode !== 'vehicle');
  }, [bookingKind, journeyTrips]);

  const today = todayIsoDate();

  /** Live rides — only trips departing today. */
  const liveTodayTrips = useMemo(
    () =>
      [...modeTrips]
        .filter((trip) => String(trip.date || '').slice(0, 10) === today)
        .sort((a, b) => `${a.date}${a.departureTime}`.localeCompare(`${b.date}${b.departureTime}`))
        .slice(0, 6),
    [modeTrips, today]
  );

  /** Continue searching — all trips transporters currently offer. */
  const allTransporterTrips = useMemo(
    () =>
      [...modeTrips]
        .sort((a, b) => `${a.date}${a.departureTime}`.localeCompare(`${b.date}${b.departureTime}`))
        .slice(0, 8),
    [modeTrips]
  );

  const recommendedTrips = useMemo(
    () => modeTrips.filter((trip) => trip.recommended).slice(0, 4),
    [modeTrips]
  );

  const stayHotels = useMemo(() => {
    const dest = (hotelDestination || to || '').trim().toLowerCase();
    if (!dest) return hotels.slice(0, 8);
    const matched = hotels.filter((hotel) => {
      const city = hotel.location.city.toLowerCase();
      const area = hotel.location.area.toLowerCase();
      return city.includes(dest) || area.includes(dest) || dest.includes(city);
    });
    return (matched.length ? matched : hotels).slice(0, 8);
  }, [hotelDestination, hotels, to]);

  const ridesToStay = useMemo(() => {
    const dest = (hotelDestination || to || '').trim().toLowerCase();
    const matchTo = (list: typeof trips) =>
      dest ? list.filter((trip) => trip.to.toLowerCase().includes(dest)) : list;
    const ones = matchTo(oneWayTrips);
    const rounds = matchTo(roundTrips);
    const combined = [...(ones.length ? ones : oneWayTrips).slice(0, 2), ...(rounds.length ? rounds : roundTrips).slice(0, 2)];
    const seen = new Set<string>();
    return combined.filter((trip) => {
      if (seen.has(trip.id)) return false;
      seen.add(trip.id);
      return true;
    }).slice(0, 4);
  }, [hotelDestination, oneWayTrips, roundTrips, to]);

  const durationLabel = useMemo(() => {
    if (mode !== 'transport') return undefined;
    const matching = trips.filter(
      (trip) =>
        trip.from.toLowerCase().includes((from || '').toLowerCase()) &&
        trip.to.toLowerCase().includes((to || '').toLowerCase())
    );
    if (matching.length) {
      const minutes = matching.map((trip) => trip.durationMinutes).filter((value) => value > 0);
      if (minutes.length) {
        const min = Math.min(...minutes);
        const max = Math.max(...minutes);
        return min === max ? formatDuration(min) : `${formatDuration(min)} – ${formatDuration(max)}`;
      }
    }
    const corridor = POPULAR_ROUTE_SUGGESTIONS.find(
      (route) =>
        route.from.toLowerCase() === (from || '').toLowerCase() &&
        route.to.toLowerCase() === (to || '').toLowerCase()
    );
    return corridor?.duration;
  }, [from, mode, to, trips]);

  const liveCount = useMemo(() => {
    if (mode === 'hotels') return stayHotels.length;
    if (mode !== 'transport') return 0;
    return liveTodayTrips.length;
  }, [liveTodayTrips.length, mode, stayHotels.length]);

  const tripLengthLabel = useMemo(() => {
    if (journeyKind !== 'round_trip' || !date || !returnDate) return undefined;
    const nights = Math.round(
      (new Date(`${returnDate}T12:00:00`).getTime() - new Date(`${date}T12:00:00`).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (nights < 1) return undefined;
    return `${nights}-night return`;
  }, [date, journeyKind, returnDate]);

  const liveRoutes = useMemo(
    () =>
      POPULAR_ROUTE_SUGGESTIONS.map((route) => {
        const matches = trips.filter(
          (trip) =>
            trip.from.toLowerCase().includes(route.from.toLowerCase()) &&
            trip.to.toLowerCase().includes(route.to.toLowerCase())
        );
        const fromPrice = matches.length ? Math.min(...matches.map((trip) => trip.price)) : null;
        return {
          ...route,
          tripCount: matches.length,
          fromPrice,
          currency: matches[0]?.currency ?? 'PKR',
        };
      }).sort((a, b) => b.tripCount - a.tripCount),
    [trips]
  );

  const onSearchTransport = () => {
    setQuery('');
    saveRecentSearch();
    router.push('/(customer)/results');
  };

  const onSearchHotels = () => {
    setQuery('');
    saveHotelSearch();
    router.push('/(customer)/hotels/results');
  };

  const onSearchByName = () => {
    const text = query.trim();
    if (!text) return;
    if (mode === 'hotels') {
      setDestination(text);
      saveHotelSearch();
      router.push('/(customer)/hotels/results');
      return;
    }
    router.push('/(customer)/results');
  };

  const onChangeMode = (next: HomeMode) => {
    setMode(next);
    if (next === 'transport') {
      setProductMode(journeyKind === 'round_trip' ? 'trips' : 'transport');
    } else if (next === 'hotels') {
      // hotels search uses hotel store
    }
  };

  const onChangeJourney = (next: 'one_way' | 'round_trip') => {
    setJourneyKind(next);
    setProductMode(next === 'round_trip' ? 'trips' : 'transport');
  };

  const openDestination = (name: string) => {
    if (mode === 'hotels') {
      setDestination(name);
      saveHotelSearch();
      router.push('/(customer)/hotels/results');
      return;
    }
    setTo(name);
    setProductMode(journeyKind === 'round_trip' ? 'trips' : 'transport');
    saveRecentSearch();
    router.push('/(customer)/results');
  };

  const openTrip = (tripId: string) => {
    const trip = trips.find((item) => item.id === tripId);
    if (trip) setTrip(trip);
    pushPath(`/(customer)/trip/${tripId}`);
  };

  const stayTitle = 'Looking for a place to stay';
  const staySubtitle =
    'Choose among the best hotels, lodges and guest houses available at your destination.';
  const rideTitle = 'Live rides';
  const searchCta =
    mode === 'hotels'
      ? 'Search stays'
      : journeyKind === 'round_trip'
        ? 'Search trips'
        : bookingKind === 'vehicle'
          ? 'Search vehicles'
          : 'Search rides';

  const serviceExploreBlock =
    mode === 'tours' || mode === 'guides' || mode === 'restaurants' ? (
      <>
        <ExplorePanels
          tab={mode}
          trips={trips}
          hotels={hotels}
          restaurants={restaurants}
          guides={guides}
          tourProviders={tourProviders}
          compact
          onOpenDestination={openDestination}
          onSearchRestaurants={(city) => void searchByDestination(city)}
        />
        <FloatingCrossSell
          tab={mode}
          trips={trips}
          hotels={hotels}
          restaurants={restaurants}
          guides={guides}
        />
      </>
    ) : null;

  const searchBlock =
    mode === 'tours' || mode === 'guides' || mode === 'restaurants' ? null : (
    <View style={styles.searchFloat}>
      {mode === 'transport' ? (
        <View
          style={[
            styles.transportControls,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <SegmentChips
            value={transportPanel}
            onChange={setTransportPanel}
            options={[
              { id: 'available' as const, label: 'Available rides' },
              { id: 'customise' as const, label: 'Customise route' },
            ]}
          />
          {transportPanel === 'customise' ? (
            <>
              <SegmentChips
                value={journeyKind}
                onChange={onChangeJourney}
                options={[
                  { id: 'one_way' as const, label: 'One way' },
                  { id: 'round_trip' as const, label: 'Two way' },
                ]}
              />
              <SegmentChips
                value={bookingKind}
                onChange={setBookingKind}
                options={[
                  { id: 'seat' as const, label: 'Seat booking' },
                  { id: 'vehicle' as const, label: 'Vehicle booking' },
                ]}
              />
            </>
          ) : null}
        </View>
      ) : null}

      {mode === 'transport' && transportPanel === 'available' ? null : (
        <>
          <HomeSearchKindTabs value={searchKind} onChange={setSearchKind} />
          {searchKind === 'name' ? (
            <NameSearchCard
              value={query}
              onChangeText={setQuery}
              onSearch={onSearchByName}
              ctaLabel={searchCta}
            />
          ) : mode === 'hotels' ? (
            <HotelSearchCard onSearch={onSearchHotels} showGuestControls={false} showCta />
          ) : (
            <>
              <TransportSearchCard
                intent={journeyKind === 'round_trip' ? 'trips' : 'transport'}
                from={from}
                to={to}
                dateLabel={date ? shortDate(date) : 'Pick date'}
                returnDateLabel={returnDate ? shortDate(returnDate) : 'Pick return'}
                passengersLabel={
                  bookingKind === 'vehicle'
                    ? `${passengers} traveler${passengers === 1 ? '' : 's'}`
                    : `${passengers} passenger${passengers === 1 ? '' : 's'}`
                }
                onFrom={() => setLocationField('from')}
                onTo={() => setLocationField('to')}
                onDate={() => {
                  setShowReturnDate(false);
                  setShowDate(true);
                }}
                onReturnDate={() => {
                  setShowDate(false);
                  setShowReturnDate(true);
                }}
                onPassengers={() => setShowPassengers(true)}
                onSwap={swapLocations}
                onSearch={onSearchTransport}
                selectedDate={date}
                onSelectDate={setDate}
                tripLengthLabel={tripLengthLabel}
                hint={
                  bookingKind === 'vehicle'
                    ? 'Book a full vehicle for your route'
                    : undefined
                }
                showCta
              />
              <LocationPinSheet
                visible={locationField !== null}
                title={locationField === 'from' ? 'Departure location' : 'Destination'}
                confirmLabel={locationField === 'from' ? 'Use departure location' : 'Use destination'}
                initial={locationField && routePins[locationField]?.name === (locationField === 'from' ? from : to) ? routePins[locationField]?.value : undefined}
                onClose={() => setLocationField(null)}
                onConfirm={picked => {
                  const name = formatPickedCity(picked);
                  if (locationField) setRoutePins(pins => ({ ...pins, [locationField]: { name, value: picked } }));
                  if (locationField === 'from') setFrom(name);
                  else if (locationField === 'to') setTo(name);
                  setLocationField(null);
                }}
              />
              <PassengerPicker
                visible={showPassengers}
                value={passengers}
                onChange={setPassengers}
                onClose={() => setShowPassengers(false)}
              />
              <DatePickerModal
                visible={showDate}
                title="Travel date"
                value={date}
                minimumDate={new Date()}
                onChange={setDate}
                onClose={() => setShowDate(false)}
              />
              <DatePickerModal
                visible={showReturnDate}
                title="Return home"
                value={returnDate}
                minimumDate={date ? new Date(date) : new Date()}
                onChange={setReturnDate}
                onClose={() => setShowReturnDate(false)}
              />
            </>
          )}
        </>
      )}
    </View>
  );

  const recentSection =
    mode === 'transport' ? (
      <HomeSection
        title="Continue searching"
        subtitle="All trips currently offered by transporters"
        actionLabel="View all"
        onAction={() => router.push('/(customer)/results')}
      >
        {loading && allTransporterTrips.length === 0 ? (
          <View style={styles.stack}>
            <TripCardSkeleton />
            <TripCardSkeleton />
          </View>
        ) : allTransporterTrips.length === 0 ? (
          <EmptyState
            title="No trips listed yet"
            message="When transporters publish rides, they will appear here."
            actionLabel={searchCta}
            onAction={onSearchTransport}
          />
        ) : (
          <View style={styles.stack}>
            {allTransporterTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onPress={() => openTrip(trip.id)} />
            ))}
          </View>
        )}
      </HomeSection>
    ) : mode === 'hotels' && hotelRecent.length > 0 ? (
      <HomeSection title="Continue searching">
        <View style={styles.recentStack}>
          {hotelRecent.slice(0, 4).map((item) => {
            const meta = destinationMetaFor(item.destination);
            const nights = Math.max(
              1,
              Math.round(
                (new Date(item.checkOut).getTime() - new Date(item.checkIn).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            );
            return (
              <RecentHotelRow
                key={item.id}
                item={item}
                meta={meta}
                nights={nights}
                onPress={() => {
                  useHotelStore.getState().applyRecentSearch(item);
                  setMode('hotels');
                  router.push('/(customer)/hotels/results');
                }}
              />
            );
          })}
        </View>
      </HomeSection>
    ) : null;

  const destinationsSection = useMemo(() => {
    const placeNames = new Set<string>();
    for (const trip of trips) {
      if (trip.from) placeNames.add(String(trip.from).trim());
      if (trip.to) placeNames.add(String(trip.to).trim());
    }
    for (const hotel of hotels) {
      if (hotel.location?.city) placeNames.add(hotel.location.city.trim());
    }
    const liveDestinations = POPULAR_DESTINATIONS.filter((d) =>
      [...placeNames].some(
        (n) =>
          n.toLowerCase().includes(d.name.toLowerCase()) ||
          d.name.toLowerCase().includes(n.toLowerCase())
      )
    );
    if (!liveDestinations.length) return null;
    return (
      <HomeSection
        title="Popular destinations"
        subtitle="Places with live trips or stays on BANJARA"
        actionLabel="Explore"
        onAction={() => router.push('/(customer)/(tabs)/search')}
      >
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
              onPress={() => openDestination(item.name)}
            />
          ))}
        </ScrollView>
      </HomeSection>
    );
  }, [hotels, mode, trips]);

  const inspirationFromProviders = useMemo(() => {
    return groupTripsByAgency(trips)
      .slice(0, 8)
      .map((g) => ({
        id: g.agencyId,
        name: g.agency.name,
        route: g.routes[0] || `${g.tripCount} trips`,
        image: g.agency.logo || g.trips[0]?.image || g.trips[0]?.vehicleImages?.[0],
        rating: g.agency.rating || 0,
        quote: `Live on BANJARA · ${g.tripCount} trip${g.tripCount === 1 ? '' : 's'} from this transporter. Book seats on published schedules.`,
      }));
  }, [trips]);

  const ridesSection = (
    <HomeSection
      title={rideTitle}
      subtitle="Only rides departing today"
      actionLabel="View all"
      onAction={() => router.push('/(customer)/results')}
    >
      {loading && liveTodayTrips.length === 0 ? (
        <View style={styles.stack}>
          <TripCardSkeleton />
          <TripCardSkeleton />
        </View>
      ) : error && liveTodayTrips.length === 0 ? (
        <EmptyState
          title="Could not load trips"
          message="Check your connection and try again."
          actionLabel="Try again"
          onAction={() => void refreshTrips()}
        />
      ) : liveTodayTrips.length === 0 ? (
        <EmptyState
          title="No live rides today"
          message="Check Available rides or search another date for vans, buses, and seats."
          actionLabel={searchCta}
          onAction={onSearchTransport}
        />
      ) : (
        <View style={styles.stack}>
          {liveTodayTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onPress={() => openTrip(trip.id)} />
          ))}
        </View>
      )}
    </HomeSection>
  );

  const recommendedSection =
    recommendedTrips.length > 0 ? (
      <HomeSection title="Recommended for you" subtitle="Marked by providers on BANJARA">
        <View style={styles.stack}>
          {recommendedTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onPress={() => openTrip(trip.id)} />
          ))}
        </View>
      </HomeSection>
    ) : null;

  const renderStays = (layout: 'detail' | 'rail') => (
    <HomeSection
      title={stayTitle}
      subtitle={staySubtitle}
      actionLabel="Browse all"
      onAction={() => router.push('/(customer)/(tabs)/hotels')}
    >
      {hotelsLoading && hotels.length === 0 ? (
        layout === 'detail' ? (
          <View style={styles.stack}>
            <HotelCardSkeleton />
            <HotelCardSkeleton />
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
            <HotelCardSkeleton />
          </ScrollView>
        )
      ) : stayHotels.length === 0 ? (
        <EmptyState
          title="No hotels listed yet"
          message="Stays will appear here when providers add hotels."
          actionLabel="Search stays"
          onAction={onSearchHotels}
        />
      ) : layout === 'detail' ? (
        <View style={styles.stack}>
          {stayHotels.slice(0, 4).map((hotel) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              checkIn={checkIn}
              checkOut={checkOut}
              onPress={() => pushPath(`/(customer)/hotels/${hotel.id}`)}
            />
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hRow}
        >
          {stayHotels.map((hotel) => (
            <View key={hotel.id} style={styles.hotelSlide}>
              <HotelCard
                hotel={hotel}
                checkIn={checkIn}
                checkOut={checkOut}
                compact
                onPress={() => pushPath(`/(customer)/hotels/${hotel.id}`)}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </HomeSection>
  );

  const routesSection = (
    <HomeSection
      title="Popular routes"
      subtitle="Most travelled corridors on BANJARA"
    >
      <View style={styles.stack}>
        {liveRoutes.map((route) => (
          <PopularRouteCard
            key={route.id}
            route={route}
            onPress={() => {
              setFrom(route.from);
              setTo(route.to);
              saveRecentSearch();
              router.push('/(customer)/results');
            }}
          />
        ))}
      </View>
    </HomeSection>
  );

  const connectingRidesSection =
    ridesToStay.length > 0 ? (
      <HomeSection
        title={hotelDestination ? `Rides to ${hotelDestination}` : 'Rides to get there'}
        subtitle="Transport and return trips for this stay"
        actionLabel="View all"
        onAction={() => router.push('/(customer)/results')}
      >
        <View style={styles.stack}>
          {ridesToStay.map((trip) => (
            <TripCard key={trip.id} trip={trip} onPress={() => openTrip(trip.id)} />
          ))}
        </View>
      </HomeSection>
    ) : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.feed}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              lastHomeFocusRefreshAt = Date.now();
              invalidateRecommendedTripsCache();
              invalidatePopularHotelsCache();
              await Promise.all([
                refreshTrips(),
                refreshHotels(),
                mode === 'restaurants' ? refreshRestos() : Promise.resolve(),
                mode === 'guides' ? refreshGuides() : Promise.resolve(),
                mode === 'tours' ? refreshTours() : Promise.resolve(),
              ]);
              setRefreshing(false);
            }}
            tintColor={colors.primary}
          />
        }
      >
        <HomeHeroHeader
          mode={mode}
          onChangeMode={onChangeMode}
          from={from}
          to={to}
          hotelDestination={hotelDestination}
          userName={user?.name}
          userAvatar={user?.avatar}
          durationLabel={durationLabel}
          liveCount={liveCount}
          hasUnread={hasUnread}
          onOpenSearch={() => router.push('/(customer)/(tabs)/search')}
          onNotifications={() => pushPath('/(customer)/(tabs)/notifications')}
          onProfile={() => pushPath('/(customer)/(tabs)/profile')}
        />

        {searchBlock}

        {mode === 'tours' || mode === 'guides' || mode === 'restaurants' ? (
          serviceExploreBlock
        ) : mode === 'hotels' ? (
          <>
            {recentSection}
            <ExplorePanels
              tab="hotels"
              trips={trips}
              hotels={hotels}
              restaurants={restaurants}
              guides={guides}
              tourProviders={tourProviders}
              compact
              onOpenDestination={openDestination}
            />
            {connectingRidesSection}
            <FloatingCrossSell
              tab="hotels"
              trips={trips}
              hotels={hotels}
              restaurants={restaurants}
              guides={guides}
            />
            {destinationsSection}
          </>
        ) : (
          <>
            {transportPanel === 'available' ? (
              <HomeSection
                title="Available rides"
                subtitle="Trips published by transporters"
                actionLabel="View all"
                onAction={() => router.push('/(customer)/results')}
              >
                {loading && modeTrips.length === 0 ? (
                  <View style={styles.stack}>
                    <TripCardSkeleton />
                    <TripCardSkeleton />
                  </View>
                ) : modeTrips.length === 0 ? (
                  <EmptyState
                    title="No rides available"
                    message="Try Customise your route or another date."
                    actionLabel="Customise route"
                    onAction={() => setTransportPanel('customise')}
                  />
                ) : (
                  <View style={styles.stack}>
                    {modeTrips.slice(0, 8).map((trip) => (
                      <TripCard key={trip.id} trip={trip} onPress={() => openTrip(trip.id)} />
                    ))}
                  </View>
                )}
              </HomeSection>
            ) : (
              <>
                {recentSection}
                {ridesSection}
                {recommendedSection}
                <ExplorePanels
                  tab="transport"
                  trips={trips}
                  hotels={hotels}
                  restaurants={restaurants}
                  guides={guides}
                  tourProviders={tourProviders}
                  compact
                  onOpenDestination={openDestination}
                />
                {routesSection}
                {stayHotels.length > 0 ? renderStays('rail') : null}
                <FloatingCrossSell
                  tab="transport"
                  trips={trips}
                  hotels={hotels}
                  restaurants={restaurants}
                  guides={guides}
                />
              </>
            )}
            {destinationsSection}
          </>
        )}

        {inspirationFromProviders.length > 0 ? (
        <HomeSection
          title="Travel inspiration"
          subtitle="Transporters live on BANJARA — added by service providers"
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hRow}
          >
            {inspirationFromProviders.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => pushPath(`/(customer)/agency/${item.id}`)}
                style={[
                  styles.testimonialCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.testimonialHead}>
                  <Image
                    source={{
                      uri:
                        item.image ||
                        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=200&q=80&auto=format&fit=crop',
                    }}
                    style={styles.testimonialAvatar}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.testimonialName, { color: colors.dark }]}>{item.name}</Text>
                    <Text style={[styles.testimonialMeta, { color: colors.muted }]} numberOfLines={1}>
                      {item.route}
                    </Text>
                  </View>
                  {item.rating > 0 ? (
                    <View style={[styles.ratingPill, { backgroundColor: colors.softGreen }]}>
                      <Ionicons name="star" size={12} color={colors.action} />
                      <Text style={[styles.ratingText, { color: colors.action }]}>
                        {item.rating.toFixed(1)}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.testimonialQuote, { color: colors.dark }]} numberOfLines={5}>
                  {item.quote}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </HomeSection>
        ) : null}

        <HomeSection title="Why travelers choose BANJARA">
          <TrustGrid />
        </HomeSection>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  feed: {
    paddingBottom: Spacing['4xl'],
  },
  searchFloat: {
    marginTop: Spacing.sm,
    marginHorizontal: Spacing.screen,
    gap: Spacing.md,
  },
  transportControls: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  segmentTrack: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'stretch',
    borderRadius: Radius.full,
    borderWidth: 1,
    padding: 3,
    gap: 0,
  },
  segmentChip: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentChipText: {
    fontSize: 12,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  hRow: {
    paddingHorizontal: Spacing.screen,
  },
  blogCard: {
    width: 268,
    marginRight: Spacing.sm,
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.card,
  },
  blogImage: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.border,
  },
  blogCopy: {
    padding: Spacing.md,
    gap: 4,
  },
  blogPlace: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  blogTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  blogExcerpt: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 17,
  },
  blogMeta: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    marginTop: 4,
  },
  testimonialCard: {
    width: 300,
    marginRight: Spacing.sm,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.card,
  },
  testimonialHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  testimonialAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.border,
  },
  testimonialName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
  },
  testimonialMeta: {
    fontFamily: Fonts.body,
    fontSize: 11,
    marginTop: 2,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  ratingText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
  },
  testimonialQuote: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },
  stack: {
    paddingHorizontal: Spacing.screen,
    gap: Spacing.sm,
  },
  hotelSlide: {
    marginRight: Spacing.sm,
  },
  recentStack: {
    marginHorizontal: Spacing.screen,
    gap: Spacing.sm,
  },
  recentRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    gap: Spacing.md,
    ...Shadows.card,
  },
  recentThumb: {
    width: 68,
    height: 68,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySoft,
  },
  recentBody: { flex: 1, minWidth: 0 },
  recentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  recentPlace: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
  },
  recentTypeChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  recentTypeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  recentDetails: {
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 4,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    gap: Spacing.md,
    ...Shadows.card,
  },
  routeThumb: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    backgroundColor: Colors.border,
  },
  routeCopy: { flex: 1, minWidth: 0 },
  routeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  routeTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    flex: 1,
  },
  routeDurationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  routeDurationText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
  },
  routeMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 3,
  },
  routeLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  routeLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#20C978',
  },
  routeLive: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
  },
  storyCard: {
    width: 260,
    height: 180,
    marginRight: Spacing.sm,
    borderRadius: Radius['3xl'],
    overflow: 'hidden',
    backgroundColor: Colors.border,
  },
  storyImage: { ...StyleSheet.absoluteFill },
  storyOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.lg,
  },
  storyTitle: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.card,
  },
  storySub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.86)',
    marginTop: 4,
  },
  finalCta: {
    marginHorizontal: Spacing.screen,
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: Radius.hero,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  finalCtaTitle: {
    fontFamily: Fonts.display,
    fontSize: 24,
    lineHeight: 30,
    color: Colors.white,
  },
  finalCtaSub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.78)',
    marginBottom: Spacing.sm,
  },
  finalCtaBtn: {
    backgroundColor: '#08111F',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl,
  },
});
