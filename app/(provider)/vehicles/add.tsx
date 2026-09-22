import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
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
import { paramId } from '@/utils/navigation';

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
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const vehicleId = paramId(params.id);
  const isEditing = Boolean(vehicleId);
  const provider = useProviderStore((s) => s.provider);
  const vehicles = useProviderStore((s) => s.vehicles);
  const refreshDashboard = useProviderStore((s) => s.refreshDashboard);
  const existing = useMemo(
    () => vehicles.find((item) => item.id === vehicleId),
    [vehicles, vehicleId]
  );

  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(existing?.images ?? []);
  const flags = amenitiesFrom(existing?.amenities);
  const [form, setForm] = useState({
    name: existing?.name ?? '',
    type: (existing?.type ?? 'van') as string,
    model: existing?.model ?? '',
    year: String(existing?.year ?? '2023'),
    registrationNumber: existing?.registrationNumber ?? '',
    totalSeats: String(existing?.totalSeats ?? '14'),
    ac: flags.ac,
    wifi: flags.wifi,
    charging: flags.charging,
    luggage: flags.luggage,
  });

  useEffect(() => {
    if (!existing) return;
    const next = amenitiesFrom(existing.amenities);
    setImageUrls(existing.images ?? []);
    setForm({
      name: existing.name,
      type: existing.type,
      model: existing.model,
      year: String(existing.year ?? ''),
      registrationNumber: existing.registrationNumber,
      totalSeats: String(existing.totalSeats ?? ''),
      ...next,
    });
  }, [existing?.id]);

  const onAddImages = async () => {
    try {
      setUploadingImages(true);
      const remaining = Math.max(0, 5 - imageUrls.length);
      const picked = await uploadService.pickImages(remaining || 1);
      if (!picked.length) return;
      const uploaded = await uploadService.uploadImages(picked, 'vehicles');
      setImageUrls((prev) => [...prev, ...uploaded.map((item) => item.url)].slice(0, 5));
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
    if (!provider) {
      Alert.alert('Unavailable', 'Provider profile required.');
      return;
    }
    if (!form.name.trim() || !form.model.trim() || !form.registrationNumber.trim()) {
      Alert.alert('Missing fields', 'Name, model and registration are required.');
      return;
    }
    if (!imageUrls.length) {
      Alert.alert('Photos required', 'Add at least one vehicle photo.');
      return;
    }
    const seats = Number(form.totalSeats);
    if (!Number.isInteger(seats) || seats < 1) {
      Alert.alert('Invalid seats', 'Total seats must be a whole number of at least 1.');
      return;
    }
    setLoading(true);
    try {
      const body = {
        providerId: provider.id,
        name: form.name.trim(),
        type: form.type as 'van' | 'minibus' | 'bus' | 'car',
        model: form.model.trim(),
        year: Number(form.year) || 2023,
        registrationNumber: form.registrationNumber.trim(),
        totalSeats: seats,
        amenities: payloadAmenities(),
        images: imageUrls,
        active: existing?.active ?? false,
        status: existing?.status ?? 'pending',
      };
      if (isEditing) {
        await providerService.updateVehicle(vehicleId, body);
      } else {
        await providerService.createVehicle(body);
      }
      await refreshDashboard();
      Alert.alert(
        isEditing ? 'Vehicle updated' : 'Submitted for approval',
        isEditing
          ? existing?.status === 'rejected'
            ? 'Saved. This vehicle goes back to pending until admin reviews it.'
            : 'Your changes are saved.'
          : 'Your vehicle is pending BANJARA Admin review. You can use it for trips after it is approved.'
      );
      router.back();
    } catch (error) {
      Alert.alert(
        isEditing ? 'Could not update vehicle' : 'Could not save vehicle',
        getApiErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Remove vehicle', `Remove ${form.name || 'this vehicle'} from your fleet?`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await providerService.deleteVehicle(vehicleId);
            await refreshDashboard();
            router.back();
          } catch (error) {
            Alert.alert('Could not remove', getApiErrorMessage(error));
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header
        title={isEditing ? 'Edit vehicle' : 'Add vehicle'}
        showBack
        fallbackHref={'/(provider)/transport/index' as never}
      />
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40, gap: Spacing.lg }}
      >
        <Text style={styles.heading}>{isEditing ? 'Update this vehicle' : 'Vehicle details'}</Text>
        {isEditing && existing?.status === 'rejected' && existing.rejectionReason ? (
          <Text style={styles.reject}>Rejected: {existing.rejectionReason}</Text>
        ) : null}
        <Input label="Vehicle name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
        <SearchSelect
          label="Vehicle type"
          placeholder="Choose vehicle type"
          value={form.type}
          options={VEHICLE_TYPE_OPTIONS}
          searchable={false}
          leftIcon="bus-outline"
          onChange={(type) => setForm({ ...form, type })}
        />
        <Input label="Vehicle model" value={form.model} onChangeText={(v) => setForm({ ...form, model: v })} />
        <Input
          label="Model year"
          keyboardType="number-pad"
          value={form.year}
          onChangeText={(v) => setForm({ ...form, year: v })}
        />
        <Input
          label="Registration number"
          value={form.registrationNumber}
          onChangeText={(v) => setForm({ ...form, registrationNumber: v })}
        />
        <Input
          label="Total seats"
          keyboardType="number-pad"
          value={form.totalSeats}
          onChangeText={(v) => setForm({ ...form, totalSeats: v })}
        />
        <Toggle label="Air conditioning" value={form.ac} onChange={(ac) => setForm({ ...form, ac })} />
        <Toggle label="WiFi" value={form.wifi} onChange={(wifi) => setForm({ ...form, wifi })} />
        <Toggle label="Charging ports" value={form.charging} onChange={(charging) => setForm({ ...form, charging })} />
        <Toggle label="Luggage space" value={form.luggage} onChange={(luggage) => setForm({ ...form, luggage })} />
        <ImagePickerField
          label="Vehicle photos"
          urls={imageUrls}
          uploading={uploadingImages}
          max={5}
          onAdd={() => void onAddImages()}
          onRemove={(index) => setImageUrls((prev) => prev.filter((_, i) => i !== index))}
        />
        <Button
          title={isEditing ? 'Save changes' : 'Add vehicle'}
          loading={loading || uploadingImages}
          onPress={() => void onSave()}
        />
        {isEditing ? (
          <Button title="Remove vehicle" variant="danger" onPress={onDelete} />
        ) : null}
      </ScrollView>
    </View>
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
  toggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
  toggleLabel: { ...Typography.body, color: Colors.dark },
});
