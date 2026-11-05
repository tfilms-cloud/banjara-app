import type { GuideOfferedService } from '@/types/guide';
import type { Provider } from '@/types/provider';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

export function guideDisplayName(provider: Provider) {
  return (
    provider.guideDetails?.fullName?.trim() ||
    provider.ownerName?.trim() ||
    provider.businessName ||
    'Guide'
  );
}

export function guidePhotos(provider: Provider) {
  const guide = provider.guideDetails;
  const normalize = (urls: Array<string | undefined | null>) => [
    ...new Set(urls.map(normalizeMediaUrl).filter((url): url is string => Boolean(url))),
  ];
  const portrait = normalizeMediaUrl(guide?.profilePhoto || provider.logo);
  const field = normalize(
    (guide?.photos ?? []).filter((photo) => photo.category !== 'profile').map((photo) => photo.url),
  );
  const all = normalize((guide?.photos ?? []).map((photo) => photo.url));
  const hero = normalize([
    ...field,
    ...all,
    ...(all.length ? [] : [...(provider.galleryImages ?? []), ...(provider.tour?.images ?? [])]),
    portrait,
  ]);
  return { portrait, field, hero };
}

/** The daily-rate fallback matches the existing checkout; its defaults are not advertised as registered facts. */
export function guideServices(provider: Provider): GuideOfferedService[] {
  const guide = provider.guideDetails;
  const services = (guide?.services ?? []).filter((service) => service.active !== false);
  if (services.length) return services;
  const legacy = provider.tour;
  const rate = guide?.dailyHireRate ?? legacy?.dailyHireRate ?? legacy?.price;
  if (!Number.isFinite(rate) || !rate || rate <= 0) return [];
  return [
    {
      id: '',
      name: 'Daily guide hire',
      category: 'local',
      description: legacy?.description || provider.description || '',
      durationLabel: 'Daily hire',
      durationHours: 8,
      price: rate,
      pricingType: 'per_day',
      currency: 'PKR',
      minGuests: 1,
      maxGuests: 20,
      included: [],
      excluded: [],
      availableLocations: guide?.areasCovered ?? legacy?.operatingAreas ?? [],
      active: true,
    },
  ];
}

export function guideServiceKey(service: GuideOfferedService) {
  return service.id
    ? `id:${service.id}`
    : JSON.stringify([service.name, service.currency, service.pricingType, service.price]);
}

export function guideServiceBookable(service: GuideOfferedService) {
  return (
    service.active !== false &&
    Number.isFinite(service.price) &&
    service.price > 0 &&
    Number.isFinite(service.minGuests) &&
    service.minGuests >= 1 &&
    Number.isFinite(service.maxGuests) &&
    service.maxGuests >= service.minGuests
  );
}

export function guideServiceForBooking(services: GuideOfferedService[], requested = '') {
  return (
    services.find(
      (service) => guideServiceKey(service) === requested && guideServiceBookable(service),
    ) || services.find(guideServiceBookable)
  );
}

export function guidePricingUnit(type: GuideOfferedService['pricingType']) {
  return (
    {
      per_day: 'per day',
      per_group: 'per group',
      per_hour: 'per hour',
      per_person: 'per person',
      custom: 'custom price',
    }[type] || 'Ask guide'
  );
}

/** Never compare a per-person price with a group/hour/day price or another currency. */
export function guideFareSummary(services: GuideOfferedService[]) {
  const bookable = services.filter(guideServiceBookable);
  const groups = new Set(bookable.map((service) => `${service.currency}:${service.pricingType}`));
  if (!bookable.length) return { kind: 'unavailable' as const };
  if (groups.size !== 1) return { kind: 'mixed' as const };
  const lowest = bookable.reduce((a, b) => (a.price <= b.price ? a : b));
  return {
    kind: 'price' as const,
    amount: lowest.price,
    currency: lowest.currency,
    unit: guidePricingUnit(lowest.pricingType),
  };
}
