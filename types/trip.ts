export type VehicleType = 'van' | 'bus' | 'car' | 'tour' | 'private';

export type Amenity =
  | 'AC'
  | 'WiFi'
  | 'Charging'
  | 'Comfortable Seats'
  | 'Luggage'
  | 'Refreshments'
  | 'Entertainment';

export interface Agency {
  id: string;
  name: string;
  logo: string;
  rating: number;
  reviewCount: number;
  phone: string;
  email: string;
  description: string;
  /** From provider profile when populated on trips */
  verified?: boolean;
  /** Linked User id — needed for existing chat, when the API sends it */
  userId?: string;
  city?: string;
  address?: string;
  website?: string;
  /** Backend enum values such as transport, hotel, tour, carRental */
  services?: string[];
  yearsExperience?: number;
}

export interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  tripId: string;
  providerReply?: string;
}

export interface TripStop {
  name: string;
  time: string;
  order: number;
}

export interface Trip {
  id: string;
  agencyId: string;
  vehicleId: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  date: string;
  price: number;
  currency: string;
  availableSeats: number;
  totalSeats: number;
  rating: number;
  pickupPointIds: string[];
  dropoffPointIds: string[];
  stops: TripStop[];
  amenities: Amenity[];
  image: string;
  popular?: boolean;
  recommended?: boolean;
  /** one_way = destination only; round_trip = go & return */
  journeyType?: 'one_way' | 'round_trip';
  returnDate?: string;
  returnTime?: string;
  /** Provider-written trip notes, when the API sends them */
  description?: string;
  /** Backend trip status such as scheduled, cancelled, completed */
  status?: string;
  originCoordinates?: import('./route').Coordinates;
  destinationCoordinates?: import('./route').Coordinates;
}

export interface TripWithDetails extends Trip {
  agency: Agency;
  vehicleType: VehicleType;
  vehicleName: string;
  /** Registration / plate from the linked vehicle (display only). */
  vehiclePlate?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  /** Permanent vehicle capacity (seatCount). Differs from trip availableSeats. */
  vehicleCapacity?: number;
  vehicleImages?: string[];
  pickupLocations: import('./route').PickupPoint[];
}

export interface SearchParams {
  from: string;
  to: string;
  date: string;
  passengers: number;
  /** Preferred journey when searching from Transport vs Trips mode */
  journeyType?: 'one_way' | 'round_trip';
  returnDate?: string;
}

export interface TripFilters {
  minPrice?: number;
  maxPrice?: number;
  departureTime?: 'morning' | 'afternoon' | 'evening' | 'night';
  arrivalTime?: 'morning' | 'afternoon' | 'evening' | 'night';
  vehicleTypes?: VehicleType[];
  minRating?: number;
  minSeats?: number;
  pickupLocation?: string;
  journeyType?: 'one_way' | 'round_trip';
  /** Client-side only — match trips already returned for this search */
  providerIds?: string[];
}

export type TripSortBy =
  | 'recommended'
  | 'price_asc'
  | 'price_desc'
  | 'departure'
  | 'departure_desc'
  | 'rating'
  | 'duration';
