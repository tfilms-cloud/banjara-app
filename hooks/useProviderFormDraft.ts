import { useState, type Dispatch, type SetStateAction } from 'react';
import { useProviderStore } from '@/store/providerStore';

/** Persist edits as they happen, including invalid/partial values, without submitting them. */
export function useProviderFormDraft<T>(
  key: string,
  initial: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const cached = useProviderStore.getState().formDrafts[key];
    return cached !== undefined
      ? (cached as T)
      : typeof initial === 'function'
        ? (initial as () => T)()
        : initial;
  });
  const update: Dispatch<SetStateAction<T>> = (next) => {
    // Use the store's latest value so multiple updates in one event cannot lose changes.
    const previous =
      (useProviderStore.getState().formDrafts[key] as T | undefined) ?? value;
    const resolved =
      typeof next === 'function' ? (next as (current: T) => T)(previous) : next;
    useProviderStore.getState().setFormDraft(key, resolved);
    setValue(resolved);
  };
  return [value, update];
}
