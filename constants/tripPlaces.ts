import { POPULAR_DESTINATIONS } from '@/constants/destinations';

/** Fixed city/route options used in search + trip create dropdowns. */
export const TRIP_CITY_OPTIONS = [
  'Islamabad',
  'Rawalpindi',
  'Gilgit',
  'Hunza',
  'Karimabad',
  'Skardu',
  'Naran',
  'Murree',
  'Swat',
  'Chilas',
  'Passu',
  'Fairy Meadows',
  ...POPULAR_DESTINATIONS.map((d) => d.name),
].filter((name, index, arr) => arr.indexOf(name) === index);

/** Common boarding / pickup points (Islamabad corridor + north). */
export const TRIP_PICKUP_OPTIONS = [
  'Faizabad',
  'G-9',
  'Faizabad Metro',
  'Saddar Rawalpindi',
  'Islamabad',
  'Rawalpindi',
  'Gilgit',
  'Chilas',
  'Karimabad',
  'Hunza',
  'Skardu',
  'Naran',
  'Murree',
  'Swat',
  'Passu',
];

/** Common drop-off / arrival points. */
export const TRIP_DROPOFF_OPTIONS = [
  'Karimabad Center',
  'Hunza',
  'Gilgit',
  'Skardu',
  'Passu',
  'Naran',
  'Murree',
  'Swat',
  'Fairy Meadows',
  'Islamabad',
  'Faizabad',
  'Chilas',
];

export const TRIP_AMENITY_OPTIONS = [
  'AC',
  'WiFi',
  'Charging',
  'Comfortable Seats',
  'Luggage',
  'Refreshments',
  'Entertainment',
];

export function filterPlaceOptions(options: string[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter((item) => item.toLowerCase().includes(q));
}
