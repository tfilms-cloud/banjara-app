import { get, post, put } from '@/services/api';
import { asArray, mapReview, type AnyRecord } from '@/services/mappers';
import type { Review } from '@/types/trip';

export type DualRatingPayload = {
  bookingId: string;
  paymentRating: number;
  serviceRating: number;
  paymentComment?: string;
  serviceComment?: string;
  comment?: string;
};

export type BookingReview = {
  id: string;
  bookingId: string;
  rating: number;
  paymentRating: number | null;
  serviceRating: number | null;
  comment: string;
  paymentComment: string;
  serviceComment: string;
  providerReply: string | null;
  createdAt?: string;
};

export async function createReview(payload: DualRatingPayload | {
  bookingId: string;
  rating: number;
  comment?: string;
  categories?: Record<string, number>;
}) {
  return post('/reviews', payload);
}

export async function getReviewForBooking(bookingId: string): Promise<BookingReview | null> {
  const data = await get<AnyRecord | null>(`/reviews/booking/${bookingId}`);
  if (!data || typeof data !== 'object') return null;
  return {
    id: String(data.id ?? ''),
    bookingId: String(data.bookingId ?? bookingId),
    rating: Number(data.rating ?? 0),
    paymentRating: data.paymentRating != null ? Number(data.paymentRating) : null,
    serviceRating: data.serviceRating != null ? Number(data.serviceRating) : null,
    comment: String(data.comment ?? ''),
    paymentComment: String(data.paymentComment ?? ''),
    serviceComment: String(data.serviceComment ?? ''),
    providerReply: data.providerReply ? String(data.providerReply) : null,
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
  };
}

export async function getProviderReviews(providerId: string): Promise<Review[]> {
  const data = await get<unknown>(`/reviews/provider/${providerId}`);
  return asArray<AnyRecord>(data).map(mapReview);
}

export async function updateReview(
  id: string,
  payload: {
    rating?: number;
    paymentRating?: number;
    serviceRating?: number;
    comment?: string;
    paymentComment?: string;
    serviceComment?: string;
  }
) {
  return put(`/reviews/${id}`, payload);
}

export async function replyToReview(id: string, reply: string) {
  return post(`/reviews/${id}/reply`, { reply });
}
