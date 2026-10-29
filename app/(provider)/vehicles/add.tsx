import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useProviderFormDraft } from '@/hooks/useProviderFormDraft';
import { VehicleVerificationFields } from '@/components/provider/VehicleVerificationFields';
import { vehicleVerificationError } from '@/utils/transportValidation';
import type { ProviderTransportSetup } from '@/types/provider';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { ImagePickerField } from '@/components/ui/ImagePickerField';
import { Input } from '@/components/ui/Input';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { Colors } from '@/constants/colors';
import { VEHICLE_TYPE_OPTIONS } from '@/constants/providerOptions';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as providerService from '@/services/providerService';
import * as uploadService from '@/services/uploadService';
import { useProviderStore } from '@/store/providerStore';
import { paramId, useWizardBack, wizardBack } from '@/utils/navigation';

function amenitiesFrom(list: string[] = []) {
  const joined = list.join(' ').toLowerCase();
  return {
    ac: joined.includes('air') || joined.includes('ac'),
    wifi: joined.includes('wifi'),
    charging: joined.includes('charg'),
    luggage: joined.includes('luggage'),
  };
}

export default function AddVehicleScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string | string[];
    mode?: string;
  }>();
  const requestedId = paramId(params.id);
  const provider = useProviderStore((s) => s.provider);
  const onboarding =
    params.mode === 'onboarding' ||
    Boolean(
      provider?.services.includes('transport') &&
        !provider.onboardingProgress?.completed,
    );
  const vehicles = useProviderStore((s) => s.vehicles);
  const refreshDashboard = useProviderStore((s) => s.refreshDashboard);
  const existing = useMemo(
    () =>
      vehicles.find((item) =>
        onboarding
          ? item.registrationNumber === provider?.transport?.registrationNumber
          : item.id === requestedId,
      ),
    [
      vehicles,
      requestedId,
      onboarding,
      provider?.transport?.registrationNumber,
    ],
  );

  const vehicleId = existing?.id ?? (onboarding ? '' : requestedId);
  const goBack = useWizardBack(() => wizardBack(onboarding ? '/(provider)/register/transport' : '/(provider)/transport'));
  const isEditing = Boolean(vehicleId);
  const draftKey = `vehicle.${onboarding ? 'primary' : vehicleId || 'new'}`;
  const initialDetails =
    existing?.verificationDetails ??
    (onboarding ? provider?.transport : undefined);
  const [details, setDetails] = useProviderFormDraft<
    Partial<ProviderTransportSetup>
  >(`${draftKey}.details`, initialDetails ?? {});
  const [removingImage, setRemovingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUrls, setImageUrls] = useProviderFormDraft<string[]>(
    `${draftKey}.images`,
    [
      initialDetails?.vehicleImageFront || existing?.images[0] || '',
      initialDetails?.vehicleImageBack || existing?.images[1] || '',
      ...(existing?.images.slice(2) ?? []),
    ],
  );
  const flags = amenitiesFrom(existing?.amenities);
  const [form, setForm] = useProviderFormDraft(`${draftKey}.form`, {
    name:
      existing?.name ??
      (onboarding ? (initialDetails?.vehicleModel ?? '') : ''),
    type: (existing?.type ?? initialDetails?.vehicleClass ?? 'van') as string,
    model: existing?.model ?? initialDetails?.vehicleModel ?? '',
    year: String(existing?.year ?? initialDetails?.vehicleMakeYear ?? ''),
    registrationNumber:
      existing?.registrationNumber ?? initialDetails?.registrationNumber ?? '',
    totalSeats:
      onboarding && !existing?.registrationCompletedAt
        ? ''
        : String(existing?.totalSeats ?? ''),
    ac: flags.ac,
    wifi: flags.wifi,
    charging: flags.charging,
    luggage: flags.luggage,
  });

  const onAddImage = async (slot: number) => {
    if (uploadingImages || removingImage) return;
    try {
      setUploadingImages(true);
      const picked = await uploadService.pickImages(1);
      if (!picked.length) return;
      const uploaded = await uploadService.uploadImages(picked, 'vehicles');
      if (uploaded[0]?.url)
        setImageUrls((prev) => {
          const next = [...prev];
          next[slot] = uploaded[0].url;
          return next;
        });
    } catch (error) {
      Alert.alert('Upload failed', getApiErrorMessage(error));
    } finally {
      setUploadingImages(false);
    }
  };

  const payloadAmenities = () =>
    [
      form.ac ? 'Air Conditioning' : null,
      form.wifi ? 'WiFi' : null,
      form.charging ? 'Charging Ports' : null,
      form.luggage ? 'Luggage Space' : null,
    ].filter(Boolean) as string[];

  const onSave = async () => {
    if (removingImage || loading || uploadingImages) return;
    if (!provider) {
      Alert.alert('Unavailable', 'Provider profile required.');
      return;
    }
    if (
      !form.name.trim() ||
      !form.model.trim() ||
      !form.registrationNumber.trim()
    ) {
      Alert.alert(
        'Missing fields',
        'Name, model and registration are required.',
      );
      return;
    }
    if (!imageUrls[0] || !imageUrls[1]) {
      Alert.alert('Photos required', 'Add both front and back vehicle photos.');
      return;
    }
    const seats = Number(form.totalSeats);
    if (!Number.isInteger(seats) || seats < 1) {
      Alert.alert(
        'Invalid seats',
        'Total seats must be a whole number of at least 1.',
      );
      return;
    }
    const year = Number(form.year);
    if (
      !/^\d{4}$/.test(form.year) ||
      year < 1980 ||
      year > new Date().getFullYear() + 1
    ) {
      Alert.alert('Invalid model year', 'Enter a valid four-digit model year.');
      return;
    }
    const verificationDetails: Partial<ProviderTransportSetup> = {
      ...details,
      vehicleClass: form.type as ProviderTransportSetup['vehicleClass'],
      vehicleModel: form.model.trim(),
      vehicleMakeYear: form.year,
      registrationNumber: form.registrationNumber.trim(),
      vehicleImageFront: imageUrls[0],
      vehicleImageBack: imageUrls[1],
    };
    const validation = vehicleVerificationError(verificationDetails);
    if (validation) {
      Alert.alert('Check vehicle details', validation);
      return;
    }
    setLoading(true);
    try {
      const uiType = form.type.trim().toLowerCase();
      const apiType =
        uiType === 'jeep'
          ? 'suv'
          : uiType === 'mini_bus' || uiType === 'mini-bus'
            ? 'minibus'
            : (uiType as 'van' | 'minibus' | 'bus' | 'car' | 'suv' | 'other');
      const body = {
        providerId: provider.id,
        name: form.name.trim(),
        type: apiType,
        model: form.model.trim(),
        year,
        verificationDetails,
        registrationNumber: form.registrationNumber.trim(),
        totalSeats: seats,
        amenities: payloadAmenities(),
        images: imageUrls.filter(Boolean),
        active: existing?.active ?? false,
        status: existing?.status ?? 'pending',
      };
      const saved = isEditing
        ? await providerService.updateVehicle(vehicleId, body)
        : await providerService.createVehicle(body);
      useProviderStore.setState((state) => ({
        vehicles: [
          ...state.vehicles.filter((item) => item.id !== saved.id),
          saved,
        ],
      }));
      if (onboarding) {
        await useProviderStore.getState().checkpoint('vehicle', saved.id);
      } else if (provider.services.includes('transport'))
        await useProviderStore.getState().loadProvider(provider.id);
      else await refreshDashboard();
      for (const key of Object.keys(useProviderStore.getState().formDrafts)) {
        if (key.startsWith(draftKey + '.'))
          useProviderStore.getState().clearFormDraft(key);
      }
      if (onboarding) {
        router.push('/(provider)/register/verification');
        return;
      }
      Alert.alert(
        isEditing ? 'Vehicle updated' : 'Submitted for approval',
        isEditing
          ? existing?.status === 'rejected'
            ? 'Saved. This vehicle goes back to pending until admin reviews it.'
            : 'Your changes are saved.'
          : 'Your vehicle is pending BANJARA Admin review. You can use it for trips after it is approved.',
      );
      router.back();
    } catch (error) {
      Alert.alert(
        isEditing ? 'Could not update vehicle' : 'Could not save vehicle',
        getApiErrorMessage(error),
      );
    } finally {
      setLoading(false);
    }
  };

  const onDelete = () => {
    if (!provider) return;
    Alert.alert(
      'Remove vehicle',
      `Remove ${form.name || 'this vehicle'} from your fleet?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await providerService.deleteVehicle(vehicleId);
              await useProviderStore.getState().loadProvider(provider.id);
              router.back();
            } catch (error) {
              Alert.alert('Could not remove', getApiErrorMessage(error));
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title={
          onboarding
            ? 'Register primary vehicle'
            : isEditing
              ? 'Edit vehicle'
              : 'Add vehicle'
        }
        showBack
        onBack={goBack}
        fallbackHref={
          onboarding
            ? '/(provider)/register/transport'
            : ('/(provider)/transport' as never)
        }
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 40,
          gap: Spacing.lg,
        }}
      >
        <Text style={styles.heading}>
          {isEditing ? 'Update this vehicle' : 'Vehicle details'}
        </Text>
        {isEditing &&
        existing?.status === 'rejected' &&
        existing.rejectionReason ? (
          <Text style={styles.reject}>
            Rejected: {existing.rejectionReason}
          </Text>
        ) : null}
        {onboarding ? (
          <>
            <Text style={styles.reject}>
              Your vehicle, driver and insurance details are prefilled from
              registration. Enter the passenger capacity and choose amenities.
            </Text>
            <Button
              title="Edit transporter details"
              variant="outline"
              onPress={() => router.push('/(provider)/register/transport')}
            />
          </>
        ) : null}
        <Input
          label="Vehicle name *"
          value={form.name}
          onChangeText={(v) => setForm({ ...form, name: v })}
        />
        <SearchSelect
          label="Vehicle type *"
          placeholder="Choose vehicle type"
          value={form.type}
          options={VEHICLE_TYPE_OPTIONS}
          searchable={false}
          disabled={onboarding}
          leftIcon="bus-outline"
          onChange={(type) => setForm({ ...form, type })}
        />
        <Input
          editable={!onboarding}
          label="Vehicle model *"
          value={form.model}
          onChangeText={(v) => setForm({ ...form, model: v })}
        />
        <Input
          editable={!onboarding}
          label="Model year *"
          keyboardType="number-pad"
          value={form.year}
          onChangeText={(v) => setForm({ ...form, year: v })}
        />
        <Input
          editable={!onboarding}
          label="Registration number *"
          value={form.registrationNumber}
          onChangeText={(v) => setForm({ ...form, registrationNumber: v })}
        />
        <Input
          label="Passenger seats (excluding driver) *"
          keyboardType="number-pad"
          value={form.totalSeats}
          onChangeText={(v) => setForm({ ...form, totalSeats: v })}
        />
        <Toggle
          label="Air conditioning"
          value={form.ac}
          onChange={(ac) => setForm({ ...form, ac })}
        />
        <Toggle
          label="WiFi"
          value={form.wifi}
          onChange={(wifi) => setForm({ ...form, wifi })}
        />
        <Toggle
          label="Charging ports"
          value={form.charging}
          onChange={(charging) => setForm({ ...form, charging })}
        />
        <Toggle
          label="Luggage space"
          value={form.luggage}
          onChange={(luggage) => setForm({ ...form, luggage })}
        />
        {onboarding ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.toggleLabel}>Owner: {details.ownerName}</Text>
            <Text style={styles.toggleLabel}>
              Engine: {details.engineNumber}
            </Text>
            <Text style={styles.toggleLabel}>
              Driver: {details.driverName} · {details.driverPhone}
            </Text>
            <Text style={styles.toggleLabel}>
              License: {details.driverLicenseNumber}
            </Text>
            <Text style={styles.toggleLabel}>
              Insurance: {details.insuranceCompany} · {details.insuranceNumber}{' '}
              ({details.insuranceYear})
            </Text>
          </View>
        ) : (
          <VehicleVerificationFields
            value={details}
            onChange={(patch) => setDetails((prev) => ({ ...prev, ...patch }))}
          />
        )}
        {[0, 1].map((slot) => (
          <ImagePickerField
            key={slot}
            disabled={loading || uploadingImages || removingImage}
            onRemovingChange={setRemovingImage}
            label={
              slot === 0 ? 'Vehicle front photo *' : 'Vehicle back photo *'
            }
            urls={imageUrls[slot] ? [imageUrls[slot]] : []}
            uploading={uploadingImages}
            max={1}
            onAdd={() => void onAddImage(slot)}
            onRemove={() =>
              setImageUrls((prev) => {
                const next = [...prev];
                next[slot] = '';
                return next;
              })
            }
          />
        ))}
        <ImagePickerField
          label="Additional vehicle photos (optional)"
          max={3}
          urls={imageUrls.slice(2).filter(Boolean)}
          disabled={loading || uploadingImages || removingImage}
          uploading={uploadingImages}
          onRemovingChange={setRemovingImage}
          onAdd={() => void onAddImage(imageUrls.length)}
          onRemove={(index) =>
            setImageUrls((prev) => prev.filter((_, i) => i !== index + 2))
          }
        />
        <Button
          title={
            onboarding
              ? 'Save vehicle and continue'
              : isEditing
                ? 'Save changes'
                : 'Add vehicle'
          }
          disabled={removingImage}
          loading={loading || uploadingImages}
          onPress={() => void onSave()}
        />
        {isEditing && !onboarding ? (
          <Button title="Remove vehicle" variant="danger" onPress={onDelete} />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggle}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heading: { ...Typography.h2, color: Colors.dark },
  reject: { ...Typography.caption, color: Colors.danger, lineHeight: 18 },
  toggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  toggleLabel: { ...Typography.body, color: Colors.dark },
});
