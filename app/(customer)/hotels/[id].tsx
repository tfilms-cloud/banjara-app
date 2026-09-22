import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Linking, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FavoriteButton } from '@/components/hotels/FavoriteButton';
import { HotelAmenityList } from '@/components/hotels/HotelAmenity';
import { HotelImageGallery } from '@/components/hotels/HotelImageGallery';
import { HotelMap } from '@/components/hotels/HotelMap';
import { HotelRating } from '@/components/hotels/HotelRating';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useHotel } from '@/hooks/useHotels';
import { useHotelStore } from '@/store/hotelStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatTime } from '@/utils/formatTime';
import { pushPath } from '@/utils/navigation';

export default function HotelDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { hotel, loading, error } = useHotel(id);
  const setHotel = useHotelStore((state) => state.setHotel);

  if (loading) return <LoadingState title="Loading hotel..." />;
  if (error || !hotel) return <ErrorState message={error ?? 'Hotel not found'} />;

  return (
    <View style={styles.container}>
      <Header title={hotel.name} showBack fallbackHref="/(customer)/hotels/results" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
        <HotelImageGallery images={hotel.images} hotelId={hotel.id} height={260} />
        <View style={styles.content}>
          <View style={styles.top}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{hotel.name}</Text>
              <HotelRating rating={hotel.rating} reviewCount={hotel.reviewCount} />
            </View>
            <FavoriteButton hotelId={hotel.id} size={28} />
            <Badge label={hotel.hotelType.replace('_', ' ')} tone="amber" />
          </View>

          <View style={styles.loc}>
            <Ionicons name="location" size={16} color={Colors.secondary} />
            <Text style={styles.locText}>
              {hotel.location.address} · {hotel.location.distanceKm} km from center
            </Text>
          </View>

          <Text style={styles.section}>About</Text>
          <Text style={styles.body}>{hotel.description}</Text>

          <Text style={styles.section}>Amenities</Text>
          <HotelAmenityList amenities={hotel.amenities} />

          <Text style={styles.section}>Location</Text>
          <HotelMap hotels={[hotel]} height={260} />

          <Text style={styles.section}>Policies</Text>
          <Text style={styles.body}>Check-in: {formatTime(hotel.checkInTime)}</Text>
          <Text style={styles.body}>Check-out: {formatTime(hotel.checkOutTime)}</Text>
          <Text style={styles.body}>{hotel.cancellationPolicy}</Text>

          <View style={styles.actionsRow}>
            <Button
              title="Contact Hotel"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => Linking.openURL(`tel:${hotel.phone.replace(/\s/g, '')}`)}
            />
            <Button
              title="Share"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() =>
                Share.share({
                  message: `Check out ${hotel.name} on Banjara — ${hotel.location.address}`,
                })
              }
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
        <View>
          <Text style={styles.from}>From</Text>
          <Text style={styles.price}>{formatCurrency(hotel.priceFrom)} / night</Text>
        </View>
        <Button
          title="Select Room"
          fullWidth={false}
          style={{ minWidth: 150 }}
          onPress={() => {
            setHotel(hotel);
            pushPath(`/(customer)/hotels/rooms/${hotel.id}`);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.md },
  top: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  name: { ...Typography.h2, color: Colors.primary },
  loc: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  locText: { ...Typography.caption, color: Colors.muted, flex: 1, lineHeight: 18 },
  section: { ...Typography.h3, color: Colors.primary, marginTop: Spacing.sm },
  body: { ...Typography.body, color: Colors.muted, lineHeight: 22 },
  actionsRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  from: { ...Typography.small, color: Colors.muted },
  price: { ...Typography.h3, color: Colors.primary },
});
