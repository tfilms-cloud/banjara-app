import { create } from 'zustand';
import * as bookingService from '@/services/bookingService';
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
  setPassengers: (count: number) => void;
  setPassengerDetails: (details: Partial<PassengerDetails>) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  recalculatePrice: () => void;
  confirmBooking: () => Promise<Booking>;
  resetBookingFlow: () => void;
}

const defaultPassenger: PassengerDetails = {
  name: '',
  email: '',
  phone: '',
};

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
    } = get();

    if (!selectedTrip || !selectedPickup || selectedSeats.length === 0 || !priceBreakdown) {
      throw new Error('Incomplete booking details');
    }

    set({ isSubmitting: true, error: null });
    try {
      // Backend creates the booking and runs the mock payment gateway.
      const booking = await bookingService.createBooking({
        tripId: selectedTrip.id,
        date: selectedTrip.date,
        seats: selectedSeats,
        pickupPointId: selectedPickup.id,
        passengers,
        passengerDetails,
        paymentMethod,
      });
      set({ lastBooking: booking, isSubmitting: false });
      return booking;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Booking failed',
      });
      throw error;
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
      error: null,
      isSubmitting: false,
    }),
}));
