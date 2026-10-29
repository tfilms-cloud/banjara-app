import { useCallback, useEffect, useState } from 'react';
import * as tourItineraryService from '@/services/tourItineraryService';
import type { TourItinerary, TourOperatorBrief, TourType, TourTypeCatalog } from '@/types/tourItinerary';

export function useTourCatalog(tourType: TourType) {
  const [catalog, setCatalog] = useState<TourTypeCatalog | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setCatalog(await tourItineraryService.getCatalog(tourType));
    } catch {
      setCatalog({ tourType, featured: [], popular: [], newest: [] });
    } finally {
      setLoading(false);
    }
  }, [tourType]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { catalog, loading, refresh };
}

export function useBestTourOperators(limit = 12) {
  const [operators, setOperators] = useState<TourOperatorBrief[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setOperators(await tourItineraryService.getBestOperators(limit));
    } catch {
      setOperators([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { operators, loading, refresh };
}

export function useTourItinerary(id: string) {
  const [item, setItem] = useState<TourItinerary | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setItem(await tourItineraryService.getPublished(id));
    } catch (err) {
      setItem(null);
      setError(err instanceof Error ? err.message : 'Could not load itinerary');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { item, loading, error, refresh };
}
