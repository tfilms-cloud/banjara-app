import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type LiveShareAudience =
  | 'hotel'
  | 'tour'
  | 'guide'
  | 'restaurant'
  | 'customer_vehicle';

export type LiveShareSession = {
  bookingId: string;
  audience: LiveShareAudience;
  /** Who is broadcasting */
  role: 'customer' | 'provider_vehicle';
  active: boolean;
  latitude?: number;
  longitude?: number;
  updatedAt?: string;
};

type LiveLocationState = {
  sessions: Record<string, LiveShareSession>;
  startShare: (input: Omit<LiveShareSession, 'active' | 'updatedAt'>) => Promise<LiveShareSession | null>;
  stopShare: (bookingId: string) => void;
  refreshPosition: (bookingId: string) => Promise<void>;
  getSession: (bookingId: string) => LiveShareSession | undefined;
};

function sessionKey(bookingId: string) {
  return bookingId;
}

export const useLiveLocationStore = create<LiveLocationState>()(
  persist(
    (set, get) => ({
      sessions: {},
      startShare: async (input) => {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') return null;
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const session: LiveShareSession = {
          ...input,
          active: true,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          sessions: { ...state.sessions, [sessionKey(input.bookingId)]: session },
        }));
        return session;
      },
      stopShare: (bookingId) => {
        set((state) => {
          const current = state.sessions[sessionKey(bookingId)];
          if (!current) return state;
          return {
            sessions: {
              ...state.sessions,
              [sessionKey(bookingId)]: { ...current, active: false },
            },
          };
        });
      },
      refreshPosition: async (bookingId) => {
        const current = get().sessions[sessionKey(bookingId)];
        if (!current?.active) return;
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionKey(bookingId)]: {
              ...current,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },
      getSession: (bookingId) => get().sessions[sessionKey(bookingId)],
    }),
    {
      name: 'banjara-live-location',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
