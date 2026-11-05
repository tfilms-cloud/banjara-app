import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as hotelService from '@/services/hotelService';
import type {
  Hotel,
  HotelBooking,
  HotelFilters,
  HotelGuest,
  HotelPaymentMethod,
  HotelPriceBreakdown,
  HotelRoom,
  HotelSearchParams,
  HotelSortBy,
} from '@/types/hotel';
import { toISODate } from '@/utils/formatDate';
import { calculateHotelPrice, calculateNights } from '@/utils/hotelPricing';
import { reconcileRoomSelection, roomInventory } from '@/utils/hotelRoomSelection';

let quoteRequest = 0;

function defaultCheckIn() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return toISODate(date);
}

function defaultCheckOut() {
  const date = new Date();
  date.setDate(date.getDate() + 6);
  return toISODate(date);
}

interface RecentHotelSearch extends HotelSearchParams {
  id: string;
}

interface HotelState {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  filters: HotelFilters;
  sortBy: HotelSortBy;
  recentSearches: RecentHotelSearch[];
  selectedHotel: Hotel | null;
  selectedRoom: HotelRoom | null;
  roomQuantity: number;
  guest: HotelGuest;
  paymentMethod: HotelPaymentMethod;
  priceBreakdown: HotelPriceBreakdown | null;
  priceLoading: boolean;
  priceEstimated: boolean;
  lastBooking: HotelBooking | null;
  isSubmitting: boolean;
  error: string | null;
  setDestination: (destination: string) => void;
  setCheckIn: (checkIn: string) => void;
  setCheckOut: (checkOut: string) => void;
  setAdults: (adults: number) => void;
  setChildren: (children: number) => void;
  setRooms: (rooms: number) => void;
  setFilters: (filters: HotelFilters) => void;
  setSortBy: (sortBy: HotelSortBy) => void;
  resetFilters: () => void;
  saveRecentSearch: () => void;
  applyRecentSearch: (search: RecentHotelSearch) => void;
  getSearchParams: () => HotelSearchParams;
  setHotel: (hotel: Hotel) => void;
  syncHotelRooms: (hotel: Hotel, rooms: HotelRoom[]) => void;
  setRoom: (room: HotelRoom) => void;
  setRoomQuantity: (quantity: number) => void;
  setGuest: (guest: Partial<HotelGuest>) => void;
  setPaymentMethod: (method: HotelPaymentMethod) => void;
  recalculatePrice: (retainBreakdown?: boolean) => Promise<void>;
  confirmHotelBooking: () => Promise<HotelBooking>;
  resetHotelFlow: () => void;
}

const defaultGuest: HotelGuest = {
  name: '',
  email: '',
  phone: '',
  specialRequests: '',
};

export const useHotelStore = create<HotelState>()(
  persist(
    (set, get) => ({
      destination: 'Hunza',
      checkIn: defaultCheckIn(),
      checkOut: defaultCheckOut(),
      adults: 2,
      children: 0,
      rooms: 1,
      filters: {},
      sortBy: 'recommended',
      recentSearches: [],
      selectedHotel: null,
      selectedRoom: null,
      roomQuantity: 1,
      guest: defaultGuest,
      paymentMethod: 'card',
      priceBreakdown: null,
      priceLoading: false,
      priceEstimated: false,
      lastBooking: null,
      isSubmitting: false,
      error: null,
      setDestination: (destination) => set({ destination }),
      setCheckIn: (checkIn) => {
        set({ checkIn });
        void get().recalculatePrice();
      },
      setCheckOut: (checkOut) => {
        set({ checkOut });
        void get().recalculatePrice();
      },
      setAdults: (adults) => {
        set({ adults: Math.max(1, Math.min(8, adults)) });
        void get().recalculatePrice();
      },
      setChildren: (children) => {
        set({ children: Math.max(0, Math.min(6, children)) });
        void get().recalculatePrice();
      },
      setRooms: (rooms) => set({ rooms: Math.max(1, Math.min(5, rooms)) }),
      setFilters: (filters) => set({ filters }),
      setSortBy: (sortBy) => set({ sortBy }),
      resetFilters: () => set({ filters: {}, sortBy: 'recommended' }),
      saveRecentSearch: () => {
        const params = get().getSearchParams();
        const next = { id: `hrs-${Date.now()}`, ...params };
        const filtered = get().recentSearches.filter(
          (item) => item.destination !== params.destination,
        );
        set({ recentSearches: [next, ...filtered].slice(0, 6) });
      },
      applyRecentSearch: (search) =>
        set({
          destination: search.destination,
          checkIn: search.checkIn,
          checkOut: search.checkOut,
          adults: search.adults,
          children: search.children,
          rooms: search.rooms,
        }),
      getSearchParams: () => {
        const { destination, checkIn, checkOut, adults, children, rooms } = get();
        return { destination, checkIn, checkOut, adults, children, rooms };
      },
      setHotel: (hotel) => {
        const room = get().selectedRoom;
        const matches = room?.hotelId === hotel.id;
        set({
          selectedHotel: hotel,
          selectedRoom: matches ? room : null,
          roomQuantity: matches ? get().roomQuantity : 1,
        });
        void get().recalculatePrice();
      },
      syncHotelRooms: (hotel, rooms) => {
        const next = reconcileRoomSelection(
          hotel.id,
          rooms,
          get().selectedRoom,
          get().roomQuantity,
        );
        set({ selectedHotel: hotel, selectedRoom: next.room, roomQuantity: next.quantity });
        void get().recalculatePrice();
      },
      setRoom: (room) => {
        if (roomInventory(room) < 1) return;
        set({ selectedRoom: room, roomQuantity: 1 });
        void get().recalculatePrice();
      },
      setRoomQuantity: (quantity) => {
        const room = get().selectedRoom;
        if (!room || roomInventory(room) < 1) return;
        set({
          roomQuantity: Math.max(1, Math.min(roomInventory(room), Math.floor(quantity) || 1)),
        });
        void get().recalculatePrice();
      },
      setGuest: (guest) => set((state) => ({ guest: { ...state.guest, ...guest } })),
      setPaymentMethod: (paymentMethod) => {
        if (get().paymentMethod === paymentMethod) return;
        set({ paymentMethod });
        // Payment screens already have a valid stay; keep their summary mounted while repricing.
        void get().recalculatePrice(true);
      },
      recalculatePrice: async (retainBreakdown = false) => {
        const current = ++quoteRequest;
        const {
          selectedHotel,
          selectedRoom,
          checkIn,
          checkOut,
          roomQuantity,
          paymentMethod,
          adults,
          children,
        } = get();
        if (
          !selectedHotel ||
          !selectedRoom ||
          selectedRoom.hotelId !== selectedHotel.id ||
          roomInventory(selectedRoom) < roomQuantity
        ) {
          set({ priceBreakdown: null, priceLoading: false, priceEstimated: false });
          return;
        }
        set({
          priceBreakdown: retainBreakdown ? get().priceBreakdown : null,
          priceLoading: true,
          priceEstimated: false,
        });
        const nights = calculateNights(checkIn, checkOut);
        const discount = paymentMethod === 'wallet' ? 500 : 0;
        try {
          const quote = await hotelService.getHotelQuote({
            hotelId: selectedHotel.id,
            roomId: selectedRoom.id,
            checkIn,
            checkOut,
            rooms: roomQuantity,
            guests: adults + children,
          });
          if (current !== quoteRequest) return;
          const subtotal = Number(quote.subtotal ?? 0);
          const avgNightly = Math.round(subtotal / Math.max(1, nights * roomQuantity));
          const breakdown = calculateHotelPrice({
            pricePerNight: avgNightly || selectedRoom.pricePerNight,
            nights,
            rooms: roomQuantity,
            discount,
          });
          set({
            priceLoading: false,
            priceEstimated: false,
            priceBreakdown: subtotal
              ? {
                  ...breakdown,
                  roomSubtotal: subtotal,
                  total: Math.max(0, subtotal + breakdown.tax + breakdown.serviceFee - discount),
                }
              : breakdown,
          });
        } catch {
          if (current !== quoteRequest) return;
          set({
            priceLoading: false,
            priceEstimated: true,
            priceBreakdown: calculateHotelPrice({
              pricePerNight: selectedRoom.pricePerNight,
              nights,
              rooms: roomQuantity,
              discount,
            }),
          });
        }
      },
      confirmHotelBooking: async () => {
        const {
          selectedHotel,
          selectedRoom,
          checkIn,
          checkOut,
          adults,
          children,
          roomQuantity,
          guest,
          paymentMethod,
          priceBreakdown,
        } = get();

        if (!selectedHotel || !selectedRoom || !priceBreakdown) {
          throw new Error('Incomplete hotel booking details');
        }

        set({ isSubmitting: true, error: null });
        try {
          const booking = await hotelService.createHotelBooking({
            hotelId: selectedHotel.id,
            roomId: selectedRoom.id,
            checkIn,
            checkOut,
            adults,
            children,
            rooms: roomQuantity,
            guest,
            paymentMethod,
          });
          set({ lastBooking: booking, isSubmitting: false });
          return booking;
        } catch (error) {
          set({
            isSubmitting: false,
            error: error instanceof Error ? error.message : 'Hotel booking failed',
          });
          throw error;
        }
      },
      resetHotelFlow: () => {
        quoteRequest++;
        set({
          selectedHotel: null,
          selectedRoom: null,
          roomQuantity: 1,
          paymentMethod: 'card',
          priceBreakdown: null,
          priceLoading: false,
          priceEstimated: false,
          error: null,
          isSubmitting: false,
        });
      },
    }),
    {
      name: 'banjara-hotel',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        destination: state.destination,
        checkIn: state.checkIn,
        checkOut: state.checkOut,
        adults: state.adults,
        children: state.children,
        rooms: state.rooms,
        recentSearches: state.recentSearches,
        guest: state.guest,
      }),
    },
  ),
);
