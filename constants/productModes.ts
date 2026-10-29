/**
 * BANJARA customer home service categories + journey/search modes.
 *
 * Top-level home tabs (services Banjara offers):
 * Transport · Hotels · Tour Operators · Guides · Restaurants
 *
 * Transport search still uses journey modes:
 * - transport = one-way seat/vehicle
 * - trips = go & return
 */

export type HomeServiceCategory =
  | 'transport'
  | 'hotels'
  | 'tours'
  | 'guides'
  | 'restaurants';

export type CustomerProductMode = 'transport' | 'trips' | 'hotels';

export type TransportBookingKind = 'seat' | 'vehicle';
export type TransportPanel = 'customise' | 'available';

export const SERVICE_CATEGORIES: Array<{
  id: HomeServiceCategory;
  label: string;
  shortHint: string;
  icon: 'bus' | 'bed' | 'map' | 'person' | 'restaurant';
  comingSoon?: boolean;
}> = [
  {
    id: 'transport',
    label: 'Transport',
    shortHint: 'Rides & seats',
    icon: 'bus',
  },
  {
    id: 'hotels',
    label: 'Hotels',
    shortHint: 'Stays',
    icon: 'bed',
  },
  {
    id: 'tours',
    label: 'Tour Operators',
    shortHint: 'Packages',
    icon: 'map',
  },
  {
    id: 'guides',
    label: 'Guides',
    shortHint: 'Local experts',
    icon: 'person',
  },
  {
    id: 'restaurants',
    label: 'Restaurants',
    shortHint: 'Places to eat',
    icon: 'restaurant',
  },
];

export const PRODUCT_MODES: Array<{
  id: CustomerProductMode;
  label: string;
  shortHint: string;
  searchHeading: string;
  resultsTitle: string;
  cta: string;
  emptyTitle: string;
  emptyMessage: string;
}> = [
  {
    id: 'transport',
    label: 'Transport',
    shortHint: 'Ride only · one way',
    searchHeading: 'Need a ride?',
    resultsTitle: 'Rides',
    cta: 'Search rides',
    emptyTitle: 'No rides found',
    emptyMessage: 'Try another date or route for a one-way seat.',
  },
  {
    id: 'trips',
    label: 'Trips',
    shortHint: 'Go & come home',
    searchHeading: 'Plan a trip home?',
    resultsTitle: 'Return trips',
    cta: 'Search trips',
    emptyTitle: 'No return trips found',
    emptyMessage: 'Providers publish round trips with a return date here.',
  },
  {
    id: 'hotels',
    label: 'Hotels',
    shortHint: 'Stay when you arrive',
    searchHeading: 'Where will you stay?',
    resultsTitle: 'Hotels',
    cta: 'Search hotels',
    emptyTitle: 'No hotels found',
    emptyMessage: 'Try another destination or dates.',
  },
];

export function productModeMeta(mode?: CustomerProductMode | string | null) {
  const id =
    mode === 'trips' || mode === 'hotels' || mode === 'transport' ? mode : 'transport';
  return PRODUCT_MODES.find((item) => item.id === id) ?? PRODUCT_MODES[0];
}

export function serviceCategoryMeta(category?: HomeServiceCategory | string | null) {
  const id = SERVICE_CATEGORIES.find((item) => item.id === category)?.id ?? 'transport';
  return SERVICE_CATEGORIES.find((item) => item.id === id) ?? SERVICE_CATEGORIES[0];
}

/** Maps home search mode → trip journey filter (hotels have no journey). */
export function journeyFilterForMode(
  mode: CustomerProductMode
): 'one_way' | 'round_trip' | undefined {
  if (mode === 'transport') return 'one_way';
  if (mode === 'trips') return 'round_trip';
  return undefined;
}

export function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
