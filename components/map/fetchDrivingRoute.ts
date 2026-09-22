import type { Coordinates } from '@/types/route';
import { isValidCoord } from '@/components/map/mapHelpers';

export type RoadRouteResult = {
  coordinates: Coordinates[];
  distanceKm: number;
  durationMin: number;
};

/**
 * Fetch a driving route that follows roads (OSRM / OpenStreetMap).
 * Falls back to null when offline or the service is unavailable.
 */
export async function fetchDrivingRoute(
  from: Coordinates,
  to: Coordinates
): Promise<RoadRouteResult | null> {
  if (!isValidCoord(from) || !isValidCoord(to)) return null;

  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
    `?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = (await response.json()) as {
      code?: string;
      routes?: Array<{
        distance?: number;
        duration?: number;
        geometry?: { coordinates?: number[][] };
      }>;
    };
    if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates?.length) {
      return null;
    }

    const route = data.routes[0];
    const coordinates = route.geometry!.coordinates!.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));

    return {
      coordinates,
      distanceKm: (route.distance ?? 0) / 1000,
      durationMin: Math.round((route.duration ?? 0) / 60),
    };
  } catch {
    return null;
  }
}
