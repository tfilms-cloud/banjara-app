import { DEFAULT_GUIDE_WEEKLY } from '@/constants/guideOptions';
import type { GuideAvailability, GuideDetails } from '@/types/guide';

export function newGuideId(prefix = 'g') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultGuideAvailability(): GuideAvailability {
  return {
    weekly: DEFAULT_GUIDE_WEEKLY.map((row) => ({ ...row })),
    blockedDates: [],
  };
}

export function emptyGuideDetails(seed?: Partial<GuideDetails>): GuideDetails {
  return {
    country: 'Pakistan',
    guideTypes: [],
    specialSkills: [],
    areasOfExpertise: [],
    certifications: [],
    training: [],
    awards: [],
    languages: [],
    documents: [],
    photos: [],
    services: [],
    areasCovered: [],
    pickupLocations: [],
    availability: defaultGuideAvailability(),
    ...seed,
  };
}

export function splitCommaList(value: string) {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
