import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GuideCard } from '@/components/guides/GuideCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import * as guideBookingService from '@/services/guideBookingService';
import { useGuideSearchStore } from '@/store/guideSearchStore';
import type { GuideListItem } from '@/types/guide';
import { pushPath } from '@/utils/navigation';

export default function GuideSearchScreen() {
  const insets = useSafeAreaInsets();
  const search = useGuideSearchStore();
  const {
    destination,
    date,
    guests,
    guideType,
    language,
    minPrice,
    maxPrice,
    minRating,
    minExperience,
    setDestination,
    setDate,
    setGuests,
    setGuideType,
    setLanguage,
    setMinPrice,
    setMaxPrice,
    setMinRating,
    setMinExperience,
    getParams,
    resetFilters,
  } = search;

  const [results, setResults] = useState<GuideListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResults(await guideBookingService.searchGuides(getParams()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [getParams]);

  useEffect(() => {
    void runSearch();
  }, [runSearch]);

  const header = (
    <View style={styles.filters}>
      <Input
        label="Destination / area"
        value={destination}
        onChangeText={setDestination}
        placeholder="Hunza, Skardu…"
        leftIcon="location-outline"
      />
      <Input
        label="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
        placeholder="2026-06-01"
        leftIcon="calendar-outline"
      />
      <Input
        label="Guests"
        value={String(guests)}
        onChangeText={(v) => setGuests(Number(v.replace(/\D/g, '')) || 1)}
        keyboardType="number-pad"
        leftIcon="people-outline"
      />
      <Input
        label="Guide type"
        value={guideType}
        onChangeText={setGuideType}
        placeholder="trekking, cultural…"
        leftIcon="compass-outline"
      />
      <Input
        label="Language"
        value={language}
        onChangeText={setLanguage}
        placeholder="English, Urdu…"
        leftIcon="language-outline"
      />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Input
            label="Min price"
            value={minPrice != null ? String(minPrice) : ''}
            onChangeText={(v) => setMinPrice(v ? Number(v) : undefined)}
            keyboardType="number-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            label="Max price"
            value={maxPrice != null ? String(maxPrice) : ''}
            onChangeText={(v) => setMaxPrice(v ? Number(v) : undefined)}
            keyboardType="number-pad"
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Input
            label="Min rating"
            value={minRating != null ? String(minRating) : ''}
            onChangeText={(v) => setMinRating(v ? Number(v) : undefined)}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            label="Min experience (yrs)"
            value={minExperience != null ? String(minExperience) : ''}
            onChangeText={(v) => setMinExperience(v ? Number(v) : undefined)}
            keyboardType="number-pad"
          />
        </View>
      </View>
      <View style={styles.actions}>
        <Button title="Search guides" onPress={() => void runSearch()} />
        <Button title="Reset filters" variant="outline" onPress={resetFilters} />
      </View>
      <Text style={styles.count}>
        {loading ? 'Searching…' : `${results.length} guide${results.length === 1 ? '' : 's'}`}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Find a guide" showBack fallbackHref="/(customer)/(tabs)" />
      {loading && !results.length ? (
        <View style={{ flex: 1, padding: Spacing.lg }}>
          {header}
          <LoadingState title="Loading guides…" />
        </View>
      ) : error && !results.length ? (
        <View style={{ flex: 1, padding: Spacing.lg }}>
          {header}
          <ErrorState message={error} onRetry={() => void runSearch()} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={header}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void runSearch()} />}
          contentContainerStyle={{
            padding: Spacing.lg,
            paddingBottom: insets.bottom + Spacing.lg,
            gap: Spacing.md,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <EmptyState
              title="No guides match"
              message="Try another destination or relax your filters."
              icon="walk-outline"
            />
          }
          renderItem={({ item }) => (
            <GuideCard guide={item} onPress={() => pushPath(`/(customer)/guides/${item.id}`)} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filters: { gap: Spacing.md, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.md },
  actions: { gap: Spacing.sm },
  count: { ...Typography.caption, color: Colors.muted },
});
