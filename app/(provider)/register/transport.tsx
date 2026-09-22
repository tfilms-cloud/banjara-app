import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationPinField } from '@/components/location';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { PlaceAutocompleteSelect } from '@/components/ui/PlaceAutocompleteSelect';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { Colors } from '@/constants/colors';
import {
  OWNERSHIP_TYPE_OPTIONS,
  PRICING_METHOD_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
} from '@/constants/providerOptions';
import { TRIP_CITY_OPTIONS } from '@/constants/tripPlaces';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import { useProviderStore } from '@/store/providerStore';
import { useAuthStore } from '@/store/authStore';
import { formatCorridor } from '@/utils/corridors';
import {
  ONBOARDING_LOCATION,
  PROVIDER_SERVICE_TAB,
  leaveProviderEditor,
  paramId,
  useWizardBack,
  wizardBack,
} from '@/utils/navigation';

function nextAfterTransport(services: string[]) {
  if (services.some((s) => ['hotel', 'guestHouse'].includes(s))) {
    return '/(provider)/register/hotel';
  }
  if (services.some((s) => s === 'tour' || s === 'travelGuide')) return '/(provider)/register/tours';
  return '/(provider)/register/verification';
}

export default function ProviderTransportSetupScreen() {
  const insets = useSafeAreaInsets();
  const draft = useProviderStore((s) => s.draft);
  const setTransport = useProviderStore((s) => s.setTransport);
  const saveProgress = useProviderStore((s) => s.saveProgress);
  const saving = useProviderStore((s) => s.saving);
  const provider = useProviderStore((s) => s.provider);
  const user = useAuthStore((s) => s.user);
  const params = useLocalSearchParams<{ from?: string | string[] }>();
  const isEditing = paramId(params.from) === 'edit';
  const goPrevious = useWizardBack(() => {
    wizardBack(isEditing ? PROVIDER_SERVICE_TAB : (ONBOARDING_LOCATION as never));
  });
  const transport = draft.transport ?? provider?.transport;

  const [form, setForm] = useState({
    businessName: transport?.businessName ?? draft.business.businessName ?? '',
    vehicleType: transport?.vehicleTypes?.[0] ?? 'van',
    vehicleCount: String(transport?.vehicleCount ?? '1'),
    ownershipType: (transport?.ownershipType ?? 'owned') as string,
    operatingCities: transport?.operatingCities?.join(', ') ?? '',
    operatingRoutes: transport?.operatingRoutes?.join(', ') ?? '',
    pickupLocations: transport?.pickupLocations?.join(', ') ?? '',
    dropoffLocations: transport?.dropoffLocations?.join(', ') ?? '',
    description: transport?.description ?? '',
    pricingMethod: (transport?.pricingMethod ?? 'per_seat') as string,
    priceAmount: transport?.priceAmount ? String(transport.priceAmount) : '',
    pricePercent: transport?.pricePercent != null ? String(transport.pricePercent) : '',
  });
  const [routeFrom, setRouteFrom] = useState('');
  const [routeTo, setRouteTo] = useState('');
  const routeList = form.operatingRoutes
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const addCorridor = () => {
    if (!routeFrom.trim() || !routeTo.trim()) {
      Alert.alert('Choose both places', 'Pin From and To, the same way you pin a pickup.');
      return;
    }
    if (routeFrom.trim().toLowerCase() === routeTo.trim().toLowerCase()) {
      Alert.alert('Same places', 'Start and end must be different.');
      return;
    }
    const label = formatCorridor(routeFrom, routeTo);
    if (routeList.some((item) => item.toLowerCase() === label.toLowerCase())) {
      setRouteFrom('');
      setRouteTo('');
      return;
    }
    setForm({
      ...form,
      operatingRoutes: routeList.length ? `${form.operatingRoutes.replace(/,\s*$/, '')}, ${label}` : label,
    });
    setRouteFrom('');
    setRouteTo('');
  };

  useEffect(() => {
    const next = draft.transport ?? provider?.transport;
    if (!next?.businessName && !next?.operatingCities?.length) return;
    setForm({
      businessName: next.businessName ?? '',
      vehicleType: next.vehicleTypes?.[0] ?? 'van',
      vehicleCount: String(next.vehicleCount ?? '1'),
      ownershipType: (next.ownershipType ?? 'owned') as string,
      operatingCities: next.operatingCities?.join(', ') ?? '',
      operatingRoutes: next.operatingRoutes?.join(', ') ?? '',
      pickupLocations: next.pickupLocations?.join(', ') ?? '',
      dropoffLocations: next.dropoffLocations?.join(', ') ?? '',
      description: next.description ?? '',
      pricingMethod: (next.pricingMethod ?? 'per_seat') as string,
      priceAmount: next.priceAmount ? String(next.priceAmount) : '',
      pricePercent: next.pricePercent != null ? String(next.pricePercent) : '',
    });
  }, [provider?.id, draft.transport?.businessName]);

  const onContinue = async () => {
    const priceAmount = Number(form.priceAmount);
    const pricePercent = Number(form.pricePercent);
    if (form.pricingMethod !== 'negotiable' && (!Number.isFinite(priceAmount) || priceAmount <= 0)) {
      Alert.alert('Enter a price', 'Add the fare in PKR, or choose Negotiable.');
      return;
    }
    if (form.pricePercent.trim() && (pricePercent < 0 || pricePercent > 100)) {
      Alert.alert('Check the percent', 'Advance payment must be between 0 and 100.');
      return;
    }
    setTransport({
      businessName: form.businessName,
      vehicleTypes: [form.vehicleType],
      vehicleCount: Number(form.vehicleCount) || 1,
      ownershipType: (form.ownershipType as 'owned' | 'leased' | 'mixed') || 'owned',
      operatingCities: form.operatingCities.split(',').map((s) => s.trim()).filter(Boolean),
      operatingRoutes: form.operatingRoutes.split(',').map((s) => s.trim()).filter(Boolean),
      pickupLocations: form.pickupLocations.split(',').map((s) => s.trim()).filter(Boolean),
      dropoffLocations: form.dropoffLocations.split(',').map((s) => s.trim()).filter(Boolean),
      description: form.description,
      pricingMethod: (form.pricingMethod as 'per_seat' | 'per_vehicle' | 'negotiable') || 'per_seat',
      priceAmount: Number.isFinite(priceAmount) && priceAmount > 0 ? priceAmount : undefined,
      pricePercent: form.pricePercent.trim() ? pricePercent : undefined,
    });
    try {
      await saveProgress();
      if (isEditing) {
        leaveProviderEditor(user);
        return;
      }
      router.push(nextAfterTransport(draft.selectedServices) as never);
    } catch (error) {
      Alert.alert('Could not save', getApiErrorMessage(error));
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Transport Setup"
        showBack
        fallbackHref={isEditing ? PROVIDER_SERVICE_TAB : (ONBOARDING_LOCATION as never)}
        onBack={goPrevious}
      />
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40, gap: Spacing.lg }}>
        <Text style={styles.heading}>Transport provider details</Text>
        <Input label="Transport business name" value={form.businessName} onChangeText={(v) => setForm({ ...form, businessName: v })} />
        <SearchSelect
          label="Vehicle type"
          placeholder="Choose vehicle type"
          value={form.vehicleType}
          options={VEHICLE_TYPE_OPTIONS}
          searchable={false}
          leftIcon="bus-outline"
          onChange={(vehicleType) => setForm({ ...form, vehicleType })}
        />
        <Input label="Number of vehicles" keyboardType="number-pad" value={form.vehicleCount} onChangeText={(v) => setForm({ ...form, vehicleCount: v })} />
        <SearchSelect
          label="Ownership type"
          placeholder="Choose ownership"
          value={form.ownershipType}
          options={OWNERSHIP_TYPE_OPTIONS}
          searchable={false}
          leftIcon="key-outline"
          onChange={(ownershipType) => setForm({ ...form, ownershipType })}
        />
        <LocationPinField
          label="Operating cities"
          value={form.operatingCities}
          onChangeText={(v) => setForm({ ...form, operatingCities: v })}
          result="place"
          append
          mapTitle="Pin an operating city"
          hint="Cities you serve. Type or pin on the map."
        />
        <View style={{ gap: Spacing.sm }}>
          <Text style={styles.fieldLabel}>Operating routes</Text>
          <Text style={styles.fieldHint}>
            A route is the corridor you drive (Islamabad → Hunza). Pickup points are boarding spots on
            that corridor.
          </Text>
          {routeList.length ? (
            <View style={styles.chipRow}>
              {routeList.map((item) => (
                <Pressable
                  key={item}
                  onPress={() =>
                    setForm({
                      ...form,
                      operatingRoutes: routeList.filter((route) => route !== item).join(', '),
                    })
                  }
                  style={styles.chip}
                >
                  <Text style={styles.chipText}>{item}  ×</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <PlaceAutocompleteSelect
            label="From"
            leftIcon="navigate-outline"
            placeholder="Search or pin start city"
            value={routeFrom}
            suggestions={TRIP_CITY_OPTIONS}
            onChange={setRouteFrom}
          />
          <PlaceAutocompleteSelect
            label="To"
            leftIcon="flag-outline"
            placeholder="Search or pin end city"
            value={routeTo}
            suggestions={TRIP_CITY_OPTIONS.filter((name) => name !== routeFrom)}
            onChange={setRouteTo}
          />
          <Button title="Add this route" variant="outline" compact onPress={addCorridor} />
        </View>
        <LocationPinField
          label="Pickup locations"
          value={form.pickupLocations}
          onChangeText={(v) => setForm({ ...form, pickupLocations: v })}
          result="place"
          append
          mapTitle="Pin a pickup location"
        />
        <LocationPinField
          label="Drop-off locations"
          value={form.dropoffLocations}
          onChangeText={(v) => setForm({ ...form, dropoffLocations: v })}
          result="place"
          append
          mapTitle="Pin a drop-off location"
        />
        <Input label="Service description" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline />
        <SearchSelect
          label="Pricing method"
          placeholder="How do you charge?"
          value={form.pricingMethod}
          options={PRICING_METHOD_OPTIONS}
          searchable={false}
          leftIcon="pricetag-outline"
          onChange={(pricingMethod) => setForm({ ...form, pricingMethod })}
        />
        <View style={styles.priceRow}>
          <View style={styles.priceField}>
            <Input
              label="Price (PKR)"
              keyboardType="number-pad"
              value={form.priceAmount}
              onChangeText={(v) => setForm({ ...form, priceAmount: v })}
              hint={form.pricingMethod === 'per_vehicle' ? 'Full vehicle hire fare' : 'Fare per seat'}
              placeholder={form.pricingMethod === 'negotiable' ? 'Optional starting fare' : 'e.g. 2500'}
            />
          </View>
          <View style={styles.priceField}>
            <Input
              label="Advance (%)"
              keyboardType="number-pad"
              value={form.pricePercent}
              onChangeText={(v) => setForm({ ...form, pricePercent: v })}
              hint="Paid at booking"
              placeholder="e.g. 50"
            />
          </View>
        </View>
        <Button title="Add vehicles later from dashboard" variant="outline" onPress={() => router.push('/(provider)/vehicles/add')} />
        <Button title={isEditing ? 'Save changes' : 'Continue'} loading={saving} onPress={() => void onContinue()} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heading: { ...Typography.h2, color: Colors.primary },
  fieldLabel: { ...Typography.caption, color: Colors.muted },
  fieldHint: { ...Typography.caption, color: Colors.muted, lineHeight: 18, marginTop: -4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    backgroundColor: Colors.inputBg,
    borderRadius: 999,
    paddingHorizontal: Spacing.md,
    minHeight: 32,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: { ...Typography.caption, color: Colors.dark },
  priceRow: { flexDirection: 'row', gap: Spacing.md },
  priceField: { flex: 1 },
});
