import { create } from 'zustand';
import * as guideBookingService from '@/services/guideBookingService';
import type { GuideOfferedService, GuidePublicDetails } from '@/types/guide';
import type { GuideBooking, GuideBookingGuest } from '@/types/guideBooking';
import type { PaymentMethod } from '@/types/booking';
import type { TourPriceBreakdown } from '@/types/tourBooking';
import { toISODate } from '@/utils/formatDate';

function defaultDate() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return toISODate(date);
}

const defaultGuest: GuideBookingGuest = {
  name: '',
  email: '',
  phone: '',
  specialRequests: '',
};

type GuideBookingState = {
  providerId: string;
  providerName: string;
  providerUserId?: string;
  guide: GuidePublicDetails | null;
  service: GuideOfferedService | null;
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  guests: number;
  meetingPoint: string;
  availableLocation: string;
  specialRequest: string;
  guest: GuideBookingGuest;
  paymentMethod: PaymentMethod;
  priceBreakdown: TourPriceBreakdown | null;
  lastBooking: GuideBooking | null;
  isSubmitting: boolean;
  error: string | null;
  initProvider: (input: {
    providerId: string;
    providerName: string;
    providerUserId?: string;
    guide?: GuidePublicDetails | null;
    services?: GuideOfferedService[];
  }) => void;
  setService: (service: GuideOfferedService | null) => void;
  setDate: (date: string) => void;
  setStartTime: (startTime: string) => void;
  setEndTime: (endTime: string) => void;
  setDurationHours: (durationHours: number) => void;
  setGuests: (guests: number) => void;
  setMeetingPoint: (meetingPoint: string) => void;
  setAvailableLocation: (availableLocation: string) => void;
  setSpecialRequest: (specialRequest: string) => void;
  setGuest: (guest: Partial<GuideBookingGuest>) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  recalculatePrice: () => void;
  confirmGuideBooking: () => Promise<GuideBooking>;
  reset: () => void;
};

function pickDefaultService(
  guide: GuidePublicDetails | null,
  services?: GuideOfferedService[]
): GuideOfferedService | null {
  const list = (services ?? guide?.services ?? []).filter((s) => s.active !== false);
  if (list.length) return list[0];
  if (guide?.dailyHireRate && guide.dailyHireRate > 0) {
    return {
      id: '',
      name: 'Daily guide hire',
      category: 'local',
      description: '',
      durationLabel: 'Full day',
      durationHours: 8,
      price: guide.dailyHireRate,
      pricingType: 'per_day',
      currency: 'PKR',
      minGuests: 1,
      maxGuests: 20,
      included: [],
      excluded: [],
      availableLocations: guide.areasCovered ?? [],
      active: true,
    };
  }
  return null;
}

export const useGuideBookingStore = create<GuideBookingState>((set, get) => ({
  providerId: '',
  providerName: '',
  providerUserId: undefined,
  guide: null,
  service: null,
  date: defaultDate(),
  startTime: '09:00',
  endTime: '17:00',
  durationHours: 8,
  guests: 2,
  meetingPoint: '',
  availableLocation: '',
  specialRequest: '',
  guest: defaultGuest,
  paymentMethod: 'card',
  priceBreakdown: null,
  lastBooking: null,
  isSubmitting: false,
  error: null,

  initProvider: ({ providerId, providerName, providerUserId, guide, services }) => {
    const service = pickDefaultService(guide ?? null, services);
    set({
      providerId,
      providerName,
      providerUserId,
      guide: guide ?? null,
      service,
      meetingPoint: service?.meetingPoint ?? '',
      durationHours: service?.durationHours ?? 8,
      guests: Math.max(1, Math.min(2, service?.maxGuests ?? 20)),
    });
    get().recalculatePrice();
  },

  setService: (service) => {
    set({
      service,
      meetingPoint: service?.meetingPoint ?? get().meetingPoint,
      durationHours: service?.durationHours ?? get().durationHours,
    });
    get().recalculatePrice();
  },

  setDate: (date) => set({ date }),

  setStartTime: (startTime) => {
    set({ startTime });
    get().recalculatePrice();
  },

  setEndTime: (endTime) => {
    const { startTime } = get();
    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const diff = Math.max(1, (toMin(endTime) - toMin(startTime)) / 60);
    set({ endTime, durationHours: diff });
    get().recalculatePrice();
  },

  setDurationHours: (durationHours) => {
    set({ durationHours: Math.max(1, durationHours) });
    get().recalculatePrice();
  },

  setGuests: (guests) => {
    const max = get().service?.maxGuests ?? 20;
    const min = get().service?.minGuests ?? 1;
    set({ guests: Math.max(min, Math.min(max, guests)) });
    get().recalculatePrice();
  },

  setMeetingPoint: (meetingPoint) => set({ meetingPoint }),
  setAvailableLocation: (availableLocation) => set({ availableLocation }),
  setSpecialRequest: (specialRequest) => set({ specialRequest }),
  setGuest: (guest) => set((state) => ({ guest: { ...state.guest, ...guest } })),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

  recalculatePrice: () => {
    const { service, guests, durationHours } = get();
    if (!service || service.price <= 0) {
      set({ priceBreakdown: null });
      return;
    }
    set({
      priceBreakdown: guideBookingService.calcGuidePriceBreakdown(
        service.pricingType,
        service.price,
        guests,
        durationHours,
        service.currency || 'PKR'
      ),
    });
  },

  confirmGuideBooking: async () => {
    const {
      providerId,
      service,
      date,
      startTime,
      endTime,
      durationHours,
      guests,
      meetingPoint,
      availableLocation,
      specialRequest,
      guest,
      paymentMethod,
    } = get();
    if (!providerId) throw new Error('Select a guide first');
    if (!guest.name.trim() || !guest.email.trim() || !guest.phone.trim()) {
      throw new Error('Enter guest contact details');
    }
    set({ isSubmitting: true, error: null });
    try {
      const booking = await guideBookingService.createGuideBooking({
        providerId,
        serviceId: service?.id || undefined,
        date,
        startTime,
        endTime,
        durationHours,
        guests,
        meetingPoint: meetingPoint.trim() || undefined,
        availableLocation: availableLocation.trim() || undefined,
        specialRequest: specialRequest.trim() || guest.specialRequests?.trim() || undefined,
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
      providerId: '',
      providerName: '',
      providerUserId: undefined,
      guide: null,
      service: null,
      date: defaultDate(),
      startTime: '09:00',
      endTime: '17:00',
      durationHours: 8,
      guests: 2,
      meetingPoint: '',
      availableLocation: '',
      specialRequest: '',
      guest: defaultGuest,
      paymentMethod: 'card',
      priceBreakdown: null,
      lastBooking: null,
      isSubmitting: false,
      error: null,
    }),
}));
