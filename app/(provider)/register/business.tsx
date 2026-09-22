import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect } from 'react';
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
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import { useProviderStore } from '@/store/providerStore';

const schema = z.object({
  businessName: z.string().min(2, 'Enter business name'),
  ownerName: z.string().min(2, 'Enter owner name'),
  phone: z.string().min(10, 'Enter phone'),
  email: z.string().email('Enter email'),
  description: z.string().min(10, 'Add a short description'),
  city: z.string().min(2, 'Enter city'),
  address: z.string().min(5, 'Enter address'),
  yearsExperience: z.string().min(1, 'Enter years'),
  website: z.string().optional(),
  socialMedia: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ProviderBusinessScreen() {
  const insets = useSafeAreaInsets();
  const draft = useProviderStore((state) => state.draft);
  const setBusiness = useProviderStore((state) => state.setBusiness);
  const setLocationDraft = useProviderStore((state) => state.setLocationDraft);
  const saveProgress = useProviderStore((state) => state.saveProgress);
  const saving = useProviderStore((state) => state.saving);
  const provider = useProviderStore((state) => state.provider);

  const { control, handleSubmit, formState, setValue, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: draft.business.businessName ?? '',
      ownerName: draft.business.ownerName ?? draft.personal.name,
      phone: draft.business.phone ?? draft.personal.phone,
      email: draft.business.email ?? draft.personal.email,
      description: draft.business.description ?? '',
      city: draft.business.city ?? '',
      address: draft.business.address ?? '',
      yearsExperience: String(draft.business.yearsExperience ?? ''),
      website: draft.business.website ?? '',
      socialMedia: draft.business.socialMedia ?? '',
    },
  });

  useEffect(() => {
    reset({
      businessName: draft.business.businessName ?? '',
      ownerName: draft.business.ownerName ?? draft.personal.name,
      phone: draft.business.phone ?? draft.personal.phone,
      email: draft.business.email ?? draft.personal.email,
      description: draft.business.description ?? '',
      city: draft.business.city ?? '',
      address: draft.business.address ?? '',
      yearsExperience: String(draft.business.yearsExperience ?? ''),
      website: draft.business.website ?? '',
      socialMedia: draft.business.socialMedia ?? '',
    });
  }, [provider?.id, draft.business.businessName, draft.business.city, draft.business.address, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setBusiness({
      ...values,
      yearsExperience: Number(values.yearsExperience) || 0,
    });
    try {
      await saveProgress();
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
        title="Business Info"
        showBack
        fallbackHref="/(provider)/register/services"
      />
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40, gap: Spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Tell us about your business</Text>
        <Controller
          control={control}
          name="businessName"
          render={({ field: { onChange, value } }) => (
            <Input label="Business / Agency Name" value={value} onChangeText={onChange} error={formState.errors.businessName?.message} />
          )}
        />
        <Controller
          control={control}
          name="ownerName"
          render={({ field: { onChange, value } }) => (
            <Input label="Owner / Manager Name" value={value} onChangeText={onChange} error={formState.errors.ownerName?.message} />
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
            <Input label="Business Description" value={value} onChangeText={onChange} multiline error={formState.errors.description?.message} />
          )}
        />
        <Controller
          control={control}
          name="city"
          render={({ field: { onChange, value } }) => (
            <LocationPinField
              label="City"
              value={value}
              onChangeText={onChange}
              error={formState.errors.city?.message}
              result="place"
              mapTitle="Pin your city"
              initialLatitude={draft.location?.latitude}
              initialLongitude={draft.location?.longitude}
              onPicked={(picked) => {
                setValue('city', formatPickedPlace(picked), {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setValue('address', formatPickedAddress(picked), {
                  shouldDirty: true,
                  shouldValidate: true,
                });
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
          name="address"
          render={({ field: { onChange, value } }) => (
            <LocationPinField
              label="Address"
              value={value}
              onChangeText={onChange}
              error={formState.errors.address?.message}
              result="address"
              mapTitle="Pin your business"
              initialLatitude={draft.location?.latitude}
              initialLongitude={draft.location?.longitude}
              onPicked={(picked) => {
                setValue('city', formatPickedPlace(picked), {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setValue('address', formatPickedAddress(picked), {
                  shouldDirty: true,
                  shouldValidate: true,
                });
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
            <Input label="Years of Experience" keyboardType="number-pad" value={value} onChangeText={onChange} error={formState.errors.yearsExperience?.message} />
          )}
        />
        <Controller
          control={control}
          name="website"
          render={({ field: { onChange, value } }) => (
            <Input label="Website (optional)" value={value} onChangeText={onChange} autoCapitalize="none" />
          )}
        />
        <Controller
          control={control}
          name="socialMedia"
          render={({ field: { onChange, value } }) => (
            <Input label="Social Media (optional)" value={value} onChangeText={onChange} />
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
});
