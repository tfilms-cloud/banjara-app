import type { GuideOfferedService, GuidePublicDetails } from '@/types/guide';
import type { PaymentMethod, PaymentStatus } from '@/types/booking';
import type { TourGuest, TourPriceBreakdown } from '@/types/tourBooking';

export type GuideBookingGuest = TourGuest;

export type GuideBookingDraft = {
  providerId: string;
  providerName: string;
  providerUserId?: string;
  guide?: GuidePublicDetails;
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
};

export type GuideBooking = {
  id: string;
  bookingCode: string;
  providerId: string;
  providerName: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime?: string;
  durationHours?: number;
  guests: number;
  meetingPoint?: string;
  guest: GuideBookingGuest;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  status: 'pending' | 'upcoming' | 'confirmed' | 'completed' | 'cancelled';
  priceBreakdown: TourPriceBreakdown;
  createdAt: string;
  coverImage?: string | null;
};

export type CreateGuideBookingPayload = {
  providerId: string;
  serviceId?: string;
  date: string;
  startTime: string;
  endTime?: string;
  durationHours?: number;
  guests: number;
  meetingPoint?: string;
  availableLocation?: string;
  specialRequest?: string;
  guest: GuideBookingGuest;
  paymentMethod: PaymentMethod;
};
