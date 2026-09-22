import type { Coordinates } from '@/types/route';

/** Approximate coordinates for common northern / Islamabad boarding areas. */
const PLACE_COORDS: Record<string, Coordinates> = {
  faizabad: { latitude: 33.6664, longitude: 73.0845 },
  'g-9': { latitude: 33.6895, longitude: 73.033 },
  'g 9': { latitude: 33.6895, longitude: 73.033 },
  g9: { latitude: 33.6895, longitude: 73.033 },
  'faizabad metro': { latitude: 33.6664, longitude: 73.0845 },
  islamabad: { latitude: 33.6844, longitude: 73.0479 },
  rawalpindi: { latitude: 33.5651, longitude: 73.0169 },
  'saddar rawalpindi': { latitude: 33.5973, longitude: 73.0442 },
  saddar: { latitude: 33.5973, longitude: 73.0442 },
  gilgit: { latitude: 35.9208, longitude: 74.3144 },
  hunza: { latitude: 36.3167, longitude: 74.65 },
  karimabad: { latitude: 36.3256, longitude: 74.665 },
  skardu: { latitude: 35.2971, longitude: 75.6335 },
  naran: { latitude: 34.9092, longitude: 73.6497 },
  murree: { latitude: 33.9076, longitude: 73.3943 },
  swat: { latitude: 35.2227, longitude: 72.4258 },
  chilas: { latitude: 35.4205, longitude: 74.098 },
  passu: { latitude: 36.4667, longitude: 74.8833 },
  karachi: { latitude: 24.8607, longitude: 67.0011 },
  'saddar karachi': { latitude: 24.8615, longitude: 67.0099 },
  lahore: { latitude: 31.5204, longitude: 74.3587 },
  peshawar: { latitude: 34.0151, longitude: 71.5249 },
  'jiwani heights': { latitude: 25.048, longitude: 61.746 },
  jiwani: { latitude: 25.048, longitude: 61.746 },
  'khunjerab pass': { latitude: 36.85, longitude: 75.428 },
  khunjerab: { latitude: 36.85, longitude: 75.428 },
  abbottabad: { latitude: 34.1463, longitude: 73.2117 },
  mansehra: { latitude: 34.3302, longitude: 73.2 },
  besham: { latitude: 34.9333, longitude: 72.8833 },
};

function normalizePlaceKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function lookupPlaceCoordinates(
  ...labels: Array<string | undefined | null>
): Coordinates | null {
  for (const label of labels) {
    if (!label) continue;
    const key = normalizePlaceKey(label);
    if (PLACE_COORDS[key]) return PLACE_COORDS[key];
    // Prefer longer place keys so "saddar karachi" / "karachi" beat short "saddar"
    const ranked = Object.entries(PLACE_COORDS).sort((a, b) => b[0].length - a[0].length);
    for (const [place, coords] of ranked) {
      if (key.includes(place)) return coords;
    }
  }
  return null;
}

export function isUsableCoordinate(latitude?: number, longitude?: number) {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    !(latitude === 0 && longitude === 0) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
}

export function resolveCoordinates(
  latitude?: number,
  longitude?: number,
  ...labels: Array<string | undefined | null>
): Coordinates {
  if (isUsableCoordinate(latitude, longitude)) {
    return { latitude: latitude!, longitude: longitude! };
  }
  return (
    lookupPlaceCoordinates(...labels) ?? {
      latitude: Number.isFinite(latitude) ? Number(latitude) : 0,
      longitude: Number.isFinite(longitude) ? Number(longitude) : 0,
    }
  );
}
