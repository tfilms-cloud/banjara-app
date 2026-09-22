/**
 * Make Supabase (and similar) media URLs safe for React Native Image.
 * Unencoded spaces in bucket names like "Banjara Images" render as blank images.
 */
export function normalizeMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = String(url).trim();
  if (!trimmed) return undefined;

  try {
    // Encode only the pathname so query/hash stay intact.
    const parsed = new URL(trimmed);
    parsed.pathname = parsed.pathname
      .split('/')
      .map((segment) => {
        if (!segment) return segment;
        try {
          return encodeURIComponent(decodeURIComponent(segment));
        } catch {
          return encodeURIComponent(segment);
        }
      })
      .join('/');
    return parsed.toString();
  } catch {
    return trimmed.replace(/ /g, '%20');
  }
}
