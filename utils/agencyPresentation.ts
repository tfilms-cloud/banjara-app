import type { ProviderTransportSetup } from '@/types/provider';
import type { TripWithDetails } from '@/types/trip';
import { withoutDriverPhoto } from '@/utils/agencyGallery';
import { fleetDetails } from '@/utils/providerDetails';
import { tripAvailability } from '@/utils/tripDetails';
import { uniqueAreaNames } from '@/utils/serviceArea';

export function agencyDepartures(trips: TripWithDetails[], now = new Date()) {
  const cutoff = now.getTime();
  const departure = (trip: TripWithDetails) => {
    if (trip.departureTime.includes('T')) return Date.parse(trip.departureTime);
    const day = trip.date.slice(0, 10);
    const time = /^\d{2}:\d{2}/.test(trip.departureTime) ? trip.departureTime.slice(0, 5) : '00:00';
    return Date.parse(`${day}T${time}:00`);
  };
  return trips
    .filter(
      (trip) =>
        tripAvailability(trip).canBook &&
        Number.isFinite(trip.availableSeats) &&
        trip.availableSeats > 0 &&
        Number.isFinite(trip.price) &&
        trip.price >= 0 &&
        Number.isFinite(departure(trip)) &&
        departure(trip) >= cutoff,
    )
    .sort((a, b) => departure(a) - departure(b));
}

/** Amenities/photos from a trip may describe the primary vehicle only when its plate matches. */
export function agencyVehicle(
  transport: ProviderTransportSetup | undefined,
  trips: TripWithDetails[],
) {
  const fleet = fleetDetails(transport, trips);
  const linked = fleet.linkedTrip;
  const photos = withoutDriverPhoto(
    [
      transport?.vehicleImageFront ?? '',
      transport?.vehicleImageBack ?? '',
      ...(linked?.vehicleImages ?? []),
      linked?.image ?? '',
    ],
    transport?.driverPhoto,
  );
  return { ...fleet, photos, amenities: [...new Set(linked?.amenities ?? [])] };
}

export function agencyNetwork(trips: TripWithDetails[], registered: string[] = []) {
  return uniqueAreaNames([...trips.map((trip) => `${trip.from} → ${trip.to}`), ...registered]);
}
