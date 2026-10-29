import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useProviderFormDraft } from '@/hooks/useProviderFormDraft';
import { vehicleVerificationError } from '@/utils/transportValidation';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationPinField } from '@/components/location';
import { RouteStopFields } from '@/components/provider/RouteStopFields';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { ImagePickerField } from '@/components/ui/ImagePickerField';
import { Input } from '@/components/ui/Input';
import { PlaceAutocompleteSelect } from '@/components/ui/PlaceAutocompleteSelect';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { Colors } from '@/constants/colors';
import {
  INSURANCE_COMPANY_OPTIONS,
  OWNERSHIP_TYPE_OPTIONS,
  PRICING_METHOD_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  YES_NO_OPTIONS,
} from '@/constants/providerOptions';
import { TRIP_CITY_OPTIONS } from '@/constants/tripPlaces';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as uploadService from '@/services/uploadService';
import { useProviderStore } from '@/store/providerStore';
import { useAuthStore } from '@/store/authStore';
import {
  type CorridorDraft,
  addUniquePlace,
  displayStopName,
  flattenRouteStops,
  formatCorridor,
  hydrateCorridors,
} from '@/utils/corridors';
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
  if (services.some((s) => s === 'travelGuide'))
    return '/(provider)/register/guide';
  if (services.some((s) => s === 'tour')) return '/(provider)/register/tours';
  return '/(provider)/vehicles/add?mode=onboarding';
}

function required(value: string, label: string) {
  if (!value.trim()) {
    Alert.alert('Required field', `${label} is mandatory for verification.`);
    return false;
  }
  return true;
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
    wizardBack(
      isEditing ? PROVIDER_SERVICE_TAB : (ONBOARDING_LOCATION as never),
    );
  });
  const transport = draft.transport ?? provider?.transport;

  const [form, setForm] = useProviderFormDraft('transport.form', {
    businessName: transport?.businessName ?? draft.business.businessName ?? '',
    vehicleClass:
      transport?.vehicleClass ?? transport?.vehicleTypes?.[0] ?? 'van',
    ownerName:
      transport?.ownerName ??
      draft.business.ownerName ??
      draft.personal.name ??
      '',
    vehicleModel: transport?.vehicleModel ?? '',
    vehicleMakeYear: transport?.vehicleMakeYear ?? '',
    engineNumber: transport?.engineNumber ?? '',
    registrationNumber: transport?.registrationNumber ?? '',
    driverName: transport?.driverName ?? '',
    driverPhone: transport?.driverPhone ?? '',
    driverEmail: transport?.driverEmail ?? '',
    driverPermanentAddress: transport?.driverPermanentAddress ?? '',
    driverCnic: transport?.driverCnic ?? '',
    hasInsurance: (transport?.hasInsurance ?? '') as string,
    insuranceCompany: transport?.insuranceCompany ?? '',
    insuranceNumber: transport?.insuranceNumber ?? '',
    insuranceYear: transport?.insuranceYear ?? '',
    driverExperienceYears: transport?.driverExperienceYears ?? '',
    driverLicenseNumber: transport?.driverLicenseNumber ?? '',
    driverEmergencyContact: transport?.driverEmergencyContact ?? '',
    vehicleCount: String(transport?.vehicleCount ?? '1'),
    ownershipType: (transport?.ownershipType ?? 'owned') as string,
    operatingCities: transport?.operatingCities?.join(', ') ?? '',
    description: transport?.description ?? '',
    pricingMethod: (transport?.pricingMethod ?? 'per_seat') as string,
    priceAmount: transport?.priceAmount ? String(transport.priceAmount) : '',
    pricePercent:
      transport?.pricePercent != null ? String(transport.pricePercent) : '',
  });
  const [vehicleFront, setVehicleFront] = useProviderFormDraft<string[]>(
    'transport.front',
    transport?.vehicleImageFront ? [transport.vehicleImageFront] : [],
  );
  const [vehicleBack, setVehicleBack] = useProviderFormDraft<string[]>(
    'transport.back',
    transport?.vehicleImageBack ? [transport.vehicleImageBack] : [],
  );
  const [driverPhoto, setDriverPhoto] = useProviderFormDraft<string[]>(
    'transport.driver',
    transport?.driverPhoto ? [transport.driverPhoto] : [],
  );
  const [removingImage, setRemovingImage] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [uploading, setUploading] = useState<
    'front' | 'back' | 'driver' | null
  >(null);
  const [routeFrom, setRouteFrom] = useProviderFormDraft(
    'transport.routeFrom',
    '',
  );
  const [routeTo, setRouteTo] = useProviderFormDraft('transport.routeTo', '');
  const [corridors, setCorridors] = useProviderFormDraft<CorridorDraft[]>(
    'transport.corridors',
    () =>
      hydrateCorridors(
        transport?.operatingRoutes,
        transport?.pickupLocations,
        transport?.dropoffLocations,
      ),
  );

  const patch = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addCorridor = () => {
    if (!routeFrom.trim() || !routeTo.trim()) {
      Alert.alert(
        'Choose both places',
        'Pin From and To, then add boarding and drop-off on that route.',
      );
      return;
    }
    if (routeFrom.trim().toLowerCase() === routeTo.trim().toLowerCase()) {
      Alert.alert('Same places', 'Start and end must be different.');
      return;
    }
    const label = formatCorridor(routeFrom, routeTo);
    if (
      corridors.some(
        (item) =>
          formatCorridor(item.from, item.to).toLowerCase() ===
          label.toLowerCase(),
      )
    ) {
      setRouteFrom('');
      setRouteTo('');
      return;
    }
    setCorridors((current) => {
      const usedPickups = new Set(
        current.flatMap((item) =>
          item.pickups.map((place) => place.toLowerCase()),
        ),
      );
      const usedDropoffs = new Set(
        current.flatMap((item) =>
          item.dropoffs.map((place) => place.toLowerCase()),
        ),
      );
      const from = routeFrom.trim();
      const to = routeTo.trim();
      let pickups: string[] = [];
      let dropoffs: string[] = [];
      (transport?.pickupLocations ?? []).forEach((item) => {
        const place = displayStopName(item);
        if (usedPickups.has(place.toLowerCase())) return;
        if (place.toLowerCase().includes(from.toLowerCase()))
          pickups = addUniquePlace(pickups, place);
      });
      (transport?.dropoffLocations ?? []).forEach((item) => {
        const place = displayStopName(item);
        if (usedDropoffs.has(place.toLowerCase())) return;
        if (place.toLowerCase().includes(to.toLowerCase()))
          dropoffs = addUniquePlace(dropoffs, place);
      });
      return [...current, { from, to, pickups, dropoffs }];
    });
    setRouteFrom('');
    setRouteTo('');
  };

  const updateCorridor = (index: number, next: Partial<CorridorDraft>) => {
    setCorridors((current) =>
      current.map((item, i) => (i === index ? { ...item, ...next } : item)),
    );
  };

  const pickImage = async (slot: 'front' | 'back' | 'driver') => {
    try {
      setUploading(slot);
      const picked = await uploadService.pickImages(1);
      if (!picked.length) return;
      const uploaded = await uploadService.uploadImages(picked, 'vehicles');
      const url = uploaded[0]?.url;
      if (!url) return;
      if (slot === 'front') setVehicleFront([url]);
      else if (slot === 'back') setVehicleBack([url]);
      else setDriverPhoto([url]);
    } catch (error) {
      Alert.alert('Upload failed', getApiErrorMessage(error));
    } finally {
      setUploading(null);
    }
  };

  const onContinue = async () => {
    if (removingImage || saving || advancing || Boolean(uploading)) return;
    if (!required(form.vehicleClass, 'Vehicle class')) return;
    if (!required(form.ownerName, 'Owner name')) return;
    if (!required(form.vehicleModel, 'Vehicle model')) return;
    if (!required(form.vehicleMakeYear, "Vehicle's make year")) return;
    if (!required(form.engineNumber, "Vehicle's engine number")) return;
    if (!required(form.registrationNumber, "Vehicle's registration number"))
      return;
    if (!required(form.driverName, 'Driver name')) return;
    if (!required(form.driverPhone, "Driver's phone number")) return;
    if (!required(form.driverPermanentAddress, "Driver's permanent address"))
      return;
    if (!required(form.driverCnic, "Driver's CNIC")) return;
    if (!form.hasInsurance) {
      Alert.alert(
        'Car insurance',
        'Please select Yes or No for car insurance.',
      );
      return;
    }
    if (form.hasInsurance === 'no') {
      Alert.alert(
        'Insurance required',
        'Valid car insurance is mandatory. Transporters without insurance cannot be approved on BANJARA.',
      );
      return;
    }
    if (!required(form.insuranceCompany, 'Insurance company')) return;
    if (!required(form.insuranceNumber, 'Insurance number')) return;
    if (!required(form.insuranceYear, 'Insurance year')) return;
    if (!required(form.driverExperienceYears, "Driver's experience")) return;
    if (!required(form.driverLicenseNumber, "Driver's license number")) return;
    if (!vehicleFront[0] || !vehicleBack[0]) {
      Alert.alert(
        'Vehicle photos',
        'Front and back images of the vehicle are mandatory for verification.',
      );
      return;
    }
    if (
      !required(
        form.driverEmergencyContact,
        "Driver's emergency contact number",
      )
    )
      return;

    const verificationError = vehicleVerificationError({
      ...form,
      vehicleClass: form.vehicleClass as never,
      hasInsurance: form.hasInsurance as never,
      ownershipType: form.ownershipType as never,
      vehicleCount: Number(form.vehicleCount),
      operatingCities: [],
      pricingMethod: form.pricingMethod as never,
      priceAmount: undefined,
      pricePercent: undefined,
      vehicleImageFront: vehicleFront[0],
      vehicleImageBack: vehicleBack[0],
    });
    if (verificationError) {
      Alert.alert('Check vehicle details', verificationError);
      return;
    }
    if (!/^\d+$/.test(form.vehicleCount) || Number(form.vehicleCount) < 1) {
      Alert.alert('Vehicle count', 'Enter a positive whole number.');
      return;
    }

    const priceAmount = Number(form.priceAmount);
    const pricePercent = Number(form.pricePercent);
    if (
      form.pricingMethod !== 'negotiable' &&
      (!Number.isFinite(priceAmount) || priceAmount <= 0)
    ) {
      Alert.alert(
        'Enter a price',
        'Add the fare in PKR, or choose Negotiable.',
      );
      return;
    }
    if (
      form.pricePercent.trim() &&
      (!Number.isFinite(pricePercent) || pricePercent < 0 || pricePercent > 100)
    ) {
      Alert.alert(
        'Check the percent',
        'Advance payment must be between 0 and 100.',
      );
      return;
    }

    const routeStops = flattenRouteStops(corridors);
    const operatingCities = [
      ...new Set([
        ...form.operatingCities
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        ...corridors.flatMap((item) =>
          [item.from, item.to].map((part) => part.trim()).filter(Boolean),
        ),
      ]),
    ];

    setTransport({
      businessName: form.businessName.trim() || form.ownerName.trim(),
      vehicleTypes: [form.vehicleClass],
      vehicleClass: form.vehicleClass as
        | 'car'
        | 'jeep'
        | 'suv'
        | 'van'
        | 'mini_bus'
        | 'bus',
      vehicleCount: Number(form.vehicleCount) || 1,
      ownershipType:
        (form.ownershipType as 'owned' | 'leased' | 'mixed') || 'owned',
      operatingCities,
      operatingRoutes: routeStops.operatingRoutes,
      pickupLocations: routeStops.pickupLocations,
      dropoffLocations: routeStops.dropoffLocations,
      description: form.description,
      pricingMethod:
        (form.pricingMethod as 'per_seat' | 'per_vehicle' | 'negotiable') ||
        'per_seat',
      priceAmount:
        Number.isFinite(priceAmount) && priceAmount > 0
          ? priceAmount
          : undefined,
      pricePercent: form.pricePercent.trim() ? pricePercent : undefined,
      ownerName: form.ownerName.trim(),
      vehicleModel: form.vehicleModel.trim(),
      vehicleMakeYear: form.vehicleMakeYear.trim(),
      engineNumber: form.engineNumber.trim(),
      registrationNumber: form.registrationNumber.trim(),
      driverName: form.driverName.trim(),
      driverPhone: form.driverPhone.trim(),
      driverEmail: form.driverEmail.trim() || undefined,
      driverPermanentAddress: form.driverPermanentAddress.trim(),
      driverCnic: form.driverCnic.trim(),
      hasInsurance: 'yes',
      insuranceCompany: form.insuranceCompany,
      insuranceNumber: form.insuranceNumber.trim(),
      insuranceYear: form.insuranceYear.trim(),
      driverExperienceYears: form.driverExperienceYears.trim(),
      driverLicenseNumber: form.driverLicenseNumber.trim(),
      vehicleImageFront: vehicleFront[0] || '',
      vehicleImageBack: vehicleBack[0] || '',
      driverPhoto: driverPhoto[0] || '',
      driverEmergencyContact: form.driverEmergencyContact.trim(),
    });

    try {
      setAdvancing(true);
      await saveProgress();
      if (!isEditing) await useProviderStore.getState().checkpoint('transport');
      if (!isEditing) {
        const vehicles = await import('@/services/providerService').then(
          (service) => service.getProviderVehicles(),
        );
        useProviderStore.setState({ vehicles });
      }
      for (const key of Object.keys(useProviderStore.getState().formDrafts)) {
        if (key.startsWith('transport.'))
          useProviderStore.getState().clearFormDraft(key);
      }
      if (isEditing) {
        leaveProviderEditor(user);
        return;
      }
      router.push(nextAfterTransport(draft.selectedServices) as never);
    } catch (error) {
      Alert.alert('Could not save', getApiErrorMessage(error));
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Transporter registration"
        showBack
        fallbackHref={
          isEditing ? PROVIDER_SERVICE_TAB : (ONBOARDING_LOCATION as never)
        }
        onBack={goPrevious}
      />
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 40,
          gap: Spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Vehicle & driver verification</Text>
        <Text style={styles.sub}>
          Fields marked mandatory are required for BANJARA verification.
          Applications without car insurance are rejected.
        </Text>

        <Text style={styles.section}>Vehicle</Text>
        <SearchSelect
          label="Vehicle class"
          placeholder="Car, jeep, SUV, van, mini bus, bus"
          value={form.vehicleClass}
          options={VEHICLE_TYPE_OPTIONS}
          searchable={false}
          leftIcon="car-outline"
          onChange={(vehicleClass) => patch('vehicleClass', vehicleClass)}
        />
        <Input
          label="Owner name (registered in name of)"
          value={form.ownerName}
          onChangeText={(v) => patch('ownerName', v)}
        />
        <Input
          label="Vehicle model"
          value={form.vehicleModel}
          onChangeText={(v) => patch('vehicleModel', v)}
        />
        <Input
          label="Vehicle's make year"
          keyboardType="number-pad"
          value={form.vehicleMakeYear}
          onChangeText={(v) => patch('vehicleMakeYear', v)}
          placeholder="e.g. 2019"
        />
        <Input
          label="Vehicle's engine number *"
          value={form.engineNumber}
          onChangeText={(v) => patch('engineNumber', v)}
          autoCapitalize="characters"
        />
        <Input
          label="Vehicle's registration number *"
          value={form.registrationNumber}
          onChangeText={(v) => patch('registrationNumber', v)}
          autoCapitalize="characters"
        />

        <Text style={styles.section}>Driver</Text>
        <Input
          label="Driver name"
          value={form.driverName}
          onChangeText={(v) => patch('driverName', v)}
        />
        <Input
          label="Driver's phone number *"
          keyboardType="phone-pad"
          value={form.driverPhone}
          onChangeText={(v) => patch('driverPhone', v)}
        />
        <Input
          label="Driver's email address (optional)"
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.driverEmail}
          onChangeText={(v) => patch('driverEmail', v)}
        />
        <Input
          label="Driver's permanent address *"
          value={form.driverPermanentAddress}
          onChangeText={(v) => patch('driverPermanentAddress', v)}
          multiline
        />
        <Input
          label="Driver's CNIC *"
          value={form.driverCnic}
          onChangeText={(v) => patch('driverCnic', v)}
          keyboardType="number-pad"
          placeholder="xxxxx-xxxxxxx-x"
        />
        <Input
          label="Driver's experience (years) *"
          keyboardType="number-pad"
          value={form.driverExperienceYears}
          onChangeText={(v) => patch('driverExperienceYears', v)}
        />
        <Input
          label="Driver's license number *"
          value={form.driverLicenseNumber}
          onChangeText={(v) => patch('driverLicenseNumber', v)}
          autoCapitalize="characters"
        />
        <Input
          label="Driver's emergency contact number *"
          keyboardType="phone-pad"
          value={form.driverEmergencyContact}
          onChangeText={(v) => patch('driverEmergencyContact', v)}
        />

        <Text style={styles.section}>Car insurance</Text>
        <SearchSelect
          label="Car insurance *"
          placeholder="Yes / No"
          value={form.hasInsurance}
          options={YES_NO_OPTIONS}
          searchable={false}
          leftIcon="shield-checkmark-outline"
          onChange={(hasInsurance) => {
            if (hasInsurance === 'no') {
              Alert.alert(
                'Insurance required',
                'If you select No, this transporter application will be rejected.',
              );
            }
            patch('hasInsurance', hasInsurance);
          }}
        />
        {form.hasInsurance === 'yes' ? (
          <>
            <SearchSelect
              label="Insurance company *"
              placeholder="Select insurer"
              value={form.insuranceCompany}
              options={INSURANCE_COMPANY_OPTIONS}
              searchable
              leftIcon="business-outline"
              onChange={(insuranceCompany) =>
                patch('insuranceCompany', insuranceCompany)
              }
            />
            <Input
              label="Insurance number *"
              value={form.insuranceNumber}
              onChangeText={(v) => patch('insuranceNumber', v)}
            />
            <Input
              label="Insurance year *"
              keyboardType="number-pad"
              value={form.insuranceYear}
              onChangeText={(v) => patch('insuranceYear', v)}
              placeholder="e.g. 2026"
            />
          </>
        ) : null}

        <Text style={styles.section}>Photos for verification</Text>
        <ImagePickerField
          disabled={saving || Boolean(uploading) || removingImage}
          onRemovingChange={setRemovingImage}
          label="Vehicle image — front *"
          urls={vehicleFront}
          max={1}
          uploading={uploading === 'front'}
          onAdd={() => void pickImage('front')}
          onRemove={() => setVehicleFront([])}
        />
        <ImagePickerField
          disabled={saving || Boolean(uploading) || removingImage}
          onRemovingChange={setRemovingImage}
          label="Vehicle image — back *"
          urls={vehicleBack}
          max={1}
          uploading={uploading === 'back'}
          onAdd={() => void pickImage('back')}
          onRemove={() => setVehicleBack([])}
        />
        <ImagePickerField
          disabled={saving || Boolean(uploading) || removingImage}
          onRemovingChange={setRemovingImage}
          label="Driver's photo"
          urls={driverPhoto}
          max={1}
          uploading={uploading === 'driver'}
          onAdd={() => void pickImage('driver')}
          onRemove={() => setDriverPhoto([])}
        />

        <Text style={styles.section}>Service coverage (optional now)</Text>
        <Input
          label="Transport business name"
          value={form.businessName}
          onChangeText={(v) => patch('businessName', v)}
        />
        <Input
          label="Number of vehicles"
          keyboardType="number-pad"
          value={form.vehicleCount}
          onChangeText={(v) => patch('vehicleCount', v)}
        />
        <SearchSelect
          label="Ownership type"
          placeholder="Choose ownership"
          value={form.ownershipType}
          options={OWNERSHIP_TYPE_OPTIONS}
          searchable={false}
          leftIcon="key-outline"
          onChange={(ownershipType) => patch('ownershipType', ownershipType)}
        />
        <LocationPinField
          label="Operating cities"
          value={form.operatingCities}
          onChangeText={(v) => patch('operatingCities', v)}
          result="place"
          append
          mapTitle="Pin an operating city"
          hint="Cities you serve. Type or pin on the map."
        />
        <View style={{ gap: Spacing.sm }}>
          <Text style={styles.fieldLabel}>Operating routes</Text>
          <Text style={styles.fieldHint}>
            Add corridors you drive (e.g. Islamabad → Hunza) with pickup and
            drop-off stops.
          </Text>
          {corridors.map((item, index) => (
            <View
              key={`${item.from}-${item.to}-${index}`}
              style={styles.routeCard}
            >
              <View style={styles.routeHead}>
                <Text style={styles.routeTitle}>
                  {formatCorridor(item.from, item.to || item.from)}
                </Text>
                <Pressable
                  onPress={() =>
                    setCorridors((current) =>
                      current.filter((_, i) => i !== index),
                    )
                  }
                  style={styles.removeRoute}
                >
                  <Text style={styles.removeRouteText}>Remove</Text>
                </Pressable>
              </View>
              <RouteStopFields
                origin={item.from}
                destination={item.to}
                pickups={item.pickups}
                dropoffs={item.dropoffs}
                onChangePickups={(pickups) =>
                  updateCorridor(index, { pickups })
                }
                onChangeDropoffs={(dropoffs) =>
                  updateCorridor(index, { dropoffs })
                }
              />
            </View>
          ))}
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
          <Button
            title="Add this route"
            variant="outline"
            compact
            onPress={addCorridor}
          />
        </View>
        <Input
          label="Service description"
          value={form.description}
          onChangeText={(v) => patch('description', v)}
          multiline
        />
        <SearchSelect
          label="Pricing method"
          placeholder="How do you charge?"
          value={form.pricingMethod}
          options={PRICING_METHOD_OPTIONS}
          searchable={false}
          leftIcon="pricetag-outline"
          onChange={(pricingMethod) => patch('pricingMethod', pricingMethod)}
        />
        <View style={styles.priceRow}>
          <View style={styles.priceField}>
            <Input
              label="Fare (PKR)"
              keyboardType="number-pad"
              value={form.priceAmount}
              onChangeText={(v) => patch('priceAmount', v)}
            />
          </View>
          <View style={styles.priceField}>
            <Input
              label="Advance %"
              keyboardType="number-pad"
              value={form.pricePercent}
              onChangeText={(v) => patch('pricePercent', v)}
            />
          </View>
        </View>

        <Button
          title={isEditing ? 'Save transporter details' : 'Continue'}
          onPress={() => void onContinue()}
          disabled={removingImage}
          loading={saving || advancing || Boolean(uploading)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heading: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.dark,
    letterSpacing: -0.3,
  },
  sub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
    marginTop: -Spacing.sm,
    lineHeight: 18,
  },
  section: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.primary,
    marginTop: Spacing.sm,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  fieldLabel: { ...Typography.label, color: Colors.dark },
  fieldHint: { ...Typography.caption, color: Colors.muted },
  routeCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.card,
  },
  routeHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  routeTitle: { ...Typography.cardTitle, color: Colors.dark, flex: 1 },
  removeRoute: { paddingHorizontal: 8, paddingVertical: 4 },
  removeRouteText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.danger,
  },
  priceRow: { flexDirection: 'row', gap: Spacing.sm },
  priceField: { flex: 1 },
});
