import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { TripCard } from '@/components/trip/TripCard';
import { TripResultsMap, tripsWithMapPoints } from '@/components/trip/TripResultsMap';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { TripCardSkeleton } from '@/components/ui/Skeleton';
import { Colors } from '@/constants/colors';
import { productModeMeta } from '@/constants/productModes';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { useTrips } from '@/hooks/useTrips';
import { useBookingStore } from '@/store/bookingStore';
import { useSearchStore } from '@/store/searchStore';
import type { TripFilters, TripSortBy, VehicleType } from '@/types/trip';
import { formatDate } from '@/utils/formatDate';
import { vehicleTypeLabel } from '@/utils/helpers';

const VEHICLE_TYPES: VehicleType[] = ['van', 'bus', 'car', 'tour', 'private'];
const TIME_WINDOWS: Array<{ key: NonNullable<TripFilters['departureTime']>; label: string }> = [
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
  { key: 'night', label: 'Night' },
];
const PRICE_BANDS: Array<{ label: string; min?: number; max?: number }> = [
  { label: 'Any price' },
  { label: 'Under 3,000', max: 2999 },
  { label: '3,000 – 6,000', min: 3000, max: 6000 },
  { label: '6,000 – 10,000', min: 6000, max: 10000 },
  { label: '10,000+', min: 10000 },
];

export default function ResultsScreen() {
  const { from, to, date, passengers, productMode, sortBy, setSortBy, filters, setFilters, resetFilters } =
    useSearchStore();
  const setTrip = useBookingStore((state) => state.setTrip);
  const { trips, loading, error, refresh } = useTrips();
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [mapMode, setMapMode] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string>();
  const modeMeta = productModeMeta(productMode);

  const sortOptions: { label: string; value: TripSortBy }[] = [
    { label: 'Recommended', value: 'recommended' },
    { label: 'Cheapest', value: 'price_asc' },
    { label: 'Earliest departure', value: 'departure' },
    { label: 'Latest departure', value: 'departure_desc' },
    { label: 'Highest rated', value: 'rating' },
    { label: 'Fastest', value: 'duration' },
  ];

  const mappableTrips = useMemo(() => tripsWithMapPoints(trips), [trips]);
  const canShowMap = mappableTrips.length > 0;

  const providers = useMemo(() => {
    const map = new Map<string, string>();
    trips.forEach((trip) => {
      if (trip.agencyId) map.set(trip.agencyId, trip.agency.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [trips]);

  const activeFilterCount = [
    filters.vehicleTypes?.length,
    filters.departureTime,
    filters.arrivalTime,
    filters.minRating,
    filters.minSeats,
    filters.minPrice,
    filters.maxPrice,
    filters.providerIds?.length,
  ].filter(Boolean).length;

  const openTrip = (id: string) => {
    const trip = trips.find((item) => item.id === id);
    if (!trip) return;
    setTrip(trip);
    router.push(`/(customer)/trip/${id}`);
  };

  const noun = productMode === 'trips' ? 'trips' : 'rides';

  return (
    <View style={styles.container}>
      <Header
        title={modeMeta.resultsTitle}
        showBack
        right={
          canShowMap ? (
            <Pressable
              onPress={() => setMapMode((value) => !value)}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel={mapMode ? 'Show list' : 'Show map'}
            >
              <Ionicons name={mapMode ? 'list' : 'map-outline'} size={18} color={Colors.primary} />
            </Pressable>
          ) : null
        }
      />

      <Pressable
        style={styles.summary}
        onPress={() => router.push('/(customer)/(tabs)/search')}
        accessibilityRole="button"
        accessibilityLabel="Edit search"
      >
        <Text style={styles.summaryRoute}>
          {from} → {to}
        </Text>
        <Text style={styles.summaryMeta}>
          {formatDate(date, false)} · {passengers} passenger{passengers > 1 ? 's' : ''}
          {productMode === 'trips' ? ' · return' : ' · one way'}
        </Text>
        <Text style={styles.summaryCount}>
          {loading ? 'Searching…' : `${trips.length} ${noun} available`}
        </Text>
      </Pressable>

      <View style={styles.toolbar}>
        <Pressable
          style={styles.toolChip}
          onPress={() => setShowSort(true)}
          accessibilityRole="button"
          accessibilityLabel="Sort results"
        >
          <Ionicons name="swap-vertical" size={14} color={Colors.dark} />
          <Text style={styles.toolChipText}>
            {sortOptions.find((item) => item.value === sortBy)?.label ?? 'Sort'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toolChip, activeFilterCount > 0 && styles.toolChipActive]}
          onPress={() => setShowFilters(true)}
          accessibilityRole="button"
          accessibilityLabel="Filter results"
        >
          <Ionicons
            name="options-outline"
            size={14}
            color={activeFilterCount > 0 ? Colors.card : Colors.dark}
          />
          <Text style={[styles.toolChipText, activeFilterCount > 0 && styles.toolChipTextActive]}>
            Filter{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
          </Text>
        </Pressable>
      </View>

      {loading && trips.length === 0 ? (
        <View style={styles.list}>
          <TripCardSkeleton />
          <TripCardSkeleton />
          <TripCardSkeleton />
        </View>
      ) : error && trips.length === 0 ? (
        <ErrorState title="Could not load trips" message={error} onRetry={refresh} />
      ) : mapMode && canShowMap ? (
        <View style={styles.mapWrap}>
          <TripResultsMap
            trips={mappableTrips}
            selectedTripId={selectedTripId ?? mappableTrips[0]?.id}
            onSelectTrip={(trip) => {
              setSelectedTripId(trip.id);
            }}
            height={320}
          />
          {selectedTripId ? (
            <View style={styles.mapCard}>
              {trips
                .filter((trip) => trip.id === selectedTripId)
                .map((trip) => (
                  <TripCard key={trip.id} trip={trip} onPress={() => openTrip(trip.id)} />
                ))}
            </View>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
          ListEmptyComponent={
            <EmptyState
              title={modeMeta.emptyTitle}
              message={modeMeta.emptyMessage}
              icon={productMode === 'trips' ? 'swap-horizontal-outline' : 'bus-outline'}
              actionLabel="Edit search"
              onAction={() => router.push('/(customer)/(tabs)/search')}
            />
          }
          renderItem={({ item }) => (
            <TripCard trip={item} onPress={() => openTrip(item.id)} />
          )}
        />
      )}

      <BottomSheet visible={showSort} title="Sort by" onClose={() => setShowSort(false)}>
        {sortOptions.map((option) => (
          <Pressable
            key={option.value}
            style={styles.option}
            onPress={() => {
              setSortBy(option.value);
              setShowSort(false);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: sortBy === option.value }}
          >
            <Text style={styles.optionText}>{option.label}</Text>
            {sortBy === option.value ? (
              <Ionicons name="checkmark" size={18} color={Colors.action} />
            ) : null}
          </Pressable>
        ))}
      </BottomSheet>

      <BottomSheet visible={showFilters} title="Filters" onClose={() => setShowFilters(false)}>
        <ScrollView style={styles.filterScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.filterLabel}>Price</Text>
          <View style={styles.chips}>
            {PRICE_BANDS.map((band) => {
              const active = filters.minPrice === band.min && filters.maxPrice === band.max;
              return (
                <Pressable
                  key={band.label}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() =>
                    setFilters({ ...filters, minPrice: band.min, maxPrice: band.max })
                  }
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{band.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.filterLabel}>Departure</Text>
          <View style={styles.chips}>
            {TIME_WINDOWS.map((item) => {
              const active = filters.departureTime === item.key;
              return (
                <Pressable
                  key={`dep-${item.key}`}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() =>
                    setFilters({
                      ...filters,
                      departureTime: active ? undefined : item.key,
                    })
                  }
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.filterLabel}>Arrival</Text>
          <View style={styles.chips}>
            {TIME_WINDOWS.map((item) => {
              const active = filters.arrivalTime === item.key;
              return (
                <Pressable
                  key={`arr-${item.key}`}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() =>
                    setFilters({
                      ...filters,
                      arrivalTime: active ? undefined : item.key,
                    })
                  }
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.filterLabel}>Vehicle</Text>
          <View style={styles.chips}>
            {VEHICLE_TYPES.map((type) => {
              const active = filters.vehicleTypes?.includes(type);
              return (
                <Pressable
                  key={type}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    const current = filters.vehicleTypes ?? [];
                    const next = active
                      ? current.filter((item) => item !== type)
                      : [...current, type];
                    setFilters({ ...filters, vehicleTypes: next });
                  }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {vehicleTypeLabel(type)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {providers.length > 1 ? (
            <>
              <Text style={styles.filterLabel}>Provider</Text>
              <View style={styles.chips}>
                {providers.map((provider) => {
                  const active = filters.providerIds?.includes(provider.id);
                  return (
                    <Pressable
                      key={provider.id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => {
                        const current = filters.providerIds ?? [];
                        const next = active
                          ? current.filter((id) => id !== provider.id)
                          : [...current, provider.id];
                        setFilters({ ...filters, providerIds: next });
                      }}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                        {provider.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          <Text style={styles.filterLabel}>Minimum rating</Text>
          <View style={styles.chips}>
            {[3.5, 4, 4.5].map((rating) => (
              <Pressable
                key={rating}
                style={[styles.chip, filters.minRating === rating && styles.chipActive]}
                onPress={() =>
                  setFilters({
                    ...filters,
                    minRating: filters.minRating === rating ? undefined : rating,
                  })
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    filters.minRating === rating && styles.chipTextActive,
                  ]}
                >
                  {rating}+
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.filterLabel}>Seats available</Text>
          <View style={styles.chips}>
            {[2, 4, 6].map((seats) => (
              <Pressable
                key={seats}
                style={[styles.chip, filters.minSeats === seats && styles.chipActive]}
                onPress={() =>
                  setFilters({
                    ...filters,
                    minSeats: filters.minSeats === seats ? undefined : seats,
                  })
                }
              >
                <Text
                  style={[styles.chipText, filters.minSeats === seats && styles.chipTextActive]}
                >
                  {seats}+ seats
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.filterActions}>
            <Button title="Reset" variant="outline" onPress={resetFilters} style={{ flex: 1 }} />
            <Button title="Apply" onPress={() => setShowFilters(false)} style={{ flex: 1 }} />
          </View>
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  summary: {
    marginHorizontal: Spacing.screen,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  summaryRoute: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.dark,
  },
  summaryMeta: {
    ...Typography.caption,
    marginTop: 4,
  },
  summaryCount: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.action,
    marginTop: 6,
  },
  toolbar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.sm,
  },
  toolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toolChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toolChipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.dark,
  },
  toolChipTextActive: { color: Colors.card },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: Spacing.screen, gap: Spacing.md, paddingBottom: 40 },
  mapWrap: { flex: 1, paddingHorizontal: Spacing.screen, gap: Spacing.sm },
  mapCard: { flexGrow: 0 },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionText: { ...Typography.body, color: Colors.dark },
  filterScroll: { maxHeight: 480 },
  filterLabel: {
    ...Typography.bodyBold,
    color: Colors.dark,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: '100%',
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: {
    ...Typography.caption,
    color: Colors.muted,
    fontFamily: Fonts.bodySemiBold,
  },
  chipTextActive: { color: Colors.card },
  filterActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
});
