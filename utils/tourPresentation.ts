import type { TourItinerary } from '@/types/tourItinerary';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

export function tourPhotos(item: Pick<TourItinerary, 'coverImage' | 'images'>) {
  return [
    ...new Set(
      [item.coverImage, ...item.images]
        .map(normalizeMediaUrl)
        .filter((uri): uri is string => Boolean(uri)),
    ),
  ];
}

export function tourCanReserve(item: TourItinerary) {
  return (
    item.status === 'published' &&
    Boolean(item.id) &&
    Number.isFinite(item.pricePerPerson) &&
    item.pricePerPerson >= 0 &&
    Number.isFinite(item.maxParticipants) &&
    item.maxParticipants >= 1
  );
}

export function tourDuration(item: Pick<TourItinerary, 'durationDays' | 'durationNights'>) {
  if (!Number.isFinite(item.durationDays) || item.durationDays < 1) return 'Ask operator';
  return item.durationNights != null &&
    Number.isFinite(item.durationNights) &&
    item.durationNights >= 0
    ? `${item.durationDays}D / ${item.durationNights}N`
    : `${item.durationDays} ${item.durationDays === 1 ? 'day' : 'days'}`;
}

export function tourTypeLabel(item: Pick<TourItinerary, 'tourType'>) {
  return item.tourType === 'summit'
    ? 'Summit'
    : item.tourType === 'expedition'
      ? 'Expedition'
      : 'Trek';
}
