import { useEffect, useState } from 'react';
import * as bookingService from '@/services/bookingService';
import type { Booking, BookingStatus } from '@/types/booking';

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingService.getBookings();
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const byStatus = (status: BookingStatus | 'upcoming') => {
    if (status === 'upcoming') {
      return bookings.filter((item) => item.status === 'upcoming' || item.status === 'confirmed');
    }
    return bookings.filter((item) => item.status === status);
  };

  return { bookings, loading, error, refresh, byStatus };
}

export function useBooking(id?: string) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await bookingService.getBookingById(id);
        if (mounted) setBooking(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load booking');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  return { booking, loading, error, setBooking };
}
