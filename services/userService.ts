import { get, put, apiRequest } from '@/services/api';
import { asArray, mapNotification, mapUser, type AnyRecord } from '@/services/mappers';
import type { AppNotification } from '@/types/booking';
import type { User } from '@/types/user';

export async function getProfile(): Promise<User> {
  const data = await get<AnyRecord>('/users/me');
  return mapUser(data);
}

export async function updateProfile(updates: Partial<User>): Promise<User> {
  const data = await put<AnyRecord>('/users/me', {
    name: updates.name,
    phone: updates.phone,
    avatar: updates.avatar,
  });
  return mapUser(data);
}

export async function updatePassword(currentPassword: string, newPassword: string): Promise<void> {
  await put('/users/me/password', { currentPassword, newPassword });
}

export async function updateAvatar(avatarUrl: string): Promise<User> {
  const data = await put<AnyRecord>('/users/me/avatar', { avatar: avatarUrl });
  return mapUser(data);
}

export async function uploadAvatarFile(uri: string, fileName = `avatar-${Date.now()}.jpg`): Promise<User> {
  const form = new FormData();
  form.append('file', {
    uri,
    name: fileName,
    type: 'image/jpeg',
  } as unknown as Blob);
  const data = await apiRequest<AnyRecord>({
    method: 'PUT',
    url: '/users/me/avatar',
    data: form,
    headers: { 'Content-Type': 'multipart/form-data' },
    transformRequest: [(payload) => payload],
    timeout: 60000,
  });
  return mapUser(data);
}

export async function getNotifications(): Promise<AppNotification[]> {
  const data = await get<unknown>('/notifications');
  return asArray<AnyRecord>(data).map(mapNotification);
}

export async function markNotificationRead(id: string): Promise<void> {
  await put(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await put('/notifications/read-all');
}
