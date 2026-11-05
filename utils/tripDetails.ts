import type { TripWithDetails } from '@/types/trip';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

const UNAVAILABLE_STATUSES = new Set(['cancelled', 'completed', 'departed']);

export function tripAvailability(trip: TripWithDetails) {
  const unavailable = UNAVAILABLE_STATUSES.has(
    String(trip.status ?? '')
      .trim()
      .toLowerCase(),
  );
  const soldOut = trip.availableSeats <= 0;
  return { unavailable, soldOut, canBook: !unavailable && !soldOut };
}

export function tripPhotos(trip: TripWithDetails) {
  return [
    ...new Set(
      [trip.image, ...(trip.vehicleImages ?? [])]
        .map((uri) => normalizeMediaUrl(uri))
        .filter((uri): uri is string => Boolean(uri)),
    ),
  ];
}
