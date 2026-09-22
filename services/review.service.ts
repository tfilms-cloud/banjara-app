import { get, post, put } from '@/services/api';
import { asArray, mapReview, type AnyRecord } from '@/services/mappers';
import type { Review } from '@/types/trip';

export async function createReview(payload: {
  bookingId: string;
  rating: number;
  comment?: string;
  categories?: Record<string, number>;
}) {
  return post('/reviews', payload);
}

export async function getProviderReviews(providerId: string): Promise<Review[]> {
  const data = await get<unknown>(`/reviews/provider/${providerId}`);
  return asArray<AnyRecord>(data).map(mapReview);
}

export async function updateReview(id: string, payload: { rating?: number; comment?: string }) {
  return put(`/reviews/${id}`, payload);
}

export async function replyToReview(id: string, reply: string) {
  return post(`/reviews/${id}/reply`, { reply });
}
