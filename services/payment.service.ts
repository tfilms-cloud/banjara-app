import { get } from '@/services/api';
import type { AnyRecord } from '@/services/mappers';

/** Backend mock payment is tied to booking creation; this reads payment records. */
export async function getPayment(id: string) {
  return get<AnyRecord>(`/payments/${id}`);
}
