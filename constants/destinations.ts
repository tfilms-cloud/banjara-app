/** Northern Pakistan destination imagery (demo Unsplash assets) */

export const HERO_IMAGE =
  'https://images.unsplash.com/photo-1589802829985-817e51171b92?w=1400&q=80';

export const AUTH_BG_IMAGE =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=80';

export const WELCOME_IMAGE =
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1400&q=80';

export const POPULAR_DESTINATIONS = [
  {
    id: 'hunza',
    name: 'Hunza',
    subtitle: 'Valley of peaks',
    image: 'https://images.unsplash.com/photo-1589802829985-817e51171b92?w=800&q=80',
    tag: 'Most loved',
  },
  {
    id: 'skardu',
    name: 'Skardu',
    subtitle: 'Gateway to K2',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
    tag: 'Adventure',
  },
  {
    id: 'gilgit',
    name: 'Gilgit',
    subtitle: 'Mountain capital',
    image: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&q=80',
    tag: 'Culture',
  },
  {
    id: 'naran',
    name: 'Naran',
    subtitle: 'Lake Saiful Muluk',
    image: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&q=80',
    tag: 'Lakes',
  },
  {
    id: 'swat',
    name: 'Swat',
    subtitle: 'Green paradise',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
    tag: 'Nature',
  },
  {
    id: 'fairy-meadows',
    name: 'Fairy Meadows',
    subtitle: 'Nanga Parbat views',
    image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&q=80',
    tag: 'Trekking',
  },
  {
    id: 'passu',
    name: 'Passu',
    subtitle: 'Cones & glacier',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80',
    tag: 'Scenic',
  },
  {
    id: 'murree',
    name: 'Murree',
    subtitle: 'Hill station',
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
    tag: 'Weekend',
  },
];

/** Resolve a destination photo for recent-search cards (always returns an image URL). */
export function destinationImageFor(place?: string | null): string {
  const key = String(place ?? '')
    .trim()
    .toLowerCase();
  if (!key) return POPULAR_DESTINATIONS[0].image;

  const exact = POPULAR_DESTINATIONS.find((d) => d.name.toLowerCase() === key);
  if (exact) return exact.image;

  const partial = POPULAR_DESTINATIONS.find(
    (d) => key.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(key)
  );
  if (partial) return partial.image;

  const hash = Array.from(key).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return POPULAR_DESTINATIONS[hash % POPULAR_DESTINATIONS.length].image;
}

export function destinationMetaFor(place?: string | null) {
  const key = String(place ?? '')
    .trim()
    .toLowerCase();
  const match =
    POPULAR_DESTINATIONS.find((d) => d.name.toLowerCase() === key) ??
    POPULAR_DESTINATIONS.find(
      (d) => key.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(key)
    );
  return {
    name: match?.name ?? place ?? 'Destination',
    subtitle: match?.subtitle ?? 'Northern Pakistan',
    image: destinationImageFor(place),
    tag: match?.tag ?? 'Stay',
  };
}

export const FEATURED_STORIES = [
  {
    id: 'story-hunza',
    title: 'Sunrise in Hunza',
    subtitle: 'Passu Cones · Karimabad',
    cta: 'Explore Hunza',
    to: 'Hunza',
    image: 'https://images.unsplash.com/photo-1589802829985-817e51171b92?w=1200&q=80',
  },
  {
    id: 'story-skardu',
    title: 'Skardu Lakes',
    subtitle: 'Shangrila · Upper Kachura',
    cta: 'Explore Skardu',
    to: 'Skardu',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
  },
  {
    id: 'story-fairy',
    title: 'Fairy Meadows',
    subtitle: 'Nanga Parbat views',
    cta: 'Explore Fairy Meadows',
    to: 'Fairy Meadows',
    image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&q=80',
  },
];

export const TRAVEL_OFFERS = [
  {
    id: 'offer-1',
    title: 'Early bird north',
    detail: 'Save up to 15% on Hunza vans this week',
    code: 'NORTH15',
    tone: 'copper' as const,
  },
  {
    id: 'offer-2',
    title: 'Family seat deal',
    detail: 'Book 3+ seats and unlock free seat pick',
    code: 'FAMILY3',
    tone: 'pine' as const,
  },
];

export const TRUST_POINTS = [
  {
    id: 't1',
    label: 'Verified Providers',
    caption: 'Admin-approved agencies',
    icon: 'shield-checkmark-outline' as const,
  },
  {
    id: 't2',
    label: 'Secure Payments',
    caption: 'Pay inside BANJARA',
    icon: 'lock-closed-outline' as const,
  },
  {
    id: 't3',
    label: 'Live Seat Maps',
    caption: 'Choose your seat',
    icon: 'grid-outline' as const,
  },
  {
    id: 't4',
    label: 'In-app help',
    caption: 'Support from BANJARA',
    icon: 'headset-outline' as const,
  },
];

export const POPULAR_ROUTE_SUGGESTIONS = [
  {
    id: 'isb-hunza',
    from: 'Islamabad',
    to: 'Hunza',
    duration: '12–14 hrs',
    fromPrice: 'PKR 8,500',
  },
  {
    id: 'gilgit-hunza',
    from: 'Gilgit',
    to: 'Hunza',
    duration: '2–3 hrs',
    fromPrice: 'PKR 1,800',
  },
  {
    id: 'isb-skardu',
    from: 'Islamabad',
    to: 'Skardu',
    duration: '14–16 hrs',
    fromPrice: 'PKR 12,000',
  },
  {
    id: 'gilgit-skardu',
    from: 'Gilgit',
    to: 'Skardu',
    duration: '6–8 hrs',
    fromPrice: 'PKR 3,500',
  },
];

export const TRAVEL_CATEGORIES = [
  { id: 'transport', label: 'Transport', hint: 'Ride only', icon: 'navigate-outline' as const },
  { id: 'trips', label: 'Trips', hint: 'Go & return', icon: 'swap-horizontal-outline' as const },
  { id: 'van', label: 'Vans', hint: 'Shared', icon: 'bus-outline' as const },
  { id: 'bus', label: 'Buses', hint: 'Comfort', icon: 'bus' as const },
  { id: 'hotel', label: 'Hotels', hint: 'Stay', icon: 'bed-outline' as const },
];
