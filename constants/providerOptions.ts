import type { Provider } from '@/types/provider';

export const SERVICE_OPTIONS: {
  type: Provider['services'][number];
  label: string;
  emoji: string;
  description: string;
}[] = [
  {
    type: 'transport',
    label: 'Transportation',
    emoji: '🚌',
    description: 'Trips, vans, buses, and car rental — one transport listing',
  },
  {
    type: 'hotel',
    label: 'Lodging',
    emoji: '🏨',
    description: 'Hotels, guest houses, lodges, and hostels',
  },
  {
    type: 'tour',
    label: 'Tour Operators',
    emoji: '🗺️',
    description: 'Guided tours, treks, and packages',
  },
  {
    type: 'travelGuide',
    label: 'Guides',
    emoji: '🧭',
    description: 'Hireable local guide — experience & languages, no trips',
  },
  {
    type: 'restaurant',
    label: 'Restaurants',
    emoji: '🍽️',
    description: 'Dining, menus, sales and destination offers',
  },
];

export const SERVICE_LABELS: Record<string, string> = {
  transport: 'Transportation',
  van: 'Transportation',
  bus: 'Transportation',
  carRental: 'Transportation',
  hotel: 'Lodging',
  guestHouse: 'Lodging',
  tour: 'Tour Operators',
  travelGuide: 'Guides',
  travelAgency: 'Travel Agency',
  restaurant: 'Restaurants',
};

export function serviceLabel(type: string) {
  return SERVICE_LABELS[normalizeServiceKey(type)] ?? SERVICE_LABELS[type] ?? type;
}

/**
 * Catalog / DB keys may be lowercased (travelguide). Map to app canonical keys.
 */
export function normalizeServiceKey(type: string): string {
  const raw = String(type ?? '').trim();
  if (!raw) return raw;
  const lower = raw.toLowerCase().replace(/[\s-]+/g, '');
  const aliases: Record<string, string> = {
    transport: 'transport',
    transportation: 'transport',
    van: 'transport',
    bus: 'transport',
    vanoperator: 'transport',
    busoperator: 'transport',
    hotel: 'hotel',
    lodging: 'hotel',
    resort: 'hotel',
    guesthouse: 'guestHouse',
    lodge: 'guestHouse',
    tour: 'tour',
    touroperator: 'tour',
    touroperators: 'tour',
    travelagency: 'travelAgency',
    travelguide: 'travelGuide',
    guide: 'travelGuide',
    guides: 'travelGuide',
    carrental: 'carRental',
    restaurant: 'restaurant',
    restaurants: 'restaurant',
  };
  return aliases[lower] ?? raw;
}

export function isHotelService(type: string) {
  const key = normalizeServiceKey(type);
  return key === 'hotel' || key === 'guestHouse';
}

export function isGuestHouseService(type: string) {
  return normalizeServiceKey(type) === 'guestHouse';
}

export const HOTEL_STAY_TYPE_OPTIONS = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'resort', label: 'Resort' },
];

export const GUEST_STAY_TYPE_OPTIONS = [
  { value: 'guestHouse', label: 'Guest house' },
  { value: 'lodge', label: 'Lodge' },
];

/** Lodging sign-up: Hotel, Guest house, Lodge or Hostel */
export const LODGING_TYPE_OPTIONS = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'guestHouse', label: 'Guest house' },
  { value: 'lodge', label: 'Lodge' },
  { value: 'hostel', label: 'Hostel' },
];

export function stayTypeLabel(value?: string) {
  const all = [...LODGING_TYPE_OPTIONS, ...HOTEL_STAY_TYPE_OPTIONS, ...GUEST_STAY_TYPE_OPTIONS];
  return all.find((item) => item.value === value)?.label ?? value ?? '';
}

export function normalizeStayType(
  value?: string | null
): 'hotel' | 'resort' | 'guestHouse' | 'lodge' | 'hostel' {
  const raw = String(value ?? '')
    .replace(/[_-\s]/g, '')
    .toLowerCase();
  if (raw === 'resort') return 'resort';
  if (raw === 'lodge') return 'lodge';
  if (raw === 'hostel') return 'hostel';
  if (raw === 'guesthouse' || raw === 'homestay') return 'guestHouse';
  return 'hotel';
}

export function defaultStayType(services: string[], current?: string) {
  const guest = services.some(isGuestHouseService);
  const normalized = normalizeStayType(current);
  if (normalized === 'hostel') return 'hostel';
  if (guest) {
    return normalized === 'lodge' ? 'lodge' : 'guestHouse';
  }
  if (normalized === 'guestHouse' || normalized === 'lodge') return normalized;
  return normalized === 'resort' ? 'resort' : 'hotel';
}

/** Fleet operators who run vans, minibuses, buses, and car rental. */
export function isTransportService(type: string) {
  const key = normalizeServiceKey(type);
  return key === 'transport' || key === 'van' || key === 'bus' || key === 'carRental';
}

export function isTourLikeService(type: string) {
  const key = normalizeServiceKey(type);
  return key === 'tour' || key === 'travelGuide';
}

/** Tour operators only — packages / itineraries (not hireable guides). */
export function isTourOperatorService(type: string) {
  return normalizeServiceKey(type) === 'tour';
}

export function isGuideService(type: string) {
  return normalizeServiceKey(type) === 'travelGuide';
}

export function isRestaurantService(type: string) {
  return normalizeServiceKey(type) === 'restaurant';
}

/** Only transport providers can organise trips. */
export function canOrganizeTrips(type?: string | null) {
  return Boolean(type && isTransportService(type));
}

export function canOrganizeTripsFromList(services: string[] = []) {
  return services.some((item) => isTransportService(item));
}

export function editServiceHref(type: string) {
  const key = normalizeServiceKey(type);
  if (isHotelService(key)) return '/(provider)/register/hotel';
  if (isGuideService(key)) return '/(provider)/register/guide';
  if (isTourOperatorService(key) || key === 'travelAgency') return '/(provider)/register/tours';
  if (isTransportService(key)) return '/(provider)/register/transport';
  if (isRestaurantService(key)) return '/(provider)/register/restaurant';
  return '/(provider)/register/business';
}

/** Next onboarding screen after location pin for the selected service. */
export function nextProviderSetupRoute(services: string[]) {
  if (services.some((s) => isTransportService(s) || s === 'carRental')) {
    return '/(provider)/register/transport';
  }
  if (services.some((s) => isHotelService(s))) {
    return '/(provider)/register/hotel';
  }
  if (services.some((s) => isGuideService(s))) {
    return '/(provider)/register/guide';
  }
  if (services.some((s) => isTourOperatorService(s) || s === 'travelAgency')) {
    return '/(provider)/register/tours';
  }
  if (services.some((s) => isRestaurantService(s))) {
    return '/(provider)/register/restaurant';
  }
  return '/(provider)/register/verification';
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
  { value: 'jeep', label: 'Jeep' },
  { value: 'suv', label: 'SUV' },
  { value: 'van', label: 'Van' },
  { value: 'mini_bus', label: 'Mini bus' },
  { value: 'bus', label: 'Bus' },
];

export const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export const INSURANCE_COMPANY_OPTIONS = [
  { value: 'jubilee', label: 'Jubilee General Insurance' },
  { value: 'efu', label: 'EFU General Insurance' },
  { value: 'adamjee', label: 'Adamjee Insurance' },
  { value: 'ubl_insurer', label: 'UBL Insurers' },
  { value: 'askari', label: 'Askari General Insurance' },
  { value: 'igi', label: 'IGI Insurance' },
  { value: 'takaful_pakistan', label: 'Takaful Pakistan' },
  { value: 'salaam_takaful', label: 'Salaam Takaful' },
  { value: 'other', label: 'Other' },
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
