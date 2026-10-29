import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { ImagePickerField } from '@/components/ui/ImagePickerField';
import { LocationPinField } from '@/components/location/LocationPinField';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as uploadService from '@/services/uploadService';
import { useAuthStore } from '@/store/authStore';
import { useProviderStore } from '@/store/providerStore';
import type { ProviderRestaurantOffer } from '@/types/provider';
import {
  ONBOARDING_LOCATION,
  PROVIDER_SERVICE_TAB,
  leaveProviderEditor,
  paramId,
  useWizardBack,
  wizardBack,
} from '@/utils/navigation';

function splitList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOffers(raw: string): ProviderRestaurantOffer[] {
  return splitList(raw).map((title, index) => {
    const discountMatch = title.match(/(\d+)\s*%/);
    const lower = title.toLowerCase();
    const type: ProviderRestaurantOffer['type'] = lower.includes('sale')
      ? 'sale'
      : discountMatch
        ? 'discount'
        : 'offer';
    return {
      id: `offer-${index + 1}`,
      title,
      type,
      discountPercent: discountMatch ? Number(discountMatch[1]) : undefined,
      active: true,
    };
  });
}

export default function ProviderRestaurantSetupScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const params = useLocalSearchParams<{ from?: string | string[] }>();
  const isEditing = paramId(params.from) === 'edit';
  const draft = useProviderStore((s) => s.draft);
  const provider = useProviderStore((s) => s.provider);
  const setRestaurant = useProviderStore((s) => s.setRestaurant);
  const saveProgress = useProviderStore((s) => s.saveProgress);
  const saving = useProviderStore((s) => s.saving);

  const goPrevious = useWizardBack(() => {
    if (isEditing) {
      wizardBack(PROVIDER_SERVICE_TAB);
      return;
    }
    wizardBack(ONBOARDING_LOCATION as never);
  });

  const seed = draft.restaurant ?? provider?.restaurant;

  const [form, setForm] = useState({
    restaurantName: seed?.restaurantName ?? draft.business.businessName ?? '',
    cuisineTypes: seed?.cuisineTypes?.join(', ') ?? 'Pakistani, BBQ',
    menuVariety: seed?.menuVariety?.join(', ') ?? 'Grill, Traditional, Family',
    city: seed?.city ?? draft.business.city ?? '',
    address: seed?.address ?? draft.business.address ?? '',
    phone: seed?.phone ?? draft.business.phone ?? draft.personal.phone ?? '',
    description: seed?.description ?? draft.business.description ?? '',
    hours: seed?.hours ?? '11:00 AM – 11:00 PM',
    website: seed?.website ?? '',
    offers:
      seed?.offers?.map((o) => o.title).join(', ') ??
      '20% off lunch, Weekend family deal, Free dessert sale',
  });
  const [removingImage, setRemovingImage] = useState(false);
  const [images, setImages] = useState<string[]>(seed?.images ?? []);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const next = draft.restaurant ?? provider?.restaurant;
    if (!next?.restaurantName && !next?.city) return;
    setForm({
      restaurantName: next.restaurantName ?? '',
      cuisineTypes: next.cuisineTypes?.join(', ') ?? '',
      menuVariety: next.menuVariety?.join(', ') ?? '',
      city: next.city ?? '',
      address: next.address ?? '',
      phone: next.phone ?? '',
      description: next.description ?? '',
      hours: next.hours ?? '',
      website: next.website ?? '',
      offers: next.offers?.map((o) => o.title).join(', ') ?? '',
    });
    if (next.images?.length) setImages(next.images);
  }, [draft.restaurant, provider?.restaurant]);

  const patch = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onAddPhotos = async () => {
    try {
      setUploading(true);
      const remaining = Math.max(0, 8 - images.length);
      const picked = await uploadService.pickImages(remaining || 1);
      if (!picked.length) return;
      const uploaded = await uploadService.uploadImages(picked, 'restaurants');
      setImages((prev) => [...prev, ...uploaded.map((item) => item.url)].slice(0, 8));
    } catch (error) {
      Alert.alert('Upload failed', getApiErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const onContinue = async () => {
    if (removingImage || saving || uploading) return;
    if (!form.restaurantName.trim() || form.restaurantName.trim().length < 2) {
      Alert.alert('Required', 'Enter your restaurant name.');
      return;
    }
    if (!form.city.trim()) {
      Alert.alert('Required', 'Enter the city or destination where you operate.');
      return;
    }
    if (!form.phone.trim() || form.phone.trim().length < 10) {
      Alert.alert('Required', 'Enter a valid phone number.');
      return;
    }
    if (!images.length) {
      Alert.alert('Photos needed', 'Add at least one photo from your gallery for the listing.');
      return;
    }

    const offers = parseOffers(form.offers);

    setRestaurant({
      restaurantName: form.restaurantName.trim(),
      cuisineTypes: splitList(form.cuisineTypes),
      menuVariety: splitList(form.menuVariety),
      city: form.city.trim(),
      address: form.address.trim() || form.city.trim(),
      phone: form.phone.trim(),
      description: form.description.trim(),
      hours: form.hours.trim() || undefined,
      website: form.website.trim() || undefined,
      offers,
      images,
      latitude: draft.location?.latitude,
      longitude: draft.location?.longitude,
    });

    try {
      await saveProgress();
      if (isEditing) {
        leaveProviderEditor(user);
        return;
      }
      router.push('/(provider)/register/verification');
    } catch (error) {
      Alert.alert('Could not save', getApiErrorMessage(error));
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Restaurant details"
        showBack
        fallbackHref={isEditing ? PROVIDER_SERVICE_TAB : ONBOARDING_LOCATION}
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
        <Text style={styles.heading}>List your restaurant on BANJARA</Text>
        <Text style={styles.sub}>
          Travelers search by destination. Keep sales, offers, and discounts up to date from this
          profile — they appear first near their search.
        </Text>

        <Input
          label="Restaurant name"
          value={form.restaurantName}
          onChangeText={(v) => patch('restaurantName', v)}
          leftIcon="restaurant-outline"
        />
        <LocationPinField
          label="City / destination"
          value={form.city}
          onChangeText={(v) => patch('city', v)}
          result="city"
        />
        <LocationPinField
          label="Address"
          value={form.address}
          onChangeText={(v) => patch('address', v)}
        />
        <Input
          label="Phone"
          value={form.phone}
          onChangeText={(v) => patch('phone', v)}
          keyboardType="phone-pad"
          leftIcon="call-outline"
        />
        <Input
          label="Cuisine types"
          value={form.cuisineTypes}
          onChangeText={(v) => patch('cuisineTypes', v)}
          placeholder="Pakistani, Chinese, BBQ"
          hint="Comma-separated"
        />
        <Input
          label="Menu variety"
          value={form.menuVariety}
          onChangeText={(v) => patch('menuVariety', v)}
          placeholder="Grill, Family platters, Vegetarian"
          hint="Used for Most visited ranking"
        />
        <Input
          label="Sales, offers & discounts"
          value={form.offers}
          onChangeText={(v) => patch('offers', v)}
          placeholder="20% off lunch, Free dessert sale"
          hint="Update anytime — shown nearest to traveler searches"
          multiline
        />
        <Input
          label="Hours"
          value={form.hours}
          onChangeText={(v) => patch('hours', v)}
        />
        <Input
          label="Short description"
          value={form.description}
          onChangeText={(v) => patch('description', v)}
          multiline
        />

        <ImagePickerField

          disabled={saving || uploading || removingImage}

          onRemovingChange={setRemovingImage}
          label="Restaurant photos *"
          urls={images}
          uploading={uploading}
          max={8}
          onAdd={() => void onAddPhotos()}
          onRemove={(index) => setImages((prev) => prev.filter((_, i) => i !== index))}
        />

        <Input
          label="Website (optional)"
          value={form.website}
          onChangeText={(v) => patch('website', v)}
          autoCapitalize="none"
        />

        <Button
          title={isEditing ? 'Save restaurant' : 'Continue'}
          disabled={removingImage}
          loading={saving || uploading}
          onPress={() => void onContinue()}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heading: { ...Typography.h2, color: Colors.dark },
  sub: { ...Typography.caption, color: Colors.muted, lineHeight: 18, marginTop: -8 },
});
