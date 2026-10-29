import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DateField, TimeField } from '@/components/ui/DateTimeFields';
import { MultiSearchSelect } from '@/components/ui/MultiSearchSelect';
import { PlaceAutocompleteSelect } from '@/components/ui/PlaceAutocompleteSelect';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Colors, useThemeColors } from '@/constants/colors';
import { canOrganizeTripsFromList } from '@/constants/providerOptions';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { TRIP_CITY_OPTIONS } from '@/constants/tripPlaces';
import { Fonts, Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as providerService from '@/services/providerService';
import { useProviderStore } from '@/store/providerStore';
import { toISODate } from '@/utils/formatDate';
import { vehicleTypeLabel } from '@/utils/helpers';
import { corridorKey, displayStopName, parseRouteStop } from '@/utils/corridors';
import { paramId } from '@/utils/navigation';

type JourneyType = 'one_way' | 'round_trip';
type BookingMode = 'seat' | 'vehicle';

type CreateTripScreenProps = {
  /** When embedded on the transporter dashboard */
  embedded?: boolean;
  onPublished?: () => void;
};

function SegmentChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
}) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        styles.segmentTrack,
        { backgroundColor: colors.inputBg, borderColor: colors.border },
      ]}
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            style={[
              styles.segmentChip,
              active && { backgroundColor: colors.primary, ...Shadows.soft },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text
              style={{
                color: active ? colors.white : colors.muted,
                fontFamily: active ? Fonts.bodySemiBold : Fonts.bodyMedium,
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function CreateTripScreen({ embedded, onPublished }: CreateTripScreenProps) {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const tripId = paramId(params.id);
  const isEditing = Boolean(tripId);

  const provider = useProviderStore((s) => s.provider);
  const vehicles = useProviderStore((s) => s.vehicles);
  const trips = useProviderStore((s) => s.trips);
  const routes = useProviderStore((s) => s.routes);
  const refreshDashboard = useProviderStore((s) => s.refreshDashboard);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(!tripId);
  const allowedToCreateTrips = canOrganizeTripsFromList(provider?.services ?? []);

  const existingTrip = useMemo(
    () => (tripId ? trips.find((trip) => trip.id === tripId) : undefined),
    [tripId, trips]
  );

  const activeVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.status === 'active'),
    [vehicles]
  );
  const defaultVehicle = activeVehicles[0];

  const [form, setForm] = useState({
    journeyType: 'one_way' as JourneyType,
    bookingMode: 'seat' as BookingMode,
    origin: 'Islamabad',
    destination: 'Hunza',
    departureDate: toISODate(new Date()),
    departureTime: '20:00',
    arrivalTime: '08:00',
    returnDate: toISODate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
    returnTime: '18:00',
    vehicleId: '',
    stops: [] as string[],
    pickupPoints: [] as string[],
    dropoffPoints: [] as string[],
    pinkSeats: '6',
    blueSeats: '8',
    price: '4500',
    description: '',
  });

  useEffect(() => {
    if (!isEditing) return;
    if (!existingTrip) {
      void refreshDashboard().finally(() => setHydrated(true));
      return;
    }
    const available =
      Math.max(0, existingTrip.totalSeats - (existingTrip.bookedSeats ?? 0)) ||
      existingTrip.totalSeats;
    const half = Math.max(1, Math.floor(available / 2));
    setForm({
      journeyType: existingTrip.journeyType ?? 'one_way',
      bookingMode: existingTrip.bookingMode ?? 'seat',
      origin: existingTrip.origin,
      destination: existingTrip.destination,
      departureDate: existingTrip.departureDate,
      departureTime: existingTrip.departureTime,
      arrivalTime: existingTrip.arrivalTime || existingTrip.departureTime,
      returnDate:
        existingTrip.returnDate ||
        toISODate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
      returnTime: existingTrip.returnTime || '18:00',
      vehicleId: existingTrip.vehicleId,
      stops: [],
      pickupPoints: existingTrip.pickupPoints ?? [],
      dropoffPoints: existingTrip.dropoffPoints ?? [],
      pinkSeats: String(half),
      blueSeats: String(Math.max(0, available - half)),
      price: String(existingTrip.price || ''),
      description: existingTrip.description ?? '',
    });
    setHydrated(true);
  }, [existingTrip, isEditing, refreshDashboard]);

  const cityOptions = useMemo(() => {
    const fromRoutes = routes.flatMap((r) => [r.origin, r.destination]).filter(Boolean);
    const fromProfile = (provider?.transport?.operatingRoutes ?? []).flatMap((item) => {
      const parsed =
        item.includes('→') || item.toLowerCase().includes(' to ')
          ? item.split(/\s*(?:→| to )\s*/i)
          : [item];
      return parsed.map((part) => part.trim()).filter(Boolean);
    });
    const fromCities = provider?.transport?.operatingCities ?? [];
    return [...new Set([...TRIP_CITY_OPTIONS, ...fromRoutes, ...fromProfile, ...fromCities])];
  }, [provider?.transport?.operatingCities, provider?.transport?.operatingRoutes, routes]);

  const stopOptions = useMemo(() => {
    const fromRoutes = routes.flatMap((r) => [...(r.pickupPoints ?? []), ...(r.dropoffPoints ?? [])]);
    const fromProfile = [
      ...(provider?.transport?.pickupLocations ?? []),
      ...(provider?.transport?.dropoffLocations ?? []),
    ];
    return [...new Set([...fromRoutes, ...fromProfile].map(displayStopName).filter(Boolean))];
  }, [provider?.transport?.dropoffLocations, provider?.transport?.pickupLocations, routes]);

  const pickupOptions = useMemo(() => {
    const fromRoutes = routes.flatMap((r) => r.pickupPoints ?? []).filter(Boolean);
    const fromProfile = provider?.transport?.pickupLocations ?? [];
    return [...new Set([...fromRoutes, ...fromProfile])]
      .filter((item) => {
        const parsed = parseRouteStop(item);
        if (parsed.origin && parsed.destination) {
          return corridorKey(parsed.origin, parsed.destination) === corridorKey(form.origin, form.destination);
        }
        return displayStopName(item).toLowerCase().includes(form.origin.trim().toLowerCase());
      })
      .map(displayStopName)
      .filter(Boolean);
  }, [form.destination, form.origin, provider?.transport?.pickupLocations, routes]);

  const dropoffOptions = useMemo(() => {
    const fromRoutes = routes.flatMap((r) => r.dropoffPoints ?? []).filter(Boolean);
    const fromProfile = provider?.transport?.dropoffLocations ?? [];
    return [...new Set([...fromRoutes, ...fromProfile])]
      .filter((item) => {
        const parsed = parseRouteStop(item);
        if (parsed.origin && parsed.destination) {
          return corridorKey(parsed.origin, parsed.destination) === corridorKey(form.origin, form.destination);
        }
        return displayStopName(item).toLowerCase().includes(form.destination.trim().toLowerCase());
      })
      .map(displayStopName)
      .filter(Boolean);
  }, [form.destination, form.origin, provider?.transport?.dropoffLocations, routes]);

  const vehicleOptions = useMemo(
    () =>
      activeVehicles.map((vehicle) => ({
        value: vehicle.id,
        label: `${vehicle.name} · ${vehicle.totalSeats} seats`,
        subtitle: `${vehicleTypeLabel(vehicle.type)} · ${vehicle.registrationNumber}`,
      })),
    [activeVehicles]
  );

  useEffect(() => {
    if (isEditing) return;
    if (!form.vehicleId && defaultVehicle?.id) {
      setForm((prev) => ({ ...prev, vehicleId: defaultVehicle.id }));
    }
  }, [defaultVehicle?.id, form.vehicleId, isEditing]);

  const selectedVehicle =
    activeVehicles.find((vehicle) => vehicle.id === form.vehicleId) ??
    vehicles.find((vehicle) => vehicle.id === form.vehicleId) ??
    defaultVehicle;

  const pink = Math.max(0, Number(form.pinkSeats) || 0);
  const blue = Math.max(0, Number(form.blueSeats) || 0);
  const totalSeats = pink + blue;
  const isRoundTrip = form.journeyType === 'round_trip';
  const isVehicleHire = form.bookingMode === 'vehicle';

  const onPublish = async () => {
    if (!provider?.id) {
      Alert.alert('Unavailable', 'Provider profile required.');
      return;
    }
    if (!form.origin || !form.destination) {
      Alert.alert('Missing route', 'From and To are required.');
      return;
    }
    if (form.origin === form.destination) {
      Alert.alert('Same places', 'From and To must be different.');
      return;
    }
    if (!form.departureDate || !form.departureTime) {
      Alert.alert('Missing schedule', 'Departure date and time are required.');
      return;
    }
    if (isRoundTrip && (!form.returnDate || !form.returnTime)) {
      Alert.alert('Return required', 'Two-way trips need a return date and time.');
      return;
    }
    if (isRoundTrip && form.returnDate < form.departureDate) {
      Alert.alert('Return date', 'Return date must be on or after departure.');
      return;
    }
    if (!isEditing && !isVehicleHire && totalSeats < 1) {
      Alert.alert('Seats', 'Add pink and/or blue seat availability.');
      return;
    }
    if (!selectedVehicle?.id) {
      Alert.alert(
        'No approved vehicle',
        'Only active (approved) vehicles can be used for trips. Wait for admin approval or add another vehicle.'
      );
      return;
    }
    if (!(Number(form.price) > 0)) {
      Alert.alert(
        isVehicleHire ? 'Vehicle price' : 'Per seat price',
        `Enter a valid ${isVehicleHire ? 'whole-vehicle' : 'per-seat'} price.`
      );
      return;
    }

    const boarding = form.pickupPoints.length ? form.pickupPoints : [form.origin];
    const drops = form.dropoffPoints.length
      ? form.dropoffPoints
      : form.stops.length
        ? form.stops
        : [form.destination];

    setLoading(true);
    try {
      const modeNote = isVehicleHire
        ? 'Booking: whole vehicle hire'
        : `Seats: ${pink} pink · ${blue} blue`;
      const journeyNote = isRoundTrip
        ? `Two-way · return ${form.returnDate} ${form.returnTime}. `
        : 'One-way. ';
      const stopsNote = form.stops.length ? `Stops: ${form.stops.join(', ')}. ` : '';
      const description = `${journeyNote}${stopsNote}${modeNote}. ${form.description}`.trim();

      if (isEditing && tripId) {
        await providerService.updateTrip(tripId, {
          origin: form.origin,
          destination: form.destination,
          departureDate: form.departureDate,
          departureTime: form.departureTime,
          arrivalTime: form.arrivalTime || form.departureTime,
          pickupPoints: boarding,
          dropoffPoints: drops,
          price: Number(form.price) || 0,
          description,
          journeyType: form.journeyType,
          returnDate: isRoundTrip ? form.returnDate : undefined,
          returnTime: isRoundTrip ? form.returnTime : undefined,
          bookingMode: form.bookingMode,
        });
        await refreshDashboard();
        Alert.alert('Saved', 'Trip details updated.');
      } else {
        await providerService.createTrip({
          providerId: provider.id,
          origin: form.origin,
          destination: form.destination,
          departureDate: form.departureDate,
          departureTime: form.departureTime,
          arrivalTime: form.arrivalTime || form.departureTime,
          vehicleId: selectedVehicle.id,
          pickupPoints: boarding,
          dropoffPoints: drops,
          price: Number(form.price) || 0,
          totalSeats: isVehicleHire ? selectedVehicle.totalSeats : totalSeats,
          bookedSeats: 0,
          amenities: [],
          description,
          status: 'upcoming',
          journeyType: form.journeyType,
          returnDate: isRoundTrip ? form.returnDate : undefined,
          returnTime: isRoundTrip ? form.returnTime : undefined,
          bookingMode: form.bookingMode,
        });
        await refreshDashboard();
        Alert.alert('Published', 'Trip is now available to customers.');
      }
      onPublished?.();
      if (!embedded) router.back();
    } catch (error) {
      Alert.alert(
        isEditing ? 'Could not save' : 'Could not publish',
        getApiErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  };

  if (!allowedToCreateTrips) {
    return (
      <View style={styles.container}>
        {!embedded ? (
          <Header title="Create Trip" showBack fallbackHref={'/(provider)/transport' as never} />
        ) : null}
        <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
          <Text style={styles.heading}>Transport providers only</Text>
          <Text style={styles.sub}>Only BANJARA transporters can organise trips.</Text>
        </View>
      </View>
    );
  }

  if (isEditing && hydrated && !existingTrip) {
    return (
      <View style={styles.container}>
        <Header title="Edit Trip" showBack fallbackHref={'/(provider)/transport' as never} />
        <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
          <Text style={styles.heading}>Trip not found</Text>
          <Text style={styles.sub}>This trip may have been cancelled or removed.</Text>
          <Button title="Back to trips" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const formBody = (
    <>
      <View style={styles.card}>
        <Text style={styles.section}>Trip type</Text>
        <SegmentChips
          value={form.journeyType}
          onChange={(journeyType) => setForm({ ...form, journeyType })}
          options={[
            { id: 'one_way' as const, label: 'One way' },
            { id: 'round_trip' as const, label: 'Two way' },
          ]}
        />
        <Text style={styles.hint}>
          {isRoundTrip
            ? 'Travelers go and return on this schedule.'
            : 'Travelers book a one-direction departure.'}
        </Text>

        <Text style={[styles.section, { marginTop: Spacing.sm }]}>Booking type</Text>
        <SegmentChips
          value={form.bookingMode}
          onChange={(bookingMode) => setForm({ ...form, bookingMode })}
          options={[
            { id: 'seat' as const, label: 'Seat booking' },
            { id: 'vehicle' as const, label: 'Vehicle booking' },
          ]}
        />
        <Text style={styles.hint}>
          {isVehicleHire
            ? 'Hire the whole vehicle for this trip (per-vehicle price).'
            : 'Travelers pick individual seats (per-seat price).'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>From & To</Text>
        <PlaceAutocompleteSelect
          label="From"
          leftIcon="navigate-outline"
          placeholder="Departure city"
          value={form.origin}
          suggestions={cityOptions}
          onChange={(origin) => setForm({ ...form, origin })}
        />
        <PlaceAutocompleteSelect
          label="To"
          leftIcon="flag-outline"
          placeholder="Destination"
          value={form.destination}
          suggestions={cityOptions.filter((name) => name !== form.origin)}
          onChange={(destination) => setForm({ ...form, destination })}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Departure</Text>
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
          label="Arrival time (optional)"
          value={form.arrivalTime}
          onChange={(arrivalTime) => setForm({ ...form, arrivalTime })}
          hint="May be next day"
        />
      </View>

      {isRoundTrip ? (
        <View style={styles.card}>
          <Text style={styles.section}>Return</Text>
          <DateField
            label="Return date"
            value={form.returnDate}
            onChange={(returnDate) => setForm({ ...form, returnDate })}
            minimumDate={new Date(`${form.departureDate}T00:00:00`)}
          />
          <TimeField
            label="Return time"
            value={form.returnTime}
            onChange={(returnTime) => setForm({ ...form, returnTime })}
          />
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.section}>Stops</Text>
        <MultiSearchSelect
          label="En-route stops"
          placeholder="Add stops along the way"
          searchPlaceholder="Search or type a stop…"
          values={form.stops}
          options={stopOptions}
          onChange={(stops) => setForm({ ...form, stops })}
          enableRemoteSearch
          hint="Towns or landmarks between From and To"
        />
        <MultiSearchSelect
          label="Pickup points"
          placeholder="Boarding points"
          searchPlaceholder="Search pickup…"
          values={form.pickupPoints}
          options={pickupOptions}
          onChange={(pickupPoints) => setForm({ ...form, pickupPoints })}
          enableRemoteSearch
        />
        <MultiSearchSelect
          label="Drop-off points"
          placeholder="Drop-off points"
          searchPlaceholder="Search drop-off…"
          values={form.dropoffPoints}
          options={dropoffOptions}
          onChange={(dropoffPoints) => setForm({ ...form, dropoffPoints })}
          enableRemoteSearch
        />
      </View>

      {!isVehicleHire ? (
        <View style={styles.card}>
          <Text style={styles.section}>Seat availability</Text>
          <Text style={styles.hint}>Pink = ladies / reserved · Blue = general seats</Text>
          <View style={styles.seatRow}>
            <View style={[styles.seatBox, styles.seatPink]}>
              <Text style={styles.seatLabel}>Pink seats</Text>
              <Input
                keyboardType="number-pad"
                value={form.pinkSeats}
                onChangeText={(pinkSeats) => setForm({ ...form, pinkSeats })}
              />
            </View>
            <View style={[styles.seatBox, styles.seatBlue]}>
              <Text style={styles.seatLabel}>Blue seats</Text>
              <Input
                keyboardType="number-pad"
                value={form.blueSeats}
                onChangeText={(blueSeats) => setForm({ ...form, blueSeats })}
              />
            </View>
          </View>
          <Text style={styles.hint}>Total available: {totalSeats} seats</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.section}>Vehicle & price</Text>
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
          />
        )}
        <Input
          label={isVehicleHire ? 'Whole vehicle price (PKR)' : 'Per seat price (PKR)'}
          keyboardType="number-pad"
          value={form.price}
          onChangeText={(price) => setForm({ ...form, price })}
          leftIcon="cash-outline"
          hint={
            isVehicleHire
              ? selectedVehicle
                ? `Capacity ${selectedVehicle.totalSeats} seats · hire fare for the full vehicle`
                : 'Fare charged for the full vehicle'
              : 'Price each traveler pays per seat'
          }
        />
        <Input
          label="Trip description"
          value={form.description}
          onChangeText={(description) => setForm({ ...form, description })}
          multiline
          placeholder="Short note for travelers"
        />
      </View>

      <Button
        title={isEditing ? 'Save trip changes' : 'Publish trip'}
        loading={loading}
        onPress={() => void onPublish()}
      />
    </>
  );

  if (embedded) {
    return <View style={styles.embed}>{formBody}</View>;
  }

  return (
    <View style={styles.container}>
      <Header
        title={isEditing ? 'Edit Trip' : 'Create Trip'}
        showBack
        fallbackHref={'/(provider)/transport' as never}
      />
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
            <Text style={styles.heading}>{isEditing ? 'Update this trip' : 'Generate a trip'}</Text>
            <Text style={styles.sub}>
              {isEditing
                ? 'Change route, schedule, price, or booking type. Seats already booked stay reserved.'
                : 'Choose one way or two way, then seat booking or whole-vehicle hire.'}
            </Text>
          </View>
          {formBody}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  embed: { gap: Spacing.lg },
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
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.primary,
  },
  hint: { ...Typography.caption, color: Colors.muted, lineHeight: 17 },
  segmentTrack: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: Radius.full,
    borderWidth: 1,
    padding: 3,
    gap: 0,
  },
  segmentChip: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
  },
  seatRow: { flexDirection: 'row', gap: Spacing.sm },
  seatBox: {
    flex: 1,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    gap: 4,
    borderWidth: 1,
  },
  seatPink: {
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    borderColor: '#EC4899',
  },
  seatBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: '#3B82F6',
  },
  seatLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.dark,
  },
  empty: { ...Typography.caption, color: Colors.danger, lineHeight: 18 },
});
