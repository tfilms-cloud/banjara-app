import { serviceLabel } from '@/constants/providerOptions';
import type { AppNotification, Booking, BookingStatus, PaymentMethod, PaymentStatus } from '@/types/booking';
import type {
  Hotel,
  HotelAmenity,
  HotelBooking,
  HotelBookingStatus,
  HotelPaymentMethod,
  HotelRoom,
  HotelType,
} from '@/types/hotel';
import type {
  Provider,
  ProviderBooking,
  ProviderBookingStatus,
  ProviderDashboardStats,
  ProviderEarningsSummary,
  ProviderHotelSetup,
  ProviderReview,
  ProviderRoom,
  ProviderRoute,
  ProviderServiceItem,
  ProviderServiceType,
  ProviderTourSetup,
  ProviderTransportSetup,
  ProviderTrip,
  ProviderVehicle,
  RoomAvailabilityDay,
} from '@/types/provider';
import type { Coordinates, PickupPoint, RouteInfo } from '@/types/route';
import type { Seat, SeatLayout, SeatStatus } from '@/types/seat';
import type { Agency, Amenity, Review, Trip, TripWithDetails, VehicleType } from '@/types/trip';
import type { ProviderAccountStatus, User, UserRole } from '@/types/user';
import { resolveCoordinates } from '@/constants/geoPlaces';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

export type AnyRecord = Record<string, unknown>;

function mediaUrl(value: unknown): string | undefined {
  return normalizeMediaUrl(value ? String(value) : undefined);
}

function mediaUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => mediaUrl(item)).filter(Boolean) as string[];
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function asRecord(value: unknown): AnyRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as AnyRecord) : undefined;
}

function mapHotelSetup(raw: unknown): ProviderHotelSetup | undefined {
  const data = asRecord(raw);
  if (!data || (!data.hotelName && !data.address && !data.city)) return undefined;
  const hotelTypeRaw = String(data.hotelType ?? 'hotel');
  const hotelType: ProviderHotelSetup['hotelType'] =
    hotelTypeRaw === 'resort' || hotelTypeRaw === 'guest_house' || hotelTypeRaw === 'lodge'
      ? hotelTypeRaw
      : 'hotel';
  return {
    hotelName: String(data.hotelName ?? ''),
    hotelType,
    address: String(data.address ?? ''),
    city: String(data.city ?? ''),
    latitude: Number(data.latitude ?? 0),
    longitude: Number(data.longitude ?? 0),
    description: String(data.description ?? ''),
    phone: String(data.phone ?? ''),
    email: String(data.email ?? ''),
    checkInTime: String(data.checkInTime ?? '14:00'),
    checkOutTime: String(data.checkOutTime ?? '12:00'),
    amenities: stringList(data.amenities),
    images: mediaUrls(data.images).length ? mediaUrls(data.images) : stringList(data.images),
  };
}

function mapTransportSetup(raw: unknown): ProviderTransportSetup | undefined {
  const data = asRecord(raw);
  if (!data || (!data.businessName && !stringList(data.operatingCities).length && !data.description)) {
    return undefined;
  }
  const ownership = String(data.ownershipType ?? 'owned');
  const pricing = String(data.pricingMethod ?? 'per_seat');
  return {
    businessName: String(data.businessName ?? ''),
    vehicleTypes: stringList(data.vehicleTypes),
    vehicleCount: Number(data.vehicleCount ?? 0),
    ownershipType: ownership === 'leased' || ownership === 'mixed' ? ownership : 'owned',
    operatingCities: stringList(data.operatingCities),
    operatingRoutes: stringList(data.operatingRoutes),
    pickupLocations: stringList(data.pickupLocations),
    dropoffLocations: stringList(data.dropoffLocations),
    description: String(data.description ?? ''),
    pricingMethod: pricing === 'per_vehicle' || pricing === 'negotiable' ? pricing : 'per_seat',
    priceAmount: Number.isFinite(Number(data.priceAmount)) && Number(data.priceAmount) > 0 ? Number(data.priceAmount) : undefined,
    pricePercent:
      data.pricePercent == null || data.pricePercent === ''
        ? undefined
        : Number(data.pricePercent),
  };
}

function mapTourSetup(raw: unknown): ProviderTourSetup | undefined {
  const data = asRecord(raw);
  if (!data || (!data.tourName && !data.destination && !data.companyName)) return undefined;
  return {
    companyName: String(data.companyName ?? ''),
    tourName: String(data.tourName ?? ''),
    description: String(data.description ?? ''),
    destination: String(data.destination ?? ''),
    duration: String(data.duration ?? ''),
    departureLocation: String(data.departureLocation ?? ''),
    pickupLocations: stringList(data.pickupLocations),
    price: Number(data.price ?? 0),
    maxParticipants: Number(data.maxParticipants ?? 0),
    included: stringList(data.included),
    excluded: stringList(data.excluded),
    images: mediaUrls(data.images).length ? mediaUrls(data.images) : stringList(data.images),
  };
}

export function idOf(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    const obj = value as AnyRecord;
    if (obj.id != null) return String(obj.id);
    if (obj._id != null) return String(obj._id);
  }
  return '';
}

export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as AnyRecord).items)) {
    return (value as { items: T[] }).items;
  }
  return [];
}

export function mapUser(raw: AnyRecord): User {
  return {
    id: idOf(raw),
    name: String(raw.name ?? ''),
    email: String(raw.email ?? ''),
    phone: String(raw.phone ?? ''),
    avatar: mediaUrl(raw.avatar),
    role: (raw.role as UserRole) ?? 'customer',
    providerId: raw.providerId ? idOf(raw.providerId) : undefined,
    providerStatus: raw.providerStatus as ProviderAccountStatus | undefined,
    savedTripIds: Array.isArray(raw.savedTripIds) ? raw.savedTripIds.map(String) : [],
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

function mapAgency(provider: AnyRecord | undefined, fallbackId = ''): Agency {
  const p = provider ?? {};
  const services = Array.isArray(p.services)
    ? p.services.map((item) => String(item)).filter(Boolean)
    : [];
  const yearsExperience = Number(p.yearsExperience ?? 0);
  const userId = idOf(p.userId) || (typeof p.userId === 'string' ? p.userId : '');
  const city = String(p.city ?? '').trim();
  const formattedAddress =
    p.structuredAddress && typeof p.structuredAddress === 'object'
      ? String((p.structuredAddress as AnyRecord).formattedAddress ?? '')
      : '';
  const address = String(p.address ?? formattedAddress).trim();
  const website = String(p.website ?? '').trim();

  return {
    id: idOf(p) || fallbackId,
    name: String(p.businessName ?? p.name ?? 'Provider'),
    logo: mediaUrl(p.logo) ?? '',
    rating: Number(p.rating ?? 0),
    reviewCount: Number(p.totalReviews ?? p.reviewCount ?? 0),
    phone: String(p.phone ?? ''),
    email: String(p.email ?? ''),
    description: String(p.description ?? ''),
    verified: String(p.verificationStatus ?? '') === 'approved',
    userId: userId || undefined,
    city: city || undefined,
    address: address || undefined,
    website: website || undefined,
    services: services.length ? services : undefined,
    yearsExperience: yearsExperience > 0 ? yearsExperience : undefined,
  };
}

function mapVehicleType(type: unknown): VehicleType {
  const value = String(type ?? 'van');
  if (value === 'bus' || value === 'car' || value === 'tour' || value === 'private') return value;
  if (value === 'minibus' || value === 'tourVehicle') return 'van';
  return 'van';
}

function coordsOf(lat: unknown, lng: unknown): Coordinates | undefined {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  if (latitude === 0 && longitude === 0) return undefined;
  return { latitude, longitude };
}

function parseDurationMinutes(departureTime?: string, arrivalTime?: string): number {
  if (!departureTime || !arrivalTime) return 0;
  const [dh, dm] = departureTime.split(':').map(Number);
  const [ah, am] = arrivalTime.split(':').map(Number);
  if ([dh, dm, ah, am].some((n) => Number.isNaN(n))) return 0;
  let mins = ah * 60 + am - (dh * 60 + dm);
  if (mins < 0) mins += 24 * 60;
  return mins;
}

export function mapPickupPoint(raw: AnyRecord, tripId?: string): PickupPoint {
  const name = String(raw.name ?? '');
  const address = String(raw.address ?? '');
  return {
    id: idOf(raw),
    name,
    address,
    time: String(raw.time ?? raw.landmark ?? ''),
    distanceKm: Number(raw.distanceKm ?? 0),
    coordinates: resolveCoordinates(
      Number(raw.latitude ?? 0),
      Number(raw.longitude ?? 0),
      name,
      address
    ),
    tripId,
  };
}

export function mapSeatLayout(trip: AnyRecord): SeatLayout | null {
  const seatsRaw = Array.isArray(trip.seatLayout) ? trip.seatLayout : [];
  if (!seatsRaw.length) return null;

  const seats: Seat[] = seatsRaw.map((seat: AnyRecord) => {
    const backendStatus = String(seat.status ?? 'available');
    let status: SeatStatus = 'available';
    if (backendStatus === 'booked' || backendStatus === 'blocked') status = 'occupied';
    else if (backendStatus === 'reserved') status = 'reserved';

    return {
      id: String(seat.seatNumber ?? `${seat.row}-${seat.column}`),
      label: String(seat.seatNumber ?? ''),
      row: Number(seat.row ?? 1),
      column: Number(seat.column ?? 1),
      status,
      price: Number(trip.price ?? 0),
      isAisle: Number(seat.column) === 2,
    };
  });

  const rows = Math.max(...seats.map((s) => s.row), 1);
  const columns = Math.max(...seats.map((s) => s.column), 1);

  return {
    rows,
    columns,
    aisleAfterColumn: 2,
    seats,
  };
}

export function mapTrip(raw: AnyRecord): TripWithDetails {
  const provider =
    raw.providerId && typeof raw.providerId === 'object'
      ? (raw.providerId as AnyRecord)
      : undefined;
  const vehicle =
    raw.vehicleId && typeof raw.vehicleId === 'object'
      ? (raw.vehicleId as AnyRecord)
      : undefined;

  const pickupLocations = asArray<AnyRecord>(raw.pickupPoints)
    .filter((p) => typeof p === 'object')
    .map((p) => mapPickupPoint(p, idOf(raw)));

  const trip: Trip = {
    id: idOf(raw),
    agencyId: idOf(raw.providerId),
    vehicleId: idOf(raw.vehicleId),
    from: String(raw.origin ?? raw.from ?? ''),
    to: String(raw.destination ?? raw.to ?? ''),
    departureTime: String(raw.departureTime ?? ''),
    arrivalTime: String(raw.arrivalTime ?? ''),
    durationMinutes: parseDurationMinutes(
      String(raw.departureTime ?? ''),
      String(raw.arrivalTime ?? '')
    ),
    date: String(raw.departureDate ?? raw.date ?? ''),
    price: Number(raw.price ?? 0),
    currency: 'PKR',
    availableSeats: Number(raw.availableSeats ?? 0),
    totalSeats: Number(raw.totalSeats ?? 0),
    rating: Number(provider?.rating ?? raw.rating ?? 0),
    pickupPointIds: asArray<unknown>(raw.pickupPoints).map((p) => idOf(p)),
    dropoffPointIds: asArray<unknown>(raw.dropoffPoints).map((p) => idOf(p)),
    stops: [],
    amenities: (Array.isArray(raw.amenities) ? raw.amenities : [])
      .map((item) => String(item).trim())
      .filter(Boolean) as Amenity[],
    image: mediaUrl(
      (Array.isArray(vehicle?.images) && vehicle?.images[0]) ||
        (Array.isArray(raw.images) && (raw.images as string[])[0]) ||
        ''
    ) ?? '',
    popular: Boolean(raw.popular),
    recommended: Boolean(raw.recommended) || Number(provider?.rating ?? 0) >= 4.5,
    journeyType: String(raw.journeyType ?? 'one_way') === 'round_trip' ? 'round_trip' : 'one_way',
    returnDate: raw.returnDate ? String(raw.returnDate) : undefined,
    returnTime: raw.returnTime ? String(raw.returnTime) : undefined,
    description: String(raw.description ?? '').trim() || undefined,
    status: String(raw.status ?? '').trim() || undefined,
    originCoordinates: coordsOf(raw.originLat, raw.originLng),
    destinationCoordinates: coordsOf(raw.destinationLat, raw.destinationLng),
  };

  const vehicleImages = mediaUrls(
    Array.isArray(vehicle?.images) ? vehicle.images : trip.image ? [trip.image] : []
  );

  return {
    ...trip,
    agency: mapAgency(provider, trip.agencyId),
    vehicleType: mapVehicleType(vehicle?.type),
    vehicleName: String(vehicle?.name ?? 'Vehicle'),
    vehicleBrand: String(vehicle?.brand ?? '').trim() || undefined,
    vehicleModel: String(vehicle?.vehicleModel ?? '').trim() || undefined,
    vehiclePlate: vehicle?.registrationNumber
      ? String(vehicle.registrationNumber)
      : undefined,
    vehicleCapacity: Number(vehicle?.seatCount ?? raw.totalSeats ?? 0) || undefined,
    vehicleImages,
    pickupLocations,
  };
}

function mapFrontendBookingStatus(status: string): BookingStatus {
  if (status === 'pending' || status === 'confirmed') return 'upcoming';
  if (status === 'completed') return 'completed';
  if (status === 'cancelled' || status === 'refunded') return 'cancelled';
  return (status as BookingStatus) || 'upcoming';
}

function mapPaymentMethod(method: unknown): PaymentMethod {
  const value = String(method ?? 'card');
  if (value === 'mobileWallet' || value === 'wallet') return 'wallet';
  if (value === 'cash' || value === 'payAtHotel') return 'cash';
  return 'card';
}

export function toBackendPaymentMethod(
  method: PaymentMethod | HotelPaymentMethod
): 'card' | 'mobileWallet' | 'cash' | 'payAtHotel' {
  if (method === 'wallet') return 'mobileWallet';
  if (method === 'cash') return 'cash';
  return 'card';
}

export function mapTransportBooking(raw: AnyRecord): Booking {
  const transport = (raw.transportBooking ?? {}) as AnyRecord;
  const passengers = asArray<AnyRecord>(transport.passengerDetails);
  const firstPassenger = passengers[0] ?? {};

  return {
    id: idOf(raw),
    bookingCode: String(raw.bookingNumber ?? raw.bookingCode ?? ''),
    tripId: idOf(transport.tripId),
    userId: idOf(raw.customerId),
    providerId: idOf(raw.providerId),
    providerUserId: raw.providerUserId ? String(raw.providerUserId) : undefined,
    date: String(raw.createdAt ?? new Date().toISOString()).slice(0, 10),
    seats: asArray<string>(transport.seats).map(String),
    pickupPointId: idOf(transport.pickupPoint),
    passengers: Math.max(1, asArray(transport.seats).length || passengers.length || 1),
    passengerDetails: {
      name: String(firstPassenger.name ?? ''),
      email: String(firstPassenger.email ?? ''),
      phone: String(firstPassenger.phone ?? ''),
    },
    paymentMethod: mapPaymentMethod(raw.paymentMethod),
    paymentStatus: (raw.paymentStatus as PaymentStatus) ?? 'pending',
    status: mapFrontendBookingStatus(String(raw.bookingStatus ?? 'pending')),
    priceBreakdown: {
      ticketPrice: Number(raw.subtotal ?? 0),
      serviceFee: Number(raw.serviceFee ?? 0),
      discount: Number(raw.discount ?? 0),
      total: Number(raw.totalAmount ?? 0),
      currency: String(raw.currency ?? 'PKR'),
    },
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    qrPayload: String(raw.ticketQr ?? raw.bookingNumber ?? ''),
  };
}

function mapHotelType(type: unknown): HotelType {
  const value = String(type ?? 'hotel');
  if (value === 'guestHouse') return 'guest_house';
  if (value === 'resort' || value === 'lodge' || value === 'homestay' || value === 'guest_house') {
    return value as HotelType;
  }
  return 'hotel';
}

export function mapHotel(raw: AnyRecord): Hotel {
  const coords = Array.isArray((raw.location as AnyRecord | undefined)?.coordinates)
    ? ((raw.location as AnyRecord).coordinates as number[])
    : [0, 0];

  return {
    id: idOf(raw),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    images: mediaUrls(raw.images),
    location: {
      city: String(raw.city ?? ''),
      area: String(raw.area ?? raw.address ?? ''),
      address: String(raw.address ?? ''),
      latitude: Number(coords[1] ?? raw.latitude ?? 0),
      longitude: Number(coords[0] ?? raw.longitude ?? 0),
      distanceKm: Number(raw.distanceKm ?? 0),
    },
    rating: Number(raw.rating ?? 0),
    reviewCount: Number(raw.reviewCount ?? 0),
    hotelType: mapHotelType(raw.hotelType),
    amenities: (Array.isArray(raw.amenities) ? raw.amenities : []) as HotelAmenity[],
    roomIds: [],
    checkInTime: String(raw.checkInTime ?? '14:00'),
    checkOutTime: String(raw.checkOutTime ?? '12:00'),
    cancellationPolicy: String(raw.cancellationPolicy ?? ''),
    priceFrom: Number(raw.priceFrom ?? 0),
    featured: Boolean(raw.featured),
    popular: Boolean(raw.popular) || Number(raw.rating ?? 0) >= 4.5,
    isVerified: Boolean(raw.isVerified),
    freeCancellation: String(raw.cancellationPolicy ?? '')
      .toLowerCase()
      .includes('free cancellation'),
    breakfastIncluded: (Array.isArray(raw.amenities) ? raw.amenities : []).some((item) =>
      String(item).toLowerCase().includes('breakfast')
    ),
    phone: String(raw.phone ?? ''),
    email: String(raw.email ?? ''),
  };
}

export function mapHotelRoom(raw: AnyRecord): HotelRoom {
  return {
    id: idOf(raw),
    hotelId: idOf(raw.hotelId),
    name: String(raw.name ?? ''),
    images: mediaUrls(raw.images),
    bedType: String(raw.bedType ?? ''),
    capacity: Number(raw.capacity ?? 1),
    sizeSqm: Number(raw.size ?? raw.sizeSqm ?? 0),
    amenities: (Array.isArray(raw.amenities) ? raw.amenities : []) as HotelAmenity[],
    breakfastIncluded: Boolean(raw.breakfastIncluded),
    freeCancellation: String(raw.cancellationPolicy ?? '')
      .toLowerCase()
      .includes('free cancellation'),
    pricePerNight: Number(raw.pricePerNight ?? 0),
    availableRooms: Number(raw.availableRooms ?? raw.totalRooms ?? 0),
    description: String(raw.description ?? raw.roomType ?? ''),
  };
}

export function mapHotelBooking(raw: AnyRecord): HotelBooking {
  const hotel = (raw.hotelBooking ?? {}) as AnyRecord;
  const guest = (hotel.guestDetails ?? {}) as AnyRecord;
  const status = mapFrontendBookingStatus(String(raw.bookingStatus ?? 'pending')) as HotelBookingStatus;

  return {
    id: idOf(raw),
    bookingCode: String(raw.bookingNumber ?? ''),
    hotelId: idOf(hotel.hotelId),
    roomId: idOf(hotel.roomId),
    userId: idOf(raw.customerId),
    providerId: idOf(raw.providerId),
    providerUserId: raw.providerUserId ? String(raw.providerUserId) : undefined,
    checkIn: String(hotel.checkIn ?? ''),
    checkOut: String(hotel.checkOut ?? ''),
    adults: Number(hotel.guests ?? hotel.adults ?? 1),
    children: Number(hotel.children ?? 0),
    rooms: Number(hotel.rooms ?? 1),
    guest: {
      name: String(guest.name ?? ''),
      email: String(guest.email ?? ''),
      phone: String(guest.phone ?? ''),
      specialRequests: guest.specialRequests ? String(guest.specialRequests) : undefined,
    },
    paymentMethod: mapPaymentMethod(raw.paymentMethod) as HotelPaymentMethod,
    paymentStatus: (raw.paymentStatus as PaymentStatus) ?? 'pending',
    status,
    priceBreakdown: {
      pricePerNight: Number(hotel.pricePerNight ?? 0),
      nights: Number(hotel.nights ?? 1),
      rooms: Number(hotel.rooms ?? 1),
      roomSubtotal: Number(raw.subtotal ?? 0),
      tax: Number(raw.tax ?? 0),
      serviceFee: Number(raw.serviceFee ?? 0),
      discount: Number(raw.discount ?? 0),
      total: Number(raw.totalAmount ?? 0),
      currency: String(raw.currency ?? 'PKR'),
    },
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    qrPayload: String(raw.ticketQr ?? raw.bookingNumber ?? ''),
  };
}

export function mapNotification(raw: AnyRecord): AppNotification {
  const typeMap: Record<string, AppNotification['type']> = {
    bookingConfirmed: 'booking_confirmed',
    bookingCancelled: 'booking_cancelled',
    tripReminder: 'trip_reminder',
    pickupReminder: 'pickup_reminder',
    paymentReceived: 'payment_received',
    newOffer: 'new_offer',
  };
  const backendType = String(raw.type ?? '');
  return {
    id: idOf(raw),
    type: typeMap[backendType] ?? 'booking_confirmed',
    title: String(raw.title ?? ''),
    message: String(raw.message ?? ''),
    read: Boolean(raw.isRead ?? raw.read),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    bookingId: raw.data && typeof raw.data === 'object'
      ? String((raw.data as AnyRecord).bookingId ?? '')
      : undefined,
  };
}

export function mapProvider(raw: AnyRecord): Provider {
  const services = (Array.isArray(raw.services) ? raw.services : []) as ProviderServiceType[];
  const coords = (raw.location as AnyRecord | undefined)?.coordinates as number[] | undefined;
  const longitude = Array.isArray(coords) ? Number(coords[0]) : undefined;
  const latitude = Array.isArray(coords) ? Number(coords[1]) : undefined;
  const structured = raw.structuredAddress as AnyRecord | undefined;

  return {
    id: idOf(raw),
    userId: idOf(raw.userId),
    businessName: String(raw.businessName ?? ''),
    ownerName: String(raw.ownerName ?? ''),
    email: String(raw.email ?? ''),
    phone: String(raw.phone ?? ''),
    description: String(raw.description ?? ''),
    address: String(raw.address ?? ''),
    city: String(raw.city ?? ''),
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
    locationUpdatedAt: raw.locationUpdatedAt ? String(raw.locationUpdatedAt) : undefined,
    structuredAddress: structured
      ? {
          street: structured.street ? String(structured.street) : undefined,
          area: structured.area ? String(structured.area) : undefined,
          city: structured.city ? String(structured.city) : undefined,
          region: structured.region ? String(structured.region) : undefined,
          postalCode: structured.postalCode ? String(structured.postalCode) : undefined,
          country: structured.country ? String(structured.country) : undefined,
          formattedAddress: structured.formattedAddress
            ? String(structured.formattedAddress)
            : undefined,
        }
      : undefined,
    logo: mediaUrl(raw.logo),
    services: services.slice(0, 1),
    verificationStatus: (raw.verificationStatus as Provider['verificationStatus']) ?? 'pending',
    rating: Number(raw.rating ?? 0),
    reviewCount: Number(raw.totalReviews ?? raw.reviewCount ?? 0),
    yearsExperience: Number(raw.yearsExperience ?? 0),
    website: raw.website ? String(raw.website) : undefined,
    socialMedia: raw.socialMedia ? String(raw.socialMedia) : undefined,
    transport: mapTransportSetup(raw.transportDetails ?? raw.transport),
    hotel: mapHotelSetup(raw.hotelDetails ?? raw.hotel),
    tour: mapTourSetup(raw.tourDetails ?? raw.tour),
    documents: [],
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

export function mapProviderVehicle(raw: AnyRecord): ProviderVehicle {
  const typeRaw = String(raw.type ?? 'van');
  const type: ProviderVehicle['type'] =
    typeRaw === 'bus' || typeRaw === 'car' || typeRaw === 'minibus' ? typeRaw : 'van';

  return {
    id: idOf(raw),
    providerId: idOf(raw.providerId),
    name: String(raw.name ?? ''),
    type,
    model: String(raw.vehicleModel ?? raw.model ?? ''),
    year: Number(raw.year ?? new Date().getFullYear()),
    registrationNumber: String(raw.registrationNumber ?? ''),
    totalSeats: Number(raw.seatCount ?? raw.totalSeats ?? 0),
    amenities: Array.isArray(raw.amenities) ? raw.amenities.map(String) : [],
    images: mediaUrls(raw.images),
    active: String(raw.status ?? 'pending') === 'active',
    status: (['pending', 'active', 'rejected', 'suspended'].includes(String(raw.status))
      ? String(raw.status)
      : 'pending') as ProviderVehicle['status'],
    rejectionReason: raw.rejectionReason ? String(raw.rejectionReason) : undefined,
  };
}

export function mapProviderTrip(raw: AnyRecord): ProviderTrip {
  const statusRaw = String(raw.status ?? 'scheduled');
  let status: ProviderTrip['status'] = 'upcoming';
  if (statusRaw === 'completed') status = 'completed';
  else if (statusRaw === 'cancelled') status = 'cancelled';
  else if (statusRaw === 'boarding' || statusRaw === 'departed' || statusRaw === 'inTransit') {
    status = 'active';
  }

  return {
    id: idOf(raw),
    providerId: idOf(raw.providerId),
    origin: String(raw.origin ?? raw.from ?? ''),
    destination: String(raw.destination ?? raw.to ?? ''),
    departureDate: String(raw.departureDate ?? raw.date ?? ''),
    departureTime: String(raw.departureTime ?? ''),
    arrivalTime: String(raw.arrivalTime ?? ''),
    vehicleId: idOf(raw.vehicleId),
    pickupPoints: asArray<unknown>(raw.pickupPoints).map((p) => idOf(p)),
    dropoffPoints: asArray<unknown>(raw.dropoffPoints).map((p) => idOf(p)),
    price: Number(raw.price ?? 0),
    totalSeats: Number(raw.totalSeats ?? 0),
    bookedSeats: Number(raw.bookedSeats ?? 0),
    amenities: Array.isArray(raw.amenities) ? raw.amenities.map(String) : [],
    description: String(raw.description ?? ''),
    status,
    journeyType: String(raw.journeyType ?? 'one_way') === 'round_trip' ? 'round_trip' : 'one_way',
    returnDate: raw.returnDate ? String(raw.returnDate) : undefined,
    returnTime: raw.returnTime ? String(raw.returnTime) : undefined,
  };
}

export function mapProviderRoute(raw: AnyRecord): ProviderRoute {
  const originPlace = raw.origin;
  const destPlace = raw.destination;
  const originName =
    typeof originPlace === 'object' && originPlace
      ? String((originPlace as AnyRecord).name ?? '')
      : String(originPlace ?? raw.from ?? '');
  const destinationName =
    typeof destPlace === 'object' && destPlace
      ? String((destPlace as AnyRecord).name ?? '')
      : String(destPlace ?? raw.to ?? '');
  const originCoords =
    typeof originPlace === 'object' && originPlace
      ? (originPlace as AnyRecord)
      : undefined;
  const destCoords =
    typeof destPlace === 'object' && destPlace ? (destPlace as AnyRecord) : undefined;

  return {
    id: idOf(raw),
    providerId: idOf(raw.providerId),
    origin: originName,
    destination: destinationName,
    stops: Array.isArray(raw.stops) ? raw.stops.map(String) : [],
    pickupPoints: asArray<unknown>(raw.pickupPoints).map((p) =>
      typeof p === 'string' ? p : idOf(p)
    ),
    dropoffPoints: asArray<unknown>(raw.dropoffPoints).map((p) =>
      typeof p === 'string' ? p : idOf(p)
    ),
    durationHours: Number(raw.estimatedDuration ?? raw.durationHours ?? Number(raw.durationMinutes ?? 0) / 60),
    distanceKm: Number(raw.distance ?? raw.distanceKm ?? 0),
    originLatitude: originCoords ? Number(originCoords.latitude ?? 0) : undefined,
    originLongitude: originCoords ? Number(originCoords.longitude ?? 0) : undefined,
    destinationLatitude: destCoords ? Number(destCoords.latitude ?? 0) : undefined,
    destinationLongitude: destCoords ? Number(destCoords.longitude ?? 0) : undefined,
  };
}

export function mapProviderRoom(raw: AnyRecord): ProviderRoom {
  const roomTypeRaw = String(raw.roomType ?? 'double');
  const roomType: ProviderRoom['roomType'] =
    roomTypeRaw === 'single' ||
    roomTypeRaw === 'twin' ||
    roomTypeRaw === 'deluxe' ||
    roomTypeRaw === 'suite' ||
    roomTypeRaw === 'family'
      ? roomTypeRaw
      : 'double';

  return {
    id: idOf(raw),
    providerId: idOf(raw.providerId),
    name: String(raw.name ?? ''),
    roomType,
    capacity: Number(raw.capacity ?? 1),
    bedType: String(raw.bedType ?? ''),
    sizeSqm: Number(raw.size ?? raw.sizeSqm ?? 0),
    pricePerNight: Number(raw.pricePerNight ?? 0),
    quantity: Number(raw.totalRooms ?? raw.quantity ?? 1),
    amenities: Array.isArray(raw.amenities) ? raw.amenities.map(String) : [],
    breakfastIncluded: Boolean(raw.breakfastIncluded),
    freeCancellation: String(raw.cancellationPolicy ?? '')
      .toLowerCase()
      .includes('free'),
    images: mediaUrls(raw.images),
    available: String(raw.status ?? 'active') === 'active',
  };
}

export function mapProviderBooking(raw: AnyRecord): ProviderBooking {
  const kind =
    raw.bookingType === 'hotel' ? 'hotel' : raw.bookingType === 'tour' ? 'tour' : 'transport';
  const transport = (raw.transportBooking ?? {}) as AnyRecord;
  const hotel = (raw.hotelBooking ?? {}) as AnyRecord;
  const backendStatus = String(raw.bookingStatus ?? 'pending');
  let status: ProviderBookingStatus = 'pending';
  if (backendStatus === 'confirmed') status = 'confirmed';
  else if (backendStatus === 'completed') status = 'completed';
  else if (backendStatus === 'cancelled' || backendStatus === 'refunded') status = 'cancelled';

  const seats = asArray<string>(transport.seats).map(String);

  return {
    id: idOf(raw),
    bookingCode: String(raw.bookingNumber ?? ''),
    providerId: idOf(raw.providerId),
    customerId: idOf(raw.customerId),
    customerName: String(raw.customerName ?? 'Customer'),
    customerPhone: String(raw.customerPhone ?? ''),
    kind,
    serviceLabel: kind === 'hotel' ? 'Hotel' : 'Transport',
    detailLabel:
      kind === 'hotel'
        ? String(hotel.roomName ?? 'Room booking')
        : seats.length
          ? `Seats ${seats.join(', ')}`
          : 'Transport booking',
    date: String(hotel.checkIn ?? String(raw.createdAt ?? '').slice(0, 10)),
    time: transport.departureTime ? String(transport.departureTime) : undefined,
    seatsOrRoom: kind === 'hotel' ? String(hotel.roomName ?? hotel.roomId ?? '') : seats.join(', '),
    amount: Number(raw.totalAmount ?? 0),
    paymentStatus: (raw.paymentStatus as ProviderBooking['paymentStatus']) ?? 'pending',
    status,
    pickup: transport.pickupPoint ? String(transport.pickupPoint) : undefined,
  };
}

export function mapEarnings(raw: AnyRecord): ProviderEarningsSummary {
  return {
    totalRevenue: Number(raw.totalRevenue ?? 0),
    today: Number(raw.todayRevenue ?? raw.today ?? 0),
    thisWeek: Number(raw.weeklyRevenue ?? raw.thisWeek ?? 0),
    thisMonth: Number(raw.monthlyRevenue ?? raw.thisMonth ?? 0),
    pendingPayout: Number(raw.pendingPayout ?? 0),
    completedPayout: Number(raw.completedPayout ?? 0),
    platformFees: Number(raw.platformFees ?? 0),
    netEarnings: Number(raw.netEarnings ?? 0),
    byDay: [],
    byMonth: [],
    byService: [],
    byRoute: [],
  };
}

export function mapDashboardStats(raw: AnyRecord): ProviderDashboardStats {
  const transport = (raw.transport ?? {}) as AnyRecord;
  const hotel = (raw.hotel ?? {}) as AnyRecord;
  const general = (raw.general ?? {}) as AnyRecord;

  return {
    todaysBookings: Number(general.totalBookings ?? 0),
    pendingBookings: Number(general.pendingBookings ?? 0),
    todaysRevenue: Number(general.todaysRevenue ?? 0),
    todaysTrips: Number(transport.todaysTrips ?? 0),
    availableSeats: Number(transport.availableSeats ?? 0),
    occupiedSeats: Number(transport.bookedSeats ?? 0),
    todaysCheckIns: Number(hotel.checkIns ?? 0),
    availableRooms: Number(hotel.availableRooms ?? 0),
    occupiedRooms: Number(hotel.occupiedRooms ?? 0),
  };
}

export function mapProviderReview(raw: AnyRecord): ProviderReview {
  return {
    id: idOf(raw),
    providerId: idOf(raw.providerId),
    customerName: String(raw.customerName ?? raw.userName ?? 'Guest'),
    rating: Number(raw.rating ?? 0),
    comment: String(raw.comment ?? ''),
    reply: raw.reply ? String(raw.reply) : undefined,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    serviceLabel: String(raw.serviceLabel ?? 'Service'),
  };
}

export function mapReview(raw: AnyRecord): Review {
  const customer =
    raw.customerId && typeof raw.customerId === 'object'
      ? (raw.customerId as AnyRecord)
      : undefined;
  const createdAt = raw.createdAt ? String(raw.createdAt) : '';
  return {
    id: idOf(raw),
    userName: String(raw.customerName ?? raw.userName ?? customer?.name ?? 'Guest'),
    userAvatar: mediaUrl(raw.userAvatar ?? customer?.avatar),
    rating: Number(raw.rating ?? 0),
    comment: String(raw.comment ?? ''),
    date: createdAt ? createdAt.slice(0, 10) : '',
    tripId: idOf(raw.targetId ?? raw.tripId),
    providerReply: raw.providerReply ? String(raw.providerReply) : undefined,
  };
}

export function mapRouteInfo(raw: AnyRecord): RouteInfo {
  return {
    id: idOf(raw),
    from: String(raw.origin ?? raw.from ?? ''),
    to: String(raw.destination ?? raw.to ?? ''),
    popular: true,
    image: '',
    avgPrice: Number(raw.basePrice ?? raw.price ?? 0),
    tripCount: Number(raw.tripCount ?? 1),
  };
}

export function mapAvailabilityDay(raw: AnyRecord): RoomAvailabilityDay {
  return {
    roomId: idOf(raw.roomId),
    date: String(raw.date ?? ''),
    status: (raw.status as RoomAvailabilityDay['status']) ?? 'available',
    priceOverride: raw.priceOverride != null ? Number(raw.priceOverride) : undefined,
  };
}

export function mapProviderServices(provider: Provider): ProviderServiceItem[] {
  return provider.services.slice(0, 1).map((type, index) => ({
    id: `${provider.id}-${type}-${index}`,
    type,
    label: serviceLabel(type),
    status: 'active' as const,
  }));
}
