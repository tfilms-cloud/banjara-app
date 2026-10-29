import { get, post } from '@/services/api';
import {
  asArray,
  mapFrontendBookingStatus,
  mapPaymentMethod,
  toBackendPaymentMethod,
  type AnyRecord,
} from '@/services/mappers';
import type {
  CreatePackageBookingPayload,
  PackageBooking,
  TourPriceBreakdown,
} from '@/types/tourBooking';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

const TAX_RATE = 0.1;
const SERVICE_FEE = 200;

export function calcPackagePrice(
  pricePerPerson: number,
  travelers: number,
  currency = 'PKR'
): TourPriceBreakdown {
  const subtotal = Math.max(0, Math.round(pricePerPerson * travelers));
  const tax = Math.round(subtotal * TAX_RATE);
  const serviceFee = SERVICE_FEE;
  return {
    subtotal,
    tax,
    serviceFee,
    discount: 0,
    total: Math.max(0, subtotal + tax + serviceFee),
    currency,
  };
}

export function mapPackageBooking(raw: AnyRecord): PackageBooking {
  const pkg = (raw.packageBooking ?? {}) as AnyRecord;
  const guestRaw = (pkg.guestDetails ?? raw.guestDetails ?? {}) as AnyRecord;

  return {
    id: String(raw._id ?? raw.id ?? ''),
    bookingCode: String(raw.bookingNumber ?? ''),
    itineraryId: String(pkg.itineraryId ?? raw.itineraryId ?? ''),
    providerId: String(raw.providerId ?? ''),
    title: String(pkg.title ?? raw.packageTitle ?? 'Tour package'),
    tourType: String(pkg.tourType ?? raw.packageTourType ?? 'trek'),
    destination: String(pkg.destination ?? raw.packageDestination ?? ''),
    startDate: String(pkg.startDate ?? raw.packageStartDate ?? '').slice(0, 10),
    travelers: Number(pkg.travelers ?? raw.packageTravelers ?? 1),
    durationDays: Number(pkg.durationDays ?? raw.packageDurationDays ?? 1),
    guest: {
      name: String(guestRaw.name ?? ''),
      email: String(guestRaw.email ?? ''),
      phone: String(guestRaw.phone ?? ''),
      specialRequests: guestRaw.specialRequests
        ? String(guestRaw.specialRequests)
        : undefined,
    },
    paymentMethod: mapPaymentMethod(raw.paymentMethod),
    paymentStatus: (raw.paymentStatus as PackageBooking['paymentStatus']) ?? 'pending',
    paymentId: raw.paymentId ? String(raw.paymentId) : undefined,
    status: mapFrontendBookingStatus(String(raw.bookingStatus ?? 'pending')),
    priceBreakdown: {
      subtotal: Number(raw.subtotal ?? 0),
      tax: Number(raw.tax ?? 0),
      serviceFee: Number(raw.serviceFee ?? 0),
      discount: Number(raw.discount ?? 0),
      total: Number(raw.totalAmount ?? 0),
      currency: String(raw.currency ?? 'PKR'),
    },
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    coverImage: raw.packageCoverImage
      ? normalizeMediaUrl(String(raw.packageCoverImage)) ?? String(raw.packageCoverImage)
      : null,
  };
}

export async function createPackageBooking(
  payload: CreatePackageBookingPayload
): Promise<PackageBooking> {
  const data = await post<AnyRecord>('/bookings', {
    bookingType: 'package',
    paymentMethod: toBackendPaymentMethod(payload.paymentMethod),
    packageBooking: {
      itineraryId: payload.itineraryId,
      startDate: payload.startDate,
      travelers: payload.travelers,
      guestDetails: {
        name: payload.guest.name,
        email: payload.guest.email,
        phone: payload.guest.phone,
        specialRequests: payload.guest.specialRequests,
      },
    },
  });
  return mapPackageBooking(data);
}

export async function getPackageBookings(): Promise<PackageBooking[]> {
  const data = await get<unknown>('/bookings/my-bookings');
  return asArray<AnyRecord>(data)
    .filter((item) => item.bookingType === 'package')
    .map(mapPackageBooking);
}

export async function getPackageBookingById(id: string): Promise<PackageBooking | null> {
  try {
    const data = await get<AnyRecord>(`/bookings/${id}`);
    if (data.bookingType !== 'package') return null;
    return mapPackageBooking(data);
  } catch {
    return null;
  }
}
