import type { Hotel } from '@/types/hotel';
import { formatTime } from '@/utils/formatTime';
import { publicWebsite } from '@/utils/providerDetails';

export function hotelPlaceLine(hotel: Hotel): string {
  const seen = new Set<string>();
  return [hotel.village, hotel.district, hotel.location.city]
    .map((value) => value?.trim() || '')
    .filter((value) => {
      if (!value || seen.has(value.toLowerCase())) return false;
      seen.add(value.toLowerCase());
      return true;
    })
    .join(' · ');
}

export function hotelAbout(hotel: Hotel): string {
  return (
    hotel.description?.trim() ||
    [
      hotel.name,
      hotelPlaceLine(hotel) ? `located in ${hotelPlaceLine(hotel)}` : '',
      hotel.managerName?.trim() ? `managed by ${hotel.managerName.trim()}` : '',
      hotel.yearsExperience && hotel.yearsExperience > 0
        ? `with ${hotel.yearsExperience}+ years in hospitality`
        : '',
    ]
      .filter(Boolean)
      .join(' ') + '.'
  );
}

export function hotelMapUrl(hotel: Hotel): string {
  const registered = publicWebsite(hotel.googleMapsUrl);
  if (registered) return registered;
  const { latitude, longitude } = hotel.location;
  const valid =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 &&
    !(latitude === 0 && longitude === 0);
  const query = valid
    ? `${latitude},${longitude}`
    : [hotel.location.address?.trim(), hotelPlaceLine(hotel), hotel.name]
        .filter(Boolean)
        .join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function hotelTimeLabel(value: string): string {
  const time = value.trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (match && Number(match[1]) < 24 && Number(match[2]) < 60)
    return `${time} (${formatTime(time)})`;
  return time.includes('T') && !Number.isNaN(new Date(time).getTime()) ? formatTime(time) : time;
}

export function hotelCancellationLabel(hotel: Hotel): string | undefined {
  if (!hotel.freeCancellation) return undefined;
  return /\b24\s*(?:h(?:ours?)?|hrs?)\b/i.test(hotel.cancellationPolicy)
    ? 'Free cancellation (24h)'
    : 'Free cancellation';
}

export function hotelStartingPrice(hotel: Hotel): number | undefined {
  return Number.isFinite(hotel.priceFrom) && hotel.priceFrom > 0 ? hotel.priceFrom : undefined;
}
