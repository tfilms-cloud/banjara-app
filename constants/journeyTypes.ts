export type JourneyType = 'one_way' | 'round_trip';

export const JOURNEY_TYPES: Array<{
  value: JourneyType;
  /** Short badge for customers */
  label: string;
  /** One-line explanation for customers */
  customerHint: string;
  /** Provider-facing title */
  providerTitle: string;
  /** Provider-facing description */
  providerHint: string;
  /** Which home product this journey belongs to */
  productMode: 'transport' | 'trips';
}> = [
  {
    value: 'one_way',
    label: 'One way',
    customerHint: 'Ride to your destination only — no return seat',
    providerTitle: 'One way (Transport)',
    providerHint: 'For travelers who only need a seat for the distance. No return included.',
    productMode: 'transport',
  },
  {
    value: 'round_trip',
    label: 'Round trip',
    customerHint: 'Travel out, then come back home on a set return',
    providerTitle: 'Round trip (Trips)',
    providerHint: 'For travelers who go north and return home. Set return date & time.',
    productMode: 'trips',
  },
];

export function journeyTypeMeta(type?: JourneyType | string | null) {
  const value = type === 'round_trip' ? 'round_trip' : 'one_way';
  return JOURNEY_TYPES.find((item) => item.value === value) ?? JOURNEY_TYPES[0];
}
