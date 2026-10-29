import { useCallback, useEffect, useState } from 'react';
import * as restaurantService from '@/services/restaurantService';
import type { Restaurant } from '@/types/restaurant';
import type { Provider } from '@/types/provider';

export function useRestaurants(initialCity = '', options?: { autoLoad?: boolean }) {
  const autoLoad = options?.autoLoad !== false;
  const [city, setCity] = useState(initialCity);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
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
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      setLoading(true);
      const data = await restaurantService.getRestaurantById(id);
      if (mounted) {
        setRestaurant(data);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  return { restaurant, loading };
}

export function useGuides(city = '', options?: { autoLoad?: boolean }) {
  const autoLoad = options?.autoLoad !== false;
  const [guides, setGuides] = useState<Provider[]>([]);
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
  const [tours, setTours] = useState<Provider[]>([]);
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
