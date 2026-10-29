import { router } from 'expo-router';
import { isP2PCustomerMethod, type CustomerPaymentMethodId } from '@/constants/payments';

const OPEN_PAYMENT_STATUSES = new Set([
  'unpaid',
  'pending',
  'payment_initiated',
  'rejected',
  'proof_submitted',
  'under_review',
  'disputed',
]);

const ACTION_REQUIRED_STATUSES = new Set([
  'unpaid',
  'pending',
  'payment_initiated',
  'rejected',
]);

function asCustomerMethod(method?: string | null): CustomerPaymentMethodId | null {
  if (!method) return null;
  if (method === 'bank_transfer') return 'bankTransfer';
  if (
    method === 'bankTransfer' ||
    method === 'easypaisa' ||
    method === 'jazzcash' ||
    method === 'raast'
  ) {
    return method;
  }
  return null;
}

/** True when the customer can reopen the P2P payment screen for this booking. */
export function canOpenBookingPayment(opts: {
  paymentId?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
}) {
  if (!opts.paymentId) return false;
  const method = asCustomerMethod(opts.paymentMethod);
  if (method && !isP2PCustomerMethod(method)) return false;
  return OPEN_PAYMENT_STATUSES.has(String(opts.paymentStatus ?? ''));
}

/** True when payment / proof is still incomplete. */
export function bookingNeedsPaymentAction(opts: {
  paymentId?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
}) {
  if (!canOpenBookingPayment(opts)) return false;
  return ACTION_REQUIRED_STATUSES.has(String(opts.paymentStatus ?? ''));
}

export function paymentActionLabel(paymentStatus?: string | null) {
  switch (paymentStatus) {
    case 'payment_initiated':
      return 'View payment details';
    case 'rejected':
      return 'Fix payment / resubmit proof';
    case 'proof_submitted':
    case 'under_review':
      return 'View payment status';
    case 'disputed':
      return 'Open payment chat';
    default:
      return 'Continue payment';
  }
}

export function paymentActionHint(paymentStatus?: string | null) {
  switch (paymentStatus) {
    case 'payment_initiated':
      return 'Your seats are on hold. Open payment details anytime to pay and upload proof.';
    case 'rejected':
      return 'The provider reported a payment issue. Open details to fix and resubmit proof.';
    case 'proof_submitted':
    case 'under_review':
      return 'Proof submitted — waiting for the provider to verify payment.';
    case 'disputed':
      return 'There is a payment dispute. Open the payment screen to chat with the provider.';
    default:
      return 'Finish payment to keep your seats. You can reopen account details here anytime.';
  }
}

/** Navigate to the customer P2P payment screen for an existing booking payment. */
export function openBookingPayment(opts: {
  paymentId: string;
  bookingId: string;
  method?: string | null;
}) {
  const method = asCustomerMethod(opts.method);
  router.push({
    pathname: '/(customer)/payments/[paymentId]',
    params: {
      paymentId: opts.paymentId,
      bookingId: opts.bookingId,
      // Only pass real transfer methods — never card/wallet defaults that block initiate.
      ...(method && isP2PCustomerMethod(method) ? { method } : {}),
    },
  });
}
