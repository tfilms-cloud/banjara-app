import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HotelPriceBreakdownCard } from '@/components/hotels/HotelPriceBreakdown';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useHotelStore } from '@/store/hotelStore';
import { formatDate } from '@/utils/formatDate';

export default function HotelReviewScreen() {
  const insets = useSafeAreaInsets();
  const {
    selectedHotel,
    selectedRoom,
    checkIn,
    checkOut,
    adults,
    children,
    roomQuantity,
    guest,
    priceBreakdown,
  } = useHotelStore();

  if (!selectedHotel || !selectedRoom || !priceBreakdown) {
    return (
      <View style={styles.container}>
        <Header title="Review Booking" showBack fallbackHref="/(customer)/(tabs)/hotels" />
        <Text style={styles.empty}>Incomplete hotel booking details.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Review Booking" showBack />
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 100, gap: Spacing.lg }}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{selectedHotel.name}</Text>
          <Text style={styles.meta}>{selectedRoom.name}</Text>
          <Text style={styles.meta}>
            {formatDate(checkIn)} → {formatDate(checkOut)}
          </Text>
          <Text style={styles.meta}>
            {adults + children} guests · {roomQuantity} room{roomQuantity > 1 ? 's' : ''} ·{' '}
            {priceBreakdown.nights} nights
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Guest</Text>
          <Text style={styles.meta}>{guest.name}</Text>
          <Text style={styles.meta}>{guest.email}</Text>
          <Text style={styles.meta}>{guest.phone}</Text>
          {guest.specialRequests ? (
            <Text style={styles.meta}>Requests: {guest.specialRequests}</Text>
          ) : null}
        </View>

        <HotelPriceBreakdownCard breakdown={priceBreakdown} />
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button title="Continue to Payment" onPress={() => router.push('/(customer)/hotels/payment')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  empty: { ...Typography.body, color: Colors.muted, padding: Spacing.lg },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: { ...Typography.h2, color: Colors.primary },
  section: { ...Typography.h3, color: Colors.primary },
  meta: { ...Typography.body, color: Colors.muted },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.lg,
  },
});
