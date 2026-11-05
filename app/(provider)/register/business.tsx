import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { LocationPinField, formatPickedAddress, formatPickedPlace } from '@/components/location';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { TRIP_CITY_OPTIONS } from '@/constants/tripPlaces';
import { Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import { useProviderStore } from '@/store/providerStore';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  ownerName: z.string().trim().min(2, 'Enter your full name'),
  phone: z.string().refine((value) => /^\+?\d{10,15}$/.test(value.replace(/[\s()-]/g, '')), 'Enter a valid phone number (10–15 digits)'),
  email: z.string().email('Enter email'),
  description: z.string().min(10, 'Tell travellers a little about yourself'),
  city: z.string().min(2, 'Select a city'),
  address: z.string().min(5, 'Enter address or pin on the map'),
  yearsExperience: z.string().regex(/^\d+$/, 'Enter whole years, including 0').refine((value) => Number(value) <= 100, 'Enter 0 to 100 years'),
});

type FormValues = z.infer<typeof schema>;

function matchCityOption(placeName: string | undefined): string | undefined {
  const raw = String(placeName ?? '').trim().toLowerCase();
  if (!raw) return undefined;
  const exact = TRIP_CITY_OPTIONS.find((city) => city.toLowerCase() === raw);
  if (exact) return exact;
  return TRIP_CITY_OPTIONS.find(
    (city) => raw.includes(city.toLowerCase()) || city.toLowerCase().includes(raw)
  );
}

export default function ProviderBusinessScreen() {
  const insets = useSafeAreaInsets();
  const draft = useProviderStore((state) => state.draft);
  const setBusiness = useProviderStore((state) => state.setBusiness);
  const setLocationDraft = useProviderStore((state) => state.setLocationDraft);
  const saveProgress = useProviderStore((state) => state.saveProgress);
  const saving = useProviderStore((state) => state.saving);
  const user = useAuthStore((state) => state.user);
  const cached = useMemo(() => useProviderStore.getState().formDrafts.business as Partial<FormValues> | undefined, []);

  const cityOptions = useMemo(
    () => TRIP_CITY_OPTIONS.map((city) => ({ value: city, label: city })),
    []
  );

  const { control, handleSubmit, formState, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ownerName: draft.business.ownerName || draft.personal.name || user?.name || '',
      phone: draft.business.phone || draft.personal.phone || user?.phone || '',
      email: draft.business.email || draft.personal.email || user?.email || '',
      description: draft.business.description ?? '',
      city: draft.business.city ?? '',
      address: draft.business.address ?? '',
      yearsExperience: String(draft.business.yearsExperience ?? ''),
      ...cached,
    },
  });

  useEffect(() => {
    const subscription = watch((values) => useProviderStore.getState().setFormDraft('business', values));
    return () => subscription.unsubscribe();
  }, [watch]);

  const onSubmit = handleSubmit(async (values) => {
    // Transport is offered by individual local drivers: the driver is the listing.
    const name = values.ownerName.trim();
    setBusiness({
      ...values,
      ownerName: name,
      businessName: name,
      yearsExperience: Number(values.yearsExperience) || 0,
    });
    try {
      await saveProgress();
      useProviderStore.getState().clearFormDraft('business');
      router.push({ pathname: '/(provider)/location', params: { mode: 'onboarding' } } as never);
    } catch (error) {
      Alert.alert('Could not save', getApiErrorMessage(error));
    }
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title="Your details"
        showBack
        fallbackHref="/(provider)/register/services"
      />
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40, gap: Spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Tell us about yourself</Text>
        <Text style={styles.sub}>
          Rides on Banjara are offered by local drivers who drive their own vehicle. Travellers will see your name on your rides.
        </Text>
        <Controller
          control={control}
          name="ownerName"
          render={({ field: { onChange, value } }) => (
            <Input label="Full name (as on your CNIC)" value={value} onChangeText={onChange} error={formState.errors.ownerName?.message} />
          )}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <Input label="Phone" keyboardType="phone-pad" value={value} onChangeText={onChange} error={formState.errors.phone?.message} />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input label="Email" autoCapitalize="none" keyboardType="email-address" value={value} onChangeText={onChange} error={formState.errors.email?.message} />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <Input label="About you" placeholder="Routes you know, languages you speak, what travellers can expect" value={value} onChangeText={onChange} multiline error={formState.errors.description?.message} />
          )}
        />
        <Controller
          control={control}
          name="city"
          render={({ field: { onChange, value } }) => (
            <SearchSelect
              label="City"
              placeholder="Select city"
              value={value}
              options={cityOptions}
              leftIcon="location-outline"
              hint="The city you drive from"
              error={formState.errors.city?.message}
              onChange={onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, value } }) => (
            <LocationPinField
              label="Address"
              value={value}
              onChangeText={onChange}
              error={formState.errors.address?.message}
              result="address"
              mapTitle="Pin your location"
              mapButtonLabel="Open full map"
              hint="Type the street address, or tap Open full map"
              initialLatitude={draft.location?.latitude}
              initialLongitude={draft.location?.longitude}
              onPicked={(picked) => {
                setValue('address', formatPickedAddress(picked), {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                const matchedCity = matchCityOption(formatPickedPlace(picked));
                if (matchedCity) {
                  setValue('city', matchedCity, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
                setLocationDraft({
                  latitude: picked.latitude,
                  longitude: picked.longitude,
                  placeName: picked.placeName,
                  address: picked.address,
                });
              }}
            />
          )}
        />
        <Controller
          control={control}
          name="yearsExperience"
          render={({ field: { onChange, value } }) => (
            <Input label="Driving experience (years)" keyboardType="number-pad" value={value} onChangeText={onChange} error={formState.errors.yearsExperience?.message} />
          )}
        />
        <Button title="Continue" loading={saving} onPress={onSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heading: { ...Typography.h2, color: Colors.primary },
  sub: { ...Typography.body, color: Colors.muted, marginTop: -Spacing.sm },
});
