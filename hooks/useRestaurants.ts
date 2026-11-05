import { useBackendState, useBackendEffect as useEffect } from '@/hooks/useBackendData';
import { useCallback, useRef, useState } from 'react';
import * as restaurantService from '@/services/restaurantService';
import type { Restaurant } from '@/types/restaurant';
import type { Provider } from '@/types/provider';

export function useRestaurants(initialCity = '', options?: { autoLoad?: boolean }) {
  const autoLoad = options?.autoLoad !== false;
  const [city, setCity] = useState(initialCity);
  const [restaurants, setRestaurants] = useBackendState<Restaurant[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (opts?: { city?: string; silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      setError(null);
      try {
        const query = opts?.city ?? city;
        const data = await restaurantService.searchRestaurants(query);
        setRestaurants(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load restaurants');
        setRestaurants([]);
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [city]
  );

  useEffect(() => {
    if (!autoLoad) return;
    void refresh();
  }, [autoLoad, refresh]);

  const searchByDestination = useCallback(
    async (destination: string) => {
      setCity(destination);
      await refresh({ city: destination });
    },
    [refresh]
  );

  return {
    city,
    setCity,
    restaurants,
    loading,
    error,
    refresh,
    searchByDestination,
    offerRestaurants: restaurantService.rankRestaurantsByOffers(
      restaurants.filter((r) => r.offers.some((o) => o.active))
    ),
    mostVisited: restaurantService.rankMostVisited(restaurants).slice(0, 12),
  };
}

export function useRestaurant(id?: string) {
  const [restaurant, setRestaurant] = useBackendState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const request = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++request.current;
    setLoading(true);
    const data = id ? await restaurantService.getRestaurantById(id) : null;
    if (current === request.current) {
      setRestaurant(data);
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    setRestaurant(null);
    void refresh();
    return () => {
      request.current++;
    };
  }, [refresh]);

  return { restaurant: restaurant?.id === id ? restaurant : null, loading, refresh };
}

export function useGuides(city = '', options?: { autoLoad?: boolean }) {
  const autoLoad = options?.autoLoad !== false;
  const [guides, setGuides] = useBackendState<Provider[]>([]);
  const [loading, setLoading] = useState(autoLoad);

  const refresh = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      try {
        setGuides(await restaurantService.searchGuides(city));
      } catch {
        setGuides([]);
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [city]
  );

  useEffect(() => {
    if (!autoLoad) return;
    void refresh();
  }, [autoLoad, refresh]);

  return { guides, loading, refresh };
}

export function useTourOperators(city = '', options?: { autoLoad?: boolean }) {
  const autoLoad = options?.autoLoad !== false;
  const [tours, setTours] = useBackendState<Provider[]>([]);
  const [loading, setLoading] = useState(autoLoad);

  const refresh = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      try {
        setTours(await restaurantService.searchTourOperators(city));
      } catch {
        setTours([]);
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [city]
  );

  useEffect(() => {
    if (!autoLoad) return;
    void refresh();
  }, [autoLoad, refresh]);

  return { tours, loading, refresh };
}
