import { useBackendState, useBackendEffect as useEffect } from '@/hooks/useBackendData';
import { useCallback, useRef, useState } from 'react';
import { getHotelById } from '@/services/hotelService';
import type { Hotel } from '@/types/hotel';

/** Property-only loading avoids coupling this overview to a separate room-inventory request. */
export function useHotelDetails(id: string) {
  const request = useRef(0);
  const [hotel, setHotel] = useBackendState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(
    async (force = true) => {
      const current = ++request.current;
      setLoading(true);
      const result = id ? await getHotelById(id, { refresh: force }) : null;
      if (current === request.current) {
        setHotel(result);
        setLoading(false);
      }
    },
    [id],
  );
  useEffect(() => {
    setHotel(null);
    void refresh(false);
    return () => {
      request.current++;
    };
  }, [refresh]);
  return { hotel: hotel?.id === id ? hotel : null, loading, refresh };
}
