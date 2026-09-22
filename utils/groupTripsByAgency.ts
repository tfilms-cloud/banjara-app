import type { Agency, TripWithDetails } from '@/types/trip';

export type AgencyTripGroup = {
  agencyId: string;
  agency: Agency;
  trips: TripWithDetails[];
  tripCount: number;
  fromPrice: number;
  currency: string;
  routes: string[];
  oneWayCount: number;
  roundTripCount: number;
};

/** One card per business — collapses duplicate agencies in trending lists. */
export function groupTripsByAgency(trips: TripWithDetails[]): AgencyTripGroup[] {
  const map = new Map<string, AgencyTripGroup>();

  for (const trip of trips) {
    const id = trip.agencyId || trip.agency.id;
    if (!id) continue;

    const existing = map.get(id);
    if (!existing) {
      map.set(id, {
        agencyId: id,
        agency: trip.agency,
        trips: [trip],
        tripCount: 1,
        fromPrice: trip.price,
        currency: trip.currency || 'PKR',
        routes: [`${trip.from} → ${trip.to}`],
        oneWayCount: trip.journeyType === 'round_trip' ? 0 : 1,
        roundTripCount: trip.journeyType === 'round_trip' ? 1 : 0,
      });
      continue;
    }

    existing.trips.push(trip);
    existing.tripCount += 1;
    existing.fromPrice = Math.min(existing.fromPrice, trip.price);
    const route = `${trip.from} → ${trip.to}`;
    if (!existing.routes.includes(route)) existing.routes.push(route);
    if (trip.journeyType === 'round_trip') existing.roundTripCount += 1;
    else existing.oneWayCount += 1;
  }

  return Array.from(map.values()).sort((a, b) => b.tripCount - a.tripCount);
}
