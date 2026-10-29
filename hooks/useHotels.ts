import { useCallback, useEffect, useState } from 'react';
import * as hotelService from '@/services/hotelService';
import { useHotelStore } from '@/store/hotelStore';
import { useSearchStore } from '@/store/searchStore';
import type { Hotel, HotelBooking, HotelRoom } from '@/types/hotel';

export function useHotels() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
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
        sortBy
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
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { checkIn, checkOut, adults, children, rooms: roomCount } = useHotelStore();

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [hotelData, roomData] = await Promise.all([
          hotelService.getHotelById(id),
          hotelService.getHotelRooms(id, { checkIn, checkOut, adults, children, rooms: roomCount }),
        ]);
        if (!mounted) return;
        setHotel(hotelData);
        setRooms(roomData);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load hotel');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, checkIn, checkOut, adults, children, roomCount]);

  return { hotel, rooms, loading, error };
}

export function useHotelBookings() {
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
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
  const [booking, setBooking] = useState<HotelBooking | null>(null);
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
  const [hotels, setHotels] = useState<Hotel[]>([]);
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
