import type { Provider } from '@/types/provider';

export const SERVICE_OPTIONS: {
  type: Provider['services'][number];
  label: string;
  emoji: string;
  description: string;
}[] = [
  {
    type: 'transport',
    label: 'Transport',
    emoji: '🚌',
    description: 'Vans, minibuses, and buses — you can organise trips',
  },
  { type: 'carRental', label: 'Car Rental', emoji: '🚗', description: 'Self-drive and chauffeur cars' },
  { type: 'hotel', label: 'Hotel', emoji: '🏨', description: 'Hotels and resorts' },
  { type: 'guestHouse', label: 'Guest House / Lodge', emoji: '🏡', description: 'Homestays and lodges' },
  { type: 'tour', label: 'Tour Services', emoji: '🗺️', description: 'Guided tours and packages' },
  { type: 'travelGuide', label: 'Travel Guide', emoji: '🧭', description: 'Local guides and on-ground hosting' },
  { type: 'travelAgency', label: 'Travel Agency', emoji: '✈️', description: 'Full travel agency services' },
];

export const SERVICE_LABELS: Record<string, string> = {
  transport: 'Transport',
  van: 'Transport',
  bus: 'Transport',
  carRental: 'Car Rental',
  hotel: 'Hotel',
  guestHouse: 'Guest House / Lodge',
  tour: 'Tour Services',
  travelGuide: 'Travel Guide',
  travelAgency: 'Travel Agency',
};

export function serviceLabel(type: string) {
  return SERVICE_LABELS[type] ?? type;
}

export function isHotelService(type: string) {
  return type === 'hotel' || type === 'guestHouse';
}

/** Fleet operators who run vans, minibuses, and buses. */
export function isTransportService(type: string) {
  return type === 'transport' || type === 'van' || type === 'bus';
}

export function isTourLikeService(type: string) {
  return type === 'tour' || type === 'travelGuide';
}

/** Only transport providers can organise trips. */
export function canOrganizeTrips(type?: string | null) {
  return Boolean(type && isTransportService(type));
}

export function canOrganizeTripsFromList(services: string[] = []) {
  return services.some((item) => isTransportService(item));
}

export function editServiceHref(type: string) {
  if (isHotelService(type)) return '/(provider)/register/hotel';
  if (isTourLikeService(type)) return '/(provider)/register/tours';
  if (isTransportService(type) || type === 'carRental') return '/(provider)/register/transport';
  return '/(provider)/register/business';
}

export const ROOM_TYPE_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'double', label: 'Double' },
  { value: 'twin', label: 'Twin' },
  { value: 'deluxe', label: 'Deluxe' },
  { value: 'suite', label: 'Suite' },
  { value: 'family', label: 'Family' },
];

export const VEHICLE_TYPE_OPTIONS = [
  { value: 'car', label: 'Car' },
  { value: 'van', label: 'Van' },
  { value: 'minibus', label: 'Minibus' },
  { value: 'bus', label: 'Bus' },
];

export const OWNERSHIP_TYPE_OPTIONS = [
  { value: 'owned', label: 'Owned' },
  { value: 'leased', label: 'Leased' },
  { value: 'mixed', label: 'Mixed' },
];

export const PRICING_METHOD_OPTIONS = [
  { value: 'per_seat', label: 'Per seat', subtitle: 'Charge each traveler a seat fare' },
  { value: 'per_vehicle', label: 'Per vehicle', subtitle: 'Charge a full-vehicle hire fare' },
  { value: 'negotiable', label: 'Negotiable', subtitle: 'Quote after the traveler enquires' },
];

export const DEFAULT_DOCUMENTS = [
  { id: 'd1', label: 'Business registration', category: 'business' as const, status: 'not_submitted' as const },
  { id: 'd2', label: 'Operating license', category: 'license' as const, status: 'not_submitted' as const },
  { id: 'd3', label: 'Identity document', category: 'other' as const, status: 'not_submitted' as const },
];
