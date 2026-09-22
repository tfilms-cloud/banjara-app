import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationPinField } from '@/components/location';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { isHotelService, isTransportService } from '@/constants/providerOptions';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
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

export default function ProviderTourSetupScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const params = useLocalSearchParams<{ from?: string | string[] }>();
  const isEditing = paramId(params.from) === 'edit';
  const draft = useProviderStore((s) => s.draft);
  const provider = useProviderStore((s) => s.provider);
  const goPrevious = useWizardBack(() => {
    if (isEditing) {
      wizardBack(PROVIDER_SERVICE_TAB);
      return;
    }
    const services = draft.selectedServices;
    if (services.some((s) => isHotelService(s))) {
      wizardBack('/(provider)/register/hotel');
      return;
    }
    if (services.some((s) => isTransportService(s) || s === 'carRental')) {
      wizardBack('/(provider)/register/transport');
      return;
    }
    wizardBack(ONBOARDING_LOCATION as never);
  });
  const setTour = useProviderStore((s) => s.setTour);
  const saveProgress = useProviderStore((s) => s.saveProgress);
  const saving = useProviderStore((s) => s.saving);
  const isGuide =
    draft.selectedServices.includes('travelGuide') || provider?.services?.[0] === 'travelGuide';
  const tour = draft.tour ?? provider?.tour;

  const [form, setForm] = useState({
    companyName: tour?.companyName ?? draft.business.businessName ?? '',
    tourName: tour?.tourName ?? '',
    description: tour?.description ?? '',
    destination: tour?.destination ?? draft.business.city ?? '',
    duration: tour?.duration ?? '3 days',
    departureLocation: tour?.departureLocation ?? 'Islamabad',
    pickupLocations: tour?.pickupLocations?.join(', ') ?? 'Hotel pickup',
    price: String(tour?.price ?? '45000'),
    maxParticipants: String(tour?.maxParticipants ?? '12'),
    included: tour?.included?.join(', ') ?? 'Transport, Guide, Breakfast',
    excluded: tour?.excluded?.join(', ') ?? 'Flights, Personal expenses',
  });

  useEffect(() => {
    const next = draft.tour ?? provider?.tour;
    if (!next?.tourName && !next?.companyName && !next?.destination) return;
    setForm({
      companyName: next.companyName ?? '',
      tourName: next.tourName ?? '',
      description: next.description ?? '',
      destination: next.destination ?? '',
      duration: next.duration ?? '3 days',
      departureLocation: next.departureLocation ?? '',
      pickupLocations: next.pickupLocations?.join(', ') ?? '',
      price: String(next.price ?? ''),
      maxParticipants: String(next.maxParticipants ?? ''),
      included: next.included?.join(', ') ?? '',
      excluded: next.excluded?.join(', ') ?? '',
    });
  }, [provider?.id, draft.tour?.tourName, draft.tour?.companyName]);

  const onContinue = async () => {
    setTour({
      companyName: form.companyName,
      tourName: form.tourName,
      description: form.description,
      destination: form.destination,
      duration: form.duration,
      departureLocation: form.departureLocation,
      pickupLocations: form.pickupLocations.split(',').map((s) => s.trim()).filter(Boolean),
      price: Number(form.price) || 0,
      maxParticipants: Number(form.maxParticipants) || 1,
      included: form.included.split(',').map((s) => s.trim()).filter(Boolean),
      excluded: form.excluded.split(',').map((s) => s.trim()).filter(Boolean),
      images: draft.tour?.images?.length
        ? draft.tour.images
        : ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'],
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
        title={isGuide ? 'Travel Guide' : 'Tour Setup'}
        showBack
        fallbackHref={isEditing ? PROVIDER_SERVICE_TAB : (ONBOARDING_LOCATION as never)}
        onBack={goPrevious}
      />
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40, gap: Spacing.lg }}
      >
        <Text style={styles.heading}>{isGuide ? 'Travel guide details' : 'Tour provider details'}</Text>
        <Input
          label={isGuide ? 'Guide / company name' : 'Tour company name'}
          value={form.companyName}
          onChangeText={(v) => setForm({ ...form, companyName: v })}
        />
        <Input
          label={isGuide ? 'Offer name' : 'Tour name'}
          value={form.tourName}
          onChangeText={(v) => setForm({ ...form, tourName: v })}
        />
        <Input
          label="Description"
          value={form.description}
          onChangeText={(v) => setForm({ ...form, description: v })}
          multiline
        />
        <LocationPinField
          label="Destination"
          value={form.destination}
          onChangeText={(v) => setForm({ ...form, destination: v })}
          result="place"
          mapTitle="Pin the destination"
        />
        <Input label="Duration" value={form.duration} onChangeText={(v) => setForm({ ...form, duration: v })} />
        <LocationPinField
          label="Departure location"
          value={form.departureLocation}
          onChangeText={(v) => setForm({ ...form, departureLocation: v })}
          result="place"
          mapTitle="Pin departure"
        />
        <LocationPinField
          label="Pickup locations"
          value={form.pickupLocations}
          onChangeText={(v) => setForm({ ...form, pickupLocations: v })}
          result="place"
          append
          mapTitle="Pin a pickup location"
        />
        <Input
          label="Price (PKR)"
          keyboardType="number-pad"
          value={form.price}
          onChangeText={(v) => setForm({ ...form, price: v })}
        />
        <Input
          label={isGuide ? 'Group size' : 'Maximum participants'}
          keyboardType="number-pad"
          value={form.maxParticipants}
          onChangeText={(v) => setForm({ ...form, maxParticipants: v })}
        />
        <Input label="Included services" value={form.included} onChangeText={(v) => setForm({ ...form, included: v })} />
        <Input label="Excluded services" value={form.excluded} onChangeText={(v) => setForm({ ...form, excluded: v })} />
          <Button title={isEditing ? 'Save changes' : 'Continue'} loading={saving} onPress={() => void onContinue()} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heading: { ...Typography.h2, color: Colors.dark },
});
