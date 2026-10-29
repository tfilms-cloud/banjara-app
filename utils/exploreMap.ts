import { router } from 'expo-router';

/** Hash a label into a stable Northern Pakistan-ish coordinate for map preview */
export function exploreDemoCoords(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const latitude = 35.2 + (h % 180) / 100;
  const longitude = 72.5 + ((h >> 8) % 250) / 100;
  return { latitude, longitude };
}

export function openExploreItemOnMap(item: {
  title: string;
  subtitle?: string;
  meta?: string;
  id?: string;
  category?: string;
  href?: string;
}) {
  const { latitude, longitude } = exploreDemoCoords(item.id || item.title);
  router.push({
    pathname: '/(customer)/explore/map',
    params: {
      title: item.title,
      subtitle: item.subtitle || item.meta || '',
      category: item.category || 'service',
      lat: String(latitude),
      lng: String(longitude),
      ...(item.href ? { href: item.href } : {}),
    },
  } as never);
}
