import { del, get, post, put } from '@/services/api';
import { ApiError } from '@/services/apiError';
import { withoutDriverPhoto } from '@/utils/agencyGallery';
import { normalizeMediaUrl } from '@/utils/mediaUrl';
import { DEFAULT_DOCUMENTS, defaultStayType, normalizeServiceKey } from '@/constants/providerOptions';
import { mapGuidePublicFromRaw } from '@/services/guideBookingService';
import {
  asArray,
  mapAvailabilityDay,
  mapDashboardStats,
  mapEarnings,
  mapProvider,
  mapProviderBooking,
  mapProviderReview,
  mapProviderRoom,
  mapProviderRoute,
  mapProviderServices,
  mapProviderTrip,
  mapProviderVehicle,
  type AnyRecord,
} from '@/services/mappers';
import type {
  Provider,
  ProviderBooking,
  ProviderBookingStatus,
  ProviderChatMessage,
  ProviderDashboardStats,
  ProviderEarningsSummary,
  ProviderMessageThread,
  ProviderNotification,
  ProviderOnboardingDraft,
  ProviderPassenger,
  ProviderReview,
  ProviderRoom,
  ProviderRoute,
  ProviderServiceItem,
  ProviderServiceType,
  ProviderTrip,
  ProviderVehicle,
  RoomAvailabilityDay,
} from '@/types/provider';

function mapFrontendServicesToBackend(
  services: ProviderServiceType[]
): Array<'transport' | 'hotel' | 'tour' | 'carRental' | 'travelGuide' | 'restaurant'> {
  const set = new Set<'transport' | 'hotel' | 'tour' | 'carRental' | 'travelGuide' | 'restaurant'>();
  for (const service of services) {
    const key = normalizeServiceKey(service);
    if (key === 'hotel' || key === 'guestHouse') set.add('hotel');
    else if (key === 'tour' || key === 'travelAgency') set.add('tour');
    else if (key === 'travelGuide') set.add('travelGuide');
    else if (key === 'carRental') set.add('carRental');
    else if (key === 'restaurant') set.add('restaurant');
    else if (key === 'transport' || key === 'van' || key === 'bus') set.add('transport');
    else set.add('transport');
  }
  return Array.from(set);
}

function mapFrontendProviderTypes(services: ProviderServiceType[]): string[] {
  const types: string[] = [];
  for (const service of services) {
    const key = normalizeServiceKey(service);
    switch (key) {
      case 'transport':
      case 'van':
        types.push('vanOperator');
        break;
      case 'bus':
        types.push('busOperator');
        break;
      case 'carRental':
        types.push('carRental');
        break;
      case 'hotel':
        types.push('hotel');
        break;
      case 'guestHouse':
        types.push('guestHouse');
        break;
      case 'tour':
        types.push('tourOperator');
        break;
      case 'travelGuide':
        types.push('travelGuide');
        break;
      case 'travelAgency':
        types.push('travelAgency');
        break;
      case 'restaurant':
        types.push('restaurant');
        break;
      default:
        types.push('vanOperator');
    }
  }
  return types.length ? types.slice(0, 1) : ['vanOperator'];
}

export async function getProviderProfile(_providerId?: string): Promise<Provider | null> {
  try {
    const data = await get<AnyRecord>('/providers/me');
    return mapProvider(data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** Public traveler profile (no auth required). */
export async function getPublicProviderById(id: string): Promise<Provider | null> {
  if (!id) return null;
  try {
    const data = await get<AnyRecord>(`/providers/public/${id}`, {
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      params: { _ts: Date.now() },
    });

    let mapped: Provider;
    try {
      mapped = mapProvider(data);
    } catch {
      mapped = {
        id: String(data._id ?? id),
        userId: String(data.userId ?? ''),
        businessName: String(data.businessName ?? 'Provider'),
        ownerName: String(data.ownerName ?? ''),
        email: String(data.email ?? ''),
        phone: String(data.phone ?? ''),
        description: String(data.description ?? ''),
        address: String(data.address ?? ''),
        city: String(data.city ?? ''),
        logo: data.logo ? String(data.logo) : undefined,
        services: [],
        verificationStatus: (data.verificationStatus as Provider['verificationStatus']) ?? 'pending',
        rating: Number(data.rating ?? 0),
        reviewCount: Number(data.totalReviews ?? 0),
        yearsExperience: Number(data.yearsExperience ?? 0),
        documents: [],
        createdAt: String(data.createdAt ?? ''),
        updatedAt: String(data.updatedAt ?? ''),
      };
    }

    const transport = (data.transportDetails ?? data.transport) as AnyRecord | undefined;
    const fleet = Array.isArray(data.fleetVehicles) ? (data.fleetVehicles as AnyRecord[]) : [];
    const extraGallery = [
      ...(Array.isArray(data.galleryImages) ? data.galleryImages : []),
      mapped.logo,
      transport?.vehicleImageFront,
      transport?.vehicleImageBack,
      ...fleet.flatMap((v) => (Array.isArray(v.images) ? v.images : [])),
      ...(mapped.galleryImages ?? []),
      mapped.transport?.vehicleImageFront,
      mapped.transport?.vehicleImageBack,
    ]
      .map((item) => (item == null ? '' : normalizeMediaUrl(String(item).trim()) ?? String(item).trim()))
      .filter(Boolean);

    const guideDetails = mapGuidePublicFromRaw(data.guideDetails as AnyRecord);

    return {
      ...mapped,
      guideDetails: guideDetails ?? mapped.guideDetails,
      galleryImages: withoutDriverPhoto(
        extraGallery,
        mapped.transport?.driverPhoto ?? (typeof transport?.driverPhoto === 'string' ? transport.driverPhoto : undefined)
      ),
    };
  } catch {
    return null;
  }
}

export async function getProviderByUserId(_userId: string): Promise<Provider | null> {
  return getProviderProfile();
}

function optionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function hasNamedDetails(value?: object | null) {
  return Boolean(value && Object.values(value).some((item) => {
    if (Array.isArray(item)) return item.length > 0;
    if (typeof item === 'number') return Number.isFinite(item) && item !== 0;
    return Boolean(item && String(item).trim());
  }));
}

export function buildProviderApplicationPayload(draft: ProviderOnboardingDraft) {
  const services = mapFrontendServicesToBackend(draft.selectedServices);
  const providerType = mapFrontendProviderTypes(draft.selectedServices);
  const payload = {
    businessName: (draft.business.businessName ?? draft.personal.name ?? '').trim(),
    ownerName: (draft.business.ownerName ?? draft.personal.name ?? '').trim(),
    providerType,
    services,
    description: draft.business.description ?? '',
    phone: (draft.business.phone ?? draft.personal.phone ?? '').trim(),
    email: (draft.business.email ?? draft.personal.email ?? '').trim().toLowerCase(),
    website: optionalText(draft.business.website),
    socialMedia: optionalText(draft.business.socialMedia),
    address: (draft.location?.address.formattedAddress || draft.business.address || '').trim(),
    city: (draft.location?.address.city || draft.business.city || '').trim(),
    latitude: draft.location?.latitude,
    longitude: draft.location?.longitude,
    structuredAddress: draft.location?.address,
    yearsExperience: draft.business.yearsExperience ?? 0,
    transportDetails: hasNamedDetails(draft.transport) ? draft.transport : undefined,
    hotelDetails: draft.hotel && hasNamedDetails(draft.hotel)
      ? {
          ...draft.hotel,
          hotelType: defaultStayType(draft.selectedServices, draft.hotel.hotelType),
        }
      : undefined,
    tourDetails: hasNamedDetails(draft.tour) ? draft.tour : undefined,
    guideDetails: hasNamedDetails(draft.guide) ? draft.guide : undefined,
    restaurantDetails: hasNamedDetails(draft.restaurant) ? draft.restaurant : undefined,
  };

  return payload;
}

export async function saveProviderProgress(
  draft: ProviderOnboardingDraft,
  existingProviderId?: string
): Promise<Provider> {
  const payload = buildProviderApplicationPayload(draft);

  if (existingProviderId) {
    const data = await put<AnyRecord>('/providers/me', payload);
    return mapProvider(data);
  }

  try {
    const data = await post<AnyRecord>('/providers/register', payload);
    return mapProvider(data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      const data = await put<AnyRecord>('/providers/me', payload);
      return mapProvider(data);
    }
    throw error;
  }
}

export async function updateProviderProfile(
  _providerId: string,
  patch: Partial<Provider>
): Promise<Provider> {
  const data = await put<AnyRecord>('/providers/me', {
    businessName: patch.businessName,
    ownerName: patch.ownerName,
    description: patch.description,
    phone: patch.phone,
    email: patch.email,
    website: patch.website,
    socialMedia: patch.socialMedia,
    address: patch.address,
    city: patch.city,
    yearsExperience: patch.yearsExperience,
    logo: patch.logo,
    services: patch.services ? mapFrontendServicesToBackend(patch.services) : undefined,
    hotelDetails: patch.hotel,
    transportDetails: patch.transport,
    tourDetails: patch.tour,
    restaurantDetails: patch.restaurant,
  });
  return mapProvider(data);
}

export async function updateProviderLogo(logoUrl: string): Promise<Provider> {
  const data = await put<AnyRecord>('/providers/me/logo', { logo: logoUrl });
  return mapProvider(data);
}

export async function getProviderServicesList(providerId: string): Promise<ProviderServiceItem[]> {
  const provider = await getProviderProfile(providerId);
  if (!provider) return [];
  return mapProviderServices(provider);
}

export async function addProviderService(
  providerId: string,
  service: Provider['services'][number]
): Promise<Provider> {
  const provider = await getProviderProfile(providerId);
  if (!provider) throw new Error('Provider not found');
  if (provider.services.includes(service)) return provider;
  if (provider.services.length >= 1) {
    throw new Error('You already offer one service. You can edit it, but you cannot add another.');
  }
  return updateProviderProfile(providerId, {
    services: [service],
  });
}

export async function updateProviderService(
  providerId: string,
  services: Provider['services']
): Promise<Provider> {
  if (services.length > 1) {
    throw new Error('A provider can offer only one service.');
  }
  return updateProviderProfile(providerId, { services });
}

export async function getProviderVehicles(_providerId?: string): Promise<ProviderVehicle[]> {
  const data = await get<unknown>('/vehicles');
  return asArray<AnyRecord>(data).map(mapProviderVehicle);
}

function normalizeApiVehicleType(
  type: string | undefined
): 'van' | 'minibus' | 'bus' | 'car' | 'suv' | 'other' {
  const raw = String(type ?? 'van').trim().toLowerCase();
  if (raw === 'jeep') return 'suv';
  if (raw === 'mini_bus' || raw === 'mini-bus') return 'minibus';
  if (raw === 'bus' || raw === 'car' || raw === 'minibus' || raw === 'suv' || raw === 'van') {
    return raw;
  }
  return 'other';
}

export async function createVehicle(
  payload: Omit<ProviderVehicle, 'id'>
): Promise<ProviderVehicle> {
  const data = await post<AnyRecord>('/vehicles', {
    name: payload.name,
    verificationDetails: payload.verificationDetails,
    type: normalizeApiVehicleType(payload.type),
    brand: payload.model || payload.name,
    vehicleModel: payload.model,
    year: payload.year,
    registrationNumber: payload.registrationNumber,
    seatCount: payload.totalSeats,
    amenities: payload.amenities,
    images: payload.images,
  });
  return mapProviderVehicle(data);
}

export async function updateVehicle(
  vehicleId: string,
  patch: Partial<ProviderVehicle>
): Promise<ProviderVehicle> {
  const data = await put<AnyRecord>(`/vehicles/${vehicleId}`, {
    name: patch.name,
    verificationDetails: patch.verificationDetails,
    type: patch.type ? normalizeApiVehicleType(patch.type) : undefined,
    vehicleModel: patch.model,
    year: patch.year,
    registrationNumber: patch.registrationNumber,
    seatCount: patch.totalSeats,
    amenities: patch.amenities,
    images: patch.images,
    // Providers cannot self-approve; status is managed by BANJARA Admin.
  });
  return mapProviderVehicle(data);
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  await del(`/vehicles/${vehicleId}`);
}

export async function getProviderTrips(_providerId?: string): Promise<ProviderTrip[]> {
  const data = await get<unknown>('/trips');
  return asArray<AnyRecord>(data).map(mapProviderTrip);
}

export async function createTrip(payload: Omit<ProviderTrip, 'id'>): Promise<ProviderTrip> {
  const data = await post<AnyRecord>('/trips', {
    vehicleId: payload.vehicleId,
    origin: payload.origin,
    destination: payload.destination,
    departureDate: payload.departureDate,
    departureTime: payload.departureTime,
    arrivalTime: payload.arrivalTime,
    pickupPoints: payload.pickupPoints,
    dropoffPoints: payload.dropoffPoints,
    price: payload.price,
    amenities: payload.amenities,
    description: payload.description,
    journeyType: payload.journeyType ?? 'one_way',
    returnDate: payload.returnDate,
    returnTime: payload.returnTime,
    bookingMode: payload.bookingMode ?? 'seat',
  });
  return mapProviderTrip(data);
}

export async function updateTrip(
  tripId: string,
  patch: Partial<ProviderTrip>
): Promise<ProviderTrip> {
  const data = await put<AnyRecord>(`/trips/${tripId}`, {
    origin: patch.origin,
    destination: patch.destination,
    departureDate: patch.departureDate,
    departureTime: patch.departureTime,
    arrivalTime: patch.arrivalTime,
    pickupPoints: patch.pickupPoints,
    dropoffPoints: patch.dropoffPoints,
    price: patch.price,
    amenities: patch.amenities,
    description: patch.description,
    journeyType: patch.journeyType,
    returnDate: patch.returnDate,
    returnTime: patch.returnTime,
    bookingMode: patch.bookingMode,
  });
  return mapProviderTrip(data);
}

export async function cancelTrip(tripId: string): Promise<ProviderTrip> {
  const data = await del<AnyRecord>(`/trips/${tripId}`);
  return mapProviderTrip(data);
}

export async function getProviderRoutes(_providerId?: string): Promise<ProviderRoute[]> {
  const data = await get<unknown>('/routes');
  return asArray<AnyRecord>(data).map(mapProviderRoute);
}

export type RoutePlaceInput = {
  name: string;
  latitude: number;
  longitude: number;
};

export async function createProviderRoute(input: {
  origin: RoutePlaceInput;
  destination: RoutePlaceInput;
  stops?: string[];
}): Promise<ProviderRoute> {
  const data = await post<AnyRecord>('/routes', {
    origin: input.origin,
    destination: input.destination,
    stops: input.stops ?? [],
  });
  return mapProviderRoute(data);
}

export async function updateProviderRoute(
  routeId: string,
  input: {
    origin: RoutePlaceInput;
    destination: RoutePlaceInput;
    stops?: string[];
  }
): Promise<ProviderRoute> {
  const data = await put<AnyRecord>(`/routes/${routeId}`, {
    origin: input.origin,
    destination: input.destination,
    stops: input.stops ?? [],
  });
  return mapProviderRoute(data);
}

export async function deleteProviderRoute(routeId: string): Promise<void> {
  await del(`/routes/${routeId}`);
}

export async function getProviderPickupPoints(providerId?: string): Promise<AnyRecord[]> {
  const data = await get<unknown>('/pickup-points', {
    params: providerId ? { providerId } : undefined,
  });
  return asArray<AnyRecord>(data);
}

export async function createProviderPickup(input: {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  landmark?: string;
}): Promise<AnyRecord> {
  return post<AnyRecord>('/pickup-points', {
    name: input.name,
    address: input.address || input.name,
    latitude: input.latitude,
    longitude: input.longitude,
    landmark: input.landmark,
    active: true,
  });
}

export async function getProviderRooms(_providerId?: string): Promise<ProviderRoom[]> {
  // Rooms are hotel-scoped; list hotels then rooms.
  const hotels = await get<unknown>('/hotels');
  const hotelList = asArray<AnyRecord>(hotels);
  const roomsNested = await Promise.all(
    hotelList.map(async (hotel) => {
      const hotelId = String(hotel.id ?? hotel._id ?? '');
      if (!hotelId) return [];
      const rooms = await get<unknown>(`/rooms/hotel/${hotelId}`);
      return asArray<AnyRecord>(rooms);
    })
  );
  return roomsNested.flat().map(mapProviderRoom);
}

async function resolveProviderHotelId(explicitHotelId?: string): Promise<string> {
  if (explicitHotelId?.trim()) return explicitHotelId.trim();

  const hotels = asArray<AnyRecord>(await get<unknown>('/hotels'));
  const existingId = String(hotels[0]?.id ?? hotels[0]?._id ?? '');
  if (existingId) return existingId;

  const provider = await getProviderProfile();
  if (!provider) {
    throw new ApiError('Provider profile required before adding rooms.', 403);
  }

  const created = await post<AnyRecord>('/hotels', {
    name: provider.businessName || 'My Hotel',
    description: provider.description || `${provider.businessName} stays`,
    hotelType: provider.services.includes('guestHouse') ? 'guestHouse' : 'hotel',
    address: provider.address || 'Address pending',
    city: provider.city || 'Gilgit',
    latitude: 36.3167,
    longitude: 74.65,
    amenities: ['WiFi'],
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],
    checkInTime: '14:00',
    checkOutTime: '12:00',
  });

  const hotelId = String(created.id ?? created._id ?? '');
  if (!hotelId) {
    throw new ApiError('Could not create hotel for this provider.', 500);
  }
  return hotelId;
}

export async function createRoom(payload: Omit<ProviderRoom, 'id'> & { hotelId?: string }): Promise<ProviderRoom> {
  const hotelId = await resolveProviderHotelId(
    typeof (payload as AnyRecord).hotelId === 'string' ? String((payload as AnyRecord).hotelId) : undefined
  );

  const data = await post<AnyRecord>('/rooms', {
    hotelId,
    name: payload.name,
    roomType: payload.roomType === 'twin' ? 'twin' : payload.roomType,
    bedType: payload.bedType,
    capacity: payload.capacity,
    size: payload.sizeSqm,
    pricePerNight: payload.pricePerNight,
    totalRooms: payload.quantity,
    amenities: payload.amenities,
    breakfastIncluded: payload.breakfastIncluded,
    cancellationPolicy: payload.freeCancellation ? 'Free cancellation' : 'Non-refundable',
    images: payload.images,
  });
  return mapProviderRoom(data);
}

export async function updateRoom(
  roomId: string,
  patch: Partial<ProviderRoom>
): Promise<ProviderRoom> {
  const data = await put<AnyRecord>(`/rooms/${roomId}`, {
    name: patch.name,
    roomType: patch.roomType,
    bedType: patch.bedType,
    capacity: patch.capacity,
    size: patch.sizeSqm,
    pricePerNight: patch.pricePerNight,
    totalRooms: patch.quantity,
    availableRooms: patch.available === false ? 0 : undefined,
    amenities: patch.amenities,
    breakfastIncluded: patch.breakfastIncluded,
    cancellationPolicy: patch.freeCancellation ? 'Free cancellation' : 'Non-refundable',
    images: patch.images,
    status: patch.available === false ? 'inactive' : patch.available === true ? 'active' : undefined,
    discountPercent: patch.discountPercent,
    offerNote: patch.offerNote,
    availableCount: patch.availableCount,
  });
  return mapProviderRoom(data);
}

export async function deleteRoom(roomId: string): Promise<void> {
  await del(`/rooms/${roomId}`);
}

export async function getRoomAvailability(roomId: string): Promise<RoomAvailabilityDay[]> {
  const data = await get<unknown>(`/availability/rooms/${roomId}`);
  return asArray<AnyRecord>(data).map(mapAvailabilityDay);
}

export async function getProviderBookings(_providerId?: string): Promise<ProviderBooking[]> {
  const data = await get<unknown>('/providers/bookings', {
    params: { limit: 100 },
  });
  return asArray<AnyRecord>(data).map(mapProviderBooking);
}

export async function getProviderBookingById(bookingId: string): Promise<ProviderBooking | null> {
  try {
    const data = await get<AnyRecord>(`/bookings/${bookingId}`);
    return mapProviderBooking(data);
  } catch {
    return null;
  }
}

export async function updateBookingStatus(
  bookingId: string,
  status: ProviderBookingStatus
): Promise<ProviderBooking> {
  const backendStatus =
    status === 'rejected'
      ? 'rejected'
      : status === 'upcoming'
        ? 'confirmed'
        : status;

  const data = await put<AnyRecord>(`/providers/bookings/${bookingId}/status`, {
    status: backendStatus,
  });
  return mapProviderBooking(data);
}

export async function getPassengers(providerId: string): Promise<ProviderPassenger[]> {
  const bookings = await getProviderBookings(providerId);
  return bookings
    .filter((booking) => booking.kind === 'transport')
    .flatMap((booking) => {
      const seats = booking.seats.length
        ? booking.seats
        : booking.seatsOrRoom.split(',').map((s) => s.trim()).filter(Boolean);
      if (!seats.length) {
        return [
          {
            id: `${booking.id}-0`,
            bookingId: booking.id,
            name: booking.passengers[0]?.name || booking.customerName,
            seat: '—',
            pickup: booking.pickup ?? '',
            dropoff: booking.dropoff ?? '',
            phone: booking.passengers[0]?.phone || booking.customerPhone,
            status: booking.status,
          },
        ];
      }
      return seats.map((seat, index) => ({
        id: `${booking.id}-${index}`,
        bookingId: booking.id,
        name: booking.passengers[index]?.name || booking.customerName,
        seat,
        pickup: booking.pickup ?? '',
        dropoff: booking.dropoff ?? '',
        phone: booking.passengers[index]?.phone || booking.customerPhone,
        status: booking.status,
      }));
    });
}

export async function getProviderEarnings(_providerId?: string): Promise<ProviderEarningsSummary> {
  const data = await get<AnyRecord>('/providers/earnings');
  return mapEarnings(data);
}

export async function getProviderReviews(providerId: string): Promise<ProviderReview[]> {
  const data = await get<unknown>(`/reviews/provider/${providerId}`);
  return asArray<AnyRecord>(data).map(mapProviderReview);
}

export async function replyToReview(reviewId: string, reply: string): Promise<ProviderReview> {
  const data = await post<AnyRecord>(`/reviews/${reviewId}/reply`, { reply });
  return mapProviderReview(data);
}

export async function getProviderMessages(): Promise<ProviderMessageThread[]> {
  try {
    const data = await get<unknown>('/messages');
    return asArray<AnyRecord>(data).map((item) => ({
      id: String(item.conversationId ?? item.id ?? item._id ?? ''),
      customerName: String(item.customerName ?? 'Customer'),
      bookingCode: String(item.bookingId ?? ''),
      serviceLabel: 'Support',
      lastMessage: String(item.message ?? item.lastMessage ?? item.text ?? ''),
      timestamp: String(item.updatedAt ?? item.createdAt ?? new Date().toISOString()),
      unread: item.readAt ? 0 : 1,
    }));
  } catch {
    return [];
  }
}

export async function getChatMessages(threadId: string): Promise<ProviderChatMessage[]> {
  try {
    const data = await get<unknown>('/messages', { params: { withUserId: threadId } });
    return asArray<AnyRecord>(data).map((item) => ({
      id: String(item.id ?? item._id ?? ''),
      threadId,
      sender: String(item.senderId) === threadId ? 'customer' : 'provider',
      text: String(item.message ?? item.text ?? ''),
      timestamp: String(item.createdAt ?? new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}

export async function sendChatMessage(
  threadId: string,
  text: string
): Promise<ProviderChatMessage> {
  const data = await post<AnyRecord>('/messages', {
    receiverId: threadId,
    message: text,
  });
  return {
    id: String(data.id ?? data._id ?? Date.now()),
    threadId,
    sender: 'provider',
    text,
    timestamp: String(data.createdAt ?? new Date().toISOString()),
  };
}

export async function getProviderNotifications(): Promise<ProviderNotification[]> {
  const data = await get<unknown>('/notifications');
  return asArray<AnyRecord>(data).map((item) => ({
    id: String(item.id ?? item._id ?? ''),
    title: String(item.title ?? ''),
    body: String(item.message ?? item.body ?? ''),
    type: 'system',
    read: Boolean(item.isRead ?? item.read),
    createdAt: String(item.createdAt ?? new Date().toISOString()),
  }));
}

export async function getDashboardStats(_providerId?: string): Promise<ProviderDashboardStats> {
  const data = await get<AnyRecord>('/providers/dashboard');
  return mapDashboardStats(data);
}

export async function submitProviderApplication(
  draft: ProviderOnboardingDraft,
  _userId: string,
  existingProviderId?: string
): Promise<Provider> {
  const provider = await saveProviderProgress(draft, existingProviderId);
  if (draft.selectedServices.includes('transport')) {
    return mapProvider(await post<AnyRecord>('/providers/me/onboarding/submit', {}));
  }
  provider.documents = DEFAULT_DOCUMENTS.map((doc) => ({ ...doc, status: 'pending' as const }));
  return provider;
}

export async function saveOnboardingCheckpoint(step: 'location' | 'transport' | 'vehicle', vehicleId?: string): Promise<Provider> {
  return mapProvider(await post<AnyRecord>('/providers/me/onboarding/checkpoint', { step, vehicleId }));
}

export async function getProviderStatus() {
  return get<AnyRecord>('/providers/me/status');
}
