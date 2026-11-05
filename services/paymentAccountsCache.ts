import * as p2p from '@/services/p2pPaymentService';
import { backendAvailability } from '@/services/backendAvailability';

type CacheEntry = {
  hasActive: boolean;
  accounts: p2p.ProviderPaymentAccount[];
  at: number;
  epoch: number;
};

const TTL_MS = 45_000;
let cache: CacheEntry | null = null;
let inflight: Promise<CacheEntry> | null = null;

function toEntry(accounts: p2p.ProviderPaymentAccount[], epoch: number): CacheEntry {
  return {
    accounts,
    hasActive: accounts.some((a) => a.active !== false),
    at: Date.now(),
    epoch,
  };
}

export function peekPaymentAccountsCache(): CacheEntry | null {
  if (!cache || cache.epoch !== backendAvailability.getEpoch()) return null;
  if (Date.now() - cache.at > TTL_MS) return null;
  return cache;
}

export function paymentAccountsCacheAgeMs(): number | null {
  const current = peekPaymentAccountsCache();
  return current ? Date.now() - current.at : null;
}

export function invalidatePaymentAccountsCache() {
  cache = null;
  inflight = null;
}

/** Single-flight + short TTL so dashboard/layout don't wait on duplicate API calls. */
export async function getPaymentAccountsStatus(opts?: {
  force?: boolean;
}): Promise<CacheEntry> {
  if (!opts?.force) {
    const hit = peekPaymentAccountsCache();
    if (hit) return hit;
    if (inflight) return inflight;
  }

  const epoch = backendAvailability.getEpoch();
  inflight = (async () => {
    const accounts = await p2p.listMyPaymentAccounts();
    cache = toEntry(accounts, epoch);
    return cache;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

backendAvailability.registerReset(invalidatePaymentAccountsCache);
