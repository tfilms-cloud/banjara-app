import { get, post, put, del } from '@/services/api';
import { asArray, type AnyRecord } from '@/services/mappers';
import { normalizeMediaUrl } from '@/utils/mediaUrl';
import type {
  CreateTourItineraryInput,
  TourDay,
  TourItinerary,
  TourOperatorBrief,
  TourType,
  TourTypeCatalog,
} from '@/types/tourItinerary';

function mapProvider(raw: unknown): TourOperatorBrief | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as AnyRecord;
  const id = String(data._id ?? data.id ?? '');
  if (!id) return null;
  const logo = typeof data.logo === 'string' ? data.logo : undefined;
  return {
    id,
    businessName: String(data.businessName ?? 'Tour operator'),
    logo: normalizeMediaUrl(logo) ?? null,
    rating: Number(data.rating ?? 0),
    reviewCount: Number(data.totalReviews ?? data.reviewCount ?? 0),
    yearsExperience: Number(data.yearsExperience ?? 0),
    city: data.city ? String(data.city) : null,
    verified: data.verificationStatus === 'approved' || data.verified === true,
    description: data.description ? String(data.description) : '',
    itineraryCount: data.itineraryCount != null ? Number(data.itineraryCount) : undefined,
  };
}

function mapDays(raw: unknown): TourDay[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const row = (item ?? {}) as AnyRecord;
    return {
      dayNumber: Number(row.dayNumber ?? index + 1),
      title: String(row.title ?? `Day ${index + 1}`),
      description: String(row.description ?? ''),
    };
  });
}

export function mapTourItinerary(raw: AnyRecord): TourItinerary {
  const providerRaw = raw.providerId;
  const provider =
    providerRaw && typeof providerRaw === 'object' ? mapProvider(providerRaw) : null;
  const providerId =
    provider?.id ||
    (typeof providerRaw === 'string' || typeof providerRaw === 'number'
      ? String(providerRaw)
      : String((providerRaw as AnyRecord)?._id ?? raw.providerId ?? ''));

  const coverValue = typeof raw.coverImage === 'string' ? raw.coverImage : '';
  const cover = normalizeMediaUrl(coverValue) ?? '';
  const images = asArray<string>(raw.images)
    .map((url) => normalizeMediaUrl(url) ?? url)
    .filter(Boolean);

  return {
    id: String(raw._id ?? raw.id ?? ''),
    providerId,
    title: String(raw.title ?? ''),
    tourType: (raw.tourType as TourType) ?? 'trek',
    summary: String(raw.summary ?? ''),
    description: String(raw.description ?? ''),
    destination: String(raw.destination ?? ''),
    region: raw.region ? String(raw.region) : undefined,
    durationDays: Number(raw.durationDays ?? 1),
    durationNights:
      raw.durationNights != null && raw.durationNights !== ''
        ? Number(raw.durationNights)
        : undefined,
    difficulty: raw.difficulty as TourItinerary['difficulty'],
    maxParticipants: Number(raw.maxParticipants ?? 1),
    pricePerPerson: Number(raw.pricePerPerson ?? 0),
    currency: String(raw.currency ?? 'PKR'),
    included: asArray<string>(raw.included).map(String),
    excluded: asArray<string>(raw.excluded).map(String),
    days: mapDays(raw.days),
    coverImage: cover,
    images,
    departureLocation: raw.departureLocation ? String(raw.departureLocation) : undefined,
    bestSeason: raw.bestSeason ? String(raw.bestSeason) : undefined,
    status: (raw.status as TourItinerary['status']) ?? 'draft',
    featured: Boolean(raw.featured),
    rejectionReason: raw.rejectionReason ? String(raw.rejectionReason) : undefined,
    publishedAt: raw.publishedAt ? String(raw.publishedAt) : undefined,
    provider,
  };
}

export async function listMine(params?: { tourType?: string; status?: string }) {
  const data = await get<unknown>('/tour-itineraries/mine', { params });
  return asArray<AnyRecord>(data).map(mapTourItinerary);
}

export async function getMine(id: string) {
  return mapTourItinerary(await get<AnyRecord>(`/tour-itineraries/mine/${id}`));
}

export async function createItinerary(input: CreateTourItineraryInput) {
  return mapTourItinerary(await post<AnyRecord>('/tour-itineraries', input));
}

export async function updateItinerary(id: string, input: Partial<CreateTourItineraryInput>) {
  return mapTourItinerary(await put<AnyRecord>(`/tour-itineraries/${id}`, input));
}

export async function deleteItinerary(id: string) {
  return del(`/tour-itineraries/${id}`);
}

export async function listPublished(params?: {
  tourType?: TourType;
  featured?: 'true' | 'false';
  sort?: 'newest' | 'popular' | 'featured';
  providerId?: string;
  limit?: number;
}) {
  const data = await get<unknown>('/tour-itineraries', { params });
  return asArray<AnyRecord>(data).map(mapTourItinerary);
}

export async function getCatalog(tourType: TourType) {
  const data = await get<AnyRecord>(`/tour-itineraries/catalog/${tourType}`);
  return {
    tourType: (data.tourType as TourType) ?? tourType,
    featured: asArray<AnyRecord>(data.featured).map(mapTourItinerary),
    popular: asArray<AnyRecord>(data.popular).map(mapTourItinerary),
    newest: asArray<AnyRecord>(data.newest).map(mapTourItinerary),
  } satisfies TourTypeCatalog;
}

export async function getBestOperators(limit = 12) {
  const data = await get<unknown>('/tour-itineraries/best-operators', { params: { limit } });
  return asArray<AnyRecord>(data)
    .map((row) => mapProvider(row))
    .filter((row): row is TourOperatorBrief => Boolean(row));
}

export async function getPublished(id: string) {
  return mapTourItinerary(await get<AnyRecord>(`/tour-itineraries/${id}`));
}
