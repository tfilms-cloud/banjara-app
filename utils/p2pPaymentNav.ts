import { router } from 'expo-router';
import {
  isP2PCustomerMethod,
  type CustomerPaymentMethodId,
} from '@/constants/payments';

export function shouldContinueP2P(
  method: CustomerPaymentMethodId,
  paymentId?: string | null
) {
  return isP2PCustomerMethod(method) && Boolean(paymentId);
}

/** After booking create — send P2P customers to the transaction screen. */
export function navigateAfterBookingPayment(opts: {
  method: CustomerPaymentMethodId;
  paymentId?: string | null;
  bookingId: string;
  successPath: string;
  successParams?: Record<string, string>;
}) {
  if (shouldContinueP2P(opts.method, opts.paymentId)) {
    router.replace({
      pathname: '/(customer)/payments/[paymentId]',
      params: {
        paymentId: String(opts.paymentId),
        bookingId: opts.bookingId,
        method: opts.method,
      },
    });
    return;
  }
  router.replace({
    pathname: opts.successPath as never,
    params: { bookingId: opts.bookingId, ...(opts.successParams ?? {}) },
  });
}
