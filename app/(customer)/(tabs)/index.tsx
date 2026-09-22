import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { HotelCard } from '@/components/hotels/HotelCard';
import { HotelSearchCard } from '@/components/hotels/HotelSearchCard';
import { DestinationCard } from '@/components/travel/DestinationCard';
import { HomeHeroHeader } from '@/components/travel/HomeHeroHeader';
import { HomeSection } from '@/components/travel/HomeSection';
import { TransportSearchCard } from '@/components/travel/SearchCard';
import { TrustGrid } from '@/components/travel/TrustGrid';
import { AgencyTripSummaryCard } from '@/components/trip/AgencyTripSummaryCard';
import { TripCard } from '@/components/trip/TripCard';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { PassengerPicker } from '@/components/ui/PassengerPicker';
import { EmptyState } from '@/components/ui/EmptyState';
import { HotelCardSkeleton, TripCardSkeleton } from '@/components/ui/Skeleton';
import { Colors, useThemeColors } from '@/constants/colors';
import {
  FEATURED_STORIES,
  POPULAR_DESTINATIONS,
  POPULAR_ROUTE_SUGGESTIONS,
  destinationImageFor,
  destinationMetaFor,
} from '@/constants/destinations';
import { type CustomerProductMode } from '@/constants/productModes';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { usePopularHotels } from '@/hooks/useHotels';
import { useRecommendedTrips } from '@/hooks/useTrips';
import { useAuthStore } from '@/store/authStore';
import { useHotelStore } from '@/store/hotelStore';
import { useSearchStore } from '@/store/searchStore';
import { useBookingStore } from '@/store/bookingStore';
import { useUserStore } from '@/store/userStore';
import { groupTripsByAgency } from '@/utils/groupTripsByAgency';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { formatDuration } from '@/utils/formatTime';
import { pushPath } from '@/utils/navigation';

type HomeMode = CustomerProductMode;

function shortDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return formatDate(iso, false);
  }
}

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const {
    from,
    to,
    date,
    returnDate,
    passengers,
    productMode,
    setFrom,
    setTo,
    setDate,
    setReturnDate,
    setPassengers,
    setProductMode,
    swapLocations,
    saveRecentSearch,
    recentSearches,
    applyRecentSearch,
  } = useSearchStore();
  const [mode, setMode] = useState<HomeMode>(productMode === 'trips' ? 'trips' : 'transport');
  const [showDate, setShowDate] = useState(false);
  const [showReturnDate, setShowReturnDate] = useState(false);
  const [showPassengers, setShowPassengers] = useState(false);
  const {
    checkIn,
    checkOut,
    destination: hotelDestination,
    setDestination,
    saveRecentSearch: saveHotelSearch,
    recentSearches: hotelRecent,
  } = useHotelStore();
  const { trips, loading, error, refresh: refreshTrips } = useRecommendedTrips();
  const { hotels, loading: hotelsLoading, refresh: refreshHotels } = usePopularHotels();
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
  const modeTrips = mode === 'trips' ? roundTrips : oneWayTrips;

  const agencyGroups = useMemo(() => groupTripsByAgency(modeTrips).slice(0, 4), [modeTrips]);

  const leavingSoon = useMemo(
    () =>
      [...modeTrips]
        .sort((a, b) => `${a.date}${a.departureTime}`.localeCompare(`${b.date}${b.departureTime}`))
        .slice(0, 4),
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
    if (mode === 'hotels') return undefined;
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
    return trips.filter(
      (trip) =>
        trip.from.toLowerCase().includes((from || '').toLowerCase()) &&
        trip.to.toLowerCase().includes((to || '').toLowerCase())
    ).length;
  }, [from, mode, stayHotels.length, to, trips]);

  const tripLengthLabel = useMemo(() => {
    if (mode !== 'trips' || !date || !returnDate) return undefined;
    const nights = Math.round(
      (new Date(`${returnDate}T12:00:00`).getTime() - new Date(`${date}T12:00:00`).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (nights < 1) return undefined;
    return `${nights}-night return`;
  }, [date, mode, returnDate]);

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
      }),
    [trips]
  );

  const onSearchTransport = () => {
    saveRecentSearch();
    router.push('/(customer)/results');
  };

  const onSearchHotels = () => {
    saveHotelSearch();
    router.push('/(customer)/hotels/results');
  };

  const onChangeMode = (next: HomeMode) => {
    setMode(next);
    if (next === 'transport' || next === 'trips') {
      setProductMode(next);
    }
  };

  const openDestination = (name: string) => {
    if (mode === 'hotels') {
      setDestination(name);
      saveHotelSearch();
      router.push('/(customer)/hotels/results');
      return;
    }
    setTo(name);
    if (mode === 'trips') setProductMode('trips');
    else setProductMode('transport');
    saveRecentSearch();
    router.push('/(customer)/results');
  };

  const openTrip = (tripId: string) => {
    const trip = trips.find((item) => item.id === tripId);
    if (trip) setTrip(trip);
    pushPath(`/(customer)/trip/${tripId}`);
  };

  const stayTitle = hotelDestination ? `Stays in ${hotelDestination}` : 'Popular stays';
  const rideTitle = mode === 'trips' ? 'Return trips' : 'Live rides';
  const searchCta = mode === 'hotels' ? 'Search stays' : mode === 'trips' ? 'Search trips' : 'Search rides';

  const searchBlock = (
    <View style={styles.searchFloat}>
      {mode === 'hotels' ? (
        <HotelSearchCard onSearch={onSearchHotels} showGuestControls={false} embedded showCta />
      ) : (
        <>
          <TransportSearchCard
            intent={mode === 'trips' ? 'trips' : 'transport'}
            from={from}
            to={to}
            dateLabel={date ? shortDate(date) : 'Pick date'}
            returnDateLabel={returnDate ? shortDate(returnDate) : 'Pick return'}
            passengersLabel={`${passengers} passenger${passengers === 1 ? '' : 's'}`}
            onFrom={() => router.push('/(customer)/(tabs)/search')}
            onTo={() => router.push('/(customer)/(tabs)/search')}
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
            showCta
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
    </View>
  );

  const recentSection =
    (mode === 'hotels' ? hotelRecent : recentSearches).length > 0 ? (
      <HomeSection title="Continue searching">
        <View style={styles.recentStack}>
          {mode === 'hotels'
            ? hotelRecent.slice(0, 4).map((item) => {
                const meta = destinationMetaFor(item.destination);
                const nights = Math.max(
                  1,
                  Math.round(
                    (new Date(item.checkOut).getTime() - new Date(item.checkIn).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                );
                return (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.recentRowCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                    onPress={() => {
                      useHotelStore.getState().applyRecentSearch(item);
                      setMode('hotels');
                      router.push('/(customer)/hotels/results');
                    }}
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
                      <Text style={[styles.recentPlace, { color: colors.dark }]} numberOfLines={1}>
                        {item.destination}
                      </Text>
                      <Text style={[styles.recentDetails, { color: colors.muted }]} numberOfLines={1}>
                        {shortDate(item.checkIn)} → {shortDate(item.checkOut)} · {nights} night
                        {nights === 1 ? '' : 's'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                  </Pressable>
                );
              })
            : recentSearches.slice(0, 4).map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.recentRowCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                  onPress={() => {
                    applyRecentSearch(item);
                    setMode(item.productMode === 'trips' ? 'trips' : 'transport');
                    router.push('/(customer)/results');
                  }}
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
                    <Text style={[styles.recentPlace, { color: colors.dark }]} numberOfLines={1}>
                      {item.from} → {item.to}
                    </Text>
                    <Text style={[styles.recentDetails, { color: colors.muted }]} numberOfLines={1}>
                      {shortDate(item.date)} · {item.passengers} passenger
                      {item.passengers === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
              ))}
        </View>
      </HomeSection>
    ) : null;

  const destinationsSection = (
    <HomeSection
      title={mode === 'hotels' ? 'More places to stay' : 'Popular destinations'}
      actionLabel="Explore"
      onAction={() => router.push('/(customer)/(tabs)/search')}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hRow}
      >
        {POPULAR_DESTINATIONS.map((item, index) => (
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

  const ridesSection = (
    <HomeSection
      title={rideTitle}
      subtitle={mode === 'trips' ? 'Go and come home on BANJARA' : 'Agencies with seats you can book now'}
      actionLabel="View all"
      onAction={() => router.push('/(customer)/results')}
    >
      {loading && modeTrips.length === 0 ? (
        <View style={styles.stack}>
          <TripCardSkeleton />
          <TripCardSkeleton />
        </View>
      ) : error && modeTrips.length === 0 ? (
        <EmptyState
          title="Could not load trips"
          message="Check your connection and try again."
          actionLabel="Try again"
          onAction={() => void refreshTrips()}
        />
      ) : leavingSoon.length === 0 ? (
        <EmptyState
          title={mode === 'trips' ? 'No return trips yet' : 'No rides listed yet'}
          message="Search a route to find vans, buses, and private seats."
          actionLabel={searchCta}
          onAction={onSearchTransport}
        />
      ) : (
        <View style={styles.stack}>
          {leavingSoon.map((trip) => (
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

  const providersSection = (
    <HomeSection
      title="Top providers"
      subtitle="Agencies with live trips"
      actionLabel="See more"
      onAction={() => router.push('/(customer)/(tabs)/search')}
    >
      {loading && agencyGroups.length === 0 ? (
        <View style={styles.stack}>
          <TripCardSkeleton />
        </View>
      ) : agencyGroups.length === 0 ? (
        <EmptyState
          title="No agencies yet"
          message="When providers publish trips, they will appear here."
        />
      ) : (
        <View style={styles.stack}>
          {agencyGroups.map((group) => (
            <AgencyTripSummaryCard
              key={group.agencyId}
              group={group}
              onPress={() => router.push(`/(customer)/agency/${group.agencyId}`)}
            />
          ))}
        </View>
      )}
    </HomeSection>
  );

  const renderStays = (layout: 'detail' | 'rail') => (
    <HomeSection
      title={stayTitle}
      subtitle={
        layout === 'detail'
          ? 'Rooms and lodges you can book'
          : 'Stay after you arrive'
      }
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
    <HomeSection title="Popular routes">
      <View style={styles.stack}>
        {liveRoutes.map((route) => {
          const dest = POPULAR_DESTINATIONS.find((d) => d.name === route.to);
          return (
            <Pressable
              key={route.id}
              style={[
                styles.routeCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => {
                setFrom(route.from);
                setTo(route.to);
                saveRecentSearch();
                router.push('/(customer)/results');
              }}
              accessibilityRole="button"
              accessibilityLabel={`Search ${route.from} to ${route.to}`}
            >
              <Image
                source={{ uri: dest?.image ?? POPULAR_DESTINATIONS[0].image }}
                style={styles.routeThumb}
                contentFit="cover"
              />
              <View style={styles.routeCopy}>
                <Text style={[styles.routeTitle, { color: colors.dark }]}>
                  {route.from} → {route.to}
                </Text>
                <Text style={[styles.routeMeta, { color: colors.muted }]}>{route.duration}</Text>
                {route.tripCount > 0 ? (
                  <Text style={[styles.routeLive, { color: colors.action }]}>
                    {route.tripCount} live trip{route.tripCount === 1 ? '' : 's'}
                    {route.fromPrice != null
                      ? ` · from ${formatCurrency(route.fromPrice, route.currency)}`
                      : ''}
                  </Text>
                ) : (
                  <Text style={[styles.routeMeta, { color: colors.muted }]}>Search this corridor</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          );
        })}
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
              await Promise.all([refreshTrips(), refreshHotels()]);
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

        {recentSection}

        {mode === 'hotels' ? (
          <>
            {renderStays('detail')}
            {connectingRidesSection}
          </>
        ) : (
          <>
            {ridesSection}
            {recommendedSection}
            {providersSection}
            {routesSection}
            {renderStays('rail')}
          </>
        )}

        {destinationsSection}

        <HomeSection title="Travel inspiration">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hRow}
          >
            {FEATURED_STORIES.map((story) => (
              <DestinationCard
                key={story.id}
                name={story.title}
                subtitle={story.subtitle}
                image={story.image}
                featured
                onPress={() => openDestination(story.to)}
              />
            ))}
          </ScrollView>
        </HomeSection>

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
    gap: Spacing.sm,
  },
  hRow: {
    paddingHorizontal: Spacing.screen,
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
    ...Shadows.soft,
  },
  recentThumb: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primarySoft,
  },
  recentBody: { flex: 1, minWidth: 0 },
  recentPlace: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.dark,
  },
  recentDetails: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
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
  },
  routeThumb: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    backgroundColor: Colors.border,
  },
  routeCopy: { flex: 1, minWidth: 0 },
  routeTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: Colors.dark,
  },
  routeMeta: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
    marginTop: 2,
  },
  routeLive: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.action,
    marginTop: 4,
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
