import { normalizeMediaUrl } from '@/utils/mediaUrl';

/** Keep portraits out of the gallery, including older responses and signed URL variants. */
export function withoutDriverPhoto(
  images: string[],
  driverPhoto?: string | null,
): string[] {
  const imageKey = (uri: string) =>
    (normalizeMediaUrl(uri) ?? '').split(/[?#]/)[0];
  const portrait = imageKey(driverPhoto ?? '');
  return Array.from(
    new Set(
      images
        .map((uri) => normalizeMediaUrl(uri) ?? '')
        .filter(
          (uri) => Boolean(uri) && (!portrait || imageKey(uri) !== portrait),
        ),
    ),
  );
}
