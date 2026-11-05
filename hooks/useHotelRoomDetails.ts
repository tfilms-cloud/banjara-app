import { useBackendState, useBackendEffect as useEffect } from '@/hooks/useBackendData';
import { useCallback, useRef, useState } from 'react';
import { getHotelById, getRoomById } from '@/services/hotelService';
import type { Hotel, HotelRoom } from '@/types/hotel';

/** The room owns its property identity; a navigation query cannot replace it. */
export function useHotelRoomDetails(roomId: string) {
  const request = useRef(0);
  const [data, setData] = useBackendState<{ room: HotelRoom; hotel: Hotel | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(
    async (force = true) => {
      const current = ++request.current;
      setLoading(true);
      const room = roomId ? await getRoomById(roomId, { refresh: force }) : null;
      if (current !== request.current) return;
      const hotel = room?.hotelId ? await getHotelById(room.hotelId, { refresh: force }) : null;
      if (current === request.current) {
        setData(room ? { room, hotel: hotel?.id === room.hotelId ? hotel : null } : null);
        setLoading(false);
      }
    },
    [roomId],
  );
  useEffect(() => {
    setData(null);
    void refresh(false);
    return () => {
      request.current++;
    };
  }, [refresh]);
  return {
    room: data?.room.id === roomId ? data.room : null,
    hotel: data?.room.id === roomId ? data.hotel : null,
    loading,
    refresh,
  };
}
