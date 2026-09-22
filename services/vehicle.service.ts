import { del, get, post, put } from '@/services/api';
import { asArray, mapProviderVehicle, type AnyRecord } from '@/services/mappers';

export async function listVehicles() {
  const data = await get<unknown>('/vehicles');
  return asArray<AnyRecord>(data).map(mapProviderVehicle);
}

export async function getVehicle(id: string) {
  const data = await get<AnyRecord>(`/vehicles/${id}`);
  return mapProviderVehicle(data);
}

export async function createVehicle(payload: Record<string, unknown>) {
  return post('/vehicles', payload);
}

export async function updateVehicle(id: string, payload: Record<string, unknown>) {
  return put(`/vehicles/${id}`, payload);
}

export async function deleteVehicle(id: string) {
  await del(`/vehicles/${id}`);
}
