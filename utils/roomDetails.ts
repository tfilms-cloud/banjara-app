import type { HotelRoom } from '@/types/hotel';
import { roomInventory } from '@/utils/hotelRoomSelection';

export function roomTypeLabel(room: HotelRoom): string {
  const value = room.roomType?.trim().replace(/_/g, ' ');
  return value ? value.replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Not provided';
}

export function roomSizeLabel(room: HotelRoom): string {
  return Number.isFinite(room.sizeSqm) && room.sizeSqm > 0
    ? `${room.sizeSqm} m² (${Math.round(room.sizeSqm * 10.76391)} sq ft)`
    : 'Not provided';
}

export function roomCancellationLabel(room: HotelRoom): string | undefined {
  if (!room.freeCancellation) return undefined;
  return /\b24\s*(?:h(?:ours?)?|hrs?)\b/i.test(room.cancellationPolicy || '')
    ? 'Free cancellation (24h)'
    : 'Free cancellation';
}

export function roomAbout(room: HotelRoom): string {
  return (
    room.description?.trim() ||
    [
      room.bedType?.trim() ? `A room with ${room.bedType.trim()}` : 'A guest room',
      Number.isFinite(room.capacity) && room.capacity > 0
        ? `for up to ${room.capacity} guest${room.capacity === 1 ? '' : 's'}`
        : '',
      Number.isFinite(room.sizeSqm) && room.sizeSqm > 0 ? `with ${room.sizeSqm} m² of space` : '',
    ]
      .filter(Boolean)
      .join(' ') + '.'
  );
}

export function canSelectRoom(room: HotelRoom): boolean {
  return (
    !!room.hotelId &&
    roomInventory(room) > 0 &&
    Number.isFinite(room.pricePerNight) &&
    room.pricePerNight > 0
  );
}
