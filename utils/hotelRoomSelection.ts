import type { HotelRoom } from '@/types/hotel';

export function roomInventory(room: HotelRoom): number {
  return Number.isFinite(room.availableRooms) ? Math.max(0, Math.floor(room.availableRooms)) : 0;
}

/** Reconcile a returning selection against this property's fresh, date-specific inventory. */
export function reconcileRoomSelection(
  hotelId: string,
  rooms: HotelRoom[],
  selected: HotelRoom | null,
  quantity: number,
) {
  const room =
    rooms.find(
      (item) => item.id === selected?.id && item.hotelId === hotelId && roomInventory(item) > 0,
    ) ?? null;
  return {
    room,
    quantity: room ? Math.max(1, Math.min(roomInventory(room), Math.floor(quantity) || 1)) : 1,
  };
}

export function roomSummary(room: HotelRoom): string {
  return [
    room.roomType?.replace(/_/g, ' '),
    room.bedType,
    room.capacity > 0 ? `Up to ${room.capacity} guest${room.capacity === 1 ? '' : 's'}` : null,
    room.sizeSqm > 0 ? `${room.sizeSqm} m²` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}
