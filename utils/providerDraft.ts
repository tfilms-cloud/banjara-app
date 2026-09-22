import type { Provider, ProviderOnboardingDraft } from '@/types/provider';

function filled(value?: string | null) {
  return Boolean(value && String(value).trim());
}

function pick(server?: string, local?: string) {
  return filled(server) ? String(server) : local;
}

export function draftFromProvider(
  provider: Provider,
  current: ProviderOnboardingDraft
): ProviderOnboardingDraft {
  const hasPin =
    provider.latitude != null &&
    provider.longitude != null &&
    !(provider.latitude === 0 && provider.longitude === 0);

  return {
    ...current,
    selectedServices: provider.services?.length ? provider.services : current.selectedServices,
    business: {
      ...current.business,
      businessName: pick(provider.businessName, current.business.businessName),
      ownerName: pick(provider.ownerName, current.business.ownerName),
      phone: pick(provider.phone, current.business.phone),
      email: pick(provider.email, current.business.email),
      description: pick(provider.description, current.business.description),
      city: pick(provider.city, current.business.city),
      address: pick(provider.address, current.business.address),
      yearsExperience: provider.yearsExperience || current.business.yearsExperience,
      website: pick(provider.website, current.business.website),
      socialMedia: pick(provider.socialMedia, current.business.socialMedia),
    },
    location: hasPin
      ? {
          latitude: provider.latitude as number,
          longitude: provider.longitude as number,
          placeName: provider.structuredAddress?.city || provider.city,
          address: {
            city: provider.structuredAddress?.city || provider.city,
            formattedAddress: provider.structuredAddress?.formattedAddress || provider.address,
            street: provider.structuredAddress?.street,
            area: provider.structuredAddress?.area,
            region: provider.structuredAddress?.region,
            postalCode: provider.structuredAddress?.postalCode,
            country: provider.structuredAddress?.country || 'Pakistan',
          },
        }
      : current.location,
    transport: provider.transport ?? current.transport,
    hotel: provider.hotel ?? current.hotel,
    tour: provider.tour ?? current.tour,
  };
}

export function canPersistProviderApplication(draft: ProviderOnboardingDraft, fallbackServices: string[] = []) {
  const businessName = draft.business.businessName ?? draft.personal.name ?? '';
  const ownerName = draft.business.ownerName ?? draft.personal.name ?? '';
  const phone = draft.business.phone ?? draft.personal.phone ?? '';
  const email = draft.business.email ?? draft.personal.email ?? '';
  const address = draft.location?.address.formattedAddress || draft.business.address || '';
  const city = draft.location?.address.city || draft.business.city || '';
  const services = draft.selectedServices.length ? draft.selectedServices : fallbackServices;

  return (
    businessName.trim().length >= 2 &&
    ownerName.trim().length >= 2 &&
    phone.trim().length >= 10 &&
    email.includes('@') &&
    address.trim().length >= 3 &&
    city.trim().length >= 2 &&
    services.length === 1
  );
}
