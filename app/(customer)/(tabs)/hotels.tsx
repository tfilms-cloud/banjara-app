import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { pushPath } from '@/utils/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HotelCard } from '@/components/hotels/HotelCard';
import { HotelSearchCard } from '@/components/hotels/HotelSearchCard';
import { LoadingState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { usePopularHotels } from '@/hooks/useHotels';
import { POPULAR_DESTINATIONS } from '@/constants/destinations';
import { useHotelStore } from '@/store/hotelStore';
import { formatCurrency } from '@/utils/formatCurrency';

export default function HotelsTabScreen() {
  const insets = useSafeAreaInsets();
  const {
    checkIn,
    checkOut,
    setDestination,
    saveRecentSearch,
    recentSearches,
    applyRecentSearch,
  } = useHotelStore();
  const { hotels, loading } = usePopularHotels();

  const onSearch = () => {
    saveRecentSearch();
    router.push('/(customer)/hotels/results');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.lg,
        paddingBottom: insets.bottom + 24,
      }}
    >
      <Text style={styles.title}>Find hotels</Text>
      <Text style={styles.sub}>Discover stays across Hunza, Skardu, Gilgit and more.</Text>

      <View style={styles.pad}>
        <HotelSearchCard onSearch={onSearch} />
      </View>

      <Text style={styles.section}>Popular destinations</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {POPULAR_DESTINATIONS.map((dest) => (
          <Pressable
            key={dest.id}
            style={styles.destCard}
            onPress={() => {
              setDestination(dest.name);
              saveRecentSearch();
              router.push('/(customer)/hotels/results');
            }}
          >
            <Image source={{ uri: dest.image }} style={styles.destImage} />
            <LinearGradient colors={['transparent', 'rgba(11,31,51,0.85)']} style={styles.destOverlay}>
              <Text style={styles.destTitle}>{dest.name}</Text>
              <Text style={styles.destMeta}>Search available hotels</Text>
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.section}>Popular hotels</Text>
      {loading ? (
        <LoadingState title="Loading hotels..." />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {hotels.map((hotel) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              checkIn={checkIn}
              checkOut={checkOut}
              compact
              onPress={() => pushPath(`/(customer)/hotels/${hotel.id}`)}
            />
          ))}
        </ScrollView>
      )}

      <Text style={styles.section}>Recent searches</Text>
      <View style={styles.list}>
        {recentSearches.map((item) => (
          <Pressable
            key={item.id}
            style={styles.recent}
            onPress={() => {
              applyRecentSearch(item);
              router.push('/(customer)/hotels/results');
            }}
          >
            <Ionicons name="time-outline" size={18} color={Colors.muted} />
            <Text style={styles.recentText}>{item.destination}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { ...Typography.h1, color: Colors.dark, paddingHorizontal: Spacing.lg },
  sub: {
    ...Typography.body,
    color: Colors.muted,
    paddingHorizontal: Spacing.lg,
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  pad: { paddingHorizontal: Spacing.lg },
  section: {
    ...Typography.h3,
    color: Colors.dark,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.md,
  },
  row: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  destCard: { width: 180, height: 140, borderRadius: Radius.xl, overflow: 'hidden' },
  destImage: { ...StyleSheet.absoluteFill },
  destOverlay: { flex: 1, justifyContent: 'flex-end', padding: Spacing.md },
  destTitle: { ...Typography.bodyBold, color: Colors.white },
  destMeta: { ...Typography.small, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  dealCard: {
    width: 240,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dealImage: { width: '100%', height: 110 },
  dealTitle: {
    ...Typography.bodyBold,
    color: Colors.dark,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  dealSub: { ...Typography.caption, color: Colors.muted, paddingHorizontal: Spacing.md, marginTop: 4 },
  dealCode: {
    ...Typography.small,
    color: Colors.secondary,
    fontWeight: '700',
    padding: Spacing.md,
  },
  list: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  recent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentText: { ...Typography.bodyBold, color: Colors.dark, flex: 1 },
});
