import { formatCurrency } from '@/utils/formatCurrency';

/** Cash remit cap — service providers must pay collected cash back to BANJARA. */
export const BANJARA_CASH_LIMIT = 25000;
/** @deprecated Use BANJARA_CASH_LIMIT */
export const TRANSPORTER_CASH_LIMIT = BANJARA_CASH_LIMIT;

export function getBanjaraCashState(pendingPayout: number) {
  const owed = Math.max(0, Number(pendingPayout) || 0);
  const blocked = owed > BANJARA_CASH_LIMIT;
  const remaining = Math.max(0, BANJARA_CASH_LIMIT - owed);
  return {
    owed,
    limit: BANJARA_CASH_LIMIT,
    remaining,
    blocked,
    owedLabel: formatCurrency(owed),
    limitLabel: formatCurrency(BANJARA_CASH_LIMIT),
    remainingLabel: formatCurrency(remaining),
  };
}

/** @deprecated Use getBanjaraCashState */
export const getTransporterCashState = getBanjaraCashState;
