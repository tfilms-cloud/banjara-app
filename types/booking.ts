export type BookingStatus = 'upcoming' | 'completed' | 'cancelled' | 'confirmed';
export type PaymentMethod = 'card' | 'wallet' | 'cash';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface PassengerDetails {
  name: string;
  email: string;
  phone: string;
}

export interface PriceBreakdown {
  ticketPrice: number;
  serviceFee: number;
  discount: number;
  total: number;
  currency: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  tripId: string;
  userId: string;
  /** Provider profile id */
  providerId?: string;
  /** Provider's User id — required to open in-app chat */
  providerUserId?: string;
  date: string;
  seats: string[];
  pickupPointId: string;
  passengers: number;
  passengerDetails: PassengerDetails;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  priceBreakdown: PriceBreakdown;
  createdAt: string;
  qrPayload: string;
}

export interface CreateBookingPayload {
  tripId: string;
  date: string;
  seats: string[];
  pickupPointId: string;
  passengers: number;
  passengerDetails: PassengerDetails;
  paymentMethod: PaymentMethod;
}

export type NotificationType =
  | 'booking_confirmed'
  | 'trip_reminder'
  | 'pickup_reminder'
  | 'booking_cancelled'
  | 'payment_received'
  | 'new_offer';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  bookingId?: string;
  offerId?: string;
}
