export type HotelType = 'hotel' | 'resort' | 'guest_house' | 'lodge' | 'homestay';

export type HotelAmenity =
  | 'WiFi'
  | 'Air Conditioning'
  | 'Breakfast'
  | 'Parking'
  | 'Restaurant'
  | 'Room Service'
  | 'Swimming Pool'
  | 'Mountain View'
  | '24/7 Reception'
  | 'Airport Transfer'
  | 'Heating'
  | 'Laundry';

export type HotelBookingStatus = 'pending' | 'upcoming' | 'confirmed' | 'completed' | 'cancelled';
export type HotelPaymentMethod =
  | 'card'
  | 'wallet'
  | 'cash'
  | 'bankTransfer'
  | 'easypaisa'
  | 'jazzcash'
  | 'raast';
export type HotelPaymentStatus =
  | 'pending'
  | 'unpaid'
  | 'payment_initiated'
  | 'proof_submitted'
  | 'under_review'
  | 'paid'
  | 'confirmed'
  | 'rejected'
  | 'disputed'
  | 'failed'
  | 'refunded'
  | 'refund_pending'
  | 'expired';
export type HotelSortBy =
  | 'recommended'
  | 'price_asc'
  | 'price_desc'
  | 'rating'
  | 'distance';

export interface HotelLocation {
  city: string;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

export interface HotelRoom {
  id: string;
  hotelId: string;
  name: string;
  images: string[];
  bedType: string;
  capacity: number;
  sizeSqm: number;
  amenities: HotelAmenity[];
  breakfastIncluded: boolean;
  freeCancellation: boolean;
  pricePerNight: number;
  availableRooms: number;
  description: string;
  roomType?: string;
}

export interface Hotel {
  id: string;
  name: string;
  description: string;
  images: string[];
  location: HotelLocation;
  rating: number;
  reviewCount: number;
  hotelType: HotelType;
  amenities: HotelAmenity[];
  roomIds: string[];
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  priceFrom: number;
  featured?: boolean;
  popular?: boolean;
  isVerified?: boolean;
  freeCancellation?: boolean;
  breakfastIncluded?: boolean;
  phone: string;
  email: string;
  /** Owning provider profile id (for P2P payment accounts) */
  providerId?: string;
  /** Provider lodging profile fields (from hotelDetails) */
  managerName?: string;
  village?: string;
  district?: string;
  landline?: string;
  yearsExperience?: number;
  restaurantAvailable?: boolean;
  googleMapsUrl?: string;
  website?: string;
  businessRegistered?: boolean;
}

export interface HotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  /** Free-text match on hotel name, city, or area */
  query?: string;
}

export interface HotelFilters {
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  hotelTypes?: HotelType[];
  amenities?: HotelAmenity[];
  maxDistanceKm?: number;
  breakfastIncluded?: boolean;
  freeCancellation?: boolean;
}

export interface HotelGuest {
  name: string;
  email: string;
  phone: string;
  specialRequests?: string;
}

export interface HotelPriceBreakdown {
  pricePerNight: number;
  nights: number;
  rooms: number;
  roomSubtotal: number;
  tax: number;
  serviceFee: number;
  discount: number;
  total: number;
  currency: string;
}

export interface HotelBooking {
  id: string;
  bookingCode: string;
  hotelId: string;
  roomId: string;
  userId: string;
  providerId?: string;
  providerUserId?: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  guest: HotelGuest;
  paymentMethod: HotelPaymentMethod;
  paymentStatus: HotelPaymentStatus;
  paymentId?: string;
  status: HotelBookingStatus;
  priceBreakdown: HotelPriceBreakdown;
  createdAt: string;
  qrPayload: string;
  /** Reserved for future transport + hotel packages */
  transportBookingId?: string;
  packageId?: string;
}

export interface CreateHotelBookingPayload {
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  guest: HotelGuest;
  paymentMethod: HotelPaymentMethod;
}

export interface HotelDestination {
  id: string;
  name: string;
  image: string;
  hotelCount: number;
  avgPrice: number;
}
