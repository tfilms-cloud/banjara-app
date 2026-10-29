import type {
  GuideDocumentType,
  GuidePhotoCategory,
  GuidePricingType,
  GuideType,
  LanguageProficiency,
  Weekday,
} from '@/types/guide';
import type { GuideDayAvailability } from '@/types/guide';

export const DEFAULT_GUIDE_WEEKLY: GuideDayAvailability[] = [
  { day: 'monday', enabled: true, startTime: '09:00', endTime: '18:00' },
  { day: 'tuesday', enabled: true, startTime: '09:00', endTime: '18:00' },
  { day: 'wednesday', enabled: true, startTime: '09:00', endTime: '18:00' },
  { day: 'thursday', enabled: true, startTime: '09:00', endTime: '18:00' },
  { day: 'friday', enabled: true, startTime: '09:00', endTime: '18:00' },
  { day: 'saturday', enabled: true, startTime: '09:00', endTime: '18:00' },
  { day: 'sunday', enabled: false, startTime: '09:00', endTime: '18:00' },
];

export const GUIDE_AREA_SUGGESTIONS = [
  'Gilgit',
  'Hunza',
  'Skardu',
  'Nagar',
  'Ghizer',
  'Astore',
  'Diamer',
  'Chitral',
  'Islamabad',
  'Fairy Meadows',
  'Naltar',
  'Khunjerab',
] as const;

export const GUIDE_TYPE_OPTIONS: { value: GuideType; label: string }[] = [
  { value: 'local', label: 'Local guide' },
  { value: 'tour', label: 'Tour guide' },
  { value: 'trekking', label: 'Trekking' },
  { value: 'hiking', label: 'Hiking' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'mountain', label: 'Mountain' },
  { value: 'photography', label: 'Photography' },
  { value: 'other', label: 'Other' },
];

export const LANGUAGE_PROFICIENCY_OPTIONS: { value: LanguageProficiency; label: string }[] = [
  { value: 'basic', label: 'Basic' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'fluent', label: 'Fluent' },
  { value: 'native', label: 'Native' },
];

export const GUIDE_DOCUMENT_TYPE_OPTIONS: { value: GuideDocumentType; label: string }[] = [
  { value: 'cnic', label: 'CNIC' },
  { value: 'guide_license', label: 'Guide license' },
  { value: 'tourism_cert', label: 'Tourism certificate' },
  { value: 'first_aid', label: 'First aid' },
  { value: 'mountain_cert', label: 'Mountain cert' },
  { value: 'other', label: 'Other' },
];

export const GUIDE_PHOTO_CATEGORY_OPTIONS: { value: GuidePhotoCategory; label: string }[] = [
  { value: 'profile', label: 'Profile' },
  { value: 'action', label: 'Action' },
  { value: 'mountains', label: 'Mountains' },
  { value: 'destinations', label: 'Destinations' },
  { value: 'trekking', label: 'Trekking' },
  { value: 'tours', label: 'Tours' },
  { value: 'other', label: 'Other' },
];

export const GUIDE_PRICING_TYPE_OPTIONS: { value: GuidePricingType; label: string }[] = [
  { value: 'per_person', label: 'Per person' },
  { value: 'per_group', label: 'Per group' },
  { value: 'per_hour', label: 'Per hour' },
  { value: 'per_day', label: 'Per day' },
  { value: 'custom', label: 'Custom' },
];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export const GUIDE_ONBOARDING_STEPS = [
  'Basic info',
  'Location',
  'Professional',
  'Languages',
  'Documents',
  'Services',
  'Availability',
  'Photos',
  'Review',
] as const;
