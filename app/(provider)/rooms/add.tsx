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
import { ROOM_TYPE_OPTIONS } from '@/constants/providerOptions';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as providerService from '@/services/providerService';
import * as uploadService from '@/services/uploadService';
import { useProviderStore } from '@/store/providerStore';
import { paramId } from '@/utils/navigation';

export default function AddRoomScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const roomId = paramId(params.id);
  const isEditing = Boolean(roomId);
  const provider = useProviderStore((s) => s.provider);
  const rooms = useProviderStore((s) => s.rooms);
  const refreshDashboard = useProviderStore((s) => s.refreshDashboard);
  const existing = useMemo(() => rooms.find((room) => room.id === roomId), [rooms, roomId]);
  const [removingImage, setRemovingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(existing?.images ?? []);
  const [form, setForm] = useState({
    name: existing?.name ?? '',
    roomType: (existing?.roomType ?? 'double') as string,
    capacity: String(existing?.capacity ?? '2'),
    bedType: existing?.bedType ?? 'King',
    sizeSqm: String(existing?.sizeSqm ?? '28'),
    pricePerNight: String(existing?.pricePerNight ?? '15000'),
    quantity: String(existing?.quantity ?? '2'),
    amenities: existing?.amenities?.join(', ') ?? 'WiFi, Breakfast',
    breakfastIncluded: existing?.breakfastIncluded ?? true,
    freeCancellation: existing?.freeCancellation ?? true,
    discountPercent: String(existing?.discountPercent ?? ''),
    offerNote: existing?.offerNote ?? '',
  });

  useEffect(() => {
    if (isEditing && !existing) void refreshDashboard();
  }, [isEditing, existing, refreshDashboard]);

  useEffect(() => {
    if (!existing) return;
    setForm({
      name: existing.name,
      roomType: existing.roomType,
      capacity: String(existing.capacity),
      bedType: existing.bedType,
      sizeSqm: String(existing.sizeSqm),
      pricePerNight: String(existing.pricePerNight),
      quantity: String(existing.quantity),
      amenities: existing.amenities.join(', '),
      breakfastIncluded: existing.breakfastIncluded,
      freeCancellation: existing.freeCancellation,
      discountPercent: String(existing.discountPercent ?? ''),
      offerNote: existing.offerNote ?? '',
    });
    if (existing.images.length) setImageUrls(existing.images);
  }, [existing]);

  const onAddImages = async () => {
    try {
      setUploadingImages(true);
      const remaining = Math.max(0, 6 - imageUrls.length);
      const picked = await uploadService.pickImages(remaining || 1);
      if (!picked.length) return;
      const uploaded = await uploadService.uploadImages(picked, 'rooms');
      setImageUrls((prev) => [...prev, ...uploaded.map((item) => item.url)].slice(0, 6));
    } catch (error) {
      Alert.alert('Upload failed', getApiErrorMessage(error));
    } finally {
      setUploadingImages(false);
    }
  };

  const onSave = async () => {
    if (removingImage || loading || uploadingImages) return;
    if (!provider) return;
    if (!form.name) {
      Alert.alert('Missing name', 'Enter a room name.');
      return;
    }
    if (!imageUrls.length) {
      Alert.alert('Photos required', 'Add at least one room photo.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        providerId: provider.id,
        name: form.name,
        roomType: form.roomType as 'single' | 'double' | 'twin' | 'deluxe' | 'suite' | 'family',
        capacity: Number(form.capacity) || 1,
        bedType: form.bedType,
        sizeSqm: Number(form.sizeSqm) || 20,
        pricePerNight: Number(form.pricePerNight) || 0,
        quantity: Number(form.quantity) || 1,
        amenities: form.amenities.split(',').map((s) => s.trim()).filter(Boolean),
        breakfastIncluded: form.breakfastIncluded,
        freeCancellation: form.freeCancellation,
        images: imageUrls,
        available: true,
        availableCount: Number(form.quantity) || 1,
        discountPercent: Number(form.discountPercent) || 0,
        offerNote: form.offerNote.trim() || undefined,
      };
      if (isEditing) {
        await providerService.updateRoom(roomId, payload);
      } else {
        await providerService.createRoom(payload);
      }
      await refreshDashboard();
      router.back();
    } catch (error) {
      Alert.alert(isEditing ? 'Could not update room' : 'Could not save room', getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={isEditing ? 'Edit Room' : 'Add Room'}
        showBack
        fallbackHref={'/(provider)/rooms/index' as never}
      />
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40, gap: Spacing.lg }}>
        <Text style={styles.heading}>{isEditing ? 'Update this room type' : 'Room details'}</Text>
        <Input label="Room name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
        <SearchSelect
          label="Room type"
          placeholder="Choose room type"
          value={form.roomType}
          options={ROOM_TYPE_OPTIONS}
          searchable={false}
          leftIcon="bed-outline"
          onChange={(roomType) => setForm({ ...form, roomType })}
        />
        <Input label="Capacity" keyboardType="number-pad" value={form.capacity} onChangeText={(v) => setForm({ ...form, capacity: v })} />
        <Input label="Bed type" value={form.bedType} onChangeText={(v) => setForm({ ...form, bedType: v })} />
        <Input label="Room size (m²)" keyboardType="number-pad" value={form.sizeSqm} onChangeText={(v) => setForm({ ...form, sizeSqm: v })} />
        <Input label="Price per night" keyboardType="number-pad" value={form.pricePerNight} onChangeText={(v) => setForm({ ...form, pricePerNight: v })} />
        <Input label="Number of rooms" keyboardType="number-pad" value={form.quantity} onChangeText={(v) => setForm({ ...form, quantity: v })} />
        <Input
          label="Discount %"
          keyboardType="number-pad"
          value={form.discountPercent}
          onChangeText={(v) => setForm({ ...form, discountPercent: v.replace(/[^0-9]/g, '') })}
        />
        <Input
          label="Offer / promo"
          value={form.offerNote}
          onChangeText={(v) => setForm({ ...form, offerNote: v })}
          placeholder="e.g. Free breakfast for 2 nights"
        />
        <Input label="Amenities" value={form.amenities} onChangeText={(v) => setForm({ ...form, amenities: v })} />
        <View style={styles.toggle}>
          <Text style={styles.toggleLabel}>Breakfast included</Text>
          <Switch value={form.breakfastIncluded} onValueChange={(breakfastIncluded) => setForm({ ...form, breakfastIncluded })} />
        </View>
        <View style={styles.toggle}>
          <Text style={styles.toggleLabel}>Free cancellation</Text>
          <Switch value={form.freeCancellation} onValueChange={(freeCancellation) => setForm({ ...form, freeCancellation })} />
        </View>
        <ImagePickerField
          disabled={loading || uploadingImages || removingImage}
          onRemovingChange={setRemovingImage}
          label="Room photos"
          urls={imageUrls}
          uploading={uploadingImages}
          max={6}
          onAdd={() => void onAddImages()}
          onRemove={(index) => setImageUrls((prev) => prev.filter((_, i) => i !== index))}
        />
        <Button
          title={isEditing ? 'Save changes' : 'Save Room'}
          disabled={removingImage}
          loading={loading || uploadingImages}
          onPress={() => void onSave()}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heading: { ...Typography.h2, color: Colors.primary },
  toggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { ...Typography.body, color: Colors.primary },
});
