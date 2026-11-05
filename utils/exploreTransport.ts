import type { TripWithDetails } from '@/types/trip';
import type { ProviderTransportSetup } from '@/types/provider';
import { VEHICLE_TYPE_OPTIONS } from '@/constants/providerOptions';

type ProviderVehicleClass = NonNullable<ProviderTransportSetup['vehicleClass']>;
export type ExploreVehicleFilter = 'all' | ProviderVehicleClass | 'other';

const VEHICLE_FILTERS: Array<{ id: ExploreVehicleFilter; label: string }> = [
  { id: 'all', label: 'All' },
  ...VEHICLE_TYPE_OPTIONS.map((option) => ({
    id: option.value as ProviderVehicleClass,
    label: option.label,
  })),
  { id: 'other', label: 'Other' },
];

export function exploreVehicleClass(trip: TripWithDetails): ExploreVehicleFilter {
  const category = (trip.vehicleCategory || trip.vehicleType || '').trim().toLowerCase();
  if (category === 'minibus' || category === 'mini-bus') return 'mini_bus';
  if (category === 'private') return 'car';
  return (
    VEHICLE_FILTERS.find((option) => option.id !== 'all' && option.id === category)?.id ?? 'other'
  );
}

export function isExploreTripAvailable(trip: TripWithDetails) {
  return trip.availableSeats > 0 && !/cancelled|completed/i.test(trip.status ?? '');
}

/** Match the provider registration choices, showing only categories with bookable inventory. */
export function exploreVehicleFilters(trips: TripWithDetails[]) {
  const present = new Set(trips.filter(isExploreTripAvailable).map(exploreVehicleClass));
  return VEHICLE_FILTERS.filter((option) => option.id === 'all' || present.has(option.id));
}

/** One published, bookable listing per vehicle, represented by its lowest available fare. */
export function exploreVehicles(trips: TripWithDetails[], filter: ExploreVehicleFilter) {
  const vehicles = new Map<string, TripWithDetails>();
  for (const trip of trips) {
    if (!isExploreTripAvailable(trip)) continue;
    if (filter !== 'all' && exploreVehicleClass(trip) !== filter) continue;
    const identity = trip.vehicleId || `${trip.vehicleName || trip.vehicleType}-${trip.agencyId}`;
    const key = `${trip.agencyId}-${identity}`;
    const current = vehicles.get(key);
    if (!current || trip.price < current.price) vehicles.set(key, trip);
  }
  return [...vehicles.values()];
}
