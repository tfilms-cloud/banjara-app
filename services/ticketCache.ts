import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Booking } from '@/types/booking';
import type { PickupPoint } from '@/types/route';
import type { TripWithDetails } from '@/types/trip';

const KEY = 'banjara-offline-tickets';

export type CachedTicket = {
  booking: Booking;
  trip: TripWithDetails;
  pickup: PickupPoint | null;
  qrCode?: string;
  savedAt: string;
};

export async function saveOfflineTicket(ticket: Omit<CachedTicket, 'savedAt'>): Promise<void> {
  const existing = await listOfflineTickets();
  const next: CachedTicket = { ...ticket, savedAt: new Date().toISOString() };
  const filtered = existing.filter((item) => item.booking.id !== ticket.booking.id);
  await AsyncStorage.setItem(KEY, JSON.stringify([next, ...filtered].slice(0, 12)));
}

export async function listOfflineTickets(): Promise<CachedTicket[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CachedTicket[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getOfflineTicket(bookingId: string): Promise<CachedTicket | null> {
  const all = await listOfflineTickets();
  return all.find((item) => item.booking.id === bookingId) ?? null;
}
