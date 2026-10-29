import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationPinField, formatPickedAddress, formatPickedPlace } from '@/components/location';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { ImagePickerField } from '@/components/ui/ImagePickerField';
import { Input } from '@/components/ui/Input';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { Colors } from '@/constants/colors';
import {
  LODGING_TYPE_OPTIONS,
  YES_NO_OPTIONS,
  defaultStayType,
  isTransportService,
  normalizeStayType,
} from '@/constants/providerOptions';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as uploadService from '@/services/uploadService';
import { useProviderStore } from '@/store/providerStore';
import { useAuthStore } from '@/store/authStore';
import type { ProviderHotelSetup } from '@/types/provider';
import {
  ONBOARDING_LOCATION,
  PROVIDER_SERVICE_TAB,
  leaveProviderEditor,
  paramId,
  useWizardBack,
  wizardBack,
} from '@/utils/navigation';

function nextAfterHotel(services: string[]) {
  if (services.some((s) => s === 'travelGuide')) return '/(provider)/register/guide';
  if (services.some((s) => s === 'tour')) return '/(provider)/register/tours';
  return '/(provider)/register/verification';
}

function emptyHotelForm(
  seed?: Partial<ProviderHotelSetup>,
  draft?: {
    businessName?: string;
    ownerName?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    yearsExperience?: number;
  }
): {
  hotelName: string;
  managerName: string;
  landline: string;
  phone: string;
  hotelType: ProviderHotelSetup['hotelType'];
  address: string;
  village: string;
  district: string;
  city: string;
  googleMapsUrl: string;
  businessRegistered: string;
  businessRegistrationNumber: string;
  yearsExperience: string;
  website: string;
  socialFacebook: string;
  socialInstagram: string;
  socialTiktok: string;
  restaurantAvailable: string;
  description: string;
  email: string;
  latitude: number;
  longitude: number;
} {
  const years =
    seed?.yearsExperience != null && seed.yearsExperience > 0
      ? seed.yearsExperience
      : draft?.yearsExperience != null && draft.yearsExperience > 0
        ? draft.yearsExperience
        : undefined;
  return {
    hotelName: seed?.hotelName ?? draft?.businessName ?? '',
    managerName: seed?.managerName?.trim() || draft?.ownerName?.trim() || '',
    landline: seed?.landline ?? '',
    phone: seed?.phone ?? draft?.phone ?? '',
    hotelType: normalizeStayType(seed?.hotelType),
    address: seed?.address ?? draft?.address ?? '',
    village: seed?.village ?? '',
    district: seed?.district ?? '',
    city: seed?.city ?? draft?.city ?? '',
    googleMapsUrl: seed?.googleMapsUrl ?? '',
    businessRegistered: seed?.businessRegistered || (seed?.businessRegistrationNumber ? 'yes' : ''),
    businessRegistrationNumber: seed?.businessRegistrationNumber ?? '',
    yearsExperience: years != null ? String(years) : '',
    website: seed?.website ?? '',
    socialFacebook: seed?.socialFacebook ?? '',
    socialInstagram: seed?.socialInstagram ?? '',
    socialTiktok: seed?.socialTiktok ?? '',
    restaurantAvailable: seed?.restaurantAvailable ?? '',
    description: seed?.description ?? '',
    email: seed?.email ?? draft?.email ?? '',
    latitude: seed?.latitude ?? draft?.latitude ?? 36.3167,
    longitude: seed?.longitude ?? draft?.longitude ?? 74.65,
  };
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
    if (services.some((s) => isTransportService(s))) {
      wizardBack('/(provider)/register/transport');
      return;
    }
    wizardBack(ONBOARDING_LOCATION as never);
  });

  const serviceList = draft.selectedServices.length ? draft.selectedServices : provider?.services ?? [];
  const seed = draft.hotel ?? provider?.hotel;

  const [removingImage, setRemovingImage] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<'outlook' | 'rooms' | 'restaurant' | null>(null);
  const [outlookImages, setOutlookImages] = useState<string[]>(seed?.outlookImages?.length ? seed.outlookImages : []);
  const [roomImages, setRoomImages] = useState<string[]>(seed?.roomImages?.length ? seed.roomImages : []);
  const [restaurantImages, setRestaurantImages] = useState<string[]>(
    seed?.restaurantImages?.length ? seed.restaurantImages : []
  );

  const [form, setForm] = useState(() =>
    emptyHotelForm(seed, {
      businessName: draft.business.businessName,
      ownerName: draft.business.ownerName,
      phone: draft.business.phone,
      email: draft.business.email,
      address: draft.location?.address.formattedAddress ?? draft.business.address,
      city: draft.location?.address.city ?? draft.business.city,
      latitude: draft.location?.latitude,
      longitude: draft.location?.longitude,
      yearsExperience: draft.business.yearsExperience,
    })
  );

  useEffect(() => {
    const hotel = draft.hotel ?? provider?.hotel;
    if (!hotel?.hotelName && !hotel?.managerName && !hotel?.address && !hotel?.village) return;
    setForm(
      emptyHotelForm(hotel, {
        businessName: draft.business.businessName ?? provider?.businessName,
        ownerName: draft.business.ownerName ?? provider?.ownerName,
        phone: draft.business.phone ?? provider?.phone,
        email: draft.business.email ?? provider?.email,
        address: draft.location?.address.formattedAddress ?? draft.business.address ?? provider?.address,
        city: draft.location?.address.city ?? draft.business.city ?? provider?.city,
        latitude: draft.location?.latitude ?? provider?.latitude,
        longitude: draft.location?.longitude ?? provider?.longitude,
        yearsExperience: draft.business.yearsExperience ?? provider?.yearsExperience,
      })
    );
    if (hotel.outlookImages?.length) setOutlookImages(hotel.outlookImages);
    if (hotel.roomImages?.length) setRoomImages(hotel.roomImages);
    if (hotel.restaurantImages?.length) setRestaurantImages(hotel.restaurantImages);
    // Legacy: split combined images if category buckets empty
    if (
      !(hotel.outlookImages?.length || hotel.roomImages?.length) &&
      hotel.images?.length
    ) {
      setOutlookImages(hotel.images.slice(0, 1));
      setRoomImages(hotel.images.slice(1));
    }
  }, [
    provider?.id,
    provider?.hotel?.managerName,
    provider?.hotel?.village,
    provider?.hotel?.district,
    provider?.hotel?.businessRegistrationNumber,
    provider?.hotel?.yearsExperience,
    provider?.hotel?.landline,
    draft.hotel?.hotelName,
    draft.hotel?.address,
    draft.hotel?.managerName,
    draft.hotel?.village,
    draft.hotel?.district,
    draft.hotel?.businessRegistrationNumber,
    draft.hotel?.yearsExperience,
  ]);

  const patch = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onAddImages = async (kind: 'outlook' | 'rooms' | 'restaurant') => {
    const current =
      kind === 'outlook' ? outlookImages : kind === 'rooms' ? roomImages : restaurantImages;
    const setter =
      kind === 'outlook' ? setOutlookImages : kind === 'rooms' ? setRoomImages : setRestaurantImages;
    try {
      setUploadingKind(kind);
      const remaining = Math.max(0, 6 - current.length);
      const picked = await uploadService.pickImages(remaining || 1);
      if (!picked.length) return;
      const uploaded = await uploadService.uploadImages(picked, 'hotels');
      setter((prev) => [...prev, ...uploaded.map((item) => item.url)].slice(0, 6));
    } catch (error) {
      Alert.alert('Upload failed', getApiErrorMessage(error));
    } finally {
      setUploadingKind(null);
    }
  };

  const openInGoogleMaps = async () => {
    const url =
      form.googleMapsUrl.trim() ||
      `https://www.google.com/maps/search/?api=1&query=${form.latitude},${form.longitude}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Maps', 'Could not open Google Maps.');
    }
  };

  const onContinue = async () => {
    if (removingImage || saving || Boolean(uploadingKind)) return;
    if (!form.hotelName.trim()) {
      Alert.alert('Required', 'Enter the property’s registered name.');
      return;
    }
    if (!form.managerName.trim()) {
      Alert.alert('Required', 'Manager name is mandatory.');
      return;
    }
    if (!form.phone.trim()) {
      Alert.alert('Required', 'Mobile number is mandatory.');
      return;
    }
    if (!form.hotelType) {
      Alert.alert('Required', 'Select the type of lodging service.');
      return;
    }
    if (!form.address.trim() || !form.latitude || !form.longitude) {
      Alert.alert('Required', 'Pin your property location on the map (or add a Google Maps link).');
      return;
    }
    if (!form.village.trim()) {
      Alert.alert('Required', 'Village is mandatory.');
      return;
    }
    if (!form.district.trim()) {
      Alert.alert('Required', 'District is mandatory.');
      return;
    }
    if (!form.city.trim()) {
      Alert.alert('Required', 'City is mandatory.');
      return;
    }
    if (!form.businessRegistered) {
      Alert.alert('Business registration', 'Please select Yes or No for business registration.');
      return;
    }
    if (form.businessRegistered === 'no') {
      Alert.alert(
        'Application rejected',
        'Business registration is mandatory. Properties without registration cannot be approved on BANJARA.'
      );
      return;
    }
    if (!form.businessRegistrationNumber.trim()) {
      Alert.alert('Required', 'Business registration number is mandatory.');
      return;
    }
    if (!(Number(form.yearsExperience) >= 0) || form.yearsExperience.trim() === '') {
      Alert.alert('Required', 'Years of experience in hospitality is mandatory.');
      return;
    }
    if (!outlookImages.length) {
      Alert.alert('Photos required', 'Add at least one outlook (exterior) photo of the property.');
      return;
    }
    if (!roomImages.length) {
      Alert.alert('Photos required', 'Add at least one room photo.');
      return;
    }
    if (form.restaurantAvailable === 'yes' && !restaurantImages.length) {
      Alert.alert('Photos required', 'Add restaurant photos when restaurant availability is Yes.');
      return;
    }

    const lodgingType = defaultStayType(serviceList, form.hotelType);
    const combinedImages = [...outlookImages, ...roomImages, ...restaurantImages];

    setHotel({
      hotelName: form.hotelName.trim(),
      hotelType: lodgingType,
      managerName: form.managerName.trim(),
      landline: form.landline.trim() || undefined,
      phone: form.phone.trim(),
      address: form.address.trim(),
      village: form.village.trim(),
      district: form.district.trim(),
      city: form.city.trim(),
      latitude: form.latitude,
      longitude: form.longitude,
      googleMapsUrl: form.googleMapsUrl.trim() || undefined,
      businessRegistered: 'yes',
      businessRegistrationNumber: form.businessRegistrationNumber.trim(),
      yearsExperience: Number(form.yearsExperience) || 0,
      website: form.website.trim() || undefined,
      socialFacebook: form.socialFacebook.trim() || undefined,
      socialInstagram: form.socialInstagram.trim() || undefined,
      socialTiktok: form.socialTiktok.trim() || undefined,
      restaurantAvailable: (form.restaurantAvailable as 'yes' | 'no' | '') || '',
      outlookImages,
      roomImages,
      restaurantImages,
      description: form.description.trim(),
      email: form.email.trim(),
      checkInTime: seed?.checkInTime ?? '14:00',
      checkOutTime: seed?.checkOutTime ?? '12:00',
      amenities: seed?.amenities ?? [],
      images: combinedImages,
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
        title="Lodging setup"
        showBack
        fallbackHref={isEditing ? PROVIDER_SERVICE_TAB : (ONBOARDING_LOCATION as never)}
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
        <Text style={styles.heading}>Property sign-up</Text>
        <Text style={styles.sub}>
          Fill in your lodging details. Fields marked * are required. Unregistered businesses are
          rejected.
        </Text>

        <Input
          label="Property’s registered name *"
          placeholder="Hotel, lodge or guest house name"
          value={form.hotelName}
          onChangeText={(v) => patch('hotelName', v)}
          leftIcon="business-outline"
        />
        <Input
          label="Manager name *"
          value={form.managerName}
          onChangeText={(v) => patch('managerName', v)}
          leftIcon="person-outline"
        />
        <Input
          label="Landline number"
          placeholder="Optional"
          value={form.landline}
          onChangeText={(v) => patch('landline', v)}
          keyboardType="phone-pad"
          leftIcon="call-outline"
        />
        <Input
          label="Mobile number *"
          value={form.phone}
          onChangeText={(v) => patch('phone', v)}
          keyboardType="phone-pad"
          leftIcon="phone-portrait-outline"
        />

        <SearchSelect
          label="Type of lodging service *"
          placeholder="Hotel, Guest house, Lodge or Hostel"
          value={form.hotelType}
          options={LODGING_TYPE_OPTIONS}
          searchable={false}
          leftIcon="home-outline"
          onChange={(hotelType) => patch('hotelType', normalizeStayType(hotelType))}
        />

        <LocationPinField
          label="Location on map *"
          value={form.address}
          onChangeText={(v) => patch('address', v)}
          result="address"
          mapTitle="Pin your property"
          hint="Pin on the map or enter the place. You can also paste a Google Maps link below."
          initialLatitude={form.latitude}
          initialLongitude={form.longitude}
          onPicked={(picked) => {
            setForm((prev) => ({
              ...prev,
              address: formatPickedAddress(picked),
              city: prev.city || formatPickedPlace(picked),
              district: prev.district || picked.address.region || '',
              village: prev.village || picked.address.area || '',
              latitude: picked.latitude,
              longitude: picked.longitude,
              googleMapsUrl:
                prev.googleMapsUrl ||
                `https://www.google.com/maps/search/?api=1&query=${picked.latitude},${picked.longitude}`,
            }));
          }}
        />
        <Text style={styles.hint}>
          Pin {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
        </Text>
        <Input
          label="Google Maps link"
          placeholder="Paste a Google Maps URL (optional)"
          value={form.googleMapsUrl}
          onChangeText={(v) => patch('googleMapsUrl', v)}
          autoCapitalize="none"
          leftIcon="map-outline"
        />
        <Pressable style={styles.mapsBtn} onPress={() => void openInGoogleMaps()}>
          <Ionicons name="logo-google" size={18} color={Colors.primary} />
          <Text style={styles.mapsBtnText}>Open in Google Maps</Text>
        </Pressable>

        <Input
          label="Village *"
          value={form.village}
          onChangeText={(v) => patch('village', v)}
          leftIcon="trail-sign-outline"
        />
        <Input
          label="District *"
          value={form.district}
          onChangeText={(v) => patch('district', v)}
          leftIcon="map-outline"
        />
        <Input
          label="City *"
          value={form.city}
          onChangeText={(v) => patch('city', v)}
          leftIcon="location-outline"
        />

        <SearchSelect
          label="Business registration *"
          placeholder="Yes / No"
          value={form.businessRegistered}
          options={YES_NO_OPTIONS}
          searchable={false}
          leftIcon="document-text-outline"
          onChange={(businessRegistered) => {
            if (businessRegistered === 'no') {
              Alert.alert(
                'Registration required',
                'If you select No, this lodging application will be rejected.'
              );
            }
            patch('businessRegistered', businessRegistered);
          }}
        />
        {form.businessRegistered === 'yes' ? (
          <Input
            label="Business registration number *"
            value={form.businessRegistrationNumber}
            onChangeText={(v) => patch('businessRegistrationNumber', v)}
            leftIcon="barcode-outline"
          />
        ) : null}

        <Input
          label="Years of experience in hospitality *"
          value={form.yearsExperience}
          onChangeText={(v) => patch('yearsExperience', v.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          leftIcon="time-outline"
        />

        <Input
          label="Official website"
          placeholder="Optional"
          value={form.website}
          onChangeText={(v) => patch('website', v)}
          autoCapitalize="none"
          leftIcon="globe-outline"
        />

        <Text style={styles.groupLabel}>Official social media (optional)</Text>
        <Input
          label="Facebook"
          placeholder="Page or profile URL / handle"
          value={form.socialFacebook}
          onChangeText={(v) => patch('socialFacebook', v)}
          autoCapitalize="none"
          leftIcon="logo-facebook"
        />
        <Input
          label="Instagram"
          placeholder="@handle or URL"
          value={form.socialInstagram}
          onChangeText={(v) => patch('socialInstagram', v)}
          autoCapitalize="none"
          leftIcon="logo-instagram"
        />
        <Input
          label="TikTok"
          placeholder="@handle or URL"
          value={form.socialTiktok}
          onChangeText={(v) => patch('socialTiktok', v)}
          autoCapitalize="none"
          leftIcon="logo-tiktok"
        />

        <SearchSelect
          label="Restaurant availability"
          placeholder="Yes / No"
          value={form.restaurantAvailable}
          options={YES_NO_OPTIONS}
          searchable={false}
          leftIcon="restaurant-outline"
          onChange={(restaurantAvailable) => patch('restaurantAvailable', restaurantAvailable)}
        />

        <Text style={styles.groupLabel}>Images of the property *</Text>
        <Text style={styles.sub}>
          Outlook (exterior), rooms, and restaurant photos are required for a complete listing.
        </Text>
        <ImagePickerField
          disabled={saving || Boolean(uploadingKind) || removingImage}
          onRemovingChange={setRemovingImage}
          label="Outlook / exterior *"
          urls={outlookImages}
          uploading={uploadingKind === 'outlook'}
          max={6}
          onAdd={() => void onAddImages('outlook')}
          onRemove={(index) => setOutlookImages((prev) => prev.filter((_, i) => i !== index))}
        />
        <ImagePickerField
          disabled={saving || Boolean(uploadingKind) || removingImage}
          onRemovingChange={setRemovingImage}
          label="Rooms *"
          urls={roomImages}
          uploading={uploadingKind === 'rooms'}
          max={6}
          onAdd={() => void onAddImages('rooms')}
          onRemove={(index) => setRoomImages((prev) => prev.filter((_, i) => i !== index))}
        />
        <ImagePickerField
          disabled={saving || Boolean(uploadingKind) || removingImage}
          onRemovingChange={setRemovingImage}
          label={
            form.restaurantAvailable === 'yes'
              ? 'Restaurant *'
              : 'Restaurant (required if restaurant is Yes)'
          }
          urls={restaurantImages}
          uploading={uploadingKind === 'restaurant'}
          max={6}
          onAdd={() => void onAddImages('restaurant')}
          onRemove={(index) => setRestaurantImages((prev) => prev.filter((_, i) => i !== index))}
        />

        <Button
          title={isEditing ? 'Save changes' : 'Continue'}
          disabled={removingImage}
          loading={Boolean(uploadingKind) || saving}
          onPress={() => void onContinue()}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heading: { ...Typography.h2, color: Colors.primary },
  sub: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  hint: { ...Typography.caption, color: Colors.muted },
  groupLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.dark,
    marginTop: Spacing.xs,
  },
  mapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  mapsBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.primary },
});
