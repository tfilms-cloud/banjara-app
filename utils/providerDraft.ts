import type { Provider, ProviderHotelSetup, ProviderOnboardingDraft } from '@/types/provider';

function filled(value?: string | number | null) {
  if (value == null) return false;
  if (typeof value === 'number') return Number.isFinite(value) && value !== 0;
  return Boolean(String(value).trim());
}

function pick(server?: string, local?: string) {
  return filled(server) ? String(server) : local;
}

function pickHotel(
  server?: ProviderHotelSetup,
  local?: Partial<ProviderHotelSetup>
): Partial<ProviderHotelSetup> | undefined {
  if (!server && !local) return undefined;
  if (!server) return local;
  if (!local) return server;

  return {
    ...local,
    ...server,
    hotelName: pick(server.hotelName, local.hotelName) ?? '',
    hotelType: server.hotelType || local.hotelType,
    managerName: pick(server.managerName, local.managerName) ?? '',
    landline: pick(server.landline, local.landline),
    phone: pick(server.phone, local.phone) ?? '',
    address: pick(server.address, local.address) ?? '',
    village: pick(server.village, local.village) ?? '',
    district: pick(server.district, local.district) ?? '',
    city: pick(server.city, local.city) ?? '',
    latitude: server.latitude || local.latitude,
    longitude: server.longitude || local.longitude,
    googleMapsUrl: pick(server.googleMapsUrl, local.googleMapsUrl),
    businessRegistered: server.businessRegistered || local.businessRegistered || '',
    businessRegistrationNumber:
      pick(server.businessRegistrationNumber, local.businessRegistrationNumber) ?? '',
    yearsExperience: server.yearsExperience || local.yearsExperience || 0,
    website: pick(server.website, local.website),
    socialFacebook: pick(server.socialFacebook, local.socialFacebook),
    socialInstagram: pick(server.socialInstagram, local.socialInstagram),
    socialTiktok: pick(server.socialTiktok, local.socialTiktok),
    restaurantAvailable: server.restaurantAvailable || local.restaurantAvailable || '',
    outlookImages: server.outlookImages?.length ? server.outlookImages : local.outlookImages ?? [],
    roomImages: server.roomImages?.length ? server.roomImages : local.roomImages ?? [],
    restaurantImages: server.restaurantImages?.length
      ? server.restaurantImages
      : local.restaurantImages ?? [],
    description: pick(server.description, local.description) ?? '',
    email: pick(server.email, local.email) ?? '',
    checkInTime: pick(server.checkInTime, local.checkInTime) ?? '14:00',
    checkOutTime: pick(server.checkOutTime, local.checkOutTime) ?? '12:00',
    amenities: server.amenities?.length ? server.amenities : local.amenities ?? [],
    images: server.images?.length ? server.images : local.images ?? [],
  };
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
    hotel: pickHotel(provider.hotel, current.hotel),
    tour: provider.tour ?? current.tour,
    guide: provider.guideDetails ?? current.guide,
    restaurant: provider.restaurant ?? current.restaurant,
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
