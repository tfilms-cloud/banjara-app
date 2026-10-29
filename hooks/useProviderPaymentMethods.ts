import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  paymentMethodsForProviderChannels,
  type CustomerPaymentMethodId,
  type PayoutChannel,
} from '@/constants/payments';
import * as p2p from '@/services/p2pPaymentService';

/**
 * Loads the provider's active receiving accounts and exposes only matching
 * customer payment methods (Bank / Easypaisa / JazzCash / Raast).
 */
export function useProviderPaymentMethods(providerId?: string | null) {
  const [accounts, setAccounts] = useState<p2p.ProviderPaymentAccount[]>([]);
  const [loading, setLoading] = useState(Boolean(providerId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!providerId) {
      setAccounts([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await p2p.listProviderActiveAccounts(providerId);
      setAccounts(list.filter((a) => a.active !== false));
    } catch (err) {
      setAccounts([]);
      setError(err instanceof Error ? err.message : 'Could not load payment methods');
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const channels = useMemo(() => {
    const set = new Set<PayoutChannel>();
    for (const account of accounts) {
      if (account.channel) set.add(account.channel);
    }
    return set;
  }, [accounts]);

  const methods = useMemo(
    () => paymentMethodsForProviderChannels(channels),
    [channels]
  );

  const defaultMethodId: CustomerPaymentMethodId | null = methods[0]?.id ?? null;

  return {
    accounts,
    methods,
    channels,
    defaultMethodId,
    loading,
    error,
    reload: load,
    hasAccounts: accounts.length > 0,
  };
}
