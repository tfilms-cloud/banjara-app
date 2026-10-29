import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PriceCard } from '@/components/booking/PriceCard';
import { JourneyTypePanel } from '@/components/trip/JourneyTypePanel';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useBookingStore } from '@/store/bookingStore';
import { formatDate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';

export default function BookingReviewScreen() {
  const insets = useSafeAreaInsets();
  const {
    selectedTrip,
    selectedPickup,
    selectedSeats,
    passengerDetails,
    setPassengerDetails,
    priceBreakdown,
  } = useBookingStore();

  if (!selectedTrip || !selectedPickup || !priceBreakdown) {
    return (
      <View style={styles.container}>
        <Header
          title="Review Booking"
          showBack
          fallbackHref="/(customer)/(tabs)"
          onBack={() => router.back()}
        />
        <Text style={styles.empty}>Complete trip, pickup and seat selection first.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Review Booking"
        showBack
        fallbackHref={
          selectedTrip?.id
            ? (`/(customer)/seat/${selectedTrip.id}` as never)
            : '/(customer)/(tabs)'
        }
        onBack={() => {
          if (selectedTrip?.id) {
            router.push(`/(customer)/seat/${selectedTrip.id}`);
            return;
          }
          router.back();
        }}
      />
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 100, gap: Spacing.lg }}>
        <View style={styles.card}>
          <Text style={styles.route}>
            {selectedTrip.from} → {selectedTrip.to}
          </Text>
          <Text style={styles.meta}>{formatDate(selectedTrip.date)}</Text>
          <Text style={styles.meta}>
            Departs {formatTime(selectedTrip.departureTime)} · {selectedTrip.agency.name}
          </Text>
          <Text style={styles.meta}>Vehicle: {selectedTrip.vehicleName}</Text>
          <Text style={styles.meta}>Seats: {selectedSeats.join(', ')}</Text>
          <Text style={styles.meta}>
            Pickup: {selectedPickup.name} · {formatTime(selectedPickup.time)}
          </Text>
        </View>

        <JourneyTypePanel
          journeyType={selectedTrip.journeyType}
          from={selectedTrip.from}
          to={selectedTrip.to}
          returnDate={selectedTrip.returnDate}
          returnTime={selectedTrip.returnTime}
        />

        <View style={styles.card}>
          <Text style={styles.section}>Passenger information</Text>
          <Input
            label="Full name"
            value={passengerDetails.name}
            onChangeText={(name) => setPassengerDetails({ name })}
          />
          <Input
            label="Email"
            value={passengerDetails.email}
            onChangeText={(email) => setPassengerDetails({ email })}
            autoCapitalize="none"
          />
          <Input
            label="Phone"
            value={passengerDetails.phone}
            onChangeText={(phone) => setPassengerDetails({ phone })}
            keyboardType="phone-pad"
          />
        </View>

        <PriceCard breakdown={priceBreakdown} />
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button title="Continue to Payment" onPress={() => router.push('/(customer)/booking/payment')} />
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
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  route: { ...Typography.h2, color: Colors.dark },
  meta: { ...Typography.body, color: Colors.muted },
  section: { ...Typography.h3, color: Colors.dark },
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
