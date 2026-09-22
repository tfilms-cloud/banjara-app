import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import type { Coordinates } from '@/types/route';

/**
 * Optional device location for customer screens (pickup, nearby).
 * Does not request permission until `request()` is called.
 */
export function useLocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const request = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        setPermissionDenied(true);
        setLocation(null);
        return null;
      }
      setPermissionDenied(false);
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setLocation(coords);
      return coords;
    } catch {
      setPermissionDenied(true);
      setLocation(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Do not auto-request on mount — only when screens need it.
    setLoading(false);
  }, []);

  return { location, loading, permissionDenied, request };
}
