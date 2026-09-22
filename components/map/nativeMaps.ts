import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { NativeModules, Platform } from 'react-native';

type MapsModule = {
  default: React.ComponentType<Record<string, unknown>>;
  Marker: React.ComponentType<Record<string, unknown>>;
  Callout?: React.ComponentType<Record<string, unknown>>;
  Circle?: React.ComponentType<Record<string, unknown>>;
  Polyline?: React.ComponentType<Record<string, unknown>>;
  PROVIDER_GOOGLE?: string;
  PROVIDER_DEFAULT?: string;
};

let cached: MapsModule | null | undefined;

function isExpoGo() {
  return Constants.appOwnership === 'expo';
}

function hasNativeMapsModule() {
  const modules = NativeModules as Record<string, unknown>;
  return Boolean(
    modules.RNMapsAirModule ||
      modules.AirMapModule ||
      modules.RNMapsMapView ||
      modules.RNMapsGoogleMapView
  );
}

/**
 * Lazily load react-native-maps only when the native module is present.
 * Expo Go + New Architecture often lacks RNMapsAirModule and can crash Metro
 * on a bare dynamic import — we fall back to MapFallback instead.
 */
export function useNativeMaps(): { maps: MapsModule | null; ready: boolean } {
  const [maps, setMaps] = useState<MapsModule | null>(cached === undefined ? null : cached);
  const [ready, setReady] = useState(cached !== undefined);

  useEffect(() => {
    if (cached !== undefined) {
      setMaps(cached);
      setReady(true);
      return;
    }

    let alive = true;

    const finish = (value: MapsModule | null) => {
      cached = value;
      if (alive) {
        setMaps(value);
        setReady(true);
      }
    };

    // Never pull maps into the Expo Go async require path — it triggers
    // "Requiring unknown module" / missing RNMapsAirModule crashes.
    if (isExpoGo() || !hasNativeMapsModule()) {
      finish(null);
      return;
    }

    try {
      // Sync require only after native module is confirmed present (dev/prod builds).
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('react-native-maps') as MapsModule;
      if (!mod?.default || !mod?.Marker) {
        finish(null);
        return;
      }
      finish(mod);
    } catch {
      finish(null);
    }

    return () => {
      alive = false;
    };
  }, []);

  return { maps, ready };
}

export function mapsProvider(maps: MapsModule | null) {
  if (!maps) return undefined;
  return Platform.OS === 'android' ? maps.PROVIDER_GOOGLE : undefined;
}
