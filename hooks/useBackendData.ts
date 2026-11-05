import { useCallback, useEffect, useState, useSyncExternalStore, type DependencyList, type Dispatch, type EffectCallback, type SetStateAction } from 'react';
import { backendAvailability } from '@/services/backendAvailability';

export function useBackendStatus() {
  return useSyncExternalStore(backendAvailability.subscribe, backendAvailability.getSnapshot, backendAvailability.getSnapshot);
}

/** Keep page controls mounted, but never expose records from an older connection. */
export function useBackendState<T>(initial: T | (() => T), empty?: T): [T, Dispatch<SetStateAction<T>>] {
  const status = useBackendStatus();
  const [fallback] = useState(() => empty !== undefined ? empty : typeof initial === 'function' ? (initial as () => T)() : initial);
  const [stored, setStored] = useState(() => ({ value: typeof initial === 'function' ? (initial as () => T)() : initial, epoch: backendAvailability.getEpoch() }));
  const setValue = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    setStored(previous => {
      const epoch = backendAvailability.getEpoch();
      return {
        value: typeof next === 'function' ? (next as (value: T) => T)(previous.epoch === epoch ? previous.value : fallback) : next,
        epoch,
      };
    });
  }, [fallback]);
  return [status === 'online' && stored.epoch === backendAvailability.getEpoch() ? stored.value : fallback, setValue];
}

/** Re-fetch a screen's data on reconnect without resetting search/filter state. */
export function useBackendEffect(effect: EffectCallback, dependencies?: DependencyList) {
  const status = useBackendStatus();
  useEffect(effect, dependencies ? [status, ...dependencies] : undefined);
}
