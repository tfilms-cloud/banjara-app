/**
 * Explore catalog — service tabs, vehicle/residence filters, and mappers.
 * Listings come from live provider APIs (trips, hotels, restaurants, guides, tours).
 */

export type ExploreServiceTab =
  | 'transport'
  | 'hotels'
  | 'tours'
  | 'guides'
  | 'restaurants';

export type VehicleClass =
  | 'car'
  | 'jeep'
  | 'suv'
  | 'van'
  | 'bus'
  | 'mini_bus';

export type ResidenceClass = 'hotel' | 'guest_house' | 'lodge';

export type GuideGender = 'male' | 'female';

export type TourType = 'trek' | 'expedition' | 'summit';

export type ExploreThumb = {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  rating?: number;
  badge?: string;
  href: string;
  meta?: string;
};

export const EXPLORE_SERVICE_TABS: Array<{
  id: ExploreServiceTab;
  label: string;
}> = [
  { id: 'transport', label: 'Transportation' },
  { id: 'hotels', label: 'Lodging' },
  { id: 'tours', label: 'Tour Operators' },
  { id: 'guides', label: 'Guides' },
  { id: 'restaurants', label: 'Restaurants' },
];

export const VEHICLE_CLASSES: Array<{ id: VehicleClass; label: string }> = [
  { id: 'car', label: 'Cars' },
  { id: 'jeep', label: 'Jeeps' },
  { id: 'suv', label: 'SUVs' },
  { id: 'van', label: 'Vans' },
  { id: 'bus', label: 'Buses' },
  { id: 'mini_bus', label: 'Mini buses' },
];

export const RESIDENCE_CLASSES: Array<{ id: ResidenceClass; label: string }> = [
  { id: 'hotel', label: 'Hotels' },
  { id: 'guest_house', label: 'Guest houses' },
  { id: 'lodge', label: 'Hostels & lodges' },
];

export const GUIDE_GENDERS: Array<{ id: GuideGender; label: string }> = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
];

export const TOUR_TYPES: Array<{ id: TourType; label: string }> = [
  { id: 'trek', label: 'Trek' },
  { id: 'expedition', label: 'Expedition' },
  { id: 'summit', label: 'Summits' },
];

export function mapTripVehicleClass(type?: string): VehicleClass {
  const t = String(type || '').toLowerCase();
  if (t.includes('jeep')) return 'jeep';
  if (t.includes('suv') || t.includes('prado') || t.includes('fortuner')) return 'suv';
  if (t.includes('mini')) return 'mini_bus';
  if (t.includes('bus') || t.includes('coach')) return 'bus';
  if (t.includes('van') || t.includes('hiace') || t.includes('coaster')) return 'van';
  if (t.includes('car') || t.includes('private') || t.includes('taxi')) return 'car';
  return 'van';
}

export function mapHotelResidenceClass(type?: string): ResidenceClass {
  const t = String(type || '').toLowerCase();
  if (t.includes('guest')) return 'guest_house';
  if (t.includes('lodge') || t.includes('hostel') || t.includes('home')) return 'lodge';
  return 'hotel';
}
