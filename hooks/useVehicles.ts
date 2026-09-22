import { useCallback, useEffect, useState } from 'react';
import * as providerService from '@/services/providerService';
import type { ProviderVehicle } from '@/types/provider';

export function useVehicles(providerId?: string) {
  const [vehicles, setVehicles] = useState<ProviderVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await providerService.getProviderVehicles(providerId);
      setVehicles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { vehicles, loading, error, refresh };
}
