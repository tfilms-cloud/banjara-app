import type { ChatConversation } from '@/types/chat';

export type InboxFilter = 'all' | 'unread' | 'providers' | 'guides';

export function conversationRole(role?: string) {
  const value = (role ?? '').trim().toLowerCase();
  if (value.includes('guide')) return 'Guide';
  if (value.includes('admin') || value.includes('support')) return 'Admin';
  if (value.includes('hotel') || value.includes('host')) return 'Host';
  if (/provider|agency|operator/.test(value)) return 'Provider';
  return 'Traveler';
}

export function filterConversations(items: ChatConversation[], query: string, filter: InboxFilter) {
  const term = query.trim().toLowerCase();
  return items.filter((item) => {
    const role = conversationRole(item.otherUserRole);
    if (filter === 'unread' && item.unreadCount <= 0) return false;
    if (filter === 'providers' && !['Provider', 'Host', 'Guide'].includes(role)) return false;
    if (filter === 'guides' && role !== 'Guide') return false;
    return (
      !term ||
      [item.otherUserName, item.lastMessage, item.bookingId ?? '', role].some((value) =>
        value.toLowerCase().includes(term),
      )
    );
  });
}

export type ChatBookingContext = {
  id: string;
  code: string;
  kind: 'transport' | 'hotel' | 'package' | 'guide';
  title: string;
  date?: string;
  time?: string;
  seats: string[];
  status?: string;
  detailHref: string;
  ticketHref?: string;
};

/** Display only the linked record returned by the authorized booking endpoint. */
export function chatBookingContext(
  raw: Record<string, unknown>,
  otherUserId: string,
): ChatBookingContext | null {
  if (raw.providerUserId && String(raw.providerUserId) !== otherUserId) return null;
  const id = String(raw.id ?? raw._id ?? '').trim();
  const kind = raw.bookingType;
  if (!id || !['transport', 'hotel', 'package', 'guide'].includes(String(kind))) return null;
  const transport = kind === 'transport';
  const hotel = kind === 'hotel';
  const route =
    raw.tripOrigin && raw.tripDestination ? `${raw.tripOrigin} → ${raw.tripDestination}` : '';
  const title = String(
    route ||
      raw.routeLabel ||
      raw.hotelName ||
      raw.packageTitle ||
      (hotel
        ? 'Stay booking'
        : kind === 'guide'
          ? 'Guide booking'
          : kind === 'package'
            ? 'Tour booking'
            : 'Transport booking'),
  );
  const status = raw.bookingStatus ? String(raw.bookingStatus) : undefined;
  const ticketReady =
    transport &&
    ['confirmed', 'completed'].includes(status ?? '') &&
    ['paid', 'confirmed'].includes(String(raw.paymentStatus));
  return {
    id,
    kind: kind as ChatBookingContext['kind'],
    title,
    code: String(raw.bookingNumber || id.slice(-8)),
    date: raw.tripDate || raw.checkIn ? String(raw.tripDate || raw.checkIn) : undefined,
    time: transport && raw.tripDepartureTime ? String(raw.tripDepartureTime) : undefined,
    seats: Array.isArray(raw.seats) ? raw.seats.map(String) : [],
    status,
    detailHref: transport
      ? `/(customer)/booking-details/${id}`
      : hotel
        ? `/(customer)/hotels/booking-details/${id}`
        : '/(customer)/(tabs)/bookings',
    ticketHref: ticketReady ? `/(customer)/ticket/${id}` : undefined,
  };
}
