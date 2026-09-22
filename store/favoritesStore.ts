import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as favoriteService from '@/services/favorite.service';
import { useAuthStore } from '@/store/authStore';

interface FavoritesState {
  hotelIds: string[];
  favoriteIdsByHotel: Record<string, string>;
  syncing: boolean;
  toggleHotel: (hotelId: string) => Promise<void>;
  isFavorite: (hotelId: string) => boolean;
  clearFavorites: () => void;
  syncFromBackend: () => Promise<void>;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      hotelIds: [],
      favoriteIdsByHotel: {},
      syncing: false,
      toggleHotel: async (hotelId) => {
        const auth = useAuthStore.getState();
        const isGuest = !auth.token || auth.token === 'guest-token';
        const current = get().hotelIds;
        const exists = current.includes(hotelId);

        // Optimistic local update
        set({
          hotelIds: exists
            ? current.filter((id) => id !== hotelId)
            : [...current, hotelId],
        });

        if (isGuest) return;

        try {
          if (exists) {
            const favoriteId = get().favoriteIdsByHotel[hotelId];
            if (favoriteId) {
              await favoriteService.removeFavorite(favoriteId);
              const nextMap = { ...get().favoriteIdsByHotel };
              delete nextMap[hotelId];
              set({ favoriteIdsByHotel: nextMap });
            }
          } else {
            const created = await favoriteService.addFavorite('hotel', hotelId);
            set({
              favoriteIdsByHotel: {
                ...get().favoriteIdsByHotel,
                [hotelId]: String(created.id ?? created._id ?? ''),
              },
            });
          }
        } catch {
          // Revert on failure
          set({ hotelIds: current });
        }
      },
      isFavorite: (hotelId) => get().hotelIds.includes(hotelId),
      clearFavorites: () => set({ hotelIds: [], favoriteIdsByHotel: {} }),
      syncFromBackend: async () => {
        const auth = useAuthStore.getState();
        if (!auth.token || auth.token === 'guest-token') return;
        set({ syncing: true });
        try {
          const favorites = await favoriteService.listFavorites();
          const hotels = favorites.filter((item) => item.targetType === 'hotel');
          const favoriteIdsByHotel: Record<string, string> = {};
          for (const item of hotels) {
            favoriteIdsByHotel[item.targetId] = item.id;
          }
          set({
            hotelIds: hotels.map((item) => item.targetId),
            favoriteIdsByHotel,
            syncing: false,
          });
        } catch {
          set({ syncing: false });
        }
      },
    }),
    {
      name: 'banjara-favorites',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hotelIds: state.hotelIds,
        favoriteIdsByHotel: state.favoriteIdsByHotel,
      }),
    }
  )
);
