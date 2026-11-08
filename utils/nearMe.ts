import * as Location from 'expo-location';
import { get } from '@/services/api';

/** Same rule as the website: rides whose pickup is within 10 km, widen up to 20 km. */
export const NEAR_DEFAULT_KM = 10;
export const NEAR_MAX_KM = 20;

/** A ride card from GET /api/discover (only the fields the nearby screen shows). */
export type NearbyRide = {
  id: string;
  title: string;
  subtitle: string;
  city: string;
  image: string | null;
  price: number | null;
  priceUnit: string | null;
  rating: number | null;
  verified: boolean;
  tags: string[];
  target: { type: string; id: string; providerId?: string };
  departsAt?: string;
  location?: { lat: number; lng: number; address: string } | null;
  distanceKm?: number;
};

type DiscoverResponse = {
  total: number;
  items: NearbyRide[];
  near?: { lat: number; lng: number; radiusKm: number } | null;
};

/** Rides with a pickup within `radiusKm` of the visitor, nearest first (filtered on the server). */
export async function fetchNearbyRides(latitude: number, longitude: number, radiusKm: number) {
  const data = await get<DiscoverResponse>('/discover', {
    params: {
      service: 'transport',
      view: 'map',
      near: `${latitude.toFixed(5)},${longitude.toFixed(5)}`,
      radius: radiusKm,
      limit: 100,
    },
  });
  return data.items ?? [];
}

export type LocateResult =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; reason: 'denied' | 'blocked' | 'services-off' | 'unavailable' };

/**
 * Ask for the visitor's position once. "blocked" means the OS will not show the prompt again
 * (the user must enable it in Settings); "services-off" means device location is turned off.
 */
export async function locateVisitor(): Promise<LocateResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      return { ok: false, reason: permission.canAskAgain ? 'denied' : 'blocked' };
    }
    if (!(await Location.hasServicesEnabledAsync())) return { ok: false, reason: 'services-off' };
    // A recent fix is instant; otherwise ask for a fresh one (about 100 m accuracy is plenty).
    const last = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 });
    const position =
      last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { ok: true, latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

/** "0.4" -> "Under 1 km", "3.25" -> "3.3 km". */
export function distanceLabel(km: number | undefined) {
  if (km === undefined) return null;
  return km < 1 ? 'Under 1 km' : `${km.toFixed(1).replace(/\.0$/, '')} km`;
}
