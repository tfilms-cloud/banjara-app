import { ArrowLeftRight, BedDouble, Clock3, Mountain, Palmtree, Tent, Trees } from 'lucide-react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HotelCard } from '@/components/hotels/HotelCard';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { DestinationCard } from '@/components/travel/DestinationCard';
import { HomeSection } from '@/components/travel/HomeSection';
import { AgencyTripSummaryCard } from '@/components/trip/AgencyTripSummaryCard';
import { PlaceAutocompleteSelect } from '@/components/ui/PlaceAutocompleteSelect';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { HotelCardSkeleton, TripCardSkeleton } from '@/components/ui/Skeleton';
import { Colors } from '@/constants/colors';
import { POPULAR_DESTINATIONS, POPULAR_ROUTE_SUGGESTIONS } from '@/constants/destinations';
import { TRIP_CITY_OPTIONS } from '@/constants/tripPlaces';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { usePopularHotels } from '@/hooks/useHotels';
import { useRecommendedTrips } from '@/hooks/useTrips';
import { useSearchStore } from '@/store/searchStore';
import { groupTripsByAgency } from '@/utils/groupTripsByAgency';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { pushPath } from '@/utils/navigation';

const EXPLORE_CATEGORIES = [
  { id: 'mountains', label: 'Mountain escapes', icon: Mountain, to: 'Hunza' },
  { id: 'weekend', label: 'Weekend trips', icon: Palmtree, to: 'Murree' },
  { id: 'adventure', label: 'Adventure', icon: Tent, to: 'Fairy Meadows' },
  { id: 'nature', label: 'Scenic routes', icon: Trees, to: 'Skardu' },
] as const;

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const {
    from,
    to,
    date,
    passengers,
    productMode,
    setFrom,
    setTo,
    swapLocations,
    saveRecentSearch,
    recentSearches,
    applyRecentSearch,
  } = useSearchStore();
  const { trips, loading: tripsLoading, error, refresh: refreshTrips } = useRecommendedTrips();
  const { hotels, loading: hotelsLoading, refresh: refreshHotels } = usePopularHotels();
  const [refreshing, setRefreshing] = useState(false);

  const citySuggestions = useMemo(
    () => [...new Set([...TRIP_CITY_OPTIONS, ...POPULAR_DESTINATIONS.map((d) => d.name)])],
    []
  );

  const agencyGroups = useMemo(() => groupTripsByAgency(trips).slice(0, 6), [trips]);

  const liveRoutes = useMemo(
    () =>
      POPULAR_ROUTE_SUGGESTIONS.map((route) => {
        const matches = trips.filter(
          (trip) =>
            trip.from.toLowerCase().includes(route.from.toLowerCase()) &&
            trip.to.toLowerCase().includes(route.to.toLowerCase())
        );
        return {
          ...route,
          tripCount: matches.length,
          fromPrice: matches.length ? Math.min(...matches.map((trip) => trip.price)) : null,
          currency: matches[0]?.currency ?? 'PKR',
        };
      }),
    [trips]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshTrips(), refreshHotels()]);
    setRefreshing(false);
  };

  const searchRoute = (nextFrom: string, nextTo: string) => {
    setFrom(nextFrom);
    setTo(nextTo);
    saveRecentSearch();
    router.push('/(customer)/results');
  };

  const onSearchRides = () => {
    if (!from?.trim() || !to?.trim()) return;
    saveRecentSearch();
    router.push('/(customer)/results');
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Explore"
        showNotifications
        onNotificationsPress={() => pushPath('/(customer)/(tabs)/notifications')}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
      >
        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>Discover the north</Text>
          <Text style={styles.searchSub}>Search a corridor, or browse destinations below.</Text>

          <View style={styles.routeBlock}>
            <View style={{ flex: 1, gap: Spacing.sm }}>
              <PlaceAutocompleteSelect
                label="From"
                leftIcon="navigate-outline"
                placeholder="Pickup city or stop"
                value={from}
                suggestions={citySuggestions}
                onChange={(name) => setFrom(name)}
                hint=""
              />
              <PlaceAutocompleteSelect
                label="To"
                leftIcon="flag-outline"
                placeholder="Destination"
                value={to}
                suggestions={citySuggestions.filter((name) => name !== from)}
                onChange={(name) => setTo(name)}
                hint=""
              />
            </View>
            <Pressable
              onPress={swapLocations}
              style={styles.swapBtn}
              accessibilityLabel="Swap locations"
              accessibilityRole="button"
            >
              <ArrowLeftRight size={16} color={Colors.primary} strokeWidth={2} />
            </Pressable>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Clock3 size={14} color={Colors.muted} strokeWidth={2} />
              <Text style={styles.metaText}>{formatDate(date, false)}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>
                {passengers} passenger{passengers > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>
                {productMode === 'trips' ? 'Return trips' : 'Rides'}
              </Text>
            </View>
          </View>

          <Button title="Search rides" onPress={onSearchRides} />
        </View>

        <HomeSection title="Explore by experience">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hRow}
          >
            {EXPLORE_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Pressable
                  key={cat.id}
                  style={styles.catCard}
                  onPress={() => searchRoute(from || 'Islamabad', cat.to)}
                  accessibilityRole="button"
                  accessibilityLabel={cat.label}
                >
                  <View style={styles.catIcon}>
                    <Icon size={20} color={Colors.primary} strokeWidth={2} />
                  </View>
                  <Text style={styles.catLabel}>{cat.label}</Text>
                </Pressable>
              );
            })}
            <Pressable
              style={styles.catCard}
              onPress={() => router.push('/(customer)/(tabs)/hotels')}
              accessibilityRole="button"
              accessibilityLabel="Hotels"
            >
              <View style={styles.catIcon}>
                <BedDouble size={20} color={Colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.catLabel}>Hotels</Text>
            </Pressable>
          </ScrollView>
        </HomeSection>

        <HomeSection title="Destinations">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hRow}
          >
            {POPULAR_DESTINATIONS.map((dest) => (
              <DestinationCard
                key={dest.id}
                name={dest.name}
                image={dest.image}
                subtitle={dest.subtitle}
                tag={dest.tag}
                onPress={() => searchRoute(from || 'Islamabad', dest.name)}
              />
            ))}
          </ScrollView>
        </HomeSection>

        <HomeSection title="Popular routes">
          <View style={styles.stack}>
            {liveRoutes.map((route) => (
              <Pressable
                key={route.id}
                style={styles.routeCard}
                onPress={() => searchRoute(route.from, route.to)}
                accessibilityRole="button"
                accessibilityLabel={`${route.from} to ${route.to}`}
              >
                <Image
                  source={{
                    uri:
                      POPULAR_DESTINATIONS.find((d) => d.name === route.to)?.image ??
                      POPULAR_DESTINATIONS[0].image,
                  }}
                  style={styles.routeThumb}
                  contentFit="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeTitle}>
                    {route.from} → {route.to}
                  </Text>
                  <Text style={styles.routeMeta}>{route.duration}</Text>
                  {route.tripCount > 0 ? (
                    <Text style={styles.routeLive}>
                      {route.tripCount} live trip{route.tripCount === 1 ? '' : 's'}
                      {route.fromPrice != null
                        ? ` · from ${formatCurrency(route.fromPrice, route.currency)}`
                        : ''}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.routeCta}>Search</Text>
              </Pressable>
            ))}
          </View>
        </HomeSection>

        {recentSearches.length > 0 ? (
          <HomeSection title="Recently searched">
            <View style={styles.stack}>
              {recentSearches.slice(0, 5).map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.routeCard}
                  onPress={() => {
                    applyRecentSearch(item);
                    router.push('/(customer)/results');
                  }}
                >
                  <View style={[styles.routeIcon, styles.recentIcon]}>
                    <Clock3 size={18} color={Colors.primary} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routeTitle}>
                      {item.from} → {item.to}
                    </Text>
                    <Text style={styles.routeMeta}>
                      {formatDate(item.date, false)} · {item.passengers} passenger
                      {item.passengers > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={styles.routeCta}>Open</Text>
                </Pressable>
              ))}
            </View>
          </HomeSection>
        ) : null}

        <HomeSection title="Agencies with live trips">
          {tripsLoading && trips.length === 0 ? (
            <View style={styles.stack}>
              <TripCardSkeleton />
              <TripCardSkeleton />
            </View>
          ) : error && trips.length === 0 ? (
            <EmptyState
              title="Could not load trips"
              message="Pull to refresh or try searching a route."
              actionLabel="Try again"
              onAction={() => void refreshTrips()}
            />
          ) : agencyGroups.length === 0 ? (
            <EmptyState
              title="No live trips yet"
              message="Search a destination above to find providers."
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

        <HomeSection
          title="Hotels"
          actionLabel="Browse"
          onAction={() => router.push('/(customer)/(tabs)/hotels')}
        >
          {hotelsLoading && hotels.length === 0 ? (
            <View style={styles.hRow}>
              <HotelCardSkeleton />
            </View>
          ) : hotels.length === 0 ? (
            <EmptyState
              title="No hotels yet"
              message="Stays appear here when providers list hotels."
            />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
              {hotels.slice(0, 6).map((hotel) => (
                <View key={hotel.id} style={styles.hotelSlide}>
                  <HotelCard
                    hotel={hotel}
                    onPress={() => router.push(`/(customer)/hotels/${hotel.id}`)}
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </HomeSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  searchCard: {
    marginHorizontal: Spacing.screen,
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  searchTitle: {
    ...Typography.h2,
    fontFamily: Fonts.display,
    fontSize: 22,
  },
  searchSub: {
    ...Typography.caption,
    marginTop: -6,
  },
  routeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  swapBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.dark,
  },
  hRow: {
    paddingHorizontal: Spacing.screen,
  },
  stack: {
    paddingHorizontal: Spacing.screen,
    gap: Spacing.md,
  },
  catCard: {
    width: 128,
    marginRight: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.dark,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  routeThumb: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.border,
  },
  routeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.actionSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentIcon: { backgroundColor: Colors.primarySoft },
  routeTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.dark,
  },
  routeMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  routeLive: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.action,
    marginTop: 4,
  },
  routeCta: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.action,
  },
  hotelSlide: { width: 280, marginRight: Spacing.md },
});
