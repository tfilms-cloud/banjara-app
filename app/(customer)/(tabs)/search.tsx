import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ExplorePanels, FloatingCrossSell } from '@/components/explore/ExplorePanels';
import {
  ExploreBanner,
  ExploreHelp,
  ExploreServiceSelector,
  ExploreTransportPanel,
} from '@/components/explore/ExploreDiscovery';
import { ExploreRefineBar } from '@/components/explore/ExploreRefineBar';
import { HomeTopBar } from '@/components/home/HomeDiscovery';
import { TravelDesignProvider } from '@/components/ui/TravelDesignProvider';
import { TravelTextField } from '@/components/ui/TravelForm';
import { useExploreDesign } from '@/constants/exploreDesign';
import type { ExploreServiceTab } from '@/constants/exploreCatalog';
import { Fonts } from '@/constants/typography';
import { usePopularHotels } from '@/hooks/useHotels';
import { useGuides, useRestaurants, useTourOperators } from '@/hooks/useRestaurants';
import { useRecommendedTrips } from '@/hooks/useTrips';
import { useAuthStore } from '@/store/authStore';
import { useSearchStore } from '@/store/searchStore';
import { useUserStore } from '@/store/userStore';
import {
  DEFAULT_REFINE,
  refineHotels,
  refineRated,
  refineTrips,
  sanitizeRefine,
  type ExploreRefine,
} from '@/utils/exploreRefine';
import { pushPath } from '@/utils/navigation';

const EXPLORE_SERVICES: readonly string[] = ['transport', 'hotels', 'tours', 'guides', 'restaurants'];

function isExploreService(value: string | undefined): value is ExploreServiceTab {
  return !!value && EXPLORE_SERVICES.includes(value);
}

export default function ExploreScreen() {
  const theme = useExploreDesign();
  const user = useAuthStore((state) => state.user);
  const profile = useUserStore((state) => state.profile);
  const notifications = useUserStore((state) => state.notifications);
  const toggleSavedTrip = useUserStore((state) => state.toggleSavedTrip);
  const { service } = useLocalSearchParams<{ service?: string }>();
  const [tab, setTab] = useState<ExploreServiceTab>(() =>
    isExploreService(service) ? service : 'transport',
  );
  // Home deep-links here with ?service=…; keep the tab in sync when it changes.
  useEffect(() => {
    if (isExploreService(service)) setTab(service);
  }, [service]);
  const [refineState, setRefine] = useState<ExploreRefine>(DEFAULT_REFINE);
  // Settings only apply to services that offer them (e.g. 'Free cancellation' is hotels-only).
  const refine = useMemo(() => sanitizeRefine(tab, refineState), [tab, refineState]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const {
    trips,
    loading: tripsLoading,
    error: tripsError,
    refresh: refreshTrips,
  } = useRecommendedTrips();
  const { hotels, loading: hotelsLoading, refresh: refreshHotels } = usePopularHotels();
  const {
    restaurants,
    loading: restosLoading,
    refresh: refreshRestos,
    searchByDestination,
  } = useRestaurants();
  const { guides, loading: guidesLoading, refresh: refreshGuides } = useGuides();
  const { tours: tourProviders, loading: toursLoading, refresh: refreshTours } = useTourOperators();

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshTrips(),
      refreshHotels(),
      refreshRestos(),
      refreshGuides(),
      refreshTours(),
    ]);
  }, [refreshTrips, refreshHotels, refreshRestos, refreshGuides, refreshTours]);

  useFocusEffect(
    useCallback(() => {
      void refreshAll();
    }, [refreshAll]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  };

  const changeService = (next: ExploreServiceTab) => {
    setTab(next);
    setQuery('');
    setRefine(DEFAULT_REFINE);
    scroll.current?.scrollTo({ y: 0, animated: true });
  };

  const catalog = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matches = (...parts: Array<string | undefined>) =>
      !term || parts.join(' ').toLowerCase().includes(term);
    return {
      trips: refineTrips(
        trips.filter((trip) =>
          matches(trip.vehicleName, trip.vehicleType, trip.agency.name, trip.from, trip.to),
        ),
        refine,
      ),
      hotels: refineHotels(
        hotels.filter((hotel) => matches(hotel.name, hotel.location.city, hotel.location.area)),
        refine,
      ),
      restaurants: refineRated(
        restaurants.filter((restaurant) =>
          matches(restaurant.name, restaurant.city, ...restaurant.cuisine),
        ),
        refine,
      ),
      guides: refineRated(
        guides.filter((guide) =>
          matches(guide.businessName, guide.ownerName, guide.city, guide.description),
        ),
        refine,
      ),
      tourProviders: tourProviders.filter((provider) =>
        matches(provider.businessName, provider.city, provider.tour?.destination),
      ),
    };
  }, [query, refine, trips, hotels, restaurants, guides, tourProviders]);

  const openRoute = (from: string, to: string) => {
    const search = useSearchStore.getState();
    search.setFrom(from);
    search.setTo(to);
    search.setQuery('');
    search.setProductMode('transport');
    search.saveRecentSearch();
    pushPath('/(customer)/results');
  };

  const saveTrip = (id: string) => {
    if (!user) {
      pushPath('/(customer)/(tabs)/profile');
      return;
    }
    if (useUserStore.getState().profile?.id !== user.id) useUserStore.setState({ profile: user });
    toggleSavedTrip(id);
  };

  const categoryLoading =
    tab === 'hotels'
      ? hotelsLoading
      : tab === 'guides'
        ? guidesLoading
        : tab === 'restaurants'
          ? restosLoading
          : toursLoading;

  return (
    <TravelDesignProvider>
      <View style={[s.root, { backgroundColor: theme.background }]}>
        <HomeTopBar
          name={user?.name}
          avatar={user?.avatar}
          unread={notifications.some((item) => !item.read)}
          onSearch={() => {
            setSearchVisible((visible) => !visible);
            setQuery('');
            scroll.current?.scrollTo({ y: 0, animated: true });
          }}
          onNotifications={() => pushPath('/(customer)/(tabs)/notifications')}
          onProfile={() => pushPath('/(customer)/(tabs)/profile')}
        />
        <ScrollView
          ref={scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.feed}
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={theme.primary}
              colors={[theme.primary]}
              onRefresh={() => void onRefresh()}
            />
          }
        >
          <ExploreServiceSelector value={tab} onChange={changeService} />
          {searchVisible ? (
            <View style={s.search}>
              <TravelTextField
                label="Search Explore"
                value={query}
                onChangeText={setQuery}
                placeholder="Vehicle, provider or destination"
                icon="search-outline"
                onSubmit={() => Keyboard.dismiss()}
              />
            </View>
          ) : null}
          <ExploreBanner service={tab} />
          <ExploreRefineBar
            service={tab}
            value={refine}
            onChange={setRefine}
            resultCount={
              tab === 'transport'
                ? catalog.trips.length
                : tab === 'hotels'
                  ? catalog.hotels.length
                  : tab === 'guides'
                    ? catalog.guides.length
                    : tab === 'restaurants'
                      ? catalog.restaurants.length
                      : undefined
            }
          />
          {tab === 'transport' ? (
            <ExploreTransportPanel
              trips={catalog.trips}
              loading={tripsLoading}
              error={tripsError}
              onRetry={() => void refreshTrips()}
              onOpenRoute={openRoute}
              savedIds={profile?.savedTripIds ?? []}
              onSave={saveTrip}
              onGuides={() => changeService('guides')}
            />
          ) : (
            <>
              {categoryLoading ? (
                <View style={s.loading}>
                  <ActivityIndicator color={theme.primary} />
                  <Text style={[s.loadingText, { color: theme.muted }]}>Refreshing listings…</Text>
                </View>
              ) : null}
              <ExplorePanels
                tab={tab}
                {...catalog}
                query={query}
                onSearchRestaurants={(city) => void searchByDestination(city)}
              />
              <FloatingCrossSell tab={tab} {...catalog} />
            </>
          )}
        </ScrollView>
        <ExploreHelp />
      </View>
    </TravelDesignProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  feed: { paddingBottom: 88 },
  search: { paddingHorizontal: 16, paddingBottom: 12 },
  loading: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: { fontFamily: Fonts.body, fontSize: 12 },
});
