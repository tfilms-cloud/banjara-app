import { del, get, post, put } from '@/services/api';
import { mapGuideDetailsFromApi, type AnyRecord } from '@/services/mappers';
import type {
  GuideAvailability,
  GuideDetails,
  GuideMyProfileResponse,
  GuideOfferedService,
} from '@/types/guide';
import type { Provider } from '@/types/provider';
import { mapProvider } from '@/services/mappers';

type GuideProfilePayload = Partial<GuideDetails> & { submit?: boolean };

function mapMyProfile(raw: AnyRecord): GuideMyProfileResponse {
  const guideRaw = (raw.guideDetails ?? {}) as AnyRecord;
  return {
    providerId: String(raw.providerId ?? ''),
    verificationStatus: String(raw.verificationStatus ?? 'pending'),
    guideDetails: mapGuideDetailsFromApi(guideRaw) ?? {},
    rating: raw.rating != null ? Number(raw.rating) : undefined,
    totalReviews: raw.totalReviews != null ? Number(raw.totalReviews) : undefined,
    businessName: raw.businessName ? String(raw.businessName) : undefined,
    ownerName: raw.ownerName ? String(raw.ownerName) : undefined,
    city: raw.city ? String(raw.city) : undefined,
    logo: raw.logo ? String(raw.logo) : undefined,
  };
}

export async function getMyProfile(): Promise<GuideMyProfileResponse> {
  const data = await get<AnyRecord>('/guides/me/profile');
  return mapMyProfile(data);
}

export async function updateProfile(
  patch: Partial<GuideDetails>,
  options?: { submit?: boolean }
): Promise<GuideMyProfileResponse> {
  const body: GuideProfilePayload = { ...patch, submit: options?.submit };
  const data = await put<AnyRecord>('/guides/me/profile', body);
  return mapMyProfile(data);
}

export async function createService(
  service: Omit<GuideOfferedService, 'id'> & { id?: string }
): Promise<GuideMyProfileResponse> {
  const data = await post<AnyRecord>('/guides/me/services', service);
  return mapMyProfile(data);
}

export async function updateService(
  serviceId: string,
  patch: Partial<GuideOfferedService>
): Promise<GuideMyProfileResponse> {
  const data = await put<AnyRecord>(`/guides/me/services/${serviceId}`, patch);
  return mapMyProfile(data);
}

export async function deleteService(serviceId: string): Promise<GuideMyProfileResponse> {
  const data = await del<AnyRecord>(`/guides/me/services/${serviceId}`);
  return mapMyProfile(data);
}

export async function updateAvailability(
  availability: GuideAvailability
): Promise<GuideMyProfileResponse> {
  const data = await put<AnyRecord>('/guides/me/availability', availability);
  return mapMyProfile(data);
}

export type GuideSearchHit = {
  id: string;
  businessName: string;
  city?: string;
  rating?: number;
  guideDetails?: GuideDetails;
};

export async function searchGuides(params?: {
  destination?: string;
  date?: string;
  guests?: number;
  guideType?: string;
  language?: string;
}): Promise<GuideSearchHit[]> {
  const data = await get<unknown>('/guides', { params });
  if (Array.isArray(data)) {
    return data.map((row) => {
      const raw = row as AnyRecord;
      return {
        id: String(raw._id ?? raw.id ?? ''),
        businessName: String(raw.businessName ?? raw.ownerName ?? 'Guide'),
        city: raw.city ? String(raw.city) : undefined,
        rating: raw.rating != null ? Number(raw.rating) : undefined,
        guideDetails: mapGuideDetailsFromApi(raw.guideDetails as AnyRecord),
      };
    });
  }
  return [];
}

/** Reload provider after guide API updates (guideDetails on profile). */
export async function refreshProviderAfterGuide(): Promise<Provider | null> {
  try {
    const data = await get<AnyRecord>('/providers/me');
    return mapProvider(data);
  } catch {
    return null;
  }
}
