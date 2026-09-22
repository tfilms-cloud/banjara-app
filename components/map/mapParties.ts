import type { MapPerson, MapVehicleInfo } from '@/components/map/mapHelpers';
import type { PassengerDetails } from '@/types/booking';
import type { TripWithDetails } from '@/types/trip';
import type { User } from '@/types/user';
import { vehicleTypeLabel } from '@/utils/helpers';

export function mapTravelerFromUser(user?: User | null): MapPerson | null {
  if (!user) return null;
  return {
    name: user.name || 'Traveler',
    phone: user.phone || undefined,
    avatarUrl: user.avatar,
    label: 'You',
  };
}

export function mapTravelerFromPassenger(
  passenger?: PassengerDetails | null,
  fallbackUser?: User | null
): MapPerson | null {
  if (passenger?.name) {
    return {
      name: passenger.name,
      phone: passenger.phone || fallbackUser?.phone,
      avatarUrl: fallbackUser?.avatar,
      label: 'Traveler',
    };
  }
  return mapTravelerFromUser(fallbackUser);
}

export function mapVehicleFromTrip(trip?: TripWithDetails | null): MapVehicleInfo | null {
  if (!trip) return null;
  return {
    name: trip.vehicleName || 'Vehicle',
    typeLabel: vehicleTypeLabel(trip.vehicleType),
    plate: trip.vehiclePlate,
    imageUrl: trip.vehicleImages?.[0] || trip.image,
    phone: trip.agency.phone || undefined,
    agencyName: trip.agency.name,
    agencyLogo: trip.agency.logo || undefined,
    rating: trip.agency.rating || trip.rating,
  };
}
