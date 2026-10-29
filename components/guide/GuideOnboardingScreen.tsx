import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  GUIDE_DOCUMENT_TYPE_OPTIONS,
  GUIDE_ONBOARDING_STEPS,
  GUIDE_PHOTO_CATEGORY_OPTIONS,
  GUIDE_PRICING_TYPE_OPTIONS,
  GUIDE_TYPE_OPTIONS,
  GUIDE_AREA_SUGGESTIONS,
  LANGUAGE_PROFICIENCY_OPTIONS,
  WEEKDAY_LABELS,
} from '@/constants/guideOptions';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as guideService from '@/services/guideService';
import * as uploadService from '@/services/uploadService';
import { useAuthStore } from '@/store/authStore';
import { useProviderStore } from '@/store/providerStore';
import type {
  GuideDetails,
  GuideDocument,
  GuideLanguage,
  GuideOfferedService,
  GuidePhoto,
  GuideType,
  LanguageProficiency,
  Weekday,
} from '@/types/guide';
import { emptyGuideDetails, newGuideId, splitCommaList } from '@/utils/guideDraft';
import {
  ONBOARDING_LOCATION,
  PROVIDER_SERVICE_TAB,
  leaveProviderEditor,
  paramId,
  useWizardBack,
  wizardBack,
} from '@/utils/navigation';
import { formatCurrency } from '@/utils/formatCurrency';

const TOTAL_STEPS = GUIDE_ONBOARDING_STEPS.length;

function ProgressBar({ step }: { step: number }) {
  return (
    <View style={styles.progressWrap}>
      <Text style={styles.progressText}>
        Step {step} of {TOTAL_STEPS} · {GUIDE_ONBOARDING_STEPS[step - 1]}
      </Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
      </View>
    </View>
  );
}

function ChipSelect({
  options,
  selected,
  onToggle,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <View style={styles.chipGrid}>
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <Pressable
            key={opt.value}
            onPress={() => onToggle(opt.value)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function GuideOnboardingScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const params = useLocalSearchParams<{ from?: string | string[]; step?: string | string[] }>();
  const isEditing = paramId(params.from) === 'edit';
  const initialStep = Math.min(
    TOTAL_STEPS,
    Math.max(1, Number(paramId(params.step) || '1') || 1)
  );

  const draft = useProviderStore((s) => s.draft);
  const provider = useProviderStore((s) => s.provider);
  const setGuide = useProviderStore((s) => s.setGuide);
  const saveProgress = useProviderStore((s) => s.saveProgress);
  const setProvider = useProviderStore((s) => s.setProvider);

  const [removingImage, setRemovingImage] = useState(false);
  const [step, setStep] = useState(initialStep);
  const [details, setDetails] = useState<GuideDetails>(() =>
    emptyGuideDetails({
      fullName: draft.business.ownerName ?? draft.business.businessName ?? draft.personal.name,
      phone: draft.business.phone ?? draft.personal.phone,
      email: draft.business.email ?? draft.personal.email,
      city: draft.location?.address.city ?? draft.business.city,
      country: draft.location?.address.country ?? 'Pakistan',
    })
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [areasExtra, setAreasExtra] = useState('');
  const [pickupText, setPickupText] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [expertiseText, setExpertiseText] = useState('');
  const [certsText, setCertsText] = useState('');
  const [trainingText, setTrainingText] = useState('');
  const [awardsText, setAwardsText] = useState('');
  const [serviceForm, setServiceForm] = useState<Partial<GuideOfferedService> | null>(null);
  const [blockedDateInput, setBlockedDateInput] = useState('');
  const [photoCategory, setPhotoCategory] = useState<GuidePhoto['category']>('destinations');

  const goPrevious = useWizardBack(() => {
    if (step > 1) {
      setStep((s) => s - 1);
      return;
    }
    if (isEditing) {
      wizardBack(PROVIDER_SERVICE_TAB);
      return;
    }
    wizardBack(ONBOARDING_LOCATION as never);
  });

  const hydrateFromGuide = useCallback((guide: GuideDetails) => {
    setDetails((prev) => ({ ...prev, ...guide }));
    setAreasExtra((guide.areasCovered ?? []).filter((a) => !GUIDE_AREA_SUGGESTIONS.includes(a as never)).join(', '));
    setPickupText((guide.pickupLocations ?? []).join(', '));
    setSkillsText((guide.specialSkills ?? []).join(', '));
    setExpertiseText((guide.areasOfExpertise ?? []).join(', '));
    setCertsText((guide.certifications ?? []).join(', '));
    setTrainingText((guide.training ?? []).join(', '));
    setAwardsText((guide.awards ?? []).join(', '));
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      // Guide profile APIs need an existing provider. During onboarding that is
      // created on the location step — send the user there if it is missing.
      const hasProvider = Boolean(user?.providerId || provider?.id);
      if (!isEditing && !hasProvider) {
        router.replace(ONBOARDING_LOCATION as never);
        return;
      }

      try {
        const mine = await guideService.getMyProfile();
        if (!live) return;
        if (mine.guideDetails) hydrateFromGuide(mine.guideDetails);
        else if (provider?.guideDetails) hydrateFromGuide(provider.guideDetails);
        else if (draft.guide) hydrateFromGuide(draft.guide as GuideDetails);
      } catch {
        if (provider?.guideDetails) hydrateFromGuide(provider.guideDetails);
        else if (draft.guide) hydrateFromGuide(draft.guide as GuideDetails);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [draft.guide, hydrateFromGuide, isEditing, provider?.guideDetails, provider?.id, user?.providerId]);

  const patchForStep = useMemo((): Partial<GuideDetails> => {
    const areasFromChips = details.areasCovered ?? [];
    const extraAreas = splitCommaList(areasExtra);
    return {
      ...details,
      pickupLocations: splitCommaList(pickupText),
      areasCovered: Array.from(new Set([...areasFromChips, ...extraAreas])),
      specialSkills: splitCommaList(skillsText),
      areasOfExpertise: splitCommaList(expertiseText),
      certifications: splitCommaList(certsText),
      training: splitCommaList(trainingText),
      awards: splitCommaList(awardsText),
    };
  }, [areasExtra, awardsText, certsText, details, expertiseText, pickupText, skillsText, trainingText]);

  const persistDraft = async (patch: Partial<GuideDetails>, submit = false) => {
    // An empty document picker is a local draft, not a saved document attachment.
    const savedPatch = { ...patch, documents: patch.documents?.filter(document => Boolean(document.fileUrl)) };
    setGuide(savedPatch);
    setSaving(true);
    try {
      const res = await guideService.updateProfile(savedPatch, { submit });
      hydrateFromGuide(res.guideDetails);
      setGuide(res.guideDetails);
      await saveProgress();
      const refreshed = await guideService.refreshProviderAfterGuide();
      if (refreshed) setProvider(refreshed);
      return res;
    } finally {
      setSaving(false);
    }
  };

  const uploadGuideImages = async (count = 1) => {
    setUploading(true);
    try {
      const picked = await uploadService.pickImages(count);
      if (!picked.length) return [] as string[];
      const uploaded = await uploadService.uploadImages(picked, 'guides');
      return uploaded.map((item) => item.url);
    } finally {
      setUploading(false);
    }
  };

  const validateStep = (): boolean => {
    const d = patchForStep;
    switch (step) {
      case 1:
        if (!d.fullName?.trim()) {
          Alert.alert('Required', 'Enter your full name.');
          return false;
        }
        if (!d.phone?.trim()) {
          Alert.alert('Required', 'Enter a phone number.');
          return false;
        }
        return true;
      case 2:
        if (!d.city?.trim()) {
          Alert.alert('Required', 'Enter your city.');
          return false;
        }
        if (!(d.areasCovered?.length || splitCommaList(areasExtra).length)) {
          Alert.alert('Required', 'Select or add at least one area you guide in.');
          return false;
        }
        return true;
      case 3:
        if (!d.guideTypes?.length) {
          Alert.alert('Required', 'Select at least one guide type.');
          return false;
        }
        if (!d.shortBio?.trim()) {
          Alert.alert('Required', 'Add a short bio.');
          return false;
        }
        return true;
      case 4:
        if (!d.languages?.length) {
          Alert.alert('Required', 'Add at least one language.');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const onContinue = async () => {
    if (removingImage || saving || uploading) return;
    if (!validateStep()) return;
    const patch = patchForStep;
    try {
      if (step === 7 && patch.availability) {
        setSaving(true);
        await guideService.updateAvailability(patch.availability);
        await persistDraft({ availability: patch.availability });
        setSaving(false);
      } else if (step < TOTAL_STEPS) {
        await persistDraft(patch);
      } else {
        await persistDraft(patch, true);
        if (isEditing) {
          leaveProviderEditor(user);
          return;
        }
        router.push('/(provider)/register/verification');
        return;
      }
      setStep((s) => Math.min(TOTAL_STEPS, s + 1));
    } catch (error) {
      Alert.alert('Could not save', getApiErrorMessage(error));
    }
  };

  const addLanguage = () => {
    setDetails((d) => ({
      ...d,
      languages: [...(d.languages ?? []), { language: '', proficiency: 'conversational' }],
    }));
  };

  const updateLanguage = (index: number, patch: Partial<GuideLanguage>) => {
    setDetails((d) => {
      const languages = [...(d.languages ?? [])];
      languages[index] = { ...languages[index], ...patch };
      return { ...d, languages };
    });
  };

  const removeLanguage = (index: number) => {
    setDetails((d) => ({
      ...d,
      languages: (d.languages ?? []).filter((_, i) => i !== index),
    }));
  };

  const addDocument = () => {
    setDetails((d) => ({
      ...d,
      documents: [
        ...(d.documents ?? []),
        {
          id: newGuideId('doc'),
          type: 'guide_license',
          fileUrl: '',
          status: 'pending',
        },
      ],
    }));
  };

  const saveService = async () => {
    if (!serviceForm?.name?.trim()) {
      Alert.alert('Required', 'Service name is required.');
      return;
    }
    const payload: GuideOfferedService = {
      id: serviceForm.id ?? newGuideId('svc'),
      name: serviceForm.name.trim(),
      category: (serviceForm.category ?? 'local') as GuideType,
      description: serviceForm.description?.trim() ?? '',
      durationLabel: serviceForm.durationLabel?.trim() || 'Full day',
      durationHours: serviceForm.durationHours,
      price: Number(serviceForm.price) || 0,
      pricingType: serviceForm.pricingType ?? 'per_day',
      currency: 'PKR',
      minGuests: Number(serviceForm.minGuests) || 1,
      maxGuests: Number(serviceForm.maxGuests) || 10,
      included: splitCommaList(String(serviceForm.included ?? '')),
      excluded: splitCommaList(String(serviceForm.excluded ?? '')),
      meetingPoint: serviceForm.meetingPoint,
      availableLocations: splitCommaList(String(serviceForm.availableLocations ?? '')),
      notes: serviceForm.notes,
      active: serviceForm.active !== false,
    };
    setSaving(true);
    try {
      if (serviceForm.id) {
        await guideService.updateService(serviceForm.id, payload);
      } else {
        await guideService.createService(payload);
      }
      const res = await guideService.getMyProfile();
      hydrateFromGuide(res.guideDetails);
      setServiceForm(null);
    } catch (error) {
      Alert.alert('Could not save service', getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleArea = (area: string) => {
    setDetails((d) => {
      const set = new Set(d.areasCovered ?? []);
      if (set.has(area)) set.delete(area);
      else set.add(area);
      return { ...d, areasCovered: Array.from(set) };
    });
  };

  const toggleGuideType = (value: string) => {
    setDetails((d) => {
      const set = new Set(d.guideTypes ?? []);
      if (set.has(value as GuideType)) set.delete(value as GuideType);
      else set.add(value as GuideType);
      return { ...d, guideTypes: Array.from(set) as GuideType[] };
    });
  };

  const setWeeklyDay = (day: Weekday, patch: Partial<{ enabled: boolean; startTime: string; endTime: string }>) => {
    setDetails((d) => {
      const weekly = [...(d.availability?.weekly ?? [])];
      const idx = weekly.findIndex((row) => row.day === day);
      if (idx >= 0) weekly[idx] = { ...weekly[idx], ...patch };
      return {
        ...d,
        availability: { ...(d.availability ?? { blockedDates: [] }), weekly, blockedDates: d.availability?.blockedDates ?? [] },
      };
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 40, alignItems: 'center' }]}>
        <Text style={styles.sub}>Loading guide profile…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={isEditing ? 'Edit guide profile' : 'Travel guide setup'}
        showBack
        fallbackHref={isEditing ? PROVIDER_SERVICE_TAB : (ONBOARDING_LOCATION as never)}
        onBack={goPrevious}
      />
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 32,
          gap: Spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <ProgressBar step={step} />

        {step === 1 ? (
          <>
            <Text style={styles.heading}>Basic information</Text>
            <Text style={styles.sub}>How travelers will recognize you when hiring a guide.</Text>
            <ImagePickerField
              disabled={saving || uploading || removingImage}
              onRemovingChange={setRemovingImage}
              label="Profile photo"
              urls={details.profilePhoto ? [details.profilePhoto] : []}
              max={1}
              uploading={uploading}
              onAdd={() =>
                void (async () => {
                  const urls = await uploadGuideImages(1);
                  if (urls[0]) setDetails((d) => ({ ...d, profilePhoto: urls[0] }));
                })()
              }
              onRemove={() => setDetails((d) => ({ ...d, profilePhoto: '' }))}
            />
            <Input
              label="Full name *"
              value={details.fullName ?? ''}
              onChangeText={(v) => setDetails((d) => ({ ...d, fullName: v }))}
            />
            <View style={styles.genderBlock}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {(['male', 'female', 'other'] as const).map((g) => {
                  const active = details.gender === g;
                  return (
                    <Pressable
                      key={g}
                      onPress={() => setDetails((d) => ({ ...d, gender: g }))}
                      style={[styles.genderChip, active && styles.genderChipActive]}
                    >
                      <Text style={[styles.genderText, active && styles.genderTextActive]}>
                        {g === 'male' ? 'Male' : g === 'female' ? 'Female' : 'Other'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <Input
              label="Date of birth"
              value={details.dateOfBirth ?? ''}
              onChangeText={(v) => setDetails((d) => ({ ...d, dateOfBirth: v }))}
              placeholder="YYYY-MM-DD"
            />
            <Input
              label="Age"
              keyboardType="number-pad"
              value={details.age != null ? String(details.age) : ''}
              onChangeText={(v) =>
                setDetails((d) => ({ ...d, age: Number(v) || undefined }))
              }
            />
            <Input
              label="Phone *"
              value={details.phone ?? ''}
              onChangeText={(v) => setDetails((d) => ({ ...d, phone: v }))}
              keyboardType="phone-pad"
            />
            <Input
              label="WhatsApp"
              value={details.whatsapp ?? ''}
              onChangeText={(v) => setDetails((d) => ({ ...d, whatsapp: v }))}
              keyboardType="phone-pad"
            />
            <Input
              label="Email"
              value={details.email ?? ''}
              onChangeText={(v) => setDetails((d) => ({ ...d, email: v }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="CNIC number"
              value={details.cnicNumber ?? ''}
              onChangeText={(v) => setDetails((d) => ({ ...d, cnicNumber: v }))}
            />
            <ImagePickerField
              disabled={saving || uploading || removingImage}
              onRemovingChange={setRemovingImage}
              label="CNIC front"
              urls={details.cnicFrontUrl ? [details.cnicFrontUrl] : []}
              max={1}
              uploading={uploading}
              onAdd={() =>
                void (async () => {
                  const urls = await uploadGuideImages(1);
                  if (urls[0]) setDetails((d) => ({ ...d, cnicFrontUrl: urls[0] }));
                })()
              }
              onRemove={() => setDetails((d) => ({ ...d, cnicFrontUrl: '' }))}
            />
            <ImagePickerField
              disabled={saving || uploading || removingImage}
              onRemovingChange={setRemovingImage}
              label="CNIC back"
              urls={details.cnicBackUrl ? [details.cnicBackUrl] : []}
              max={1}
              uploading={uploading}
              onAdd={() =>
                void (async () => {
                  const urls = await uploadGuideImages(1);
                  if (urls[0]) setDetails((d) => ({ ...d, cnicBackUrl: urls[0] }));
                })()
              }
              onRemove={() => setDetails((d) => ({ ...d, cnicBackUrl: '' }))}
            />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={styles.heading}>Location</Text>
            <Input
              label="Country"
              value={details.country ?? 'Pakistan'}
              onChangeText={(v) => setDetails((d) => ({ ...d, country: v }))}
            />
            <Input
              label="Province"
              value={details.province ?? ''}
              onChangeText={(v) => setDetails((d) => ({ ...d, province: v }))}
            />
            <Input
              label="District"
              value={details.district ?? ''}
              onChangeText={(v) => setDetails((d) => ({ ...d, district: v }))}
            />
            <LocationPinField
              label="City *"
              value={details.city ?? ''}
              onChangeText={(v) => setDetails((d) => ({ ...d, city: v }))}
              result="city"
              onPicked={picked => setDetails(d => ({ ...d, city: picked.address.city || picked.placeName || d.city, province: picked.address.region || d.province, country: picked.address.country || d.country }))}
            />
            <LocationPinField
              label="Current location"
              value={details.currentLocation ?? ''}
              onChangeText={(v) => setDetails((d) => ({ ...d, currentLocation: v }))}
            />
            <Text style={styles.fieldLabel}>Areas covered *</Text>
            <ChipSelect
              options={GUIDE_AREA_SUGGESTIONS.map((a) => ({ value: a, label: a }))}
              selected={details.areasCovered ?? []}
              onToggle={toggleArea}
            />
            <Input
              label="Other areas"
              value={areasExtra}
              onChangeText={setAreasExtra}
              placeholder="Comma-separated"
              hint="Add regions beyond the suggestions above"
            />
            <LocationPinField
              label="Pickup locations"
              value={pickupText}
              onChangeText={setPickupText}
              placeholder="e.g. Gilgit airport, hotel lobby"
              hint="Comma-separated"
              result="place"
              append
            />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text style={styles.heading}>Professional profile</Text>
            <Text style={styles.fieldLabel}>Guide types *</Text>
            <ChipSelect
              options={GUIDE_TYPE_OPTIONS}
              selected={details.guideTypes ?? []}
              onToggle={toggleGuideType}
            />
            <Input
              label="Years of experience"
              keyboardType="number-pad"
              value={details.yearsExperience != null ? String(details.yearsExperience) : ''}
              onChangeText={(v) =>
                setDetails((d) => ({ ...d, yearsExperience: Number(v) || 0 }))
              }
            />
            <Input
              label="Short bio *"
              value={details.shortBio ?? ''}
              onChangeText={(v) => setDetails((d) => ({ ...d, shortBio: v }))}
              multiline
            />
            <Input
              label="Detailed description"
              value={details.detailedDescription ?? ''}
              onChangeText={(v) => setDetails((d) => ({ ...d, detailedDescription: v }))}
              multiline
            />
            <Input label="Special skills" value={skillsText} onChangeText={setSkillsText} hint="Comma-separated" />
            <Input label="Areas of expertise" value={expertiseText} onChangeText={setExpertiseText} hint="Comma-separated" />
            <Input label="Certifications" value={certsText} onChangeText={setCertsText} hint="Comma-separated" />
            <Input label="Training" value={trainingText} onChangeText={setTrainingText} hint="Comma-separated" />
            <Input label="Awards" value={awardsText} onChangeText={setAwardsText} hint="Comma-separated" />
            <Input
              label="Fallback daily rate (PKR)"
              keyboardType="number-pad"
              value={details.dailyHireRate != null ? String(details.dailyHireRate) : ''}
              onChangeText={(v) =>
                setDetails((d) => ({ ...d, dailyHireRate: Number(v) || undefined }))
              }
            />
          </>
        ) : null}

        {step === 4 ? (
          <>
            <Text style={styles.heading}>Languages</Text>
            {(details.languages ?? []).map((row, index) => (
              <View key={`lang-${index}`} style={styles.card}>
                <Input
                  label="Language"
                  value={row.language}
                  onChangeText={(v) => updateLanguage(index, { language: v })}
                />
                <Text style={styles.fieldLabel}>Proficiency</Text>
                <ChipSelect
                  options={LANGUAGE_PROFICIENCY_OPTIONS}
                  selected={[row.proficiency]}
                  onToggle={(v) => updateLanguage(index, { proficiency: v as LanguageProficiency })}
                />
                <Button title="Remove" variant="outline" compact onPress={() => removeLanguage(index)} />
              </View>
            ))}
            <Button title="Add language" variant="outline" onPress={addLanguage} />
          </>
        ) : null}

        {step === 5 ? (
          <>
            <Text style={styles.heading}>Documents</Text>
            {(details.documents ?? []).map((doc, index) => (
              <View key={doc.id} style={styles.card}>
                <Text style={styles.fieldLabel}>Document {index + 1}</Text>
                <ChipSelect
                  options={GUIDE_DOCUMENT_TYPE_OPTIONS}
                  selected={[doc.type]}
                  onToggle={(v) =>
                    setDetails((d) => {
                      const documents = [...(d.documents ?? [])];
                      documents[index] = { ...documents[index], type: v as GuideDocument['type'] };
                      return { ...d, documents };
                    })
                  }
                />
                <Input
                  label="Number"
                  value={doc.number ?? ''}
                  onChangeText={(v) =>
                    setDetails((d) => {
                      const documents = [...(d.documents ?? [])];
                      documents[index] = { ...documents[index], number: v };
                      return { ...d, documents };
                    })
                  }
                />
                <Input
                  label="Issue date"
                  value={doc.issueDate ?? ''}
                  onChangeText={(v) =>
                    setDetails((d) => {
                      const documents = [...(d.documents ?? [])];
                      documents[index] = { ...documents[index], issueDate: v };
                      return { ...d, documents };
                    })
                  }
                  placeholder="YYYY-MM-DD"
                />
                <Input
                  label="Expiry date"
                  value={doc.expiryDate ?? ''}
                  onChangeText={(v) =>
                    setDetails((d) => {
                      const documents = [...(d.documents ?? [])];
                      documents[index] = { ...documents[index], expiryDate: v };
                      return { ...d, documents };
                    })
                  }
                  placeholder="YYYY-MM-DD"
                />
                <ImagePickerField
                  disabled={saving || uploading || removingImage}
                  onRemovingChange={setRemovingImage}
                  label="Document file"
                  urls={doc.fileUrl ? [doc.fileUrl] : []}
                  max={1}
                  uploading={uploading}
                  onAdd={() =>
                    void (async () => {
                      const urls = await uploadGuideImages(1);
                      if (!urls[0]) return;
                      setDetails((d) => {
                        const documents = [...(d.documents ?? [])];
                        documents[index] = { ...documents[index], fileUrl: urls[0] };
                        return { ...d, documents };
                      });
                    })()
                  }
                  onRemove={() =>
                    setDetails((d) => {
                      const documents = [...(d.documents ?? [])];
                      documents[index] = { ...documents[index], fileUrl: '' };
                      return { ...d, documents };
                    })
                  }
                />
              </View>
            ))}
            <Button title="Add document" variant="outline" onPress={addDocument} />
          </>
        ) : null}

        {step === 6 ? (
          <>
            <Text style={styles.heading}>Offered services</Text>
            {(details.services ?? []).map((svc) => (
              <Pressable
                key={svc.id}
                style={styles.card}
                onPress={() => setServiceForm({ ...svc })}
              >
                <Text style={styles.cardTitle}>{svc.name}</Text>
                <Text style={styles.sub}>
                  {svc.durationLabel} · {formatCurrency(svc.price)} · {svc.active ? 'Active' : 'Disabled'}
                </Text>
              </Pressable>
            ))}
            {serviceForm ? (
              <View style={styles.card}>
                <Input label="Service name *" value={serviceForm.name ?? ''} onChangeText={(v) => setServiceForm((f) => ({ ...f, name: v }))} />
                <ChipSelect
                  options={GUIDE_TYPE_OPTIONS}
                  selected={serviceForm.category ? [serviceForm.category] : []}
                  onToggle={(v) => setServiceForm((f) => ({ ...f, category: v as GuideType }))}
                />
                <Input label="Description" value={serviceForm.description ?? ''} onChangeText={(v) => setServiceForm((f) => ({ ...f, description: v }))} multiline />
                <Input label="Duration label" value={serviceForm.durationLabel ?? ''} onChangeText={(v) => setServiceForm((f) => ({ ...f, durationLabel: v }))} />
                <Input label="Price (PKR)" keyboardType="number-pad" value={serviceForm.price != null ? String(serviceForm.price) : ''} onChangeText={(v) => setServiceForm((f) => ({ ...f, price: Number(v) || 0 }))} />
                <Text style={styles.fieldLabel}>Pricing type</Text>
                <ChipSelect
                  options={GUIDE_PRICING_TYPE_OPTIONS}
                  selected={serviceForm.pricingType ? [serviceForm.pricingType] : ['per_day']}
                  onToggle={(v) => setServiceForm((f) => ({ ...f, pricingType: v as GuideOfferedService['pricingType'] }))}
                />
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Button title="Save service" disabled={removingImage} loading={saving} onPress={() => void saveService()} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button title="Cancel" variant="outline" onPress={() => setServiceForm(null)} />
                  </View>
                </View>
              </View>
            ) : (
              <Button
                title="Add service"
                variant="outline"
                onPress={() =>
                  setServiceForm({
                    category: 'local',
                    pricingType: 'per_day',
                    minGuests: 1,
                    maxGuests: 10,
                    active: true,
                  })
                }
              />
            )}
          </>
        ) : null}

        {step === 7 ? (
          <>
            <Text style={styles.heading}>Availability</Text>
            {(details.availability?.weekly ?? []).map((row) => (
              <View key={row.day} style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitle}>{WEEKDAY_LABELS[row.day]}</Text>
                  <Switch
                    value={row.enabled}
                    onValueChange={(enabled) => setWeeklyDay(row.day, { enabled })}
                  />
                </View>
                {row.enabled ? (
                  <>
                    <Input label="Start" value={row.startTime} onChangeText={(v) => setWeeklyDay(row.day, { startTime: v })} />
                    <Input label="End" value={row.endTime} onChangeText={(v) => setWeeklyDay(row.day, { endTime: v })} />
                  </>
                ) : null}
              </View>
            ))}
            <Input
              label="Add blocked date"
              value={blockedDateInput}
              onChangeText={setBlockedDateInput}
              placeholder="YYYY-MM-DD"
            />
            <Button
              title="Block date"
              variant="outline"
              compact
              onPress={() => {
                const d = blockedDateInput.trim();
                if (!d) return;
                setDetails((prev) => ({
                  ...prev,
                  availability: {
                    ...(prev.availability ?? { weekly: [], blockedDates: [] }),
                    blockedDates: Array.from(new Set([...(prev.availability?.blockedDates ?? []), d])),
                  },
                }));
                setBlockedDateInput('');
              }}
            />
            {(details.availability?.blockedDates ?? []).map((d) => (
              <Pressable
                key={d}
                onPress={() =>
                  setDetails((prev) => ({
                    ...prev,
                    availability: {
                      ...(prev.availability ?? { weekly: [], blockedDates: [] }),
                      blockedDates: (prev.availability?.blockedDates ?? []).filter((x) => x !== d),
                    },
                  }))
                }
              >
                <Text style={styles.sub}>Blocked: {d} (tap to remove)</Text>
              </Pressable>
            ))}
          </>
        ) : null}

        {step === 8 ? (
          <>
            <Text style={styles.heading}>Photos</Text>
            <Text style={styles.fieldLabel}>Category for new photos</Text>
            <ChipSelect
              options={GUIDE_PHOTO_CATEGORY_OPTIONS}
              selected={[photoCategory]}
              onToggle={(v) => setPhotoCategory(v as GuidePhoto['category'])}
            />
            <ImagePickerField
              disabled={saving || uploading || removingImage}
              onRemovingChange={setRemovingImage}
              label="Gallery"
              urls={(details.photos ?? []).map((p) => p.url)}
              max={12}
              uploading={uploading}
              onAdd={() =>
                void (async () => {
                  const urls = await uploadGuideImages(3);
                  if (!urls.length) return;
                  setDetails((d) => ({
                    ...d,
                    photos: [
                      ...(d.photos ?? []),
                      ...urls.map((url) => ({
                        id: newGuideId('photo'),
                        url,
                        category: photoCategory,
                      })),
                    ],
                  }));
                })()
              }
              onRemove={(index) =>
                setDetails((d) => ({
                  ...d,
                  photos: (d.photos ?? []).filter((_, i) => i !== index),
                }))
              }
            />
          </>
        ) : null}

        {step === 9 ? (
          <>
            <Text style={styles.heading}>Review & submit</Text>
            <Text style={styles.sub}>
              Submit your guide profile for review. You can still edit later from your dashboard.
            </Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{patchForStep.fullName}</Text>
              <Text style={styles.sub}>{patchForStep.city} · {(patchForStep.guideTypes ?? []).join(', ')}</Text>
              <Text style={styles.sub}>{patchForStep.shortBio}</Text>
              <Text style={styles.sub}>
                {(patchForStep.languages ?? []).length} languages · {(patchForStep.services ?? []).length} services
              </Text>
              {patchForStep.profileStatus ? (
                <Text style={styles.sub}>Status: {patchForStep.profileStatus}</Text>
              ) : null}
            </View>
          </>
        ) : null}

        <Button
          title={step === TOTAL_STEPS ? (isEditing ? 'Save & submit' : 'Submit for review') : 'Save & continue'}
          disabled={removingImage}
          loading={saving}
          onPress={() => void onContinue()}
        />
        {step > 1 && step < TOTAL_STEPS ? (
          <Button title="Back" variant="outline" onPress={() => setStep((s) => s - 1)} />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heading: { ...Typography.h2, color: Colors.dark },
  sub: { ...Typography.body, color: Colors.muted, lineHeight: 20 },
  progressWrap: { gap: Spacing.sm },
  progressText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.muted },
  progressTrack: {
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.inputBg,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary },
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
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.dark },
  chipTextActive: { color: Colors.white },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.dark },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
