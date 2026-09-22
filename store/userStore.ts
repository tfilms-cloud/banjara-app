import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as userService from '@/services/userService';
import type { AppNotification } from '@/types/booking';
import type { User } from '@/types/user';

interface SettingsState {
  language: string;
  notificationsEnabled: boolean;
  darkMode: boolean;
  locationEnabled: boolean;
}

interface UserState {
  profile: User | null;
  notifications: AppNotification[];
  settings: SettingsState;
  isLoading: boolean;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  loadNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  updateSettings: (updates: Partial<SettingsState>) => void;
  toggleSavedTrip: (tripId: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      notifications: [],
      settings: {
        language: 'English',
        notificationsEnabled: true,
        darkMode: false,
        locationEnabled: true,
      },
      isLoading: false,
      loadProfile: async () => {
        set({ isLoading: true });
        try {
          const profile = await userService.getProfile();
          set({ profile, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },
      updateProfile: async (updates) => {
        const profile = await userService.updateProfile(updates);
        set({ profile });
      },
      loadNotifications: async () => {
        try {
          const notifications = await userService.getNotifications();
          set({ notifications });
        } catch {
          set({ notifications: [] });
        }
      },
      markRead: async (id) => {
        await userService.markNotificationRead(id);
        set({
          notifications: get().notifications.map((item) =>
            item.id === id ? { ...item, read: true } : item
          ),
        });
      },
      markAllRead: async () => {
        await userService.markAllNotificationsRead();
        set({
          notifications: get().notifications.map((item) => ({ ...item, read: true })),
        });
      },
      updateSettings: (updates) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),
      toggleSavedTrip: (tripId) => {
        const profile = get().profile;
        if (!profile) return;
        const exists = profile.savedTripIds.includes(tripId);
        const savedTripIds = exists
          ? profile.savedTripIds.filter((id) => id !== tripId)
          : [...profile.savedTripIds, tripId];
        set({ profile: { ...profile, savedTripIds } });
      },
    }),
    {
      name: 'banjara-user',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        profile: state.profile,
      }),
      migrate: (persisted, version) => {
        const state = persisted as { settings?: SettingsState; profile?: User | null };
        if (version < 3) {
          return {
            ...state,
            settings: {
              language: 'English',
              notificationsEnabled: true,
              locationEnabled: true,
              ...state.settings,
              darkMode: false,
            },
          };
        }
        return state;
      },
    }
  )
);
