import type { ProviderTransportSetup } from '@/types/provider';
import type { TripWithDetails } from '@/types/trip';

const text = (value?: string) => value?.trim() || '';
const plateKey = (value?: string) =>
  text(value).replace(/[\s-]/g, '').toUpperCase();
export const vehicleLabel = (value?: string) =>
  text(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export function publicWebsite(value?: string): string | undefined {
  const raw = text(value);
  if (!raw || (/^[a-z][a-z\d+.-]*:/i.test(raw) && !/^https?:\/\//i.test(raw)))
    return undefined;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return ['http:', 'https:'].includes(url.protocol) &&
      url.hostname &&
      !url.username &&
      !url.password
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export function fleetDetails(
  transport: ProviderTransportSetup | undefined,
  trips: TripWithDetails[],
) {
  const hasPrimary = Boolean(
    transport?.vehicleClass ||
      text(transport?.vehicleModel) ||
      text(transport?.registrationNumber) ||
      text(transport?.vehicleMakeYear),
  );
  // A trip's seats belong to its own vehicle. Never attach them to an unrelated primary vehicle.
  const linkedTrip = hasPrimary
    ? trips.find(
        (trip) =>
          plateKey(transport?.registrationNumber) &&
          plateKey(trip.vehiclePlate) ===
            plateKey(transport?.registrationNumber),
      )
    : trips[0];
  const kind = hasPrimary
    ? vehicleLabel(transport?.vehicleClass)
    : vehicleLabel(linkedTrip?.vehicleType);
  const model = hasPrimary
    ? text(transport?.vehicleModel)
    : text(linkedTrip?.vehicleModel) ||
      text(linkedTrip?.vehicleBrand) ||
      text(linkedTrip?.vehicleName);
  const plate = hasPrimary
    ? text(transport?.registrationNumber)
    : text(linkedTrip?.vehiclePlate);
  const capacity = Number(linkedTrip?.vehicleCapacity);
  const facts = [
    { label: 'Vehicle model', value: model },
    {
      label: 'Manufacture year',
      value: hasPrimary ? text(transport?.vehicleMakeYear) : '',
    },
    { label: 'Registration plate', value: plate },
    {
      label: 'Passenger capacity',
      value:
        Number.isInteger(capacity) && capacity > 0
          ? `${capacity} ${capacity === 1 ? 'seat' : 'seats'}`
          : '',
    },
  ].filter((fact) => fact.value);
  const types = Array.from(
    new Set((transport?.vehicleTypes ?? []).map(vehicleLabel).filter(Boolean)),
  );
  const fleetCount = Number(transport?.vehicleCount);
  return {
    kind,
    facts,
    types,
    fleetCount:
      Number.isInteger(fleetCount) && fleetCount > 0 ? fleetCount : undefined,
    hasPrimary,
  };
}

export function tripFareGroups(trips: TripWithDetails[]) {
  const groups = new Map<
    string,
    { amount: number; currency: string; unit: string }
  >();
  for (const trip of trips) {
    if (!Number.isFinite(trip.price) || trip.price < 0) continue;
    const currency = text(trip.currency).toUpperCase() || 'PKR';
    const unit = trip.bookingMode === 'vehicle' ? 'vehicle' : 'seat';
    const key = `${currency}:${unit}`;
    const previous = groups.get(key);
    if (!previous || trip.price < previous.amount)
      groups.set(key, { amount: trip.price, currency, unit });
  }
  return [...groups.values()];
}
