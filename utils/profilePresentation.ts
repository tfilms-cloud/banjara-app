import type { User } from '@/types/user';

type ProfileBookingRecord = { bookingType?: unknown; bookingStatus?: unknown };

/** Counts use the same booking states as the customer Bookings tab. */
export function profileBookingStats(records: ProfileBookingRecord[]) {
  let journeys = 0;
  let active = 0;
  for (const record of records) {
    if (!['transport', 'hotel', 'package', 'guide'].includes(String(record.bookingType))) continue;
    if (record.bookingStatus === 'completed') journeys += 1;
    if (
      ['pending', 'payment_verification', 'confirmed', 'upcoming'].includes(
        String(record.bookingStatus),
      )
    )
      active += 1;
  }
  return { journeys, active };
}

export function profileSavedCount(ids: string[]) {
  return new Set(ids.map((id) => id.trim()).filter(Boolean)).size;
}
/** Persisted profile data must belong to the current signed-in account. */
export function profileAccountPerson(user: User | null, profile: User | null) {
  if (!user || user.id === 'guest') return null;
  return profile?.id === user.id ? profile : user;
}
