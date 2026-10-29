/** BANJARA customer payment methods — includes P2P transfer channels. */
export type CustomerPaymentMethodId =
  | 'card'
  | 'jazzcash'
  | 'easypaisa'
  | 'bankTransfer'
  | 'raast'
  | 'cash';

export type PayoutChannel = 'bank' | 'easypaisa' | 'jazzcash' | 'raast' | 'other';

export const CUSTOMER_PAYMENT_METHODS: Array<{
  id: CustomerPaymentMethodId;
  label: string;
  hint: string;
  icon:
    | 'card-outline'
    | 'phone-portrait-outline'
    | 'wallet-outline'
    | 'cash-outline'
    | 'business-outline'
    | 'flash-outline';
  p2p?: boolean;
}> = [
  {
    id: 'bankTransfer',
    label: 'Bank Transfer',
    hint: 'Pay to provider IBAN · then upload proof',
    icon: 'business-outline',
    p2p: true,
  },
  {
    id: 'easypaisa',
    label: 'Easypaisa',
    hint: 'Send to provider wallet · upload receipt',
    icon: 'wallet-outline',
    p2p: true,
  },
  {
    id: 'jazzcash',
    label: 'JazzCash',
    hint: 'Send to provider wallet · upload receipt',
    icon: 'phone-portrait-outline',
    p2p: true,
  },
  {
    id: 'raast',
    label: 'Raast',
    hint: 'Instant bank transfer · upload proof',
    icon: 'flash-outline',
    p2p: true,
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    hint: 'Visa, Mastercard',
    icon: 'card-outline',
  },
  {
    id: 'cash',
    label: 'Cash / Pay later',
    hint: 'Pay at boarding or front desk',
    icon: 'cash-outline',
  },
];

export const PAYOUT_CHANNEL_OPTIONS: Array<{
  id: PayoutChannel;
  label: string;
  identifierLabel: string;
  identifierPlaceholder: string;
  /** Shown under the identifier field */
  helpText: string;
}> = [
  {
    id: 'bank',
    label: 'Bank Account',
    identifierLabel: 'IBAN or account number',
    identifierPlaceholder: 'PK00XXXX… or 8–20 digit account no.',
    helpText: 'Use your full IBAN (24 characters starting with PK) or account number.',
  },
  {
    id: 'easypaisa',
    label: 'Easypaisa',
    identifierLabel: 'Mobile number',
    identifierPlaceholder: '03XXXXXXXXX',
    helpText: 'Must be the 11-digit Pakistani mobile linked to Easypaisa.',
  },
  {
    id: 'jazzcash',
    label: 'JazzCash',
    identifierLabel: 'Mobile number',
    identifierPlaceholder: '03XXXXXXXXX',
    helpText: 'Must be the 11-digit Pakistani mobile linked to JazzCash.',
  },
  {
    id: 'raast',
    label: 'Raast',
    identifierLabel: 'Raast ID / IBAN / mobile',
    identifierPlaceholder: 'PK… IBAN or 03XXXXXXXXX',
    helpText: 'Use your Raast IBAN or the mobile registered for Raast.',
  },
];

export const CUSTOMER_PAYMENT_METHOD_COUNT = CUSTOMER_PAYMENT_METHODS.length;

export function isP2PCustomerMethod(id: CustomerPaymentMethodId) {
  return CUSTOMER_PAYMENT_METHODS.find((m) => m.id === id)?.p2p === true;
}

/** Map UI method → backend PaymentMethod. */
export function toBackendPaymentMethod(
  id: CustomerPaymentMethodId
): 'card' | 'mobileWallet' | 'cash' | 'bankTransfer' | 'easypaisa' | 'jazzcash' | 'raast' {
  if (id === 'jazzcash') return 'jazzcash';
  if (id === 'easypaisa') return 'easypaisa';
  if (id === 'bankTransfer') return 'bankTransfer';
  if (id === 'raast') return 'raast';
  if (id === 'cash') return 'cash';
  return 'card';
}

/** Map customer method → payout channel for provider accounts. */
export function channelForCustomerMethod(id: CustomerPaymentMethodId): PayoutChannel | null {
  if (id === 'bankTransfer') return 'bank';
  if (id === 'easypaisa') return 'easypaisa';
  if (id === 'jazzcash') return 'jazzcash';
  if (id === 'raast') return 'raast';
  return null;
}

export function channelForBackendMethod(method: string): PayoutChannel | null {
  if (method === 'bankTransfer' || method === 'bank_transfer') return 'bank';
  if (method === 'easypaisa') return 'easypaisa';
  if (method === 'jazzcash') return 'jazzcash';
  if (method === 'raast') return 'raast';
  return null;
}

/** Customer method id for a payout channel the provider has configured. */
export function customerMethodForChannel(channel: PayoutChannel): CustomerPaymentMethodId | null {
  if (channel === 'bank') return 'bankTransfer';
  if (channel === 'easypaisa') return 'easypaisa';
  if (channel === 'jazzcash') return 'jazzcash';
  if (channel === 'raast') return 'raast';
  return null;
}

/**
 * Only return P2P methods the provider has active receiving accounts for.
 * Card/cash are not provider "accounts" — omit them from the provider-driven list.
 */
export function paymentMethodsForProviderChannels(channels: Iterable<PayoutChannel>) {
  const available = new Set(channels);
  return CUSTOMER_PAYMENT_METHODS.filter((method) => {
    if (!method.p2p) return false;
    const channel = channelForCustomerMethod(method.id);
    return channel != null && available.has(channel);
  });
}

/** Frontend PaymentMethod id for stores (P2P-aware). */
export function toStorePaymentMethod(
  id: CustomerPaymentMethodId
): 'card' | 'wallet' | 'cash' | 'bankTransfer' | 'easypaisa' | 'jazzcash' | 'raast' {
  if (id === 'jazzcash') return 'jazzcash';
  if (id === 'easypaisa') return 'easypaisa';
  if (id === 'bankTransfer') return 'bankTransfer';
  if (id === 'raast') return 'raast';
  if (id === 'cash') return 'cash';
  return 'card';
}

/** @deprecated use toStorePaymentMethod / toBackendPaymentMethod */
export function toLegacyPaymentMethod(
  id: CustomerPaymentMethodId
): 'card' | 'wallet' | 'cash' {
  if (id === 'jazzcash' || id === 'easypaisa' || id === 'bankTransfer' || id === 'raast') {
    return 'wallet';
  }
  if (id === 'cash') return 'cash';
  return 'card';
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: 'Awaiting Payment',
  pending: 'Awaiting Payment',
  payment_initiated: 'Payment Instructions Ready',
  proof_submitted: 'Verification Pending',
  under_review: 'Provider Reviewing',
  paid: 'Payment Confirmed',
  confirmed: 'Payment Confirmed',
  rejected: 'Payment Issue',
  disputed: 'Disputed',
  failed: 'Failed',
  refunded: 'Refunded',
  refund_pending: 'Refund Pending',
  expired: 'Expired',
};
