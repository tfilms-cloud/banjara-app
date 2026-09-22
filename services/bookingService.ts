import { get, post, put } from '@/services/api';
import {
  asArray,
  mapHotelBooking,
  mapTransportBooking,
  toBackendPaymentMethod,
  type AnyRecord,
} from '@/services/mappers';
import type { Booking, CreateBookingPayload } from '@/types/booking';

export async function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  const data = await post<AnyRecord>('/bookings', {
    bookingType: 'transport',
    paymentMethod: toBackendPaymentMethod(payload.paymentMethod),
    transportBooking: {
      tripId: payload.tripId,
      seats: payload.seats,
      pickupPoint: payload.pickupPointId,
      passengerDetails: [
        {
          name: payload.passengerDetails.name,
          phone: payload.passengerDetails.phone,
        },
      ],
    },
  });
  return mapTransportBooking(data);
}

export async function getBookings(): Promise<Booking[]> {
  const data = await get<unknown>('/bookings/my-bookings');
  return asArray<AnyRecord>(data)
    .filter((item) => item.bookingType === 'transport')
    .map(mapTransportBooking);
}

export async function getAllMyBookings(): Promise<AnyRecord[]> {
  const data = await get<unknown>('/bookings/my-bookings');
  return asArray<AnyRecord>(data);
}

export async function getBookingById(id: string): Promise<Booking | null> {
  try {
    const data = await get<AnyRecord>(`/bookings/${id}`);
    if (data.bookingType === 'hotel') return null;
    return mapTransportBooking(data);
  } catch {
    return null;
  }
}

export async function cancelBooking(id: string): Promise<Booking> {
  const data = await put<AnyRecord>(`/bookings/${id}/cancel`);
  return mapTransportBooking(data);
}

export async function getTicket(id: string) {
  return get<AnyRecord>(`/bookings/${id}/ticket`);
}

/**
 * Payment is finalized by the backend during booking creation (mock gateway).
 * Kept for UI compatibility — validates amount only.
 */
export async function processMockPayment(
  amount: number,
  _method: CreateBookingPayload['paymentMethod']
): Promise<{ success: boolean; transactionId: string }> {
  if (amount <= 0) throw new Error('Invalid amount');
  return {
    success: true,
    transactionId: `PENDING-${Date.now()}`,
  };
}
