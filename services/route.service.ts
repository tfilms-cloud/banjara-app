import { del, get, post, put } from '@/services/api';
import { asArray, mapRouteInfo, type AnyRecord } from '@/services/mappers';

export async function listRoutes() {
  const data = await get<unknown>('/routes');
  return asArray<AnyRecord>(data).map(mapRouteInfo);
}

export async function getRoute(id: string) {
  const data = await get<AnyRecord>(`/routes/${id}`);
  return mapRouteInfo(data);
}

export async function createRoute(payload: Record<string, unknown>) {
  return post('/routes', payload);
}

export async function updateRoute(id: string, payload: Record<string, unknown>) {
  return put(`/routes/${id}`, payload);
}

export async function deleteRoute(id: string) {
  await del(`/routes/${id}`);
}
