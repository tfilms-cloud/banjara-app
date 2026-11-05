import { useEffect, useState } from 'react';
import { get } from '@/services/api';
import { chatBookingContext, type ChatBookingContext } from '@/utils/chatPresentation';

export function useChatBookingContext(
  bookingId: string | undefined,
  otherUserId: string,
  enabled: boolean,
) {
  const key = `${bookingId ?? ''}:${otherUserId}`;
  const [result, setResult] = useState<{ key: string; booking: ChatBookingContext | null }>();
  useEffect(() => {
    if (!enabled || !bookingId) return;
    let current = true;
    void get<Record<string, unknown>>(`/bookings/${encodeURIComponent(bookingId)}`)
      .then((raw) => {
        if (current) setResult({ key, booking: chatBookingContext(raw, otherUserId) });
      })
      .catch(() => {
        if (current) setResult({ key, booking: null });
      });
    return () => {
      current = false;
    };
  }, [key, bookingId, otherUserId, enabled]);
  return enabled && result?.key === key ? result.booking : null;
}
