import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
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
import { LocationPinField } from '@/components/location/LocationPinField';
import { Input } from '@/components/ui/Input';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { Colors } from '@/constants/colors';
import { isGuideService } from '@/constants/providerOptions';
import { Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as tourItineraryService from '@/services/tourItineraryService';
import * as uploadService from '@/services/uploadService';
import { useProviderStore } from '@/store/providerStore';
import type { TourDay, TourDifficulty, TourType } from '@/types/tourItinerary';
import { paramId } from '@/utils/navigation';

const TOUR_TYPE_OPTIONS = [
  { value: 'trek', label: 'Trek' },
  { value: 'expedition', label: 'Expedition' },
  { value: 'summit', label: 'Summit' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'hard', label: 'Hard' },
];

function splitList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AddItineraryScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const itineraryId = paramId(params.id);
  const isEditing = Boolean(itineraryId);
  const provider = useProviderStore((s) => s.provider);
  const isGuide = provider?.services?.some((s) => isGuideService(s));

  useEffect(() => {
    if (isGuide) {
      Alert.alert(
        'Guides cannot create packages',
        'As a travel guide you are hireable only. Update your experience profile instead.'
      );
      router.replace('/(provider)/register/tours?from=edit');
    }
  }, [isGuide]);

  const [removingImage, setRemovingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEditing);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [coverImage, setCoverImage] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [submitForReview, setSubmitForReview] = useState(true);
  const [days, setDays] = useState<TourDay[]>([
    { dayNumber: 1, title: '', description: '' },
  ]);
  const [form, setForm] = useState({
    title: '',
    tourType: 'trek' as TourType,
    summary: '',
    description: '',
    destination: '',
    region: '',
    durationDays: '3',
    durationNights: '2',
    difficulty: 'moderate' as TourDifficulty | '',
    maxParticipants: '12',
    pricePerPerson: '',
    included: 'Guide, Meals, Transport',
    excluded: 'Flights, Personal gear',
    departureLocation: '',
    bestSeason: '',
  });

  useEffect(() => {
    if (!isEditing || !itineraryId) return;
    let alive = true;
    setLoadingExisting(true);
    void tourItineraryService
      .getMine(itineraryId)
      .then((item) => {
        if (!alive) return;
        setForm({
          title: item.title,
          tourType: item.tourType,
          summary: item.summary,
          description: item.description,
          destination: item.destination,
          region: item.region ?? '',
          durationDays: String(item.durationDays),
          durationNights: item.durationNights != null ? String(item.durationNights) : '',
          difficulty: item.difficulty ?? '',
          maxParticipants: String(item.maxParticipants),
          pricePerPerson: String(item.pricePerPerson),
          included: item.included.join(', '),
          excluded: item.excluded.join(', '),
          departureLocation: item.departureLocation ?? '',
          bestSeason: item.bestSeason ?? '',
        });
        setCoverImage(item.coverImage);
        setImageUrls(item.images);
        setDays(
          item.days.length
            ? item.days
            : [{ dayNumber: 1, title: '', description: '' }]
        );
        setSubmitForReview(item.status === 'pending' || item.status === 'draft');
      })
      .catch((error) => {
        Alert.alert('Could not load', getApiErrorMessage(error));
      })
      .finally(() => {
        if (alive) setLoadingExisting(false);
      });
    return () => {
      alive = false;
    };
  }, [isEditing, itineraryId]);

  const onAddImages = async () => {
    try {
      setUploadingImages(true);
      const remaining = Math.max(0, 8 - imageUrls.length);
      const picked = await uploadService.pickImages(remaining || 1);
      if (!picked.length) return;
      const uploaded = await uploadService.uploadImages(picked, 'tours');
      const urls = uploaded.map((item) => item.url);
      setImageUrls((prev) => {
        const next = [...prev, ...urls].slice(0, 8);
        if (!coverImage && next[0]) setCoverImage(next[0]);
        return next;
      });
      if (!coverImage && urls[0]) setCoverImage(urls[0]);
    } catch (error) {
      Alert.alert('Upload failed', getApiErrorMessage(error));
    } finally {
      setUploadingImages(false);
    }
  };

  const updateDay = (index: number, patch: Partial<TourDay>) => {
    setDays((prev) => prev.map((day, i) => (i === index ? { ...day, ...patch } : day)));
  };

  const onSave = async () => {
    if (removingImage || loading || uploadingImages) return;
    if (!form.title.trim() || form.title.trim().length < 2) {
      Alert.alert('Title required', 'Enter a package title.');
      return;
    }
    if (form.summary.trim().length < 10) {
      Alert.alert('Summary too short', 'Write at least 10 characters.');
      return;
    }
    if (form.description.trim().length < 20) {
      Alert.alert('Description too short', 'Write at least 20 characters.');
      return;
    }
    if (!form.destination.trim()) {
      Alert.alert('Destination required', 'Enter where the tour goes.');
      return;
    }
    if (!coverImage) {
      Alert.alert('Cover photo required', 'Add at least one photo.');
      return;
    }
    if (!form.pricePerPerson) {
      Alert.alert('Price required', 'Enter price per person.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      tourType: form.tourType,
      summary: form.summary.trim(),
      description: form.description.trim(),
      destination: form.destination.trim(),
      region: form.region.trim() || undefined,
      durationDays: Number(form.durationDays) || 1,
      durationNights: form.durationNights ? Number(form.durationNights) : undefined,
      difficulty: (form.difficulty || undefined) as TourDifficulty | undefined,
      maxParticipants: Number(form.maxParticipants) || 1,
      pricePerPerson: Number(form.pricePerPerson) || 0,
      included: splitList(form.included),
      excluded: splitList(form.excluded),
      days: days
        .filter((d) => d.title.trim())
        .map((d, i) => ({
          dayNumber: i + 1,
          title: d.title.trim(),
          description: d.description.trim(),
        })),
      coverImage,
      images: imageUrls.length ? imageUrls : [coverImage],
      departureLocation: form.departureLocation.trim() || undefined,
      bestSeason: form.bestSeason.trim() || undefined,
      submitForReview,
    };

    setLoading(true);
    try {
      if (isEditing && itineraryId) {
        await tourItineraryService.updateItinerary(itineraryId, payload);
      } else {
        await tourItineraryService.createItinerary(payload);
      }
      Alert.alert(
        'Saved',
        submitForReview
          ? 'Submitted for admin review. Travelers see it after approval.'
          : 'Saved as draft.'
      );
      router.back();
    } catch (error) {
      Alert.alert('Could not save', getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={isEditing ? 'Edit itinerary' : 'Add itinerary'}
        showBack
        fallbackHref="/(provider)/itineraries"
      />
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 40,
          gap: Spacing.md,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {loadingExisting ? (
          <Text style={styles.hint}>Loading…</Text>
        ) : (
          <>
            <Input
              label="Title"
              value={form.title}
              onChangeText={(title) => setForm((f) => ({ ...f, title }))}
              placeholder="Fairy Meadows Base Camp Trek"
            />
            <SearchSelect
              label="Tour type"
              value={form.tourType}
              options={TOUR_TYPE_OPTIONS}
              onChange={(tourType) =>
                setForm((f) => ({ ...f, tourType: tourType as TourType }))
              }
            />
            <Input
              label="Summary"
              value={form.summary}
              onChangeText={(summary) => setForm((f) => ({ ...f, summary }))}
              placeholder="Short pitch for the catalog card"
              multiline
            />
            <Input
              label="Full description"
              value={form.description}
              onChangeText={(description) => setForm((f) => ({ ...f, description }))}
              placeholder="What travelers will experience…"
              multiline
            />
            <LocationPinField
              label="Destination"
              value={form.destination}
              onChangeText={(destination) => setForm((f) => ({ ...f, destination }))}
              placeholder="Nanga Parbat / Hunza / …"
              result="place"
            />
            <Input
              label="Region (optional)"
              value={form.region}
              onChangeText={(region) => setForm((f) => ({ ...f, region }))}
              placeholder="Gilgit-Baltistan"
            />
            <View style={styles.row}>
              <View style={styles.half}>
                <Input
                  label="Days"
                  value={form.durationDays}
                  onChangeText={(durationDays) =>
                    setForm((f) => ({ ...f, durationDays: durationDays.replace(/[^0-9]/g, '') }))
                  }
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.half}>
                <Input
                  label="Nights"
                  value={form.durationNights}
                  onChangeText={(durationNights) =>
                    setForm((f) => ({
                      ...f,
                      durationNights: durationNights.replace(/[^0-9]/g, ''),
                    }))
                  }
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <SearchSelect
              label="Difficulty"
              value={form.difficulty}
              options={DIFFICULTY_OPTIONS}
              onChange={(difficulty) =>
                setForm((f) => ({ ...f, difficulty: difficulty as TourDifficulty }))
              }
            />
            <View style={styles.row}>
              <View style={styles.half}>
                <Input
                  label="Max participants"
                  value={form.maxParticipants}
                  onChangeText={(maxParticipants) =>
                    setForm((f) => ({
                      ...f,
                      maxParticipants: maxParticipants.replace(/[^0-9]/g, ''),
                    }))
                  }
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.half}>
                <Input
                  label="Price / person (PKR)"
                  value={form.pricePerPerson}
                  onChangeText={(pricePerPerson) =>
                    setForm((f) => ({
                      ...f,
                      pricePerPerson: pricePerPerson.replace(/[^0-9]/g, ''),
                    }))
                  }
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <Input
              label="Included (comma separated)"
              value={form.included}
              onChangeText={(included) => setForm((f) => ({ ...f, included }))}
            />
            <Input
              label="Excluded (comma separated)"
              value={form.excluded}
              onChangeText={(excluded) => setForm((f) => ({ ...f, excluded }))}
            />
            <LocationPinField
              label="Departure location"
              value={form.departureLocation}
              onChangeText={(departureLocation) => setForm((f) => ({ ...f, departureLocation }))}
              placeholder="Islamabad / Skardu"
            />
            <Input
              label="Best season"
              value={form.bestSeason}
              onChangeText={(bestSeason) => setForm((f) => ({ ...f, bestSeason }))}
              placeholder="May – September"
            />

            <Text style={styles.section}>Day-by-day itinerary</Text>
            {days.map((day, index) => (
              <View key={`day-${index}`} style={styles.dayCard}>
                <Text style={styles.dayLabel}>Day {index + 1}</Text>
                <Input
                  label="Title"
                  value={day.title}
                  onChangeText={(title) => updateDay(index, { title })}
                  placeholder="Arrive Skardu"
                />
                <Input
                  label="Description"
                  value={day.description}
                  onChangeText={(description) => updateDay(index, { description })}
                  placeholder="Transfer, briefing, overnight…"
                  multiline
                />
              </View>
            ))}
            <Pressable
              onPress={() =>
                setDays((prev) => [
                  ...prev,
                  { dayNumber: prev.length + 1, title: '', description: '' },
                ])
              }
            >
              <Text style={styles.addDay}>+ Add day</Text>
            </Pressable>

            <ImagePickerField

              disabled={loading || uploadingImages || removingImage}

              onRemovingChange={setRemovingImage}
              label="Photos"
              urls={imageUrls.length ? imageUrls : coverImage ? [coverImage] : []}
              max={8}
              onAdd={() => void onAddImages()}
              onRemove={(index) => {
                const list = imageUrls.length ? imageUrls : coverImage ? [coverImage] : [];
                const next = list.filter((_, i) => i !== index);
                setImageUrls(next);
                setCoverImage(next[0] ?? '');
              }}
              uploading={uploadingImages}
            />

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Submit for review</Text>
                <Text style={styles.hint}>Admin must approve before travelers see it</Text>
              </View>
              <Switch
                value={submitForReview}
                onValueChange={setSubmitForReview}
                trackColor={{ true: Colors.primary }}
              />
            </View>

            <Button
              title={isEditing ? 'Save changes' : 'Create itinerary'}
              onPress={() => void onSave()}
              disabled={removingImage}
              loading={loading}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  row: { flexDirection: 'row', gap: Spacing.md },
  half: { flex: 1 },
  section: {
    fontFamily: Fonts.display,
    fontSize: 16,
    color: Colors.dark,
    marginTop: Spacing.sm,
  },
  dayCard: {
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  dayLabel: { fontFamily: Fonts.bodySemiBold, color: Colors.primary },
  addDay: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.primary,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  switchTitle: { fontFamily: Fonts.bodySemiBold, color: Colors.dark },
  hint: { ...Typography.caption, color: Colors.muted },
});
