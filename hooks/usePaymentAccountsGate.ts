import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  getPaymentAccountsStatus,
  invalidatePaymentAccountsCache,
  paymentAccountsCacheAgeMs,
  peekPaymentAccountsCache,
} from '@/services/paymentAccountsCache';
import { useAuthStore } from '@/store/authStore';
import { needsProviderOnboarding } from '@/utils/routing';

/**
 * Fast payment-account gate:
 * - Uses auth `providerId` (no wait for full provider profile)
 * - Hydrates instantly from short TTL cache
 * - Shares one in-flight request across dashboard + tabs layout
 */
export function usePaymentAccountsGate(opts?: { enabled?: boolean }) {
  const enabled = opts?.enabled !== false;
  const user = useAuthStore((s) => s.user);
  const providerId = user?.providerId;
  const userId = user?.id;
  const role = user?.role;
  const onboarding = needsProviderOnboarding(user);

  const cached = peekPaymentAccountsCache();
  const [missingAccounts, setMissingAccounts] = useState(
    () => (cached ? !cached.hasActive : false)
  );
  const [promptVisible, setPromptVisible] = useState(false);
  const [checking, setChecking] = useState(false);
  // Ready immediately if we already have a cache hit or we can't/shouldn't check yet
  const [ready, setReady] = useState(() => Boolean(cached) || !enabled);
  const dismissedRef = useRef(false);

  const applyStatus = useCallback((hasActive: boolean) => {
    setMissingAccounts(!hasActive);
    if (hasActive) {
      setPromptVisible(false);
      dismissedRef.current = false;
    } else if (!dismissedRef.current) {
      setPromptVisible(true);
    }
  }, []);

  const check = useCallback(
    async (force = false) => {
      if (!enabled) {
        setReady(true);
        return;
      }
      if (!userId || role !== 'provider') {
        setReady(true);
        return;
      }
      if (onboarding || !providerId) {
        setReady(true);
        return;
      }

      if (!force) {
        const hit = peekPaymentAccountsCache();
        if (hit) {
          applyStatus(hit.hasActive);
          setReady(true);
          const age = paymentAccountsCacheAgeMs() ?? 0;
          // Soft refresh only if cache is older than 15s
          if (age > 15_000) {
            void getPaymentAccountsStatus({ force: true })
              .then((fresh) => applyStatus(fresh.hasActive))
              .catch(() => undefined);
          }
          return;
        }
      }

      setChecking(true);
      try {
        const status = await getPaymentAccountsStatus({ force });
        applyStatus(status.hasActive);
      } catch {
        // Don't block the app on network errors
      } finally {
        setChecking(false);
        setReady(true);
      }
    },
    [enabled, userId, role, onboarding, providerId, applyStatus]
  );

  useEffect(() => {
    void check(false);
  }, [check]);

  useFocusEffect(
    useCallback(() => {
      // Focus: use cache first (instant), background refresh only
      void check(false);
    }, [check])
  );

  const dismiss = useCallback(() => {
    dismissedRef.current = true;
    setPromptVisible(false);
  }, []);

  const goToSetup = useCallback(() => {
    setPromptVisible(false);
    router.push('/(provider)/payment-accounts');
  }, []);

  const ensurePaymentAccounts = useCallback(async (): Promise<boolean> => {
    try {
      const status = await getPaymentAccountsStatus({ force: true });
      applyStatus(status.hasActive);
      if (!status.hasActive) {
        dismissedRef.current = false;
        setPromptVisible(true);
        return false;
      }
      return true;
    } catch {
      return true;
    }
  }, [applyStatus]);

  const recheck = useCallback(async () => {
    invalidatePaymentAccountsCache();
    await check(true);
  }, [check]);

  return {
    missingAccounts,
    promptVisible,
    checking,
    ready,
    dismiss,
    goToSetup,
    ensurePaymentAccounts,
    recheck,
  };
}
