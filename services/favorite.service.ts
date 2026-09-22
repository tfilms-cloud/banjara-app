import { del, get, post } from '@/services/api';
import { asArray, idOf, type AnyRecord } from '@/services/mappers';

export type FavoriteItem = {
  id: string;
  targetType: 'trip' | 'hotel' | 'provider';
  targetId: string;
};

export async function listFavorites(): Promise<FavoriteItem[]> {
  const data = await get<unknown>('/favorites');
  return asArray<AnyRecord>(data).map((item) => ({
    id: idOf(item),
    targetType: item.targetType as FavoriteItem['targetType'],
    targetId: idOf(item.targetId),
  }));
}

export async function addFavorite(targetType: FavoriteItem['targetType'], targetId: string) {
  return post<AnyRecord>('/favorites', { targetType, targetId });
}

export async function removeFavorite(favoriteId: string) {
  await del(`/favorites/${favoriteId}`);
}
