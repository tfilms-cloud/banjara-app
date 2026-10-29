import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { LocationPinField } from '@/components/location/LocationPinField';
import { Colors } from '@/constants/colors';
import { isGuideService, isHotelService, isTourOperatorService, isTransportService } from '@/constants/providerOptions';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
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

type GuideGender = 'male' | 'female';

function splitList(value: string) {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

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
    if (services.some((s) => isTransportService(s))) {
      wizardBack('/(provider)/register/transport');
      return;
    }
    wizardBack(ONBOARDING_LOCATION as never);
  });
  const setTour = useProviderStore((s) => s.setTour);
  const saveProgress = useProviderStore((s) => s.saveProgress);
  const saving = useProviderStore((s) => s.saving);
  const isGuide =
    draft.selectedServices.some((s) => isGuideService(s)) ||
    Boolean(provider?.services?.some((s) => isGuideService(s)));
  const isTourOp =
    draft.selectedServices.some((s) => isTourOperatorService(s)) ||
    Boolean(provider?.services?.some((s) => isTourOperatorService(s)));
  const tour = draft.tour ?? provider?.tour;

  const [guideForm, setGuideForm] = useState({
    guideName: tour?.companyName ?? draft.business.businessName ?? draft.business.ownerName ?? '',
    gender: (tour?.gender ?? 'male') as GuideGender,
    regionalLanguages: tour?.regionalLanguages?.join(', ') ?? '',
    internationalLanguages: tour?.internationalLanguages?.join(', ') ?? '',
    yearsExperience: String(tour?.yearsExperience ?? draft.business.yearsExperience ?? ''),
    experienceHistory: tour?.experienceHistory ?? tour?.description ?? '',
    specialties: tour?.specialties?.join(', ') ?? '',
    operatingAreas: tour?.operatingAreas?.join(', ') ?? tour?.destination ?? draft.business.city ?? '',
    certifications: tour?.certifications?.join(', ') ?? '',
    dailyHireRate: String(tour?.dailyHireRate ?? tour?.price ?? ''),
  });

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
    if (!next) return;
    if (isGuide) {
      setGuideForm({
        guideName: next.companyName || next.tourName || '',
        gender: (next.gender ?? 'male') as GuideGender,
        regionalLanguages: next.regionalLanguages?.join(', ') ?? '',
        internationalLanguages: next.internationalLanguages?.join(', ') ?? '',
        yearsExperience: String(next.yearsExperience ?? ''),
        experienceHistory: next.experienceHistory ?? next.description ?? '',
        specialties: next.specialties?.join(', ') ?? '',
        operatingAreas: next.operatingAreas?.join(', ') ?? next.destination ?? '',
        certifications: next.certifications?.join(', ') ?? '',
        dailyHireRate: String(next.dailyHireRate ?? next.price ?? ''),
      });
      return;
    }
    if (!next.tourName && !next.companyName && !next.destination) return;
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
  }, [provider?.id, draft.tour?.companyName, draft.tour?.tourName, draft.tour?.gender, isGuide]);

  const onContinueGuide = async () => {
    if (!guideForm.guideName.trim()) {
      Alert.alert('Required', 'Enter your guide name.');
      return;
    }
    if (!guideForm.gender) {
      Alert.alert('Required', 'Select Male or Female.');
      return;
    }
    if (!guideForm.experienceHistory.trim()) {
      Alert.alert('Required', 'Add your experience history so travelers know your background.');
      return;
    }
    const years = Number(guideForm.yearsExperience);
    const rate = Number(guideForm.dailyHireRate);
    setTour({
      companyName: guideForm.guideName.trim(),
      tourName: '',
      description: guideForm.experienceHistory.trim(),
      destination: splitList(guideForm.operatingAreas)[0] ?? '',
      duration: '',
      departureLocation: '',
      pickupLocations: [],
      price: Number.isFinite(rate) ? rate : 0,
      maxParticipants: 0,
      included: [],
      excluded: [],
      images: draft.tour?.images?.length
        ? draft.tour.images
        : ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'],
      gender: guideForm.gender,
      regionalLanguages: splitList(guideForm.regionalLanguages),
      internationalLanguages: splitList(guideForm.internationalLanguages),
      yearsExperience: Number.isFinite(years) ? years : 0,
      experienceHistory: guideForm.experienceHistory.trim(),
      specialties: splitList(guideForm.specialties),
      operatingAreas: splitList(guideForm.operatingAreas),
      certifications: splitList(guideForm.certifications),
      dailyHireRate: Number.isFinite(rate) ? rate : 0,
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

  const onContinueTour = async () => {
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

  if (isGuide) {
    return <Redirect href="/(provider)/register/guide" />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Tour Setup"
        showBack
        fallbackHref={isEditing ? PROVIDER_SERVICE_TAB : (ONBOARDING_LOCATION as never)}
        onBack={goPrevious}
      />
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40, gap: Spacing.lg }}
      >
        <Text style={styles.heading}>Tour provider details</Text>
        {!isTourOp ? (
          <Text style={styles.sub}>Complete your tour operator package details.</Text>
        ) : null}
        <Input
          label="Tour company name"
          value={form.companyName}
          onChangeText={(v) => setForm({ ...form, companyName: v })}
        />
        <Input
          label="Tour name"
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
        />
        <Input label="Duration" value={form.duration} onChangeText={(v) => setForm({ ...form, duration: v })} />
        <LocationPinField
          label="Departure location"
          value={form.departureLocation}
          onChangeText={(v) => setForm({ ...form, departureLocation: v })}
        />
        <LocationPinField
          label="Pickup locations"
          value={form.pickupLocations}
          onChangeText={(v) => setForm({ ...form, pickupLocations: v })}
          result="place"
          append
        />
        <Input
          label="Price (PKR)"
          keyboardType="number-pad"
          value={form.price}
          onChangeText={(v) => setForm({ ...form, price: v })}
        />
        <Input
          label="Maximum participants"
          keyboardType="number-pad"
          value={form.maxParticipants}
          onChangeText={(v) => setForm({ ...form, maxParticipants: v })}
        />
        <Input label="Included services" value={form.included} onChangeText={(v) => setForm({ ...form, included: v })} />
        <Input label="Excluded services" value={form.excluded} onChangeText={(v) => setForm({ ...form, excluded: v })} />
        <Button title={isEditing ? 'Save changes' : 'Continue'} loading={saving} onPress={() => void onContinueTour()} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heading: { ...Typography.h2, color: Colors.dark },
  sub: { ...Typography.body, color: Colors.muted, lineHeight: 20 },
  genderBlock: { gap: Spacing.sm },
  fieldLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.dark },
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
  },
  genderChip: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  genderChipActive: { backgroundColor: Colors.primary },
  genderText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.muted },
  genderTextActive: { fontFamily: Fonts.bodySemiBold, color: Colors.white },
});
