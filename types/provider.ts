export type ProviderServiceType =
  | 'transport'
  | 'hotel'
  | 'tour'
  | 'carRental'
  | 'travelAgency'
  | 'travelGuide'
  | 'guestHouse'
  | 'bus'
  | 'van';

export type ProviderVerificationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type ProviderDocumentStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';

export type ProviderServiceStatus = 'active' | 'paused' | 'draft';

export type ProviderBookingStatus =
  | 'pending'
  | 'upcoming'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type ProviderBookingKind = 'transport' | 'hotel' | 'tour';

export type RoomAvailabilityStatus = 'available' | 'booked' | 'blocked' | 'maintenance';

export interface ProviderDocument {
  id: string;
  label: string;
  category: 'business' | 'license' | 'vehicle' | 'hotel' | 'other';
  status: ProviderDocumentStatus;
}

export interface ProviderBusinessInfo {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  description: string;
  city: string;
  address: string;
  yearsExperience: number;
  website?: string;
  socialMedia?: string;
}

export interface ProviderTransportSetup {
  businessName: string;
  vehicleTypes: string[];
  vehicleCount: number;
  ownershipType: 'owned' | 'leased' | 'mixed';
  operatingCities: string[];
  operatingRoutes: string[];
  pickupLocations: string[];
  dropoffLocations: string[];
  description: string;
  pricingMethod: 'per_seat' | 'per_vehicle' | 'negotiable';
  priceAmount?: number;
  pricePercent?: number;
}

export interface ProviderHotelSetup {
  hotelName: string;
  hotelType: 'hotel' | 'resort' | 'guest_house' | 'lodge';
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  description: string;
  phone: string;
  email: string;
  checkInTime: string;
  checkOutTime: string;
  amenities: string[];
  images: string[];
}

export interface ProviderTourSetup {
  companyName: string;
  tourName: string;
  description: string;
  destination: string;
  duration: string;
  departureLocation: string;
  pickupLocations: string[];
  price: number;
  maxParticipants: number;
  included: string[];
  excluded: string[];
  images: string[];
}

export interface ProviderVehicle {
  id: string;
  providerId: string;
  name: string;
  type: 'van' | 'minibus' | 'bus' | 'car';
  model: string;
  year: number;
  registrationNumber: string;
  totalSeats: number;
  amenities: string[];
  images: string[];
  active: boolean;
  status: 'pending' | 'active' | 'rejected' | 'suspended';
  rejectionReason?: string;
}

export interface ProviderRoom {
  id: string;
  providerId: string;
  name: string;
  roomType: 'single' | 'double' | 'twin' | 'deluxe' | 'suite' | 'family';
  capacity: number;
  bedType: string;
  sizeSqm: number;
  pricePerNight: number;
  quantity: number;
  amenities: string[];
  breakfastIncluded: boolean;
  freeCancellation: boolean;
  images: string[];
  available: boolean;
}

export interface ProviderTrip {
  id: string;
  providerId: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  vehicleId: string;
  pickupPoints: string[];
  dropoffPoints: string[];
  price: number;
  totalSeats: number;
  bookedSeats: number;
  amenities: string[];
  description: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  journeyType?: 'one_way' | 'round_trip';
  returnDate?: string;
  returnTime?: string;
}

export interface ProviderRoute {
  id: string;
  providerId: string;
  origin: string;
  destination: string;
  stops: string[];
  pickupPoints: string[];
  dropoffPoints: string[];
  durationHours: number;
  distanceKm: number;
  originLatitude?: number;
  originLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
}

export interface ProviderServiceItem {
  id: string;
  type: ProviderServiceType;
  label: string;
  status: ProviderServiceStatus;
}

export interface ProviderBooking {
  id: string;
  bookingCode: string;
  providerId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  kind: ProviderBookingKind;
  serviceLabel: string;
  detailLabel: string;
  date: string;
  time?: string;
  seatsOrRoom: string;
  amount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  status: ProviderBookingStatus;
  pickup?: string;
  notes?: string;
}

export interface ProviderPassenger {
  id: string;
  bookingId: string;
  name: string;
  seat: string;
  pickup: string;
  dropoff: string;
  phone: string;
  status: string;
}

export interface ProviderEarningsSummary {
  totalRevenue: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  pendingPayout: number;
  completedPayout: number;
  platformFees: number;
  netEarnings: number;
  byDay: { label: string; amount: number }[];
  byMonth: { label: string; amount: number }[];
  byService: { label: string; amount: number }[];
  byRoute: { label: string; amount: number }[];
}

export interface ProviderReview {
  id: string;
  providerId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  reply?: string;
  serviceLabel: string;
}

export interface ProviderMessageThread {
  id: string;
  customerName: string;
  bookingCode: string;
  serviceLabel: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

export interface ProviderChatMessage {
  id: string;
  threadId: string;
  sender: 'provider' | 'customer';
  text: string;
  timestamp: string;
}

export interface ProviderNotification {
  id: string;
  title: string;
  body: string;
  type:
    | 'new_booking'
    | 'booking_cancelled'
    | 'payment_received'
    | 'trip_reminder'
    | 'hotel_booking'
    | 'new_review'
    | 'verification'
    | 'system';
  read: boolean;
  createdAt: string;
}

export interface RoomAvailabilityDay {
  date: string;
  status: RoomAvailabilityStatus;
  priceOverride?: number;
  roomId: string;
}

export interface ProviderDashboardStats {
  todaysBookings: number;
  pendingBookings: number;
  todaysRevenue: number;
  availableSeats?: number;
  occupiedSeats?: number;
  todaysTrips?: number;
  todaysCheckIns?: number;
  availableRooms?: number;
  occupiedRooms?: number;
}

export interface Provider {
  id: string;
  userId: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  description: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  locationUpdatedAt?: string;
  structuredAddress?: {
    street?: string;
    area?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    formattedAddress?: string;
  };
  logo?: string;
  services: ProviderServiceType[];
  verificationStatus: ProviderVerificationStatus;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  website?: string;
  socialMedia?: string;
  transport?: ProviderTransportSetup;
  hotel?: ProviderHotelSetup;
  tour?: ProviderTourSetup;
  documents: ProviderDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface ProviderOnboardingDraft {
  personal: {
    name: string;
    email: string;
    phone: string;
    password: string;
  };
  selectedServices: ProviderServiceType[];
  business: Partial<ProviderBusinessInfo>;
  location?: {
    latitude: number;
    longitude: number;
    placeName?: string;
    address: {
      street?: string;
      area?: string;
      city?: string;
      region?: string;
      postalCode?: string;
      country?: string;
      formattedAddress?: string;
    };
  };
  transport?: Partial<ProviderTransportSetup>;
  hotel?: Partial<ProviderHotelSetup>;
  tour?: Partial<ProviderTourSetup>;
  vehicles: ProviderVehicle[];
  rooms: ProviderRoom[];
}
