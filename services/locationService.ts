import { get, patch, post, put } from '@/services/api';
import type {
  BusinessLocationPayload,
  PlaceSearchResult,
  StructuredAddress,
} from '@/types/location';

export async function searchPlaces(query: string, limit = 5): Promise<PlaceSearchResult[]> {
  const data = await get<PlaceSearchResult[]>('/businesses/search', {
    params: { q: query, limit },
  });
  return Array.isArray(data) ? data : [];
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<PlaceSearchResult> {
  return get<PlaceSearchResult>('/businesses/reverse', {
    params: { latitude, longitude },
  });
}

export async function getMyBusinessLocation(): Promise<BusinessLocationPayload> {
  return get<BusinessLocationPayload>('/providers/me/location');
}

export async function saveMyBusinessLocation(input: {
  address: StructuredAddress;
  latitude: number;
  longitude: number;
}): Promise<BusinessLocationPayload> {
  const body = {
    address: input.address,
    location: {
      type: 'Point' as const,
      coordinates: [input.longitude, input.latitude] as [number, number],
    },
  };
  try {
    return await put<BusinessLocationPayload>('/providers/me/location', body);
  } catch {
    return patch<BusinessLocationPayload>('/providers/me/location', body);
  }
}

export async function saveBusinessLocationById(
  businessId: string,
  input: { address: StructuredAddress; latitude: number; longitude: number }
): Promise<BusinessLocationPayload> {
  return post<BusinessLocationPayload>(`/businesses/${businessId}/location`, {
    address: input.address,
    location: {
      type: 'Point',
      coordinates: [input.longitude, input.latitude],
    },
  });
}

export async function findNearbyBusinesses(params: {
  latitude: number;
  longitude: number;
  radius?: number;
  category?: string;
}) {
  return get<{
    items: Array<{ business: Record<string, unknown>; distanceMeters: number }>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>('/businesses/nearby', { params });
}
