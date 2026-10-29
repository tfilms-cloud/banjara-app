import type { GuideDetails } from '@/types/guide';

/** Service key from admin catalog (transport, hotel, tour, … or custom). */
export type ProviderServiceType = string;

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

export type ProviderBookingKind = 'transport' | 'hotel' | 'tour' | 'guide';

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
  /** Transporter sign-up — primary vehicle & driver verification */
  vehicleClass?: 'car' | 'jeep' | 'suv' | 'van' | 'mini_bus' | 'bus';
  ownerName?: string;
  vehicleModel?: string;
  vehicleMakeYear?: string;
  engineNumber?: string;
  registrationNumber?: string;
  driverName?: string;
  driverPhone?: string;
  driverEmail?: string;
  driverPermanentAddress?: string;
  driverCnic?: string;
  hasInsurance?: 'yes' | 'no';
  insuranceCompany?: string;
  insuranceNumber?: string;
  insuranceYear?: string;
  driverExperienceYears?: string;
  driverLicenseNumber?: string;
  vehicleImageFront?: string;
  vehicleImageBack?: string;
  driverPhoto?: string;
  driverEmergencyContact?: string;
}

export interface ProviderHotelSetup {
  hotelName: string;
  hotelType: 'hotel' | 'resort' | 'guestHouse' | 'lodge' | 'hostel';
  managerName: string;
  landline?: string;
  phone: string;
  address: string;
  village: string;
  district: string;
  city: string;
  latitude: number;
  longitude: number;
  googleMapsUrl?: string;
  businessRegistered: 'yes' | 'no' | '';
  businessRegistrationNumber: string;
  yearsExperience: number;
  website?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialTiktok?: string;
  restaurantAvailable: 'yes' | 'no' | '';
  outlookImages: string[];
  roomImages: string[];
  restaurantImages: string[];
  description: string;
  email: string;
  checkInTime: string;
  checkOutTime: string;
  amenities: string[];
  /** Combined gallery (outlook + rooms + restaurant) for listings */
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
  /** Guide listing — male / female classification */
  gender?: 'male' | 'female';
  /** Regional languages the guide speaks (e.g. Balti, Shina) */
  regionalLanguages?: string[];
  /** International languages (e.g. English, Chinese) */
  internationalLanguages?: string[];
  /** Years guiding / field experience */
  yearsExperience?: number;
  /** Work history, past expeditions, background story */
  experienceHistory?: string;
  /** Specialties e.g. trekking, cultural, mountaineering */
  specialties?: string[];
  /** Areas / regions the guide operates in */
  operatingAreas?: string[];
  /** Optional licenses or certifications */
  certifications?: string[];
  /** Daily hire rate in PKR (guides only) */
  dailyHireRate?: number;
}

export interface ProviderRestaurantOffer {
  id: string;
  title: string;
  type: 'sale' | 'offer' | 'discount';
  discountPercent?: number;
  description?: string;
  active: boolean;
}

export interface ProviderRestaurantSetup {
  restaurantName: string;
  cuisineTypes: string[];
  menuVariety: string[];
  city: string;
  address: string;
  phone: string;
  description: string;
  images: string[];
  offers: ProviderRestaurantOffer[];
  hours?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
}

export interface ProviderVehicle {
  verificationDetails?: Partial<ProviderTransportSetup>;
  registrationCompletedAt?: string;
  id: string;
  providerId: string;
  name: string;
  type: 'van' | 'minibus' | 'bus' | 'car' | 'suv' | 'other';
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
  /** Units currently free for booking */
  availableCount?: number;
  discountPercent?: number;
  offerNote?: string;
}

export interface HotelCheckInDetails {
  guestName: string;
  cnic: string;
  phone: string;
  roomsAvailed: number;
  days: number;
  guests: number;
  checkedInAt: string;
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
  bookingMode?: 'seat' | 'vehicle';
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

export interface ProviderBookingPassenger {
  name: string;
  phone?: string;
  age?: number;
  gender?: string;
  seat?: string;
}

export interface ProviderBooking {
  id: string;
  bookingCode: string;
  providerId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  kind: ProviderBookingKind;
  /** Linked trip for transport seat bookings */
  tripId?: string;
  /** Linked tour package / itinerary */
  itineraryId?: string;
  serviceLabel: string;
  detailLabel: string;
  date: string;
  time?: string;
  arrivalTime?: string;
  seatsOrRoom: string;
  seats: string[];
  passengerCount: number;
  passengers: ProviderBookingPassenger[];
  amount: number;
  subtotal?: number;
  tax?: number;
  serviceFee?: number;
  discount?: number;
  currency: string;
  paymentId?: string;
  paymentStatus:
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
  status: ProviderBookingStatus;
  routeLabel?: string;
  origin?: string;
  destination?: string;
  pickup?: string;
  pickupAddress?: string;
  dropoff?: string;
  dropoffAddress?: string;
  vehicleName?: string;
  vehicleType?: string;
  vehiclePlate?: string;
  journeyType?: string;
  bookingMode?: string;
  tripDescription?: string;
  notes?: string;
  specialRequests?: string;
  createdAt?: string;
  updatedAt?: string;
  hotelName?: string;
  roomName?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  guestsCount?: number;
  roomsCount?: number;
  checkInDetails?: HotelCheckInDetails;
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
  /** BANJARA commission % from this provider's service type */
  platformFeePercent?: number;
  /** Service key the fee came from (transport, hotel, …) */
  serviceKey?: string | null;
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
  onboardingProgress?: {
    nextStep: 'business' | 'location' | 'transport' | 'vehicle' | 'verification' | 'review' | 'submitted';
    completed: boolean;
    completedSteps?: string[];
    vehicleId?: string;
    submittedAt?: string;
  };
  identityVerification?: { verificationStatus: string; cnicVerified: boolean };
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
  guideDetails?: GuideDetails;
  restaurant?: ProviderRestaurantSetup;
  /** Public gallery URLs returned by /providers/public/:id */
  galleryImages?: string[];
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
  guide?: Partial<GuideDetails>;
  restaurant?: Partial<ProviderRestaurantSetup>;
  vehicles: ProviderVehicle[];
  rooms: ProviderRoom[];
}
