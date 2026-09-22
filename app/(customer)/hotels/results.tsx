import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { pushPath } from '@/utils/navigation';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { HotelCard } from '@/components/hotels/HotelCard';
import { HotelMap } from '@/components/hotels/HotelMap';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useHotels } from '@/hooks/useHotels';
import { useHotelStore } from '@/store/hotelStore';
import type { HotelSortBy, HotelType } from '@/types/hotel';
import { formatDate } from '@/utils/formatDate';

export default function HotelResultsScreen() {
  const {
    destination,
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    sortBy,
    setSortBy,
    filters,
    setFilters,
    resetFilters,
    setHotel,
  } = useHotelStore();
  const { hotels, loading, error, refresh } = useHotels();
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [mapMode, setMapMode] = useState(false);
  const [selectedMapHotelId, setSelectedMapHotelId] = useState<string>();

  const sortOptions: { label: string; value: HotelSortBy }[] = [
    { label: 'Recommended', value: 'recommended' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Rating', value: 'rating' },
    { label: 'Distance', value: 'distance' },
  ];

  const hotelTypes: HotelType[] = ['hotel', 'resort', 'guest_house', 'lodge', 'homestay'];

  return (
    <View style={styles.container}>
      <Header
        title={`Hotels in ${destination}`}
        subtitle={`${formatDate(checkIn, false)} → ${formatDate(checkOut, false)} · ${adults + children} guests · ${rooms} room${rooms > 1 ? 's' : ''} · ${hotels.length} stays`}
        showBack
        fallbackHref="/(customer)/(tabs)/hotels"
        right={
          <View style={styles.actions}>
            <Pressable onPress={() => setMapMode((v) => !v)} style={styles.iconBtn}>
              <Ionicons name={mapMode ? 'list' : 'map'} size={18} color={Colors.primary} />
            </Pressable>
            <Pressable onPress={() => setShowSort(true)} style={styles.iconBtn}>
              <Ionicons name="swap-vertical" size={18} color={Colors.primary} />
            </Pressable>
            <Pressable onPress={() => setShowFilters(true)} style={styles.iconBtn}>
              <Ionicons name="options-outline" size={18} color={Colors.primary} />
            </Pressable>
          </View>
        }
      />

      {loading ? (
        <LoadingState title="Searching hotels..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : mapMode ? (
        <View style={styles.mapWrap}>
          <HotelMap
            hotels={hotels}
            selectedHotelId={selectedMapHotelId}
            onSelectHotel={(hotel) => {
              setSelectedMapHotelId(hotel.id);
              setHotel(hotel);
            }}
            height={360}
          />
          <FlatList
            data={hotels}
            horizontal
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.mapCards}
            renderItem={({ item }) => (
              <HotelCard
                hotel={item}
                checkIn={checkIn}
                checkOut={checkOut}
                compact
                onPress={() => {
                  setHotel(item);
                  pushPath(`/(customer)/hotels/${item.id}`);
                }}
              />
            )}
          />
        </View>
      ) : (
        <FlatList
          data={hotels}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
          ListEmptyComponent={
            <EmptyState
              title="No hotels found"
              message="Try another destination or adjust your filters."
              icon="bed-outline"
            />
          }
          renderItem={({ item }) => (
            <HotelCard
              hotel={item}
              checkIn={checkIn}
              checkOut={checkOut}
              onPress={() => {
                setHotel(item);
                pushPath(`/(customer)/hotels/${item.id}`);
              }}
            />
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
          >
            <Text style={styles.optionText}>{option.label}</Text>
            {sortBy === option.value ? (
              <Ionicons name="checkmark" size={18} color={Colors.secondary} />
            ) : null}
          </Pressable>
        ))}
      </BottomSheet>

      <BottomSheet visible={showFilters} title="Filters" onClose={() => setShowFilters(false)}>
        <Text style={styles.filterLabel}>Hotel type</Text>
        <View style={styles.chips}>
          {hotelTypes.map((type) => {
            const active = filters.hotelTypes?.includes(type);
            return (
              <Pressable
                key={type}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => {
                  const current = filters.hotelTypes ?? [];
                  const next = active
                    ? current.filter((item) => item !== type)
                    : [...current, type];
                  setFilters({ ...filters, hotelTypes: next });
                }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {type.replace('_', ' ')}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.filterLabel}>Minimum rating</Text>
        <View style={styles.chips}>
          {[3.5, 4, 4.5].map((rating) => (
            <Pressable
              key={rating}
              style={[styles.chip, filters.minRating === rating && styles.chipActive]}
              onPress={() => setFilters({ ...filters, minRating: rating })}
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
        <View style={styles.chips}>
          <Pressable
            style={[styles.chip, filters.breakfastIncluded && styles.chipActive]}
            onPress={() =>
              setFilters({ ...filters, breakfastIncluded: !filters.breakfastIncluded })
            }
          >
            <Text
              style={[styles.chipText, filters.breakfastIncluded && styles.chipTextActive]}
            >
              Breakfast included
            </Text>
          </Pressable>
          <Pressable
            style={[styles.chip, filters.freeCancellation && styles.chipActive]}
            onPress={() =>
              setFilters({ ...filters, freeCancellation: !filters.freeCancellation })
            }
          >
            <Text
              style={[styles.chipText, filters.freeCancellation && styles.chipTextActive]}
            >
              Free cancellation
            </Text>
          </Pressable>
        </View>
        <View style={styles.filterActions}>
          <Button title="Reset" variant="outline" onPress={resetFilters} style={{ flex: 1 }} />
          <Button title="Apply" onPress={() => setShowFilters(false)} style={{ flex: 1 }} />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 40 },
  mapWrap: { gap: Spacing.md, paddingBottom: Spacing.lg },
  mapCards: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionText: { ...Typography.body, color: Colors.primary },
  filterLabel: {
    ...Typography.bodyBold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: {
    ...Typography.caption,
    color: Colors.muted,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  chipTextActive: { color: Colors.white },
  filterActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
});
