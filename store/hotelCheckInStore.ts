import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { HotelCheckInDetails } from '@/types/provider';

export type StoredHotelCheckIn = HotelCheckInDetails & {
  bookingId: string;
  bookingCode?: string;
  roomLabel?: string;
  customerVisible: boolean;
};

interface HotelCheckInState {
  byBookingId: Record<string, StoredHotelCheckIn>;
  saveCheckIn: (record: StoredHotelCheckIn) => void;
  getCheckIn: (bookingId: string) => StoredHotelCheckIn | undefined;
}

export const useHotelCheckInStore = create<HotelCheckInState>()(
  persist(
    (set, get) => ({
      byBookingId: {},
      saveCheckIn: (record) =>
        set((state) => ({
          byBookingId: { ...state.byBookingId, [record.bookingId]: record },
        })),
      getCheckIn: (bookingId) => get().byBookingId[bookingId],
    }),
    {
      name: 'banjara-hotel-checkins',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
