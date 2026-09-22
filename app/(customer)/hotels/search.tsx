import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HotelSearchCard } from '@/components/hotels/HotelSearchCard';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { POPULAR_DESTINATIONS } from '@/constants/destinations';
import { useHotelStore } from '@/store/hotelStore';

export default function HotelSearchScreen() {
  const insets = useSafeAreaInsets();
  const { setDestination, saveRecentSearch, recentSearches, applyRecentSearch } = useHotelStore();

  const onSearch = () => {
    saveRecentSearch();
    router.push('/(customer)/hotels/results');
  };

  return (
    <View style={styles.container}>
      <Header title="Hotel Search" showBack fallbackHref="/(customer)/(tabs)/hotels" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View style={styles.pad}>
          <HotelSearchCard onSearch={onSearch} />
        </View>

        <Text style={styles.section}>Recent searches</Text>
        <View style={styles.list}>
          {recentSearches.map((item) => (
            <Pressable
              key={item.id}
              style={styles.item}
              onPress={() => {
                applyRecentSearch(item);
                router.push('/(customer)/hotels/results');
              }}
            >
              <Ionicons name="time-outline" size={18} color={Colors.muted} />
              <Text style={styles.itemText}>{item.destination}</Text>
            </Pressable>
          ))}
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
              <LinearGradient colors={['transparent', 'rgba(11,31,51,0.85)']} style={styles.overlay}>
                <Text style={styles.destTitle}>{dest.name}</Text>
                <Text style={styles.destMeta}>Search hotels</Text>
              </LinearGradient>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  pad: { paddingHorizontal: Spacing.lg },
  section: {
    ...Typography.h3,
    color: Colors.primary,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.md,
  },
  list: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemText: { ...Typography.bodyBold, color: Colors.primary },
  row: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  destCard: { width: 160, height: 120, borderRadius: Radius.xl, overflow: 'hidden' },
  destImage: { ...StyleSheet.absoluteFill },
  overlay: { flex: 1, justifyContent: 'flex-end', padding: Spacing.md },
  destTitle: { ...Typography.bodyBold, color: Colors.white },
  destMeta: { ...Typography.small, color: 'rgba(255,255,255,0.85)' },
});
