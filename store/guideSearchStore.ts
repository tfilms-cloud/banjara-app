import { create } from 'zustand';
import type { GuideSearchParams } from '@/types/guide';
import { toISODate } from '@/utils/formatDate';

function defaultDate() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return toISODate(date);
}

type GuideSearchState = GuideSearchParams & {
  setDestination: (destination: string) => void;
  setDate: (date: string) => void;
  setGuests: (guests: number) => void;
  setGuideType: (guideType: string) => void;
  setLanguage: (language: string) => void;
  setMinPrice: (minPrice?: number) => void;
  setMaxPrice: (maxPrice?: number) => void;
  setMinRating: (minRating?: number) => void;
  setMinExperience: (minExperience?: number) => void;
  getParams: () => GuideSearchParams;
  resetFilters: () => void;
};

export const useGuideSearchStore = create<GuideSearchState>((set, get) => ({
  destination: '',
  date: defaultDate(),
  guests: 2,
  guideType: '',
  language: '',
  minPrice: undefined,
  maxPrice: undefined,
  minRating: undefined,
  minExperience: undefined,

  setDestination: (destination) => set({ destination }),
  setDate: (date) => set({ date }),
  setGuests: (guests) => set({ guests: Math.max(1, Math.min(50, guests)) }),
  setGuideType: (guideType) => set({ guideType }),
  setLanguage: (language) => set({ language }),
  setMinPrice: (minPrice) => set({ minPrice }),
  setMaxPrice: (maxPrice) => set({ maxPrice }),
  setMinRating: (minRating) => set({ minRating }),
  setMinExperience: (minExperience) => set({ minExperience }),

  getParams: () => {
    const s = get();
    return {
      destination: s.destination?.trim() || undefined,
      date: s.date?.trim() || undefined,
      guests: s.guests,
      guideType: s.guideType?.trim() || undefined,
      language: s.language?.trim() || undefined,
      minPrice: s.minPrice,
      maxPrice: s.maxPrice,
      minRating: s.minRating,
      minExperience: s.minExperience,
    };
  },

  resetFilters: () =>
    set({
      guideType: '',
      language: '',
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      minExperience: undefined,
    }),
}));
