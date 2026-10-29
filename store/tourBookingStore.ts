import { create } from 'zustand';
import * as tourBookingService from '@/services/tourBookingService';
import type { TourItinerary } from '@/types/tourItinerary';
import type {
  PackageBooking,
  TourGuest,
  TourPriceBreakdown,
} from '@/types/tourBooking';
import type { PaymentMethod } from '@/types/booking';
import { toISODate } from '@/utils/formatDate';

function defaultStartDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return toISODate(date);
}

const defaultGuest: TourGuest = {
  name: '',
  email: '',
  phone: '',
  specialRequests: '',
};

type TourBookingState = {
  itinerary: TourItinerary | null;
  startDate: string;
  travelers: number;
  guest: TourGuest;
  paymentMethod: PaymentMethod;
  priceBreakdown: TourPriceBreakdown | null;
  lastBooking: PackageBooking | null;
  isSubmitting: boolean;
  error: string | null;
  setItinerary: (itinerary: TourItinerary) => void;
  setStartDate: (startDate: string) => void;
  setTravelers: (travelers: number) => void;
  setGuest: (guest: Partial<TourGuest>) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  recalculatePrice: () => void;
  confirmPackageBooking: () => Promise<PackageBooking>;
  reset: () => void;
};

export const useTourBookingStore = create<TourBookingState>((set, get) => ({
  itinerary: null,
  startDate: defaultStartDate(),
  travelers: 1,
  guest: defaultGuest,
  paymentMethod: 'card',
  priceBreakdown: null,
  lastBooking: null,
  isSubmitting: false,
  error: null,

  setItinerary: (itinerary) => {
    set({
      itinerary,
      travelers: Math.min(2, Math.max(1, itinerary.maxParticipants)),
    });
    get().recalculatePrice();
  },

  setStartDate: (startDate) => set({ startDate }),

  setTravelers: (travelers) => {
    const max = get().itinerary?.maxParticipants ?? 20;
    set({ travelers: Math.max(1, Math.min(max, travelers)) });
    get().recalculatePrice();
  },

  setGuest: (guest) => set((state) => ({ guest: { ...state.guest, ...guest } })),

  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

  recalculatePrice: () => {
    const { itinerary, travelers } = get();
    if (!itinerary) {
      set({ priceBreakdown: null });
      return;
    }
    set({
      priceBreakdown: tourBookingService.calcPackagePrice(
        itinerary.pricePerPerson,
        travelers,
        itinerary.currency || 'PKR'
      ),
    });
  },

  confirmPackageBooking: async () => {
    const { itinerary, startDate, travelers, guest, paymentMethod } = get();
    if (!itinerary) throw new Error('Select a package first');
    if (!guest.name.trim() || !guest.email.trim() || !guest.phone.trim()) {
      throw new Error('Enter guest contact details');
    }
    set({ isSubmitting: true, error: null });
    try {
      const booking = await tourBookingService.createPackageBooking({
        itineraryId: itinerary.id,
        startDate,
        travelers,
        guest: {
          name: guest.name.trim(),
          email: guest.email.trim(),
          phone: guest.phone.trim(),
          specialRequests: guest.specialRequests?.trim() || undefined,
        },
        paymentMethod,
      });
      set({ lastBooking: booking, isSubmitting: false });
      return booking;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Booking failed';
      set({ isSubmitting: false, error: message });
      throw error;
    }
  },

  reset: () =>
    set({
      itinerary: null,
      startDate: defaultStartDate(),
      travelers: 1,
      guest: defaultGuest,
      paymentMethod: 'card',
      priceBreakdown: null,
      lastBooking: null,
      isSubmitting: false,
      error: null,
    }),
}));
