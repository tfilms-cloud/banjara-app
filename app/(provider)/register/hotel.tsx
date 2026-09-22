import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationPinField, formatPickedAddress, formatPickedPlace } from '@/components/location';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { ImagePickerField } from '@/components/ui/ImagePickerField';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { isTransportService } from '@/constants/providerOptions';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as uploadService from '@/services/uploadService';
import { useProviderStore } from '@/store/providerStore';
import { useAuthStore } from '@/store/authStore';
import {
  ONBOARDING_LOCATION,
  PROVIDER_SERVICE_TAB,
  leaveProviderEditor,
  paramId,
  useWizardBack,
  wizardBack,
} from '@/utils/navigation';

function nextAfterHotel(services: string[]) {
  if (services.some((s) => s === 'tour' || s === 'travelGuide')) return '/(provider)/register/tours';
  return '/(provider)/register/verification';
}

export default function ProviderHotelSetupScreen() {
  const insets = useSafeAreaInsets();
  const draft = useProviderStore((s) => s.draft);
  const setHotel = useProviderStore((s) => s.setHotel);
  const saveProgress = useProviderStore((s) => s.saveProgress);
  const saving = useProviderStore((s) => s.saving);
  const provider = useProviderStore((s) => s.provider);
  const user = useAuthStore((s) => s.user);
  const params = useLocalSearchParams<{ from?: string | string[] }>();
  const isEditing = paramId(params.from) === 'edit';
  const goPrevious = useWizardBack(() => {
    if (isEditing) {
      wizardBack(PROVIDER_SERVICE_TAB);
      return;
    }
    const services = draft.selectedServices;
    if (services.some((s) => isTransportService(s) || s === 'carRental')) {
      wizardBack('/(provider)/register/transport');
      return;
    }
    wizardBack(ONBOARDING_LOCATION as never);
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(draft.hotel?.images ?? provider?.hotel?.images ?? []);

  const [form, setForm] = useState({
    hotelName: draft.hotel?.hotelName ?? provider?.hotel?.hotelName ?? draft.business.businessName ?? '',
    hotelType: (draft.hotel?.hotelType ?? provider?.hotel?.hotelType ?? 'hotel') as string,
    address: draft.hotel?.address ?? provider?.hotel?.address ?? draft.location?.address.formattedAddress ?? draft.business.address ?? '',
    city: draft.hotel?.city ?? provider?.hotel?.city ?? draft.location?.address.city ?? draft.business.city ?? '',
    description: draft.hotel?.description ?? provider?.hotel?.description ?? '',
    phone: draft.hotel?.phone ?? provider?.hotel?.phone ?? draft.business.phone ?? '',
    email: draft.hotel?.email ?? provider?.hotel?.email ?? draft.business.email ?? '',
    checkInTime: draft.hotel?.checkInTime ?? provider?.hotel?.checkInTime ?? '14:00',
    checkOutTime: draft.hotel?.checkOutTime ?? provider?.hotel?.checkOutTime ?? '12:00',
    amenities: draft.hotel?.amenities?.join(', ') ?? provider?.hotel?.amenities?.join(', ') ?? 'WiFi, Breakfast, Parking',
    latitude: draft.location?.latitude ?? draft.hotel?.latitude ?? provider?.hotel?.latitude ?? 36.3167,
    longitude: draft.location?.longitude ?? draft.hotel?.longitude ?? provider?.hotel?.longitude ?? 74.65,
  });

  useEffect(() => {
    const hotel = draft.hotel ?? provider?.hotel;
    if (!hotel?.hotelName && !hotel?.address) return;
    setForm({
      hotelName: hotel.hotelName ?? draft.business.businessName ?? '',
      hotelType: (hotel.hotelType ?? 'hotel') as string,
      address: hotel.address ?? '',
      city: hotel.city ?? '',
      description: hotel.description ?? '',
      phone: hotel.phone ?? '',
      email: hotel.email ?? '',
      checkInTime: hotel.checkInTime ?? '14:00',
      checkOutTime: hotel.checkOutTime ?? '12:00',
      amenities: hotel.amenities?.join(', ') ?? '',
      latitude: hotel.latitude ?? draft.location?.latitude ?? 36.3167,
      longitude: hotel.longitude ?? draft.location?.longitude ?? 74.65,
    });
    if (hotel.images?.length) setImageUrls(hotel.images);
  }, [provider?.id, draft.hotel?.hotelName, draft.hotel?.address]);

  const onAddImages = async () => {
    try {
      setUploadingImages(true);
      const remaining = Math.max(0, 8 - imageUrls.length);
      const picked = await uploadService.pickImages(remaining || 1);
      if (!picked.length) return;
      const uploaded = await uploadService.uploadImages(picked, 'hotels');
      setImageUrls((prev) => [...prev, ...uploaded.map((item) => item.url)].slice(0, 8));
    } catch (error) {
      Alert.alert('Upload failed', getApiErrorMessage(error));
    } finally {
      setUploadingImages(false);
    }
  };

  const onContinue = async () => {
    if (!imageUrls.length) {
      Alert.alert('Photos required', 'Add at least one hotel photo before continuing.');
      return;
    }
    setHotel({
      hotelName: form.hotelName,
      hotelType: form.hotelType as 'hotel' | 'resort' | 'guest_house' | 'lodge',
      address: form.address,
      city: form.city,
      latitude: form.latitude,
      longitude: form.longitude,
      description: form.description,
      phone: form.phone,
      email: form.email,
      checkInTime: form.checkInTime,
      checkOutTime: form.checkOutTime,
      amenities: form.amenities.split(',').map((s) => s.trim()).filter(Boolean),
      images: imageUrls,
    });
    try {
      await saveProgress();
      if (isEditing) {
        leaveProviderEditor(user);
        return;
      }
      router.push(nextAfterHotel(draft.selectedServices) as never);
    } catch (error) {
      Alert.alert('Could not save', getApiErrorMessage(error));
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Hotel Setup"
        showBack
        fallbackHref={isEditing ? PROVIDER_SERVICE_TAB : (ONBOARDING_LOCATION as never)}
        onBack={goPrevious}
      />
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40, gap: Spacing.lg }}>
        <Text style={styles.heading}>Create your hotel profile</Text>
        <Input label="Hotel name" value={form.hotelName} onChangeText={(v) => setForm({ ...form, hotelName: v })} />
        <Input label="Hotel type (hotel / resort / guest_house / lodge)" value={form.hotelType} onChangeText={(v) => setForm({ ...form, hotelType: v })} />
        <LocationPinField
          label="Address"
          value={form.address}
          onChangeText={(v) => setForm({ ...form, address: v })}
          result="address"
          mapTitle="Pin your hotel"
          initialLatitude={form.latitude}
          initialLongitude={form.longitude}
          onPicked={(picked) => {
            setForm((prev) => ({
              ...prev,
              address: formatPickedAddress(picked),
              city: formatPickedPlace(picked),
              latitude: picked.latitude,
              longitude: picked.longitude,
            }));
          }}
        />
        <LocationPinField
          label="City"
          value={form.city}
          onChangeText={(v) => setForm({ ...form, city: v })}
          result="place"
          mapTitle="Pin hotel city"
          initialLatitude={form.latitude}
          initialLongitude={form.longitude}
          onPicked={(picked) => {
            setForm((prev) => ({
              ...prev,
              city: formatPickedPlace(picked),
              address: prev.address || formatPickedAddress(picked),
              latitude: picked.latitude,
              longitude: picked.longitude,
            }));
          }}
        />
        <Text style={styles.hint}>
          Pin is {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}. Travelers see this on the map.
        </Text>
        <Input label="Description" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline />
        <Input label="Phone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} />
        <Input label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} autoCapitalize="none" />
        <Input label="Check-in time" value={form.checkInTime} onChangeText={(v) => setForm({ ...form, checkInTime: v })} />
        <Input label="Check-out time" value={form.checkOutTime} onChangeText={(v) => setForm({ ...form, checkOutTime: v })} />
        <Input label="Amenities (comma separated)" value={form.amenities} onChangeText={(v) => setForm({ ...form, amenities: v })} />
        <ImagePickerField
          label="Hotel photos"
          urls={imageUrls}
          uploading={uploadingImages}
          max={8}
          onAdd={() => void onAddImages()}
          onRemove={(index) => setImageUrls((prev) => prev.filter((_, i) => i !== index))}
        />
        <Button
          title={isEditing ? 'Save changes' : 'Continue'}
          loading={uploadingImages || saving}
          onPress={() => void onContinue()}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heading: { ...Typography.h2, color: Colors.primary },
  hint: { ...Typography.caption, color: Colors.muted },
});
