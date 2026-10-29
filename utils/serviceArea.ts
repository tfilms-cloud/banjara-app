import { corridorKey, parseCorridor, parseRouteStop } from '@/utils/corridors';

export type ServiceAreaRoute = {
  key: string;
  from?: string;
  to?: string;
  pickups: string[];
  dropoffs: string[];
};

const clean = (value: string) =>
  value
    .trim()
    .replace(/^[·•\s]+|[·•\s]+$/g, '')
    .trim();
export function uniqueAreaNames(values: string[]) {
  const seen = new Set<string>();
  return values.map(clean).filter((name) => {
    if (!name || seen.has(name.toLocaleLowerCase())) return false;
    seen.add(name.toLocaleLowerCase());
    return true;
  });
}

/** Older profiles also stored "Origin → Destination · Stop". Keep route labels out of place names. */
function readStop(raw: string) {
  const value = clean(raw);
  const parsed = parseRouteStop(value);
  if (parsed.origin && parsed.destination)
    return { ...parsed, place: clean(parsed.place) };
  const parts = value.split(/\s+[·•]\s+/);
  if (parts.length > 1) {
    const route = parseCorridor(parts[0]);
    if (route) return { place: clean(parts.slice(1).join(' · ')), ...route };
  }
  return { place: value };
}

export function groupServiceArea(
  routes: string[],
  pickups: string[],
  dropoffs: string[],
): ServiceAreaRoute[] {
  const groups = new Map<string, ServiceAreaRoute>();
  const routeGroup = (from: string, to: string) => {
    const key = corridorKey(from, to);
    if (!groups.has(key))
      groups.set(key, {
        key,
        from: from.trim(),
        to: to.trim(),
        pickups: [],
        dropoffs: [],
      });
    return groups.get(key)!;
  };
  for (const route of routes) {
    const parsed = parseCorridor(clean(route));
    if (parsed) routeGroup(parsed.origin, parsed.destination);
  }
  const add = (raw: string, kind: 'pickups' | 'dropoffs') => {
    const stop = readStop(raw);
    if (!stop.place) return;
    let group: ServiceAreaRoute;
    if (
      'origin' in stop &&
      stop.origin &&
      'destination' in stop &&
      stop.destination
    ) {
      group = routeGroup(stop.origin, stop.destination);
    } else {
      // Unscoped stops must not be silently attached to a different journey.
      const key = 'unassigned';
      if (!groups.has(key)) groups.set(key, { key, pickups: [], dropoffs: [] });
      group = groups.get(key)!;
    }
    group[kind] = uniqueAreaNames([...group[kind], stop.place]);
  };
  pickups.forEach((stop) => add(stop, 'pickups'));
  dropoffs.forEach((stop) => add(stop, 'dropoffs'));
  return [...groups.values()];
}
