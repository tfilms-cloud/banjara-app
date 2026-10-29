export type BookingStatus = 'pending' | 'upcoming' | 'completed' | 'cancelled' | 'confirmed';
export type PaymentMethod =
  | 'card'
  | 'wallet'
  | 'cash'
  | 'bankTransfer'
  | 'easypaisa'
  | 'jazzcash'
  | 'raast';
export type PaymentStatus =
  | 'pending'
  | 'unpaid'
  | 'payment_initiated'
  | 'proof_submitted'
  | 'under_review'
  | 'paid'
  | 'confirmed'
  | 'rejected'
  | 'disputed'
  | 'failed'
  | 'refunded'
  | 'refund_pending'
  | 'expired';

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
  /** Linked P2P / gateway payment transaction id */
  paymentId?: string;
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
  | 'booking_pending'
  | 'booking_request'
  | 'booking_reminder'
  | 'trip_reminder'
  | 'pickup_reminder'
  | 'booking_cancelled'
  | 'payment_received'
  | 'payment_failed'
  | 'payment_expired'
  | 'new_offer'
  | 'new_review'
  | 'new_message'
  | 'vehicle'
  | 'cnic_verified'
  | 'cnic_failed'
  | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  bookingId?: string;
  offerId?: string;
  conversationId?: string;
  /** Chat peer user id (for opening the thread from a message notification). */
  otherUserId?: string;
}
