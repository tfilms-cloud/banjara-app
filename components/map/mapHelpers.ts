import { Linking, Platform } from 'react-native';
import type { Coordinates, PickupPoint } from '@/types/route';

export type MapLayer = 'standard' | 'satellite' | 'hybrid';

export function isValidCoord(c?: Coordinates | null): c is Coordinates {
  return Boolean(
    c &&
      Number.isFinite(c.latitude) &&
      Number.isFinite(c.longitude) &&
      !(c.latitude === 0 && c.longitude === 0)
  );
}

export function regionForPoints(
  points: Coordinates[],
  fallback: Coordinates = { latitude: 35.9208, longitude: 74.3144 }
) {
  const valid = points.filter(isValidCoord);
  if (!valid.length) {
    return {
      latitude: fallback.latitude,
      longitude: fallback.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }
  if (valid.length === 1) {
    return {
      latitude: valid[0].latitude,
      longitude: valid[0].longitude,
      latitudeDelta: 0.035,
      longitudeDelta: 0.035,
    };
  }

  let minLat = valid[0].latitude;
  let maxLat = valid[0].latitude;
  let minLng = valid[0].longitude;
  let maxLng = valid[0].longitude;
  for (const p of valid) {
    minLat = Math.min(minLat, p.latitude);
    maxLat = Math.max(maxLat, p.latitude);
    minLng = Math.min(minLng, p.longitude);
    maxLng = Math.max(maxLng, p.longitude);
  }

  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;
  const latitudeDelta = Math.max((maxLat - minLat) * 1.7, 0.04);
  const longitudeDelta = Math.max((maxLng - minLng) * 1.7, 0.04);

  return { latitude, longitude, latitudeDelta, longitudeDelta };
}

export function openExternalMaps(
  coords: Coordinates,
  label: string,
  mode: 'pin' | 'directions' = 'pin'
) {
  const q = encodeURIComponent(label);
  if (mode === 'directions') {
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${coords.latitude},${coords.longitude}&q=${q}`
        : `google.navigation:q=${coords.latitude},${coords.longitude}`;
    void Linking.openURL(url).catch(() => {
      void Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}`
      );
    });
    return;
  }

  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?ll=${coords.latitude},${coords.longitude}&q=${q}`
      : `geo:${coords.latitude},${coords.longitude}?q=${coords.latitude},${coords.longitude}(${q})`;
  void Linking.openURL(url);
}

export function pickupCoords(pickups: PickupPoint[]): Coordinates[] {
  return pickups.map((p) => p.coordinates).filter(isValidCoord);
}

/** Great-circle distance in kilometers. */
export function distanceKmBetween(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export type MapPerson = {
  name: string;
  phone?: string;
  avatarUrl?: string;
  label?: string;
};

export type MapVehicleInfo = {
  name: string;
  typeLabel?: string;
  plate?: string;
  imageUrl?: string;
  phone?: string;
  agencyName?: string;
  agencyLogo?: string;
  rating?: number;
};

