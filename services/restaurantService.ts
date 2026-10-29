import { get } from '@/services/api';
import { asArray, idOf, mapProvider, type AnyRecord } from '@/services/mappers';
import type { Restaurant, RestaurantOffer } from '@/types/restaurant';
import type { Provider } from '@/types/provider';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80&auto=format&fit=crop';

function providerToRestaurant(provider: Provider): Restaurant | null {
  if (!provider.services.includes('restaurant') && !provider.restaurant) return null;
  const r = provider.restaurant;
  const offers: RestaurantOffer[] = (r?.offers ?? [])
    .filter((o) => o.active !== false && o.title)
    .map((o) => ({
      id: o.id,
      title: o.title,
      type: o.type,
      discountPercent: o.discountPercent,
      description: o.description,
      active: o.active !== false,
    }));

  const menuVariety = r?.menuVariety ?? [];
  const rating = provider.rating || 0;
  const reviewCount = provider.reviewCount || 0;
  const visitScore = rating * 10 + reviewCount + menuVariety.length * 2 + offers.length;

  return {
    id: provider.id,
    providerId: provider.id,
    name: r?.restaurantName || provider.businessName,
    city: r?.city || provider.city,
    address: r?.address || provider.address,
    cuisine: r?.cuisineTypes ?? [],
    menuVariety,
    rating,
    reviewCount,
    images: r?.images?.length ? r.images : provider.logo ? [provider.logo] : [FALLBACK_IMAGE],
    offers,
    description: r?.description || provider.description,
    phone: r?.phone || provider.phone,
    hours: r?.hours,
    website: r?.website || provider.website,
    latitude: r?.latitude ?? provider.latitude,
    longitude: r?.longitude ?? provider.longitude,
    visitScore,
  };
}

export async function searchRestaurants(city?: string): Promise<Restaurant[]> {
  const data = await get<unknown>('/providers/catalog', {
    params: {
      service: 'restaurant',
      ...(city?.trim() ? { city: city.trim() } : {}),
      limit: 40,
    },
  });
  return asArray<AnyRecord>(data)
    .map((raw) => providerToRestaurant(mapProvider(raw)))
    .filter((item): item is Restaurant => Boolean(item));
}

export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  if (!id) return null;
  try {
    const data = await get<AnyRecord>(`/providers/public/${id}`);
    return providerToRestaurant(mapProvider(data));
  } catch {
    return null;
  }
}

export async function searchGuides(city?: string): Promise<Provider[]> {
  const data = await get<unknown>('/providers/catalog', {
    params: {
      service: 'travelGuide',
      ...(city?.trim() ? { city: city.trim() } : {}),
      limit: 24,
    },
  });
  return asArray<AnyRecord>(data).map(mapProvider);
}

export async function searchTourOperators(city?: string): Promise<Provider[]> {
  const data = await get<unknown>('/providers/catalog', {
    params: {
      service: 'tour',
      ...(city?.trim() ? { city: city.trim() } : {}),
      limit: 24,
    },
  });
  return asArray<AnyRecord>(data).map(mapProvider);
}

/** Offers first (sales/discounts), then by rating — for destination search. */
export function rankRestaurantsByOffers(list: Restaurant[]): Restaurant[] {
  return [...list].sort((a, b) => {
    const offerScore = (r: Restaurant) =>
      r.offers.reduce((sum, o) => {
        if (o.type === 'sale') return sum + 30 + (o.discountPercent ?? 0);
        if (o.type === 'discount') return sum + 20 + (o.discountPercent ?? 0);
        return sum + 10;
      }, 0);
    const diff = offerScore(b) - offerScore(a);
    if (diff !== 0) return diff;
    return b.rating - a.rating || b.visitScore - a.visitScore;
  });
}

function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Destination search ranking: active deals first, then nearer to the traveler
 * (when coords exist), then rating / visit score.
 */
export function rankRestaurantsNearOffers(
  list: Restaurant[],
  near?: { latitude: number; longitude: number } | null
): Restaurant[] {
  return [...list].sort((a, b) => {
    const offerScore = (r: Restaurant) =>
      r.offers
        .filter((o) => o.active !== false)
        .reduce((sum, o) => {
          if (o.type === 'sale') return sum + 30 + (o.discountPercent ?? 0);
          if (o.type === 'discount') return sum + 20 + (o.discountPercent ?? 0);
          return sum + 10;
        }, 0);
    const byOffer = offerScore(b) - offerScore(a);
    if (byOffer !== 0) return byOffer;

    if (near?.latitude != null && near?.longitude != null) {
      const dist = (r: Restaurant) => {
        if (r.latitude == null || r.longitude == null) return Number.POSITIVE_INFINITY;
        return haversineKm(near, { latitude: r.latitude, longitude: r.longitude });
      };
      const byDist = dist(a) - dist(b);
      if (Number.isFinite(byDist) && Math.abs(byDist) > 0.05) return byDist;
    }

    return b.rating - a.rating || b.visitScore - a.visitScore;
  });
}

/** Most visited: menu variety + ratings (+ optional nearness boost). */
export function rankMostVisited(
  list: Restaurant[],
  near?: { latitude: number; longitude: number } | null
): Restaurant[] {
  return [...list].sort((a, b) => {
    let scoreA = a.visitScore;
    let scoreB = b.visitScore;
    if (near?.latitude != null && near?.longitude != null) {
      const nearBoost = (r: Restaurant) => {
        if (r.latitude == null || r.longitude == null) return 0;
        const km = haversineKm(near, { latitude: r.latitude, longitude: r.longitude });
        if (km < 5) return 25;
        if (km < 25) return 12;
        if (km < 80) return 5;
        return 0;
      };
      scoreA += nearBoost(a);
      scoreB += nearBoost(b);
    }
    return scoreB - scoreA || b.rating - a.rating;
  });
}

export function restaurantIdOf(raw: unknown) {
  return idOf(raw);
}
