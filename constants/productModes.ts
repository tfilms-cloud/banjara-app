/**
 * BANJARA customer product vision (mixed model):
 * - Transport = ride for distance (one-way seat)
 * - Trips = go & return home with a trip duration
 * - Hotels = stay at the place you reach
 * Destination “services” for now = soft hotel suggestions after a ride.
 */

export type CustomerProductMode = 'transport' | 'trips' | 'hotels';

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

/** Maps home search mode → trip journey filter (hotels have no journey). */
export function journeyFilterForMode(
  mode: CustomerProductMode
): 'one_way' | 'round_trip' | undefined {
  if (mode === 'transport') return 'one_way';
  if (mode === 'trips') return 'round_trip';
  return undefined;
}
