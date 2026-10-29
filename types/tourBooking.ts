import type { TourItinerary } from '@/types/tourItinerary';
import type { PaymentMethod, PaymentStatus } from '@/types/booking';

export type TourGuest = {
  name: string;
  email: string;
  phone: string;
  specialRequests?: string;
};

export type TourPriceBreakdown = {
  subtotal: number;
  tax: number;
  serviceFee: number;
  discount: number;
  total: number;
  currency: string;
};

export type PackageBooking = {
  id: string;
  bookingCode: string;
  itineraryId: string;
  providerId: string;
  title: string;
  tourType: string;
  destination: string;
  startDate: string;
  travelers: number;
  durationDays: number;
  guest: TourGuest;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  status: 'pending' | 'upcoming' | 'confirmed' | 'completed' | 'cancelled';
  priceBreakdown: TourPriceBreakdown;
  createdAt: string;
  coverImage?: string | null;
};

export type CreatePackageBookingPayload = {
  itineraryId: string;
  startDate: string;
  travelers: number;
  guest: TourGuest;
  paymentMethod: PaymentMethod;
};

export type TourBookingDraft = {
  itinerary: TourItinerary | null;
  startDate: string;
  travelers: number;
  guest: TourGuest;
  paymentMethod: PaymentMethod;
  priceBreakdown: TourPriceBreakdown | null;
};
