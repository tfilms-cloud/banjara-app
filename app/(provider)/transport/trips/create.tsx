import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DateField, TimeField } from '@/components/ui/DateTimeFields';
import { MultiSearchSelect } from '@/components/ui/MultiSearchSelect';
import { PlaceAutocompleteSelect } from '@/components/ui/PlaceAutocompleteSelect';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { canOrganizeTripsFromList } from '@/constants/providerOptions';
import { JOURNEY_TYPES, type JourneyType } from '@/constants/journeyTypes';
import { Radius, Spacing } from '@/constants/spacing';
import {
  TRIP_AMENITY_OPTIONS,
  TRIP_CITY_OPTIONS,
  TRIP_DROPOFF_OPTIONS,
  TRIP_PICKUP_OPTIONS,
} from '@/constants/tripPlaces';
import { Fonts, Typography } from '@/constants/typography';
import * as providerService from '@/services/providerService';
import { useProviderStore } from '@/store/providerStore';
import { toISODate } from '@/utils/formatDate';
import { vehicleTypeLabel } from '@/utils/helpers';

export default function CreateTripScreen() {
  const insets = useSafeAreaInsets();
  const provider = useProviderStore((s) => s.provider);
  const vehicles = useProviderStore((s) => s.vehicles);
  const routes = useProviderStore((s) => s.routes);
  const refreshDashboard = useProviderStore((s) => s.refreshDashboard);
  const [loading, setLoading] = useState(false);
  const allowedToCreateTrips = canOrganizeTripsFromList(provider?.services ?? []);

  const activeVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.status === 'active'),
    [vehicles]
  );
  const defaultVehicle = activeVehicles[0];

  const cityOptions = useMemo(() => {
    const fromRoutes = routes.flatMap((r) => [r.origin, r.destination]).filter(Boolean);
    const fromProfile = (provider?.transport?.operatingRoutes ?? []).flatMap((item) => {
      const parsed = item.includes('→') || item.toLowerCase().includes(' to ')
        ? item.split(/\s*(?:→| to )\s*/i)
        : [item];
      return parsed.map((part) => part.trim()).filter(Boolean);
    });
    const fromCities = provider?.transport?.operatingCities ?? [];
    return [...new Set([...TRIP_CITY_OPTIONS, ...fromRoutes, ...fromProfile, ...fromCities])].map(
      (name) => ({
        value: name,
        label: name,
      })
    );
  }, [provider?.transport?.operatingCities, provider?.transport?.operatingRoutes, routes]);

  const pickupOptions = useMemo(() => {
    const fromRoutes = routes.flatMap((r) => r.pickupPoints ?? []).filter(Boolean);
    const fromProfile = provider?.transport?.pickupLocations ?? [];
    return [...new Set([...TRIP_PICKUP_OPTIONS, ...fromRoutes, ...fromProfile])];
  }, [provider?.transport?.pickupLocations, routes]);

  const dropoffOptions = useMemo(() => {
    const fromRoutes = routes.flatMap((r) => r.dropoffPoints ?? []).filter(Boolean);
    const fromProfile = provider?.transport?.dropoffLocations ?? [];
    return [...new Set([...TRIP_DROPOFF_OPTIONS, ...fromRoutes, ...fromProfile])];
  }, [provider?.transport?.dropoffLocations, routes]);

  const vehicleOptions = useMemo(
    () =>
      activeVehicles.map((vehicle) => ({
        value: vehicle.id,
        label: `${vehicle.name} · ${vehicle.totalSeats} seats`,
        subtitle: `${vehicleTypeLabel(vehicle.type)} · ${vehicle.registrationNumber}`,
      })),
    [activeVehicles]
  );

  const [form, setForm] = useState({
    journeyType: 'one_way' as JourneyType,
    origin: 'Islamabad',
    destination: 'Hunza',
    departureDate: toISODate(new Date()),
    departureTime: '20:00',
    arrivalTime: '08:00',
    returnDate: toISODate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
    returnTime: '14:00',
    vehicleId: '',
    pickupPoints: ['Faizabad', 'G-9'] as string[],
    dropoffPoints: ['Karimabad Center'] as string[],
    price: '4500',
    amenities: ['WiFi', 'AC'] as string[],
    description: 'Overnight comfort trip',
  });

  useEffect(() => {
    if (!form.vehicleId && defaultVehicle?.id) {
      setForm((prev) => ({ ...prev, vehicleId: defaultVehicle.id }));
    }
  }, [defaultVehicle?.id, form.vehicleId]);

  const selectedVehicle =
    activeVehicles.find((vehicle) => vehicle.id === form.vehicleId) ?? defaultVehicle;

  const onPublish = async () => {
    if (!provider) return;
    if (!form.origin || !form.destination) {
      Alert.alert('Missing route', 'Origin and destination are required.');
      return;
    }
    if (form.origin === form.destination) {
      Alert.alert('Same places', 'Origin and destination must be different.');
      return;
    }
    if (!form.departureDate || !form.departureTime || !form.arrivalTime) {
      Alert.alert('Missing schedule', 'Date and times are required.');
      return;
    }
    if (form.journeyType === 'round_trip' && (!form.returnDate || !form.returnTime)) {
      Alert.alert('Return needed', 'Round trips need a return date and time.');
      return;
    }
    if (!form.pickupPoints.length) {
      Alert.alert('Pickup points', 'Select at least one pickup point.');
      return;
    }
    if (!selectedVehicle?.id) {
      Alert.alert(
        'No approved vehicle',
        'Only active (approved) vehicles can be used for trips. Wait for admin approval or add another vehicle.'
      );
      return;
    }
    setLoading(true);
    try {
      await providerService.createTrip({
        providerId: provider.id,
        origin: form.origin,
        destination: form.destination,
        departureDate: form.departureDate,
        departureTime: form.departureTime,
        arrivalTime: form.arrivalTime,
        vehicleId: selectedVehicle.id,
        pickupPoints: form.pickupPoints,
        dropoffPoints: form.dropoffPoints,
        price: Number(form.price) || 0,
        totalSeats: selectedVehicle.totalSeats,
        bookedSeats: 0,
        amenities: form.amenities,
        description: form.description,
        status: 'upcoming',
        journeyType: form.journeyType,
        returnDate: form.journeyType === 'round_trip' ? form.returnDate : undefined,
        returnTime: form.journeyType === 'round_trip' ? form.returnTime : undefined,
      });
      await refreshDashboard();
      Alert.alert('Published', 'Trip is now available.');
      router.back();
    } catch (error) {
      Alert.alert(
        'Could not publish',
        error instanceof Error ? error.message : 'Trip creation failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!allowedToCreateTrips) {
    return (
      <View style={styles.container}>
        <Header title="Create Trip" showBack fallbackHref={'/(provider)/transport/index' as never} />
        <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
          <Text style={styles.heading}>Transport providers only</Text>
          <Text style={styles.sub}>
            Only BANJARA transport providers (vans, minibuses, and buses) can organise trips.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Create Trip" showBack fallbackHref={'/(provider)/transport/index' as never} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            padding: Spacing.lg,
            paddingBottom: insets.bottom + 48,
            gap: Spacing.lg,
          }}
        >
        <View style={styles.hero}>
          <Text style={styles.heading}>Publish a departure</Text>
          <Text style={styles.sub}>
            Transport = one-way ride for distance. Trips = go and return home with a return date.
            Customers search these as separate products on BANJARA.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Product type</Text>
          <View style={styles.typeRow}>
            {JOURNEY_TYPES.map((item) => {
              const active = form.journeyType === item.value;
              return (
                <Pressable
                  key={item.value}
                  style={[styles.typeCard, active && styles.typeCardActive]}
                  onPress={() => setForm({ ...form, journeyType: item.value })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.typeTitle, active && styles.typeTitleActive]}>
                    {item.providerTitle}
                  </Text>
                  <Text style={styles.typeHint}>{item.providerHint}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Route</Text>
          <PlaceAutocompleteSelect
            label="Origin"
            leftIcon="navigate-outline"
            placeholder="Search origin city"
            value={form.origin}
            suggestions={cityOptions.map((o) => o.value)}
            onChange={(origin) => setForm({ ...form, origin })}
            hint="Ride only · free map search"
          />
          <PlaceAutocompleteSelect
            label="Destination"
            leftIcon="flag-outline"
            placeholder="Search destination"
            value={form.destination}
            suggestions={cityOptions
              .map((o) => o.value)
              .filter((name) => name !== form.origin)}
            onChange={(destination) => setForm({ ...form, destination })}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Schedule</Text>
          <DateField
            label="Departure date"
            value={form.departureDate}
            onChange={(departureDate) => setForm({ ...form, departureDate })}
          />
          <TimeField
            label="Departure time"
            value={form.departureTime}
            onChange={(departureTime) => setForm({ ...form, departureTime })}
          />
          <TimeField
            label="Arrival time"
            value={form.arrivalTime}
            onChange={(arrivalTime) => setForm({ ...form, arrivalTime })}
            hint="May be next day"
          />
          {form.journeyType === 'round_trip' ? (
            <>
              <DateField
                label="Return date"
                value={form.returnDate}
                onChange={(returnDate) => setForm({ ...form, returnDate })}
                hint="When travelers come back home"
              />
              <TimeField
                label="Return departure time"
                value={form.returnTime}
                onChange={(returnTime) => setForm({ ...form, returnTime })}
              />
            </>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Vehicle</Text>
          {vehicleOptions.length === 0 ? (
            <Text style={styles.empty}>
              No approved vehicles yet. Submit a vehicle and wait for BANJARA Admin approval.
            </Text>
          ) : (
            <SearchSelect
              label="Select vehicle"
              leftIcon="car-outline"
              placeholder="Choose an active vehicle"
              value={form.vehicleId || selectedVehicle?.id}
              options={vehicleOptions}
              onChange={(vehicleId) => setForm({ ...form, vehicleId })}
              hint={`Trip seats start from this vehicle (${selectedVehicle?.totalSeats ?? '—'} total).`}
            />
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Boarding</Text>
          <MultiSearchSelect
            label="Pickup points"
            placeholder="Select boarding points"
            searchPlaceholder="Search pickup or type any place…"
            values={form.pickupPoints}
            options={pickupOptions}
            onChange={(pickupPoints) => setForm({ ...form, pickupPoints })}
            enableRemoteSearch
            hint="Favorites + live Pakistan search. Travelers pick one when booking."
          />
          <MultiSearchSelect
            label="Drop-off points"
            placeholder="Select drop-off points"
            searchPlaceholder="Search drop-off or type any place…"
            values={form.dropoffPoints}
            options={dropoffOptions}
            onChange={(dropoffPoints) => setForm({ ...form, dropoffPoints })}
            enableRemoteSearch
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Pricing & extras</Text>
          <Input
            label="Price (PKR)"
            keyboardType="number-pad"
            value={form.price}
            onChangeText={(price) => setForm({ ...form, price })}
            leftIcon="cash-outline"
          />
          <MultiSearchSelect
            label="Amenities"
            placeholder="Select amenities"
            searchPlaceholder="Search amenities…"
            values={form.amenities}
            options={TRIP_AMENITY_OPTIONS}
            onChange={(amenities) => setForm({ ...form, amenities })}
            max={TRIP_AMENITY_OPTIONS.length}
          />
          <Input
            label="Trip description"
            value={form.description}
            onChangeText={(description) => setForm({ ...form, description })}
            multiline
            placeholder="Short note for travelers"
          />
        </View>

        <Button title="Publish Trip" loading={loading} onPress={onPublish} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: { gap: 6 },
  heading: { ...Typography.h2, color: Colors.primary },
  sub: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  section: {
    fontFamily: Typography.h3.fontFamily,
    fontSize: 15,
    color: Colors.primary,
  },
  typeRow: { gap: Spacing.sm },
  typeCard: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: 4,
  },
  typeCardActive: {
    borderColor: Colors.action,
    backgroundColor: Colors.actionSoft,
  },
  typeTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.dark,
  },
  typeTitleActive: {
    color: Colors.actionDark,
  },
  typeHint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 17,
  },
  empty: { ...Typography.caption, color: Colors.danger, lineHeight: 18 },
});
