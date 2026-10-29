import type { PayoutChannel } from '@/constants/payments';

export const PAKISTAN_BANKS = [
  'HBL',
  'UBL',
  'MCB',
  'Allied Bank',
  'Meezan Bank',
  'Bank Alfalah',
  'Habib Metro',
  'Askari Bank',
  'Faysal Bank',
  'Bank of Punjab',
  'National Bank of Pakistan',
  'JS Bank',
  'Standard Chartered',
  'Dubai Islamic Bank',
  'BankIslami',
  'Al Baraka',
  'Samba Bank',
  'Soneri Bank',
  'Silk Bank',
  'Summit Bank',
] as const;

export type PayoutAccountForm = {
  channel: PayoutChannel;
  label: string;
  accountTitle: string;
  identifier: string;
  bankName?: string;
  branch?: string;
  instructions?: string;
};

export type PayoutFieldErrors = Partial<
  Record<'label' | 'accountTitle' | 'identifier' | 'bankName' | 'branch' | 'instructions', string>
>;

/** Keep digits only (for mobile wallets). */
export function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

/** Normalize PK mobile to 03XXXXXXXXX when possible. */
export function normalizePkMobile(raw: string): string {
  let d = digitsOnly(raw);
  if (d.startsWith('92') && d.length === 12) d = `0${d.slice(2)}`;
  if (d.startsWith('3') && d.length === 10) d = `0${d}`;
  return d;
}

export function isValidPkMobile(raw: string): boolean {
  const d = normalizePkMobile(raw);
  return /^03\d{9}$/.test(d);
}

/** Pakistani IBAN: PK + 22 alphanumeric = 24 chars. */
export function normalizeIban(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}

export function isValidPkIban(raw: string): boolean {
  const iban = normalizeIban(raw);
  return /^PK\d{2}[A-Z0-9]{20}$/.test(iban);
}

/** Bank account number: 8–20 digits (spaces allowed in input). */
export function isValidBankAccountNumber(raw: string): boolean {
  const d = digitsOnly(raw);
  return /^\d{8,20}$/.test(d);
}

export function isValidAccountTitle(raw: string): boolean {
  const v = raw.trim();
  if (v.length < 3 || v.length > 80) return false;
  // Letters / marks / spaces / common name punctuation (Hermes-safe, no \p{L})
  return /^[A-Za-z\u0600-\u06FF\u0750-\u077F\s.'’-]+$/.test(v);
}

export function isValidLabel(raw: string): boolean {
  const v = raw.trim();
  return v.length >= 2 && v.length <= 40;
}

/**
 * Validate provider payout account fields.
 * Returns field errors; empty object means valid.
 */
export function validatePayoutAccountForm(input: PayoutAccountForm): PayoutFieldErrors {
  const errors: PayoutFieldErrors = {};
  const label = input.label.trim();
  const title = input.accountTitle.trim();
  const identifier = input.identifier.trim();
  const bankName = (input.bankName ?? '').trim();
  const branch = (input.branch ?? '').trim();
  const instructions = (input.instructions ?? '').trim();

  if (!isValidLabel(label)) {
    errors.label = 'Enter a short label (2–40 characters).';
  }
  if (!isValidAccountTitle(title)) {
    errors.accountTitle = 'Enter the real account holder name (letters only, min 3 characters).';
  }
  if (instructions.length > 300) {
    errors.instructions = 'Instructions must be under 300 characters.';
  }
  if (branch && branch.length > 60) {
    errors.branch = 'Branch name is too long.';
  }

  switch (input.channel) {
    case 'easypaisa':
    case 'jazzcash': {
      if (!isValidPkMobile(identifier)) {
        errors.identifier = 'Enter a valid Pakistani mobile number (03XXXXXXXXX).';
      }
      break;
    }
    case 'bank': {
      if (!bankName) {
        errors.bankName = 'Select or enter the bank name.';
      } else if (bankName.length < 2 || bankName.length > 80) {
        errors.bankName = 'Enter a valid bank name.';
      }
      const ibanOk = isValidPkIban(identifier);
      const acctOk = isValidBankAccountNumber(identifier);
      if (!ibanOk && !acctOk) {
        errors.identifier =
          'Enter a valid IBAN (PK… 24 characters) or account number (8–20 digits).';
      }
      break;
    }
    case 'raast': {
      const ibanOk = isValidPkIban(identifier);
      const mobileOk = isValidPkMobile(identifier);
      if (!ibanOk && !mobileOk) {
        errors.identifier =
          'Enter a Raast IBAN (PK…) or registered mobile number (03XXXXXXXXX).';
      }
      break;
    }
    case 'other': {
      if (identifier.length < 5 || identifier.length > 64) {
        errors.identifier = 'Enter a valid account identifier (5–64 characters).';
      }
      break;
    }
    default:
      errors.identifier = 'Unsupported payment method.';
  }

  return errors;
}

/** Normalize identifier before save. */
export function normalizePayoutIdentifier(channel: PayoutChannel, raw: string): string {
  if (channel === 'easypaisa' || channel === 'jazzcash') {
    return normalizePkMobile(raw);
  }
  if (channel === 'bank' || channel === 'raast') {
    const iban = normalizeIban(raw);
    if (isValidPkIban(iban)) return iban;
    if (isValidPkMobile(raw)) return normalizePkMobile(raw);
    if (isValidBankAccountNumber(raw)) return digitsOnly(raw);
  }
  return raw.trim();
}

export function firstPayoutError(errors: PayoutFieldErrors): string | null {
  return (
    errors.label ||
    errors.accountTitle ||
    errors.bankName ||
    errors.identifier ||
    errors.branch ||
    errors.instructions ||
    null
  );
}
