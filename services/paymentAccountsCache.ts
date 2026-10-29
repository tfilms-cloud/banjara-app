import * as p2p from '@/services/p2pPaymentService';

type CacheEntry = {
  hasActive: boolean;
  accounts: p2p.ProviderPaymentAccount[];
  at: number;
};

const TTL_MS = 45_000;
let cache: CacheEntry | null = null;
let inflight: Promise<CacheEntry> | null = null;

function toEntry(accounts: p2p.ProviderPaymentAccount[]): CacheEntry {
  return {
    accounts,
    hasActive: accounts.some((a) => a.active !== false),
    at: Date.now(),
  };
}

export function peekPaymentAccountsCache(): CacheEntry | null {
  if (!cache) return null;
  if (Date.now() - cache.at > TTL_MS) return null;
  return cache;
}

export function paymentAccountsCacheAgeMs(): number | null {
  if (!cache) return null;
  return Date.now() - cache.at;
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

  inflight = (async () => {
    const accounts = await p2p.listMyPaymentAccounts();
    cache = toEntry(accounts);
    return cache;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}
