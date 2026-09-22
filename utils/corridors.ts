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
