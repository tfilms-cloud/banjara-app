import { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { ExplorePanels, FloatingCrossSell } from '@/components/explore/ExplorePanels';
import { CustomerHeader } from '@/components/travel/CustomerHeader';
import { SearchModeTabs } from '@/components/travel/SearchCard';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { Colors, useThemeColors } from '@/constants/colors';
import {
  type ExploreServiceTab,
} from '@/constants/exploreCatalog';
import { Spacing } from '@/constants/spacing';
import { CustomerType, Fonts, TypeSize } from '@/constants/typography';
import { usePopularHotels } from '@/hooks/useHotels';
import { useGuides, useRestaurants, useTourOperators } from '@/hooks/useRestaurants';
import { useRecommendedTrips } from '@/hooks/useTrips';
import { pushPath } from '@/utils/navigation';

export default function ExploreScreen() {
  const user = useAuthStore(state => state.user);
  const notifications = useUserStore(state => state.notifications);
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [tab, setTab] = useState<ExploreServiceTab>('transport');
  const { trips, loading: tripsLoading, refresh: refreshTrips } = useRecommendedTrips();
  const { hotels, loading: hotelsLoading, refresh: refreshHotels } = usePopularHotels();
  const {
    restaurants,
    loading: restosLoading,
    refresh: refreshRestos,
    searchByDestination,
  } = useRestaurants();
  const { guides, refresh: refreshGuides } = useGuides();
  const { tours: tourProviders, refresh: refreshTours } = useTourOperators();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refreshTrips();
      void refreshHotels();
      void refreshRestos();
      void refreshGuides();
      void refreshTours();
    }, [refreshTrips, refreshHotels, refreshRestos, refreshGuides, refreshTours])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshTrips(),
      refreshHotels(),
      refreshRestos(),
      refreshGuides(),
      refreshTours(),
    ]);
    setRefreshing(false);
  };

  const subtitle = useMemo(() => {
    switch (tab) {
      case 'transport':
        return 'Vehicles & transporters on BANJARA';
      case 'hotels':
        return 'Hotels, guest houses & lodges';
      case 'tours':
        return 'Treks, expeditions & summits';
      case 'guides':
        return 'Local guides by language & rating';
      case 'restaurants':
        return 'Search by destination · offers & most visited';
      default:
        return 'Highlights across BANJARA services';
    }
  }, [tab]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <CustomerHeader userName={user?.name} userAvatar={user?.avatar} hasUnread={notifications.some(item => !item.read)} onOpenSearch={() => pushPath('/(customer)/results')} onNotifications={() => pushPath('/(customer)/(tabs)/notifications')} onProfile={() => pushPath('/(customer)/(tabs)/profile')} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing['3xl'] }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
      >
        <View style={styles.intro}>
          <Text style={[styles.introTitle, { color: colors.dark }]}>All BANJARA services</Text>
          <Text style={[styles.introSub, { color: colors.muted }]}>{subtitle}</Text>
        </View>

        <SearchModeTabs mode={tab} onChange={setTab} compact />

        <ExplorePanels
          tab={tab}
          trips={trips}
          hotels={hotels}
          restaurants={restaurants}
          guides={guides}
          tourProviders={tourProviders}
          onSearchRestaurants={(city) => void searchByDestination(city)}
        />

        <FloatingCrossSell
          tab={tab}
          trips={trips}
          hotels={hotels}
          restaurants={restaurants}
          guides={guides}
        />

        {(tripsLoading || hotelsLoading || restosLoading) &&
        !trips.length &&
        !hotels.length &&
        !restaurants.length ? (
          <Text style={[styles.loadingHint, { color: colors.muted }]}>Loading live inventory…</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  intro: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  introTitle: {
    ...CustomerType.section,
    letterSpacing: -0.3,
  },
  introSub: {
    fontFamily: Fonts.body,
    fontSize: TypeSize.label,
  },
  loadingHint: {
    textAlign: 'center',
    fontFamily: Fonts.body,
    fontSize: TypeSize.caption,
    marginTop: Spacing.md,
  },
});
