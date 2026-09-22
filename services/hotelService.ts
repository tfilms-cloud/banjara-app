import { del, get, post, put } from '@/services/api';
import { ApiError } from '@/services/apiError';
import {
  asArray,
  mapHotel,
  mapHotelBooking,
  mapHotelRoom,
  toBackendPaymentMethod,
  type AnyRecord,
} from '@/services/mappers';
import type {
  CreateHotelBookingPayload,
  Hotel,
  HotelBooking,
  HotelFilters,
  HotelRoom,
  HotelSearchParams,
  HotelSortBy,
} from '@/types/hotel';

const hotelDetailCache = new Map<string, { at: number; hotel: Hotel }>();
const HOTEL_CACHE_MS = 20_000;

function sortToBackend(sortBy: HotelSortBy): string {
  switch (sortBy) {
    case 'price_asc':
      return 'priceLowToHigh';
    case 'price_desc':
      return 'priceHighToLow';
    case 'rating':
      return 'rating';
    default:
      return 'recommended';
  }
}

function applyClientFilters(hotels: Hotel[], filters?: HotelFilters): Hotel[] {
  let results = [...hotels];
  if (!filters) return results;

  if (filters.amenities?.length) {
    results = results.filter((hotel) =>
      filters.amenities!.every((amenity) => hotel.amenities.includes(amenity))
    );
  }
  if (filters.maxDistanceKm != null) {
    results = results.filter((hotel) => hotel.location.distanceKm <= filters.maxDistanceKm!);
  }
  if (filters.breakfastIncluded) {
    results = results.filter((hotel) => hotel.amenities.includes('Breakfast'));
  }
  if (filters.freeCancellation) {
    results = results.filter((hotel) =>
      hotel.cancellationPolicy.toLowerCase().includes('free cancellation')
    );
  }
  if (filters.hotelTypes?.length) {
    results = results.filter((hotel) => filters.hotelTypes!.includes(hotel.hotelType));
  }
  return results;
}

export async function getHotels(): Promise<Hotel[]> {
  const data = await get<unknown>('/hotels');
  return asArray<AnyRecord>(data).map(mapHotel);
}

export async function getHotelById(id: string): Promise<Hotel | null> {
  const cached = hotelDetailCache.get(id);
  if (cached && Date.now() - cached.at < HOTEL_CACHE_MS) {
    return cached.hotel;
  }
  try {
    const data = await get<AnyRecord>(`/hotels/${id}`);
    const hotel = mapHotel(data);
    hotelDetailCache.set(id, { at: Date.now(), hotel });
    return hotel;
  } catch {
    return null;
  }
}

export async function searchHotels(
  params: HotelSearchParams,
  filters?: HotelFilters,
  sortBy: HotelSortBy = 'recommended'
): Promise<Hotel[]> {
  const data = await get<unknown>('/hotels/search', {
    params: {
      destination: params.destination,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      guests: params.adults + params.children,
      rooms: params.rooms,
      minPrice: filters?.minPrice,
      maxPrice: filters?.maxPrice,
      minRating: filters?.minRating,
      hotelType: filters?.hotelTypes?.[0],
      amenities: filters?.amenities?.join(','),
      sort: sortToBackend(sortBy),
      limit: 30,
      page: 1,
    },
  });

  let results = applyClientFilters(asArray<AnyRecord>(data).map(mapHotel), filters);

  results.sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return a.priceFrom - b.priceFrom;
      case 'price_desc':
        return b.priceFrom - a.priceFrom;
      case 'rating':
        return b.rating - a.rating;
      case 'distance':
        return a.location.distanceKm - b.location.distanceKm;
      case 'recommended':
      default:
        return Number(b.featured) - Number(a.featured) || b.rating - a.rating;
    }
  });

  return results;
}

export async function getHotelRooms(
  hotelId: string,
  params?: Pick<HotelSearchParams, 'checkIn' | 'checkOut' | 'rooms' | 'adults' | 'children'>
): Promise<HotelRoom[]> {
  const data = await get<unknown>(`/rooms/hotel/${hotelId}`, {
    params: params
      ? {
          checkIn: params.checkIn,
          checkOut: params.checkOut,
          rooms: params.rooms,
          guests: (params.adults ?? 1) + (params.children ?? 0),
        }
      : undefined,
  });
  return asArray<AnyRecord>(data).map(mapHotelRoom);
}

export async function getHotelQuote(input: {
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  guests: number;
}) {
  const data = await post<AnyRecord>('/hotels/quote', input);
  return data;
}

export async function getRoomById(roomId: string): Promise<HotelRoom | null> {
  try {
    const data = await get<AnyRecord>(`/rooms/${roomId}`);
    return mapHotelRoom(data);
  } catch {
    return null;
  }
}

export async function getPopularHotels(): Promise<Hotel[]> {
  const data = await get<unknown>('/hotels/search', {
    params: { sort: 'rating', limit: 10 },
  });
  return asArray<AnyRecord>(data)
    .map(mapHotel)
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating)
    .slice(0, 10);
}

export async function createHotelBooking(
  payload: CreateHotelBookingPayload
): Promise<HotelBooking> {
  if (!payload.hotelId || !payload.roomId) {
    throw new ApiError('Select a hotel and room before booking.');
  }

  const data = await post<AnyRecord>('/bookings', {
    bookingType: 'hotel',
    paymentMethod: toBackendPaymentMethod(payload.paymentMethod),
    hotelBooking: {
      hotelId: payload.hotelId,
      roomId: payload.roomId,
      checkIn: payload.checkIn,
      checkOut: payload.checkOut,
      rooms: payload.rooms,
      guests: payload.adults + payload.children,
      guestDetails: {
        name: payload.guest.name,
        email: payload.guest.email,
        phone: payload.guest.phone,
        specialRequests: payload.guest.specialRequests,
      },
    },
  });
  return mapHotelBooking(data);
}

export async function getHotelBookings(): Promise<HotelBooking[]> {
  const data = await get<unknown>('/bookings/my-bookings');
  return asArray<AnyRecord>(data)
    .filter((item) => item.bookingType === 'hotel')
    .map(mapHotelBooking);
}

export async function getHotelBookingById(id: string): Promise<HotelBooking | null> {
  try {
    const data = await get<AnyRecord>(`/bookings/${id}`);
    if (data.bookingType !== 'hotel') return null;
    return mapHotelBooking(data);
  } catch {
    return null;
  }
}

export async function cancelHotelBooking(id: string): Promise<HotelBooking> {
  const data = await put<AnyRecord>(`/bookings/${id}/cancel`);
  return mapHotelBooking(data);
}

export async function processHotelMockPayment(
  amount: number,
  _method: CreateHotelBookingPayload['paymentMethod']
): Promise<{ success: boolean; transactionId: string }> {
  if (amount <= 0) throw new Error('Invalid amount');
  return {
    success: true,
    transactionId: `PENDING-${Date.now()}`,
  };
}

export async function createHotel(payload: Record<string, unknown>) {
  const data = await post<AnyRecord>('/hotels', payload);
  return mapHotel(data);
}

export async function updateHotel(id: string, payload: Record<string, unknown>) {
  const data = await put<AnyRecord>(`/hotels/${id}`, payload);
  return mapHotel(data);
}

export async function deleteHotel(id: string) {
  await del(`/hotels/${id}`);
}

export async function createRoom(payload: Record<string, unknown>) {
  const data = await post<AnyRecord>('/rooms', payload);
  return mapHotelRoom(data);
}

export async function updateRoom(id: string, payload: Record<string, unknown>) {
  const data = await put<AnyRecord>(`/rooms/${id}`, payload);
  return mapHotelRoom(data);
}

export async function deleteRoom(id: string) {
  await del(`/rooms/${id}`);
}
