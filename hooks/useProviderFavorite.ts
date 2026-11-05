import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as favoriteService from '@/services/favorite.service';
import { useAuthStore } from '@/store/authStore';

/** Provider bookmarks use the existing favorite API; guests keep an on-device bookmark. */
export function useProviderFavorite(providerId: string) {
  const token = useAuthStore((state) => state.token);
  const guest = !token || token === 'guest-token';
  const generation = useRef(0);
  const pending = useRef(false);
  const [state, setState] = useState({ saved: false, favoriteId: '', busy: true, ready: false });
  const key = `banjara-guest-provider-favorite:${providerId}`;

  useEffect(() => {
    const current = ++generation.current;
    setState({ saved: false, favoriteId: '', busy: true, ready: false });
    void (async () => {
      try {
        const favorite = guest
          ? (await AsyncStorage.getItem(key)) === 'true'
            ? { id: '', targetId: providerId }
            : undefined
          : (await favoriteService.listFavorites()).find(
              (item) => item.targetType === 'provider' && item.targetId === providerId,
            );
        if (current === generation.current)
          setState({
            saved: Boolean(favorite),
            favoriteId: favorite?.id || '',
            busy: false,
            ready: true,
          });
      } catch {
        if (current === generation.current)
          setState({ saved: false, favoriteId: '', busy: false, ready: false });
      }
    })();
    return () => {
      generation.current++;
    };
  }, [key, providerId, token, guest]);

  const toggle = useCallback(async () => {
    if (pending.current || state.busy || !providerId) return;
    pending.current = true;
    const current = generation.current;
    setState((previous) => ({ ...previous, busy: true }));
    try {
      // Re-read after an initial load failure rather than accidentally adding a duplicate.
      const existing =
        !guest && !state.ready
          ? (await favoriteService.listFavorites()).find(
              (item) => item.targetType === 'provider' && item.targetId === providerId,
            )
          : undefined;
      const saved = existing ? true : state.saved;
      let favoriteId = existing?.id || state.favoriteId;
      if (guest) {
        if (saved) await AsyncStorage.removeItem(key);
        else await AsyncStorage.setItem(key, 'true');
      } else if (saved) {
        await favoriteService.removeFavorite(favoriteId);
        favoriteId = '';
      } else {
        const created = await favoriteService.addFavorite('provider', providerId);
        favoriteId = String(created.id || created._id || '');
      }
      if (current === generation.current)
        setState({ saved: !saved, favoriteId, busy: false, ready: true });
    } catch (error) {
      if (current === generation.current) setState((previous) => ({ ...previous, busy: false }));
      throw error;
    } finally {
      pending.current = false;
    }
  }, [state, providerId, key, guest]);
  return { saved: state.saved, busy: state.busy, toggle };
}
