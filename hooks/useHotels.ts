import { useBackendState, useBackendEffect as useEffect } from '@/hooks/useBackendData';
import { useCallback, useRef, useState } from 'react';
import * as hotelService from '@/services/hotelService';
import { useHotelStore } from '@/store/hotelStore';
import { useSearchStore } from '@/store/searchStore';
import type { Hotel, HotelBooking, HotelRoom } from '@/types/hotel';

export function useHotels() {
  const [hotels, setHotels] = useBackendState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getSearchParams, filters, sortBy } = useHotelStore();
  const query = useSearchStore((s) => s.query);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await hotelService.searchHotels(
        { ...getSearchParams(), query: query.trim() || undefined },
        filters,
        sortBy,
      );
      setHotels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hotels');
    } finally {
      setLoading(false);
    }
  }, [filters, getSearchParams, query, sortBy]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { hotels, loading, error, refresh };
}

export function useHotel(id?: string) {
  const [hotel, setHotel] = useBackendState<Hotel | null>(null);
  const [rooms, setRooms] = useBackendState<HotelRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { checkIn, checkOut, adults, children, rooms: roomCount } = useHotelStore();
  const request = useRef(0);
  const refresh = useCallback(
    async (force = true) => {
      const current = ++request.current;
      setLoading(true);
      setError(null);
      try {
        if (!id) throw new Error('Property not found');
        const [hotelData, roomData] = await Promise.all([
          hotelService.getHotelById(id, { refresh: force }),
          hotelService.getHotelRooms(id, { checkIn, checkOut, adults, children, rooms: roomCount }),
        ]);
        if (current !== request.current) return;
        if (!hotelData) throw new Error('This property is unavailable. Please try again.');
        setHotel(hotelData);
        setRooms(roomData);
      } catch (err) {
        if (current === request.current) {
          setHotel(null);
          setRooms([]);
          setError(err instanceof Error ? err.message : 'Failed to load rooms');
        }
      } finally {
        if (current === request.current) setLoading(false);
      }
    },
    [id, checkIn, checkOut, adults, children, roomCount],
  );
  useEffect(() => {
    void refresh(false);
    return () => {
      request.current++;
    };
  }, [refresh]);

  return {
    hotel: hotel?.id === id ? hotel : null,
    rooms: hotel?.id === id ? rooms : [],
    loading,
    error,
    refresh,
  };
}

export function useHotelBookings() {
  const [bookings, setBookings] = useBackendState<HotelBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await hotelService.getHotelBookings();
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hotel bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { bookings, loading, error, refresh };
}

export function useHotelBooking(id?: string) {
  const [booking, setBooking] = useBackendState<HotelBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      const data = await hotelService.getHotelBookingById(id);
      if (mounted) {
        setBooking(data);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  return { booking, loading, setBooking };
}

export function usePopularHotels() {
  const [hotels, setHotels] = useBackendState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const data = await hotelService.getPopularHotels();
      setHotels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hotels');
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { hotels, loading, error, refresh };
}
