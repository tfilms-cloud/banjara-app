import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { ExplorePanels, FloatingCrossSell } from '@/components/explore/ExplorePanels';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Colors, useThemeColors } from '@/constants/colors';
import {
  EXPLORE_SERVICE_TABS,
  type ExploreServiceTab,
} from '@/constants/exploreCatalog';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { usePopularHotels } from '@/hooks/useHotels';
import { useGuides, useRestaurants, useTourOperators } from '@/hooks/useRestaurants';
import { useRecommendedTrips } from '@/hooks/useTrips';
import { pushPath } from '@/utils/navigation';

export default function ExploreScreen() {
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
      <ScreenHeader
        title="Explore"
        showNotifications
        onNotificationsPress={() => pushPath('/(customer)/(tabs)/notifications')}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {EXPLORE_SERVICE_TABS.map((item) => {
            const active = tab === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setTab(item.id)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: active ? colors.white : colors.dark,
                      fontFamily: active ? Fonts.bodySemiBold : Fonts.bodyMedium,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

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
    gap: 4,
  },
  introTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  introSub: {
    fontFamily: Fonts.body,
    fontSize: 13,
  },
  tabsRow: {
    paddingHorizontal: Spacing.screen,
    gap: 8,
    paddingBottom: Spacing.sm,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    ...Shadows.soft,
  },
  tabText: {
    fontSize: 13,
  },
  loadingHint: {
    textAlign: 'center',
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: Spacing.md,
  },
});
