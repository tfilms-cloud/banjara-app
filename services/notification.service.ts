import { get, put } from '@/services/api';
import { asArray, mapNotification, type AnyRecord } from '@/services/mappers';
import type { AppNotification } from '@/types/booking';

export async function getNotifications(): Promise<AppNotification[]> {
  const data = await get<unknown>('/notifications');
  return asArray<AnyRecord>(data).map(mapNotification);
}

export async function markRead(id: string) {
  await put(`/notifications/${id}/read`);
}

export async function markAllRead() {
  await put('/notifications/read-all');
}
