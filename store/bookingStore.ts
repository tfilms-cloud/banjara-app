import { create } from 'zustand';
import * as bookingService from '@/services/bookingService';
import { invalidateTripCache } from '@/services/tripService';
import type {
  Booking,
  PassengerDetails,
  PaymentMethod,
  PriceBreakdown,
} from '@/types/booking';
import type { PickupPoint } from '@/types/route';
import type { TripWithDetails } from '@/types/trip';

interface BookingState {
  selectedTrip: TripWithDetails | null;
  selectedPickup: PickupPoint | null;
  selectedSeats: string[];
  passengers: number;
  passengerDetails: PassengerDetails;
  paymentMethod: PaymentMethod;
  priceBreakdown: PriceBreakdown | null;
  lastBooking: Booking | null;
  isSubmitting: boolean;
  error: string | null;
  setTrip: (trip: TripWithDetails) => void;
  setPickup: (pickup: PickupPoint) => void;
  toggleSeat: (seatLabel: string, seatPrice: number) => void;
  clearSeats: () => void;
  /** Drop local selection for seats that are no longer free (except keep if still selected intent). */
  pruneUnavailableSeats: (unavailableLabels: string[]) => void;
  setPassengers: (count: number) => void;
  setPassengerDetails: (details: Partial<PassengerDetails>) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  recalculatePrice: () => void;
  confirmBooking: () => Promise<Booking>;
  /** Cancel an abandoned pending booking so soft-held seats are released. */
  releasePendingSeatHold: () => Promise<boolean>;
  resetBookingFlow: () => void;
}

const defaultPassenger: PassengerDetails = {
  name: '',
  email: '',
  phone: '',
};

function sameSeatSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((seat, i) => seat === right[i]);
}

export const useBookingStore = create<BookingState>((set, get) => ({
  selectedTrip: null,
  selectedPickup: null,
  selectedSeats: [],
  passengers: 1,
  passengerDetails: defaultPassenger,
  paymentMethod: 'card',
  priceBreakdown: null,
  lastBooking: null,
  isSubmitting: false,
  error: null,
  setTrip: (trip) => {
    set({
      selectedTrip: trip,
      selectedPickup: null,
      selectedSeats: [],
      passengers: 1,
      lastBooking: null,
      priceBreakdown: {
        ticketPrice: trip.price,
        serviceFee: 150,
        discount: 0,
        total: trip.price + 150,
        currency: trip.currency,
      },
    });
  },
  setPickup: (pickup) => set({ selectedPickup: pickup }),
  toggleSeat: (seatLabel, seatPrice) => {
    const { selectedSeats, selectedTrip, paymentMethod } = get();
    const exists = selectedSeats.includes(seatLabel);
    const nextSeats = exists
      ? selectedSeats.filter((seat) => seat !== seatLabel)
      : [...selectedSeats, seatLabel];

    const unit = selectedTrip?.price ?? seatPrice;
    const ticketPrice = nextSeats.length * unit;
    const serviceFee = nextSeats.length > 0 ? 150 : 0;
    const discount = paymentMethod === 'wallet' && nextSeats.length > 0 ? 200 : 0;

    set({
      selectedSeats: nextSeats,
      passengers: Math.max(1, nextSeats.length),
      priceBreakdown: {
        ticketPrice,
        serviceFee,
        discount,
        total: ticketPrice + serviceFee - discount,
        currency: selectedTrip?.currency ?? 'PKR',
      },
    });
  },
  clearSeats: () => set({ selectedSeats: [], priceBreakdown: null }),
  pruneUnavailableSeats: (unavailableLabels) => {
    const blocked = new Set(unavailableLabels);
    const { selectedSeats, selectedTrip, paymentMethod } = get();
    const nextSeats = selectedSeats.filter((seat) => !blocked.has(seat));
    if (nextSeats.length === selectedSeats.length) return;
    const unit = selectedTrip?.price ?? 0;
    const ticketPrice = nextSeats.length * unit;
    const serviceFee = nextSeats.length > 0 ? 150 : 0;
    const discount = paymentMethod === 'wallet' && nextSeats.length > 0 ? 200 : 0;
    set({
      selectedSeats: nextSeats,
      passengers: Math.max(1, nextSeats.length || 1),
      priceBreakdown: selectedTrip
        ? {
            ticketPrice,
            serviceFee,
            discount,
            total: ticketPrice + serviceFee - discount,
            currency: selectedTrip.currency,
          }
        : null,
    });
  },
  setPassengers: (passengers) => set({ passengers }),
  setPassengerDetails: (details) =>
    set((state) => ({
      passengerDetails: { ...state.passengerDetails, ...details },
    })),
  setPaymentMethod: (paymentMethod) => {
    set({ paymentMethod });
    get().recalculatePrice();
  },
  recalculatePrice: () => {
    const { selectedSeats, selectedTrip, paymentMethod } = get();
    if (!selectedTrip) return;
    const ticketPrice = selectedSeats.length * selectedTrip.price;
    const serviceFee = selectedSeats.length > 0 ? 150 : 0;
    const discount = paymentMethod === 'wallet' && selectedSeats.length > 0 ? 200 : 0;
    set({
      priceBreakdown: {
        ticketPrice,
        serviceFee,
        discount,
        total: ticketPrice + serviceFee - discount,
        currency: selectedTrip.currency,
      },
    });
  },
  confirmBooking: async () => {
    const {
      selectedTrip,
      selectedPickup,
      selectedSeats,
      passengers,
      passengerDetails,
      paymentMethod,
      priceBreakdown,
      lastBooking,
    } = get();

    if (!selectedTrip || !selectedPickup || selectedSeats.length === 0 || !priceBreakdown) {
      throw new Error('Incomplete booking details');
    }

    // Resume an existing unpaid hold instead of reserving seats twice.
    if (
      lastBooking &&
      lastBooking.tripId === selectedTrip.id &&
      sameSeatSet(lastBooking.seats, selectedSeats) &&
      lastBooking.status !== 'cancelled' &&
      lastBooking.paymentStatus !== 'paid' &&
      lastBooking.paymentStatus !== 'confirmed' &&
      lastBooking.paymentStatus !== 'expired' &&
      lastBooking.paymentStatus !== 'refunded'
    ) {
      return lastBooking;
    }

    set({ isSubmitting: true, error: null });
    try {
      // Replacing seats/trip: cancel the previous unpaid hold so seats free up.
      // Never cancel on seat-screen focus — only when placing a different booking.
      if (
        lastBooking?.id &&
        (lastBooking.tripId !== selectedTrip.id || !sameSeatSet(lastBooking.seats, selectedSeats)) &&
        lastBooking.paymentStatus !== 'paid' &&
        lastBooking.paymentStatus !== 'confirmed' &&
        lastBooking.status !== 'cancelled' &&
        lastBooking.status !== 'completed'
      ) {
        await get().releasePendingSeatHold();
      }

      const booking = await bookingService.createBooking({
        tripId: selectedTrip.id,
        date: selectedTrip.date,
        seats: selectedSeats,
        pickupPointId: selectedPickup.id,
        passengers,
        passengerDetails,
        paymentMethod,
      });
      invalidateTripCache(selectedTrip.id);
      set({ lastBooking: booking, isSubmitting: false });
      return booking;
    } catch (error) {
      invalidateTripCache(selectedTrip.id);
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Booking failed',
      });
      throw error;
    }
  },
  releasePendingSeatHold: async () => {
    const { lastBooking, selectedTrip } = get();
    if (!lastBooking?.id) return false;
    const unpaid =
      lastBooking.paymentStatus !== 'paid' &&
      lastBooking.paymentStatus !== 'confirmed' &&
      lastBooking.status !== 'cancelled' &&
      lastBooking.status !== 'completed';
    if (!unpaid) return false;
    try {
      await bookingService.cancelBooking(lastBooking.id, { replaced: true });
      if (selectedTrip?.id) invalidateTripCache(selectedTrip.id);
      set({ lastBooking: null });
      return true;
    } catch {
      // Keep lastBooking so "Continue to pay" can resume instead of double-booking.
      if (selectedTrip?.id) invalidateTripCache(selectedTrip.id);
      return false;
    }
  },
  resetBookingFlow: () =>
    set({
      selectedTrip: null,
      selectedPickup: null,
      selectedSeats: [],
      passengers: 1,
      paymentMethod: 'card',
      priceBreakdown: null,
      lastBooking: null,
      error: null,
      isSubmitting: false,
    }),
}));
