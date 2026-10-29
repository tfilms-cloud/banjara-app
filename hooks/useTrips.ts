import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/services/apiError';
import * as tripService from '@/services/tripService';
import { useSearchStore } from '@/store/searchStore';
import type { TripWithDetails } from '@/types/trip';

export function useTrips() {
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const from = useSearchStore((s) => s.from);
  const to = useSearchStore((s) => s.to);
  const date = useSearchStore((s) => s.date);
  const passengers = useSearchStore((s) => s.passengers);
  const productMode = useSearchStore((s) => s.productMode);
  const query = useSearchStore((s) => s.query);
  const filters = useSearchStore((s) => s.filters);
  const sortBy = useSearchStore((s) => s.sortBy);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const journeyType =
        filters.journeyType ?? (productMode === 'trips' ? 'round_trip' : 'one_way');
      const data = await tripService.searchTrips(
        { from, to, date, passengers, journeyType, query: query.trim() || undefined },
        { ...filters, journeyType },
        sortBy
      );
      setTrips(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // Primitive search fields only — avoid looping on unstable function refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, date, passengers, productMode, query, filters, sortBy]);

  return { trips, loading, error, refresh };
}

export function useTrip(id?: string) {
  const [trip, setTrip] = useState<TripWithDetails | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (bustCache = false) => {
    if (!id) {
      setTrip(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (bustCache) tripService.invalidateTripCache(id);
      const data = await tripService.getTripById(id);
      setTrip(data);
      if (!data) setError('This trip is no longer available.');
    } catch (err) {
      setTrip(null);
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { trip, loading, error, refresh };
}

export function useRecommendedTrips() {
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const data = await tripService.getRecommendedTrips();
      setTrips(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trips');
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { trips, loading, error, refresh };
}
