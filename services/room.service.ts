import { del, get, post, put } from '@/services/api';
import { asArray, mapHotelRoom, type AnyRecord } from '@/services/mappers';

export async function listRoomsByHotel(hotelId: string) {
  const data = await get<unknown>(`/rooms/hotel/${hotelId}`);
  return asArray<AnyRecord>(data).map(mapHotelRoom);
}

export async function getRoom(id: string) {
  const data = await get<AnyRecord>(`/rooms/${id}`);
  return mapHotelRoom(data);
}

export async function createRoom(payload: Record<string, unknown>) {
  return post('/rooms', payload);
}

export async function updateRoom(id: string, payload: Record<string, unknown>) {
  return put(`/rooms/${id}`, payload);
}

export async function deleteRoom(id: string) {
  await del(`/rooms/${id}`);
}
