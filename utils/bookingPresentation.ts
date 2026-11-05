import type { Booking } from '@/types/booking';
import type { Hotel, HotelBooking, HotelRoom } from '@/types/hotel';
import type { GuideBooking } from '@/types/guideBooking';
import type { PackageBooking } from '@/types/tourBooking';
import type { TripWithDetails } from '@/types/trip';

export type BookingCategory = 'all' | 'transport' | 'hotels' | 'tours' | 'guides';
export type BookingStatusTab = 'upcoming' | 'completed' | 'cancelled';
export type UnifiedBookingItem =
  | { kind: 'transport'; data: Booking }
  | { kind: 'hotel'; data: HotelBooking }
  | { kind: 'tour'; data: PackageBooking }
  | { kind: 'guide'; data: GuideBooking };

export function matchesBookingStatus(status: string, tab: BookingStatusTab) {
  return tab === 'upcoming'
    ? ['upcoming', 'confirmed', 'pending'].includes(status)
    : status === tab;
}

export function filterBookingItems(
  items: UnifiedBookingItem[],
  category: BookingCategory,
  status: BookingStatusTab,
) {
  const kinds: Record<Exclude<BookingCategory, 'all'>, UnifiedBookingItem['kind']> = {
    transport: 'transport',
    hotels: 'hotel',
    tours: 'tour',
    guides: 'guide',
  };
  const timestamp = (value: string) => {
    const date = Date.parse(value);
    return Number.isNaN(date) ? 0 : date;
  };
  return items
    .filter(
      (item) =>
        (category === 'all' || item.kind === kinds[category]) &&
        matchesBookingStatus(item.data.status, status),
    )
    .sort((a, b) => timestamp(b.data.createdAt) - timestamp(a.data.createdAt));
}

export function bookingMatchesQuery(
  item: UnifiedBookingItem,
  query: string,
  details: { trip?: TripWithDetails | null; hotel?: Hotel | null; room?: HotelRoom | null } = {},
) {
  const term = query.trim().toLowerCase();
  if (!term) return true;
  const fields = [item.data.bookingCode, item.data.id, item.kind, item.data.status];
  if (item.kind === 'transport')
    fields.push(
      details.trip?.from ?? '',
      details.trip?.to ?? '',
      details.trip?.agency.name ?? '',
      details.trip?.vehicleName ?? '',
      item.data.date,
      ...item.data.seats,
    );
  if (item.kind === 'hotel')
    fields.push(
      details.hotel?.name ?? '',
      details.hotel?.location.city ?? '',
      details.room?.name ?? '',
      item.data.checkIn,
      item.data.checkOut,
    );
  if (item.kind === 'tour')
    fields.push(item.data.title, item.data.destination, item.data.tourType, item.data.startDate);
  if (item.kind === 'guide')
    fields.push(
      item.data.serviceName,
      item.data.providerName,
      item.data.date,
      item.data.meetingPoint ?? '',
    );
  return fields.some((value) => value.toLowerCase().includes(term));
}

export function bookingStatusLabel(status: string) {
  return status === 'upcoming' || status === 'confirmed'
    ? 'Confirmed'
    : status === 'pending'
      ? 'Pending'
      : status === 'completed'
        ? 'Completed'
        : status === 'cancelled'
          ? 'Cancelled'
          : status;
}
