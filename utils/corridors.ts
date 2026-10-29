const STOP_MARK = ' · ';

export function formatCorridor(origin: string, destination: string) {
  return `${origin.trim()} → ${destination.trim()}`;
}

export function parseCorridor(raw: string): { origin: string; destination: string } | null {
  const text = raw.trim();
  if (!text) return null;
  const parts = text
    .split(/\s*(?:→|->|—|–| to )\s*/i)
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { origin: parts[0], destination: parts[parts.length - 1] };
  }
  return null;
}

export function corridorKey(origin: string, destination: string) {
  return `${origin.trim().toLowerCase()}|${destination.trim().toLowerCase()}`;
}

export function formatRouteStop(place: string, origin: string, destination: string) {
  const clean = displayStopName(place);
  if (!clean || !origin.trim() || !destination.trim()) return clean;
  return `${clean}${STOP_MARK}${formatCorridor(origin, destination)}`;
}

export function parseRouteStop(raw: string): {
  place: string;
  origin?: string;
  destination?: string;
} {
  const text = raw.trim();
  const idx = text.lastIndexOf(STOP_MARK);
  if (idx === -1) return { place: text };
  const place = text.slice(0, idx).trim();
  const corridor = parseCorridor(text.slice(idx + STOP_MARK.length));
  if (!place || !corridor) return { place: text };
  return { place, origin: corridor.origin, destination: corridor.destination };
}

export function displayStopName(raw: string) {
  return parseRouteStop(raw).place;
}

export function stopBelongsToRoute(raw: string, origin: string, destination: string) {
  const parsed = parseRouteStop(raw);
  if (parsed.origin && parsed.destination) {
    return corridorKey(parsed.origin, parsed.destination) === corridorKey(origin, destination);
  }
  const hay = parsed.place.toLowerCase();
  const from = origin.trim().toLowerCase();
  const to = destination.trim().toLowerCase();
  return Boolean(from && hay.includes(from)) || Boolean(to && hay.includes(to));
}

export function addUniquePlace(list: string[], value: string) {
  const next = displayStopName(value);
  if (!next) return list;
  if (list.some((item) => item.toLowerCase() === next.toLowerCase())) return list;
  return [...list, next];
}

export type CorridorDraft = {
  from: string;
  to: string;
  pickups: string[];
  dropoffs: string[];
};

export function flattenRouteStops(corridors: CorridorDraft[]) {
  return {
    operatingRoutes: corridors
      .filter((item) => item.from.trim() && item.to.trim())
      .map((item) => formatCorridor(item.from, item.to)),
    pickupLocations: corridors.flatMap((item) =>
      item.pickups.map((place) => formatRouteStop(place, item.from, item.to))
    ),
    dropoffLocations: corridors.flatMap((item) =>
      item.dropoffs.map((place) => formatRouteStop(place, item.from, item.to))
    ),
  };
}

export function replaceCorridorStops(
  current: string[] | undefined,
  origin: string,
  destination: string,
  nextPlaces: string[]
) {
  const remaining = (current ?? []).filter((item) => {
    const parsed = parseRouteStop(item);
    if (parsed.origin && parsed.destination) {
      return corridorKey(parsed.origin, parsed.destination) !== corridorKey(origin, destination);
    }
    return !nextPlaces.some((place) => place.toLowerCase() === parsed.place.toLowerCase());
  });
  return [...remaining, ...nextPlaces.map((place) => formatRouteStop(place, origin, destination))];
}

export function hydrateCorridors(
  operatingRoutes: string[] | undefined,
  pickupLocations: string[] | undefined,
  dropoffLocations: string[] | undefined
): CorridorDraft[] {
  const corridors: CorridorDraft[] = (operatingRoutes ?? [])
    .map((item) => parseCorridor(item) ?? { origin: item.trim(), destination: '' })
    .filter((item) => item.origin)
    .map((item) => ({
      from: item.origin,
      to: item.destination,
      pickups: [] as string[],
      dropoffs: [] as string[],
    }));

  const takeStop = (raw: string, kind: 'pickups' | 'dropoffs') => {
    const parsed = parseRouteStop(raw);
    if (!parsed.place) return;
    const scoped = corridors.find(
      (item) =>
        parsed.origin &&
        parsed.destination &&
        corridorKey(item.from, item.to) === corridorKey(parsed.origin, parsed.destination)
    );
    if (scoped) {
      scoped[kind] = addUniquePlace(scoped[kind], parsed.place);
      return;
    }
    const cityMatch = corridors.find((item) => {
      const hay = parsed.place.toLowerCase();
      const city = kind === 'pickups' ? item.from : item.to;
      return city.trim() && hay.includes(city.trim().toLowerCase());
    });
    if (cityMatch) {
      cityMatch[kind] = addUniquePlace(cityMatch[kind], parsed.place);
      return;
    }
    if (corridors[0]) {
      corridors[0][kind] = addUniquePlace(corridors[0][kind], parsed.place);
    }
  };

  (pickupLocations ?? []).forEach((item) => takeStop(item, 'pickups'));
  (dropoffLocations ?? []).forEach((item) => takeStop(item, 'dropoffs'));
  return corridors;
}
