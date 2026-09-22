import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CustomerProductMode } from '@/constants/productModes';
import { journeyFilterForMode } from '@/constants/productModes';
import type { SearchParams, TripFilters, TripSortBy } from '@/types/trip';
import { toISODate } from '@/utils/formatDate';

interface RecentSearch extends SearchParams {
  id: string;
  productMode?: 'transport' | 'trips';
}

interface SearchState {
  from: string;
  to: string;
  date: string;
  returnDate: string;
  passengers: number;
  /** Last travel product tab used for search (not hotels) */
  productMode: 'transport' | 'trips';
  filters: TripFilters;
  sortBy: TripSortBy;
  recentSearches: RecentSearch[];
  setFrom: (from: string) => void;
  setTo: (to: string) => void;
  setDate: (date: string) => void;
  setReturnDate: (date: string) => void;
  setPassengers: (count: number) => void;
  setProductMode: (mode: 'transport' | 'trips') => void;
  swapLocations: () => void;
  setFilters: (filters: TripFilters) => void;
  setSortBy: (sortBy: TripSortBy) => void;
  saveRecentSearch: () => void;
  applyRecentSearch: (search: RecentSearch) => void;
  getSearchParams: () => SearchParams;
  resetFilters: () => void;
}

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toISODate(date);
};

const defaultReturn = () => {
  const date = new Date();
  date.setDate(date.getDate() + 4);
  return toISODate(date);
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      from: 'Islamabad',
      to: 'Hunza',
      date: tomorrow(),
      returnDate: defaultReturn(),
      passengers: 1,
      productMode: 'transport',
      filters: {},
      sortBy: 'departure',
      recentSearches: [],
      setFrom: (from) => set({ from }),
      setTo: (to) => set({ to }),
      setDate: (date) => {
        const { returnDate } = get();
        if (returnDate && returnDate < date) {
          const next = new Date(`${date}T12:00:00`);
          next.setDate(next.getDate() + 3);
          set({ date, returnDate: toISODate(next) });
          return;
        }
        set({ date });
      },
      setReturnDate: (returnDate) => set({ returnDate }),
      setPassengers: (passengers) => set({ passengers: Math.max(1, Math.min(8, passengers)) }),
      setProductMode: (productMode) => {
        const journeyType = journeyFilterForMode(productMode);
        set({
          productMode,
          filters: { ...get().filters, journeyType },
        });
      },
      swapLocations: () => {
        const { from, to } = get();
        set({ from: to, to: from });
      },
      setFilters: (filters) => set({ filters }),
      setSortBy: (sortBy) => set({ sortBy }),
      saveRecentSearch: () => {
        const { from, to, date, returnDate, passengers, productMode, recentSearches } = get();
        const journeyType = journeyFilterForMode(productMode);
        const next: RecentSearch = {
          id: `rs-${Date.now()}`,
          from,
          to,
          date,
          passengers,
          returnDate,
          journeyType,
          productMode,
        };
        const filtered = recentSearches.filter(
          (item) => !(item.from === from && item.to === to && item.productMode === productMode)
        );
        set({ recentSearches: [next, ...filtered].slice(0, 6) });
      },
      applyRecentSearch: (search) => {
        const mode = search.productMode === 'trips' ? 'trips' : 'transport';
        set({
          from: search.from,
          to: search.to,
          date: search.date,
          returnDate: search.returnDate || get().returnDate,
          passengers: search.passengers,
          productMode: mode,
          filters: {
            ...get().filters,
            journeyType: journeyFilterForMode(mode),
          },
        });
      },
      getSearchParams: () => {
        const { from, to, date, passengers, returnDate, productMode } = get();
        return {
          from,
          to,
          date,
          passengers,
          returnDate,
          journeyType: journeyFilterForMode(productMode),
        };
      },
      resetFilters: () => {
        const journeyType = journeyFilterForMode(get().productMode);
        set({ filters: { journeyType }, sortBy: 'departure' });
      },
    }),
    {
      name: 'banjara-search',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        from: state.from,
        to: state.to,
        date: state.date,
        returnDate: state.returnDate,
        passengers: state.passengers,
        productMode: state.productMode,
        recentSearches: state.recentSearches,
      }),
    }
  )
);

/** Helper for home screen typing when hotels is also a tab */
export type HomeProductMode = CustomerProductMode;
