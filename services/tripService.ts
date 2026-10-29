import { del, get, post, put } from '@/services/api';
import {
  asArray,
  mapPickupPoint,
  mapReview,
  mapRouteInfo,
  mapSeatLayout,
  mapTrip,
  type AnyRecord,
} from '@/services/mappers';
import type { PickupPoint, RouteInfo } from '@/types/route';
import type { SeatLayout } from '@/types/seat';
import type {
  SearchParams,
  TripFilters,
  TripSortBy,
  TripWithDetails,
} from '@/types/trip';
import { matchesSearchText } from '@/utils/matchesSearchText';

function sortToBackend(sortBy: TripSortBy): string {
  switch (sortBy) {
    case 'price_asc':
      return 'priceLowToHigh';
    case 'price_desc':
      return 'priceHighToLow';
    case 'departure':
    case 'departure_desc':
      return 'departureTime';
    case 'recommended':
      return 'recommended';
    default:
      return 'recommended';
  }
}

function hourBucket(time: string, bucket: NonNullable<TripFilters['departureTime']>) {
  const hour = Number(String(time).split(':')[0]);
  if (Number.isNaN(hour)) return true;
  switch (bucket) {
    case 'morning':
      return hour >= 5 && hour < 12;
    case 'afternoon':
      return hour >= 12 && hour < 17;
    case 'evening':
      return hour >= 17 && hour < 21;
    case 'night':
      return hour >= 21 || hour < 5;
    default:
      return true;
  }
}

function applyClientFilters(
  trips: TripWithDetails[],
  params: SearchParams,
  filters?: TripFilters
): TripWithDetails[] {
  let results = trips.filter((trip) => trip.availableSeats >= params.passengers);

  if (filters?.minPrice != null) {
    results = results.filter((trip) => trip.price >= filters.minPrice!);
  }
  if (filters?.maxPrice != null) {
    results = results.filter((trip) => trip.price <= filters.maxPrice!);
  }
  if (filters?.minRating != null) {
    results = results.filter((trip) => trip.rating >= filters.minRating!);
  }
  if (filters?.minSeats != null) {
    results = results.filter((trip) => trip.availableSeats >= filters.minSeats!);
  }
  if (filters?.vehicleTypes?.length) {
    results = results.filter((trip) => filters.vehicleTypes!.includes(trip.vehicleType));
  }
  if (filters?.providerIds?.length) {
    results = results.filter((trip) => filters.providerIds!.includes(trip.agencyId));
  }
  if (filters?.journeyType) {
    results = results.filter((trip) => (trip.journeyType ?? 'one_way') === filters.journeyType);
  }
  if (params.journeyType && !filters?.journeyType) {
    results = results.filter((trip) => (trip.journeyType ?? 'one_way') === params.journeyType);
  }
  if (filters?.departureTime) {
    results = results.filter((trip) => hourBucket(trip.departureTime, filters.departureTime!));
  }
  if (filters?.arrivalTime) {
    results = results.filter((trip) => hourBucket(trip.arrivalTime, filters.arrivalTime!));
  }
  if (filters?.pickupLocation) {
    const needle = filters.pickupLocation.toLowerCase();
    results = results.filter((trip) =>
      trip.pickupLocations.some((point) => point.name.toLowerCase().includes(needle))
    );
  }
  const query = params.query?.trim();
  if (query) {
    results = results.filter((trip) =>
      matchesSearchText(
        query,
        trip.from,
        trip.to,
        trip.agency.name,
        trip.vehicleName,
        trip.vehicleType,
        trip.vehicleBrand,
        trip.vehicleModel,
        trip.description,
        ...trip.pickupLocations.map((point) => point.name)
      )
    );
  }
  return results;
}

export async function getTrips(): Promise<TripWithDetails[]> {
  const data = await get<unknown>('/trips');
  return asArray<AnyRecord>(data).map(mapTrip);
}

/** In-flight + short TTL cache to stop stampeding GET /trips/:id from remounts. */
const tripCache = new Map<
  string,
  { at: number; value: TripWithDetails | null; raw: AnyRecord | null }
>();
const tripInflight = new Map<string, Promise<TripWithDetails | null>>();
const TRIP_CACHE_MS = 15_000;

export async function getTripById(id: string): Promise<TripWithDetails | null> {
  if (!id) return null;

  const cached = tripCache.get(id);
  if (cached && Date.now() - cached.at < TRIP_CACHE_MS) {
    return cached.value;
  }

  const pending = tripInflight.get(id);
  if (pending) return pending;

  const request = (async () => {
    try {
      const data = await get<AnyRecord>(`/trips/${id}`);
      const trip = mapTrip(data);
      tripCache.set(id, { at: Date.now(), value: trip, raw: data });
      return trip;
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      // Don't cache rate-limit failures — let the UI show the error and retry later.
      if (/too many requests/i.test(message)) throw error;
      tripCache.set(id, { at: Date.now(), value: null, raw: null });
      return null;
    } finally {
      tripInflight.delete(id);
    }
  })();

  tripInflight.set(id, request);
  return request;
}

export function invalidateTripCache(id?: string) {
  if (id) {
    tripCache.delete(id);
    tripInflight.delete(id);
    return;
  }
  tripCache.clear();
  tripInflight.clear();
}

export async function searchTrips(
  params: SearchParams,
  filters?: TripFilters,
  sortBy: TripSortBy = 'departure'
): Promise<TripWithDetails[]> {
  const query = params.query?.trim();
  const data = await get<unknown>('/trips/search', {
    params: {
      origin: query ? undefined : params.from,
      destination: query ? undefined : params.to,
      date: query ? undefined : params.date,
      passengers: params.passengers,
      journeyType: params.journeyType ?? filters?.journeyType,
      minPrice: filters?.minPrice,
      maxPrice: filters?.maxPrice,
      sort: sortToBackend(sortBy),
    },
  });

  const trips = asArray<AnyRecord>(data).map(mapTrip);
  let results = applyClientFilters(trips, params, filters);

  results.sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'duration':
        return a.durationMinutes - b.durationMinutes;
      case 'departure_desc':
        return b.departureTime.localeCompare(a.departureTime);
      case 'recommended':
        return Number(Boolean(b.recommended)) - Number(Boolean(a.recommended)) || b.rating - a.rating;
      case 'departure':
      default:
        return a.departureTime.localeCompare(b.departureTime);
    }
  });

  return results;
}

export async function getPickupPoints(tripId: string): Promise<PickupPoint[]> {
  const trip = await getTripById(tripId);
  if (trip?.pickupLocations?.length) return trip.pickupLocations;

  const data = await get<unknown>('/pickup-points');
  return asArray<AnyRecord>(data).map((item) => mapPickupPoint(item, tripId));
}

export async function getVehicleSeats(tripId: string): Promise<SeatLayout | null> {
  if (!tripId) return null;
  await getTripById(tripId);
  const raw = tripCache.get(tripId)?.raw;
  if (!raw) return null;
  return mapSeatLayout(raw);
}

let recommendedTripsCache: { at: number; trips: TripWithDetails[] } | null = null;
const RECOMMENDED_TRIPS_TTL_MS = 60_000;

export async function getRecommendedTrips(): Promise<TripWithDetails[]> {
  if (
    recommendedTripsCache &&
    Date.now() - recommendedTripsCache.at < RECOMMENDED_TRIPS_TTL_MS
  ) {
    return recommendedTripsCache.trips;
  }
  const data = await get<unknown>('/trips/search', {
    params: { sort: 'recommended', limit: 40 },
  });
  const trips = asArray<AnyRecord>(data).map(mapTrip);
  recommendedTripsCache = { at: Date.now(), trips };
  return trips;
}

export function invalidateRecommendedTripsCache() {
  recommendedTripsCache = null;
}

export async function getPopularTrips(): Promise<TripWithDetails[]> {
  return getRecommendedTrips();
}

export async function getTripReviews(tripId: string, knownTrip?: TripWithDetails | null) {
  // Reviews are provider-scoped on the backend; load by trip provider when available.
  const trip = knownTrip ?? (await getTripById(tripId));
  if (!trip?.agencyId) return [];
  const data = await get<unknown>(`/reviews/provider/${trip.agencyId}`);
  return asArray<AnyRecord>(data).map(mapReview).filter((review) => !review.tripId || review.tripId === tripId);
}

export async function getAgencyById(agencyId: string) {
  try {
    const trips = await getTripsByAgency(agencyId);
    return trips[0]?.agency ?? null;
  } catch {
    return null;
  }
}

export async function getTripsByAgency(agencyId: string): Promise<TripWithDetails[]> {
  if (!agencyId) return [];
  try {
    const data = await get<unknown>('/trips/search', {
      params: { providerId: agencyId, limit: 50, sort: 'departureTime' },
    });
    const trips = asArray<AnyRecord>(data).map(mapTrip);
    const matched = trips.filter((trip) => trip.agencyId === agencyId);
    if (matched.length) return matched;
  } catch {
    // fall through to recommended list
  }

  try {
    const recommended = await getRecommendedTrips();
    return recommended.filter((trip) => trip.agencyId === agencyId);
  } catch {
    return [];
  }
}

export async function getPopularRoutes(): Promise<RouteInfo[]> {
  try {
    const trips = await getRecommendedTrips();
    const map = new Map<string, RouteInfo>();
    for (const trip of trips) {
      const key = `${trip.from}|${trip.to}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          id: key,
          from: trip.from,
          to: trip.to,
          popular: true,
          image: trip.image,
          avgPrice: trip.price,
          tripCount: 1,
        });
      } else {
        existing.tripCount += 1;
        existing.avgPrice = Math.round((existing.avgPrice + trip.price) / 2);
      }
    }
    return Array.from(map.values());
  } catch {
    return [];
  }
}

export async function listPickupPoints(): Promise<PickupPoint[]> {
  const data = await get<unknown>('/pickup-points');
  return asArray<AnyRecord>(data).map((item) => mapPickupPoint(item));
}

export async function createTrip(payload: Record<string, unknown>) {
  const data = await post<AnyRecord>('/trips', payload);
  return mapTrip(data);
}

export async function updateTrip(id: string, payload: Record<string, unknown>) {
  const data = await put<AnyRecord>(`/trips/${id}`, payload);
  return mapTrip(data);
}

export async function deleteTrip(id: string) {
  await del(`/trips/${id}`);
}

export async function createRoute(payload: Record<string, unknown>) {
  const data = await post<AnyRecord>('/routes', payload);
  return mapRouteInfo(data);
}

export async function listRoutes() {
  const data = await get<unknown>('/routes');
  return asArray<AnyRecord>(data).map(mapRouteInfo);
}
