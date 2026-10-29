import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { getApiErrorMessage } from '@/services/apiError';
import * as locationService from '@/services/locationService';
import type { LocationPickerValue, PlaceSearchResult, StructuredAddress } from '@/types/location';

const DEFAULT_CENTER = { latitude: 36.3167, longitude: 74.65 }; // Hunza / Gilgit region

function emptyAddress(): StructuredAddress {
  return {
    street: '',
    area: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'Pakistan',
    formattedAddress: '',
  };
}

export function useLocationSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);

  useEffect(() => () => {
    requestId.current++;
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const search = useCallback((text: string) => {
    const id = ++requestId.current;
    setQuery(text);
    setError(null);
    setResults([]);
    if (timer.current) clearTimeout(timer.current);
    if (text.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    timer.current = setTimeout(async () => {
      try {
        const data = await locationService.searchPlaces(text.trim());
        if (id !== requestId.current) return;
        setResults(data);
        if (!data.length) setError('No places found. Try a different search.');
      } catch (err) {
        if (id !== requestId.current) return;
        setResults([]);
        setError(getApiErrorMessage(err));
      } finally {
        if (id === requestId.current) setSearching(false);
      }
    }, 450);
  }, []);

  const clear = useCallback(() => {
    requestId.current++;
    if (timer.current) clearTimeout(timer.current);
    setSearching(false);
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  return { query, results, searching, error, search, clear, setQuery };
}

export function useReverseGeocode() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const cancel = useCallback(() => {
    requestId.current++;
    setLoading(false);
    setError(null);
  }, []);
  useEffect(() => () => { requestId.current++; }, []);

  const reverse = useCallback(async (latitude: number, longitude: number) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const place = await locationService.reverseGeocode(latitude, longitude);
      if (id !== requestId.current) return null;
      return place;
    } catch (err) {
      if (id !== requestId.current) return null;
      try {
        const rows = await Location.reverseGeocodeAsync({ latitude, longitude });
        const row = rows[0];
        if (id !== requestId.current) return null;
        if (row) {
          const formatted = [
            row.streetNumber,
            row.street,
            row.district,
            row.city,
            row.subregion,
            row.region,
            row.country,
          ]
            .filter(Boolean)
            .join(', ');
          return {
            name: row.name || row.city || 'Pinned location',
            address: {
              street: [row.streetNumber, row.street].filter(Boolean).join(' '),
              area: row.district || row.subregion || '',
              city: row.city || row.subregion || '',
              region: row.region || '',
              postalCode: row.postalCode || '',
              country: row.country || 'Pakistan',
              formattedAddress: formatted,
            },
            latitude,
            longitude,
            location: { type: 'Point' as const, coordinates: [longitude, latitude] as [number, number] },
          };
        }
      } catch {
        // fall through to API error
      }
      if (id !== requestId.current) return null;
      setError(getApiErrorMessage(err));
      return null;
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  return { reverse, loading, error, cancel };
}

export function useCurrentLocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<Location.PermissionStatus | null>(null);

  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  const getCurrentPosition = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const current = await Location.getForegroundPermissionsAsync();
      setPermission(current.status);

      if (current.status === Location.PermissionStatus.DENIED && !current.canAskAgain) {
        setError(
          'Location access is disabled. Please enable location permission in settings or select your location manually on the map.'
        );
        return null;
      }

      let status = current.status;
      if (status !== Location.PermissionStatus.GRANTED) {
        const asked = await Location.requestForegroundPermissionsAsync();
        status = asked.status;
        setPermission(asked.status);
      }

      if (status !== Location.PermissionStatus.GRANTED) {
        setError(
          'Location access is disabled. Please enable location permission or select your location manually on the map.'
        );
        return null;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setError('Location services are turned off. Enable GPS or pick a location on the map.');
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
    } catch {
      setError(
        Platform.OS === 'ios'
          ? 'Unable to get your current location. Try again or move the map pin manually.'
          : 'GPS unavailable. Check location services or select your location on the map.'
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getCurrentPosition, loading, error, permission, openSettings, setError };
}

export function useLocationPicker(initial?: Partial<LocationPickerValue>) {
  const [value, setValue] = useState<LocationPickerValue>({
    latitude: initial?.latitude ?? DEFAULT_CENTER.latitude,
    longitude: initial?.longitude ?? DEFAULT_CENTER.longitude,
    address: initial?.address ?? emptyAddress(),
    placeName: initial?.placeName,
  });
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [offlineHint, setOfflineHint] = useState(false);

  const applyPlace = useCallback((place: PlaceSearchResult) => {
    setValue({
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.address,
      placeName: place.name,
    });
    setOfflineHint(false);
  }, []);

  const applyCoords = useCallback((latitude: number, longitude: number, address?: StructuredAddress, placeName?: string) => {
    setValue((prev) => ({
      latitude,
      longitude,
      address: address ?? prev.address,
      placeName: placeName ?? prev.placeName,
    }));
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    setOfflineHint(false);
    try {
      const saved = await locationService.saveMyBusinessLocation({
        address: value.address,
        latitude: value.latitude,
        longitude: value.longitude,
      });
      return saved;
    } catch (err) {
      const message = getApiErrorMessage(err);
      if (message.toLowerCase().includes('connect') || message.toLowerCase().includes('network')) {
        setOfflineHint(true);
        setSaveError("No internet connection. Your location hasn't been saved yet.");
      } else {
        setSaveError(message);
      }
      throw err;
    } finally {
      setSaving(false);
    }
  }, [value]);

  return {
    value,
    setValue,
    applyPlace,
    applyCoords,
    confirming,
    setConfirming,
    saving,
    saveError,
    offlineHint,
    save,
    defaultCenter: DEFAULT_CENTER,
  };
}

/** Shared selection flow for provider and customer maps. Only the map's Pin button confirms it. */
export function usePinnedLocationPicker(initial?: Partial<LocationPickerValue>) {
  const picker = useLocationPicker(initial);
  const current = useCurrentLocation();
  const { reverse, loading: reversing, error: reverseError, cancel } = useReverseGeocode();
  const [pinConfirmed, setPinConfirmed] = useState(false);
  const selectionVersion = useRef(0);
  const { applyCoords, applyPlace } = picker;

  useEffect(() => () => { selectionVersion.current++; }, []);

  const onPinStatusChange = useCallback((confirmed: boolean) => {
    setPinConfirmed(confirmed);
    if (!confirmed) {
      selectionVersion.current++;
      cancel();
    }
  }, [cancel]);

  const resolveCoordinates = useCallback(async (latitude: number, longitude: number, version: number) => {
    // Never show a previous address beside a newly chosen coordinate.
    applyCoords(latitude, longitude, emptyAddress(), '');
    const place = await reverse(latitude, longitude);
    if (place && version === selectionVersion.current) {
      // Reverse geocoders may return a nearby building. Keep the user's exact pin.
      applyCoords(latitude, longitude, place.address, place.name);
    }
  }, [applyCoords, reverse]);

  const onRegionSettled = useCallback(async (latitude: number, longitude: number) => {
    await resolveCoordinates(latitude, longitude, ++selectionVersion.current);
  }, [resolveCoordinates]);

  const selectPlace = useCallback((place: PlaceSearchResult) => {
    onPinStatusChange(false);
    applyPlace(place);
  }, [applyPlace, onPinStatusChange]);

  const onUseCurrent = useCallback(async () => {
    onPinStatusChange(false);
    const version = selectionVersion.current;
    const position = await current.getCurrentPosition();
    if (!position || version !== selectionVersion.current) return;
    await resolveCoordinates(position.latitude, position.longitude, version);
  }, [current.getCurrentPosition, onPinStatusChange, resolveCoordinates]);

  return { picker, current, reversing, reverseError, pinConfirmed, onPinStatusChange, onRegionSettled, selectPlace, onUseCurrent };
}

export { DEFAULT_CENTER, emptyAddress };
