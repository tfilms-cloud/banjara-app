import { del, get, post, put } from '@/services/api';
import type { PayoutChannel } from '@/constants/payments';

export type ProviderPaymentAccount = {
  id: string;
  channel: PayoutChannel;
  label: string;
  accountTitle: string;
  displayIdentifier: string;
  identifier?: string;
  bankName?: string;
  branch?: string;
  instructions?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentProof = {
  receiptUrls: string[];
  referenceNumber: string;
  paidAmount: number;
  paidAt: string;
  note?: string;
  submittedAt: string;
};

export type PaymentTimelineEvent = {
  type: string;
  message: string;
  actorRole?: string;
  actorId?: string;
  meta?: Record<string, unknown>;
  at: string;
};

export type PaymentTransaction = {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  amountMismatch?: boolean;
  summary?: { bookingNumber: string; service: string; providerName: string; title: string; date?: string; subtotal: number; tax: number; serviceFee: number; discount: number };
  refund?: { referenceNumber: string; receiptUrls: string[]; recordedAt: string };
  transactionId?: string;
  receivingAccount?: {
    accountId: string;
    channel: PayoutChannel;
    label: string;
    accountTitle: string;
    displayIdentifier: string;
    identifier?: string;
    bankName?: string;
    instructions?: string;
  };
  expiresAt?: string;
  proof?: PaymentProof;
  issueReason?: string;
  issueNote?: string;
  timeline: PaymentTimelineEvent[];
  paidAt?: string;
  confirmedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function listMyPaymentAccounts(): Promise<ProviderPaymentAccount[]> {
  const data = await get<unknown>('/payments/accounts/me');
  return Array.isArray(data) ? (data as ProviderPaymentAccount[]) : [];
}

export async function createPaymentAccount(input: {
  channel: PayoutChannel;
  label: string;
  accountTitle: string;
  identifier: string;
  bankName?: string;
  branch?: string;
  instructions?: string;
  active?: boolean;
}): Promise<ProviderPaymentAccount> {
  return post<ProviderPaymentAccount>('/payments/accounts/me', input);
}

export async function updatePaymentAccount(
  accountId: string,
  patch: Partial<{
    label: string;
    accountTitle: string;
    identifier: string;
    bankName: string;
    branch: string;
    instructions: string;
    active: boolean;
  }>
): Promise<ProviderPaymentAccount> {
  return put<ProviderPaymentAccount>(`/payments/accounts/me/${accountId}`, patch);
}

export async function deletePaymentAccount(accountId: string): Promise<void> {
  await del(`/payments/accounts/me/${accountId}`);
}

export async function listProviderActiveAccounts(
  providerId: string
): Promise<ProviderPaymentAccount[]> {
  const data = await get<unknown>(`/payments/accounts/provider/${providerId}`);
  return Array.isArray(data) ? (data as ProviderPaymentAccount[]) : [];
}

export async function markInstructionsViewed(paymentId: string): Promise<PaymentTransaction> {
  return post<PaymentTransaction>(`/payments/${paymentId}/viewed`, {});
}

export async function listMyPayments(status?: string): Promise<PaymentTransaction[]> {
  const data = await get<unknown>('/payments', {
    params: status ? { status } : undefined,
  });
  return Array.isArray(data) ? (data as PaymentTransaction[]) : [];
}

export async function getPayment(paymentId: string): Promise<PaymentTransaction> {
  return get<PaymentTransaction>(`/payments/${paymentId}`);
}

export async function previewDraftFiles(paymentId: string, receiptUrls: string[]): Promise<Array<{ storageRef: string; url: string }>> {
  return post(`/payments/${paymentId}/attachments/preview`, { receiptUrls });
}

export async function initiatePayment(
  paymentId: string,
  input: { method: string; accountId: string }
): Promise<PaymentTransaction> {
  return post<PaymentTransaction>(`/payments/${paymentId}/initiate`, input);
}

export async function submitPaymentProof(
  paymentId: string,
  input: {
    receiptUrls: string[];
    referenceNumber: string;
    paidAmount: number;
    paidAt?: string;
    note?: string;
  }
): Promise<PaymentTransaction> {
  return post<PaymentTransaction>(`/payments/${paymentId}/proof`, input);
}

export async function confirmPayment(paymentId: string): Promise<PaymentTransaction> {
  return post<PaymentTransaction>(`/payments/${paymentId}/confirm`, {});
}

export async function reportPaymentIssue(
  paymentId: string,
  input: { reason: string; note?: string }
): Promise<PaymentTransaction> {
  return post<PaymentTransaction>(`/payments/${paymentId}/report-issue`, input);
}

export async function requestRefund(paymentId: string): Promise<PaymentTransaction> {
  return post<PaymentTransaction>(`/payments/${paymentId}/refund`, {});
}

export async function completeRefund(paymentId: string, input: { referenceNumber: string; receiptUrls: string[] }): Promise<PaymentTransaction> {
  return post<PaymentTransaction>(`/payments/${paymentId}/refund/complete`, input);
}

export type PaymentChatMessage = {
  id: string;
  paymentId: string;
  bookingId: string;
  senderRole: 'customer' | 'provider' | 'admin' | 'system';
  senderId?: string;
  kind: 'text' | 'image' | 'system' | 'reference';
  text?: string;
  imageUrl?: string;
  referenceNumber?: string;
  readByCustomer: boolean;
  readByProvider: boolean;
  createdAt: string;
};

export async function listPaymentMessages(paymentId: string): Promise<PaymentChatMessage[]> {
  const data = await get<unknown>(`/payments/${paymentId}/messages`);
  return Array.isArray(data) ? (data as PaymentChatMessage[]) : [];
}

export async function sendPaymentMessage(
  paymentId: string,
  input: { text?: string; imageUrl?: string; referenceNumber?: string }
): Promise<PaymentChatMessage> {
  return post<PaymentChatMessage>(`/payments/${paymentId}/messages`, input);
}
