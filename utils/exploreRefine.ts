/**
 * Explore refine logic — sort + quick filters shared by every Explore service.
 * Pure functions only, so the same rules can be unit-tested and mirrored on the web.
 */
import type { ExploreServiceTab } from '@/constants/exploreCatalog';

export type ExploreSort = 'recommended' | 'price' | 'rating' | 'soonest';
export type ExploreToggle = 'topRated' | 'verified' | 'freeCancel' | 'breakfast';

export type ExploreRefine = {
  sort: ExploreSort;
  toggles: ExploreToggle[];
};

export const DEFAULT_REFINE: ExploreRefine = { sort: 'recommended', toggles: [] };

export const TOP_RATED_MIN = 4;

const SORT_LABEL: Record<ExploreSort, string> = {
  recommended: 'Recommended',
  price: 'Cheapest',
  rating: 'Top rated',
  soonest: 'Soonest',
};

const TOGGLE_LABEL: Record<ExploreToggle, string> = {
  topRated: '4★ & up',
  verified: 'Verified',
  freeCancel: 'Free cancellation',
  breakfast: 'Breakfast included',
};

type RefineOptions = {
  sorts: Array<{ id: ExploreSort; label: string }>;
  toggles: Array<{ id: ExploreToggle; label: string }>;
};

const OPTION_IDS: Partial<
  Record<ExploreServiceTab, { sorts: ExploreSort[]; toggles: ExploreToggle[] }>
> = {
  transport: { sorts: ['recommended', 'price', 'soonest'], toggles: ['verified'] },
  hotels: {
    sorts: ['recommended', 'price', 'rating'],
    toggles: ['topRated', 'verified', 'freeCancel', 'breakfast'],
  },
  guides: { sorts: ['recommended', 'rating'], toggles: ['topRated'] },
  restaurants: { sorts: ['recommended', 'rating'], toggles: ['topRated', 'verified'] },
};

/** Tabs without an entry (tours) manage their own filters and show no refine bar. */
export function exploreRefineOptions(tab: ExploreServiceTab): RefineOptions | null {
  const ids = OPTION_IDS[tab];
  if (!ids) return null;
  return {
    sorts: ids.sorts.map((id) => ({ id, label: SORT_LABEL[id] })),
    toggles: ids.toggles.map((id) => ({ id, label: TOGGLE_LABEL[id] })),
  };
}

export function isRefineActive(refine: ExploreRefine): boolean {
  return refine.sort !== 'recommended' || refine.toggles.length > 0;
}

export function toggleRefine(refine: ExploreRefine, toggle: ExploreToggle): ExploreRefine {
  return {
    ...refine,
    toggles: refine.toggles.includes(toggle)
      ? refine.toggles.filter((item) => item !== toggle)
      : [...refine.toggles, toggle],
  };
}

/** Drop settings the current service doesn't offer (e.g. after switching tabs). */
export function sanitizeRefine(tab: ExploreServiceTab, refine: ExploreRefine): ExploreRefine {
  const ids = OPTION_IDS[tab];
  if (!ids) return DEFAULT_REFINE;
  return {
    sort: ids.sorts.includes(refine.sort) ? refine.sort : 'recommended',
    toggles: refine.toggles.filter((toggle) => ids.toggles.includes(toggle)),
  };
}

function sortBy<T>(items: T[], compare: (a: T, b: T) => number): T[] {
  // Array#sort is stable, so ties keep the server's "recommended" order.
  return [...items].sort(compare);
}

const num = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

export function refineTrips<
  T extends { price: number; date: string; departureTime: string; agency?: { verified?: boolean } },
>(trips: T[], refine: ExploreRefine): T[] {
  let out = trips;
  if (refine.toggles.includes('verified')) out = out.filter((trip) => !!trip.agency?.verified);
  if (refine.sort === 'price') return sortBy(out, (a, b) => num(a.price) - num(b.price));
  if (refine.sort === 'soonest') {
    return sortBy(out, (a, b) =>
      `${a.date}${a.departureTime}`.localeCompare(`${b.date}${b.departureTime}`),
    );
  }
  return out;
}

export function refineHotels<
  T extends {
    priceFrom: number;
    rating: number;
    isVerified?: boolean;
    freeCancellation?: boolean;
    breakfastIncluded?: boolean;
  },
>(hotels: T[], refine: ExploreRefine): T[] {
  let out = hotels;
  if (refine.toggles.includes('topRated')) out = out.filter((h) => num(h.rating) >= TOP_RATED_MIN);
  if (refine.toggles.includes('verified')) out = out.filter((h) => !!h.isVerified);
  if (refine.toggles.includes('freeCancel')) out = out.filter((h) => !!h.freeCancellation);
  if (refine.toggles.includes('breakfast')) out = out.filter((h) => !!h.breakfastIncluded);
  if (refine.sort === 'price') return sortBy(out, (a, b) => num(a.priceFrom) - num(b.priceFrom));
  if (refine.sort === 'rating') return sortBy(out, (a, b) => num(b.rating) - num(a.rating));
  return out;
}

/** Restaurants and guides/providers: rating-based refinement. */
export function refineRated<T extends { rating?: number; verified?: boolean }>(
  items: T[],
  refine: ExploreRefine,
): T[] {
  let out = items;
  if (refine.toggles.includes('topRated')) out = out.filter((i) => num(i.rating) >= TOP_RATED_MIN);
  if (refine.toggles.includes('verified')) out = out.filter((i) => !!i.verified);
  if (refine.sort === 'rating') return sortBy(out, (a, b) => num(b.rating) - num(a.rating));
  return out;
}
