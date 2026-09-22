import { useMemo } from 'react';
import { PickupMap } from '@/components/map/PickupMap';
import { isValidCoord } from '@/components/map/mapHelpers';
import type { PickupPoint } from '@/types/route';
import type { TripWithDetails } from '@/types/trip';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatTime } from '@/utils/formatTime';

type TripResultsMapProps = {
  trips: TripWithDetails[];
  selectedTripId?: string;
  onSelectTrip?: (trip: TripWithDetails) => void;
  height?: number;
};

function tripToMapPoint(trip: TripWithDetails): PickupPoint | null {
  const point = trip.pickupLocations.find((item) => isValidCoord(item.coordinates));
  if (!point) return null;
  return {
    id: trip.id,
    name: `${trip.from} → ${trip.to}`,
    address: `${trip.agency.name} · ${formatTime(trip.departureTime)} · ${formatCurrency(trip.price, trip.currency)}`,
    time: point.time || trip.departureTime,
    distanceKm: point.distanceKm ?? 0,
    coordinates: point.coordinates,
  };
}

export function tripsWithMapPoints(trips: TripWithDetails[]) {
  return trips.filter((trip) => tripToMapPoint(trip) != null);
}

export function TripResultsMap({
  trips,
  selectedTripId,
  onSelectTrip,
  height = 280,
}: TripResultsMapProps) {
  const points = useMemo(
    () => trips.map(tripToMapPoint).filter((item): item is PickupPoint => item != null),
    [trips]
  );

  if (!points.length) return null;

  return (
    <PickupMap
      pickups={points}
      selectedPickupId={selectedTripId ?? points[0]?.id}
      onSelectPickup={(point) => {
        const trip = trips.find((item) => item.id === point.id);
        if (trip) onSelectTrip?.(trip);
      }}
      height={height}
      showControls
      showSelectedCard
      allowFullscreen
      title={`${trips[0]?.from ?? 'Origin'} → ${trips[0]?.to ?? 'Destination'}`}
      pointNoun="trip"
    />
  );
}
