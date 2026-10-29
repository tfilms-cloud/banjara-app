import { get, post } from '@/services/api';
import {
  asArray,
  mapFrontendBookingStatus,
  mapPaymentMethod,
  toBackendPaymentMethod,
  type AnyRecord,
} from '@/services/mappers';
import type {
  GuideAvailabilityPublic,
  GuideLanguage,
  GuideListItem,
  GuideOfferedService,
  GuidePhotoCategory,
  GuideProfileStatus,
  GuidePublicDetails,
  GuideSearchParams,
  GuideType,
} from '@/types/guide';
import type { CreateGuideBookingPayload, GuideBooking } from '@/types/guideBooking';
import type { TourPriceBreakdown } from '@/types/tourBooking';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

const TAX_RATE = 0.1;
const SERVICE_FEE = 200;

export function mapGuidePublicFromRaw(
  raw: AnyRecord | undefined | null
): GuidePublicDetails | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const languages: GuideLanguage[] = asArray<AnyRecord>(raw.languages).map((l) => ({
    language: String(l.language ?? ''),
    proficiency: (l.proficiency ?? 'fluent') as GuideLanguage['proficiency'],
  }));
  const photos = asArray<AnyRecord>(raw.photos).map((p) => ({
    id: String(p.id ?? ''),
    url: normalizeMediaUrl(String(p.url ?? '')) ?? String(p.url ?? ''),
    category: String(p.category ?? 'other') as GuidePhotoCategory,
    caption: p.caption ? String(p.caption) : undefined,
  }));
  const services = asArray<AnyRecord>(raw.services).map(mapGuideService);
  return {
    profileStatus: raw.profileStatus
      ? (String(raw.profileStatus) as GuideProfileStatus)
      : undefined,
    fullName: raw.fullName ? String(raw.fullName) : undefined,
    gender: raw.gender as GuidePublicDetails['gender'],
    profilePhoto: raw.profilePhoto
      ? normalizeMediaUrl(String(raw.profilePhoto)) ?? String(raw.profilePhoto)
      : undefined,
    phone: raw.phone ? String(raw.phone) : undefined,
    email: raw.email ? String(raw.email) : undefined,
    city: raw.city ? String(raw.city) : undefined,
    currentLocation: raw.currentLocation ? String(raw.currentLocation) : undefined,
    yearsExperience:
      raw.yearsExperience != null ? Number(raw.yearsExperience) : undefined,
    shortBio: raw.shortBio ? String(raw.shortBio) : undefined,
    detailedDescription: raw.detailedDescription
      ? String(raw.detailedDescription)
      : undefined,
    guideTypes: asArray(raw.guideTypes).map(String) as GuideType[],
    areasCovered: asArray(raw.areasCovered).map(String),
    specialSkills: asArray(raw.specialSkills).map(String),
    certifications: asArray(raw.certifications).map(String),
    languages,
    dailyHireRate: raw.dailyHireRate != null ? Number(raw.dailyHireRate) : undefined,
    photos,
    services,
  };
}

export function mapGuideService(raw: AnyRecord): GuideOfferedService {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? 'Guide service'),
    category: (String(raw.category ?? 'local') as GuideType) || 'local',
    description: String(raw.description ?? ''),
    durationLabel: String(raw.durationLabel ?? ''),
    durationHours: raw.durationHours != null ? Number(raw.durationHours) : undefined,
    price: Number(raw.price ?? 0),
    pricingType: (raw.pricingType as GuideOfferedService['pricingType']) ?? 'per_day',
    currency: String(raw.currency ?? 'PKR'),
    minGuests: Number(raw.minGuests ?? 1),
    maxGuests: Number(raw.maxGuests ?? 20),
    included: asArray(raw.included).map(String),
    excluded: asArray(raw.excluded).map(String),
    meetingPoint: raw.meetingPoint ? String(raw.meetingPoint) : undefined,
    availableLocations: asArray(raw.availableLocations).map(String),
    notes: raw.notes ? String(raw.notes) : undefined,
    active: raw.active !== false,
  };
}

function mapGuideListItem(raw: AnyRecord): GuideListItem {
  const guide = mapGuidePublicFromRaw(raw.guide as AnyRecord);
  const services = asArray<AnyRecord>(raw.services).map(mapGuideService);
  const logo = raw.logo ? normalizeMediaUrl(String(raw.logo)) ?? String(raw.logo) : undefined;
  return {
    id: String(raw.id ?? raw._id ?? ''),
    businessName: String(raw.businessName ?? ''),
    ownerName: String(raw.ownerName ?? ''),
    city: String(raw.city ?? ''),
    logo,
    rating: Number(raw.rating ?? 0),
    reviewCount: Number(raw.totalReviews ?? raw.reviewCount ?? 0),
    yearsExperience: Number(raw.yearsExperience ?? guide?.yearsExperience ?? 0),
    guide,
    fromPrice: raw.fromPrice != null ? Number(raw.fromPrice) : undefined,
    services: services.length ? services : (guide?.services ?? []),
  };
}

export function calcGuidePrice(input: {
  pricingType: GuideOfferedService['pricingType'];
  unitPrice: number;
  guests: number;
  durationHours?: number;
}): number {
  const { pricingType, unitPrice, guests, durationHours = 8 } = input;
  if (unitPrice <= 0) return 0;
  switch (pricingType) {
    case 'per_person':
      return Math.round(unitPrice * guests);
    case 'per_hour':
      return Math.round(unitPrice * Math.max(1, durationHours));
    case 'per_day':
      return Math.round(unitPrice * Math.max(1, Math.ceil(durationHours / 8)));
    case 'per_group':
    case 'custom':
    default:
      return Math.round(unitPrice);
  }
}

export function calcGuidePriceBreakdown(
  pricingType: GuideOfferedService['pricingType'],
  unitPrice: number,
  guests: number,
  durationHours: number,
  currency = 'PKR'
): TourPriceBreakdown {
  const subtotal = calcGuidePrice({ pricingType, unitPrice, guests, durationHours });
  const tax = Math.round(subtotal * TAX_RATE);
  const serviceFee = SERVICE_FEE;
  return {
    subtotal,
    tax,
    serviceFee,
    discount: 0,
    total: Math.max(0, subtotal + tax + serviceFee),
    currency,
  };
}

export function mapGuideBooking(raw: AnyRecord): GuideBooking {
  const gb = (raw.guideBooking ?? {}) as AnyRecord;
  const guestRaw = (gb.guestDetails ?? raw.guestDetails ?? {}) as AnyRecord;

  return {
    id: String(raw._id ?? raw.id ?? ''),
    bookingCode: String(raw.bookingNumber ?? ''),
    providerId: String(raw.providerId ?? gb.providerId ?? ''),
    providerName: String(gb.providerName ?? raw.providerName ?? 'Guide'),
    serviceName: String(gb.serviceName ?? 'Guide hire'),
    date: String(gb.date ?? '').slice(0, 10),
    startTime: String(gb.startTime ?? ''),
    endTime: gb.endTime ? String(gb.endTime) : undefined,
    durationHours: gb.durationHours != null ? Number(gb.durationHours) : undefined,
    guests: Number(gb.guests ?? 1),
    meetingPoint: gb.meetingPoint ? String(gb.meetingPoint) : undefined,
    guest: {
      name: String(guestRaw.name ?? ''),
      email: String(guestRaw.email ?? ''),
      phone: String(guestRaw.phone ?? ''),
      specialRequests: guestRaw.specialRequests
        ? String(guestRaw.specialRequests)
        : undefined,
    },
    paymentMethod: mapPaymentMethod(raw.paymentMethod),
    paymentStatus: (raw.paymentStatus as GuideBooking['paymentStatus']) ?? 'pending',
    paymentId: raw.paymentId ? String(raw.paymentId) : undefined,
    status: mapFrontendBookingStatus(String(raw.bookingStatus ?? 'pending')),
    priceBreakdown: {
      subtotal: Number(raw.subtotal ?? 0),
      tax: Number(raw.tax ?? 0),
      serviceFee: Number(raw.serviceFee ?? 0),
      discount: Number(raw.discount ?? 0),
      total: Number(raw.totalAmount ?? 0),
      currency: String(raw.currency ?? gb.currency ?? 'PKR'),
    },
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    coverImage: raw.guidePhoto
      ? normalizeMediaUrl(String(raw.guidePhoto)) ?? String(raw.guidePhoto)
      : null,
  };
}

export async function searchGuides(params: GuideSearchParams = {}): Promise<GuideListItem[]> {
  const data = await get<unknown>('/guides', {
    params: {
      destination: params.destination,
      date: params.date,
      guests: params.guests,
      guideType: params.guideType,
      language: params.language,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      minRating: params.minRating,
      minExperience: params.minExperience,
    },
  });
  return asArray<AnyRecord>(data).map(mapGuideListItem);
}

export async function getGuideAvailability(providerId: string): Promise<GuideAvailabilityPublic> {
  const data = await get<AnyRecord>(`/guides/${providerId}/availability`);
  return {
    weekly: asArray<AnyRecord>(data.weekly).map((d) => ({
      day: d.day as GuideAvailabilityPublic['weekly'][0]['day'],
      enabled: d.enabled !== false,
      startTime: String(d.startTime ?? '09:00'),
      endTime: String(d.endTime ?? '18:00'),
    })),
    blockedDates: asArray(data.blockedDates).map(String),
    availableFrom: data.availableFrom ? String(data.availableFrom).slice(0, 10) : undefined,
    availableUntil: data.availableUntil ? String(data.availableUntil).slice(0, 10) : undefined,
    minBookingHours: data.minBookingHours != null ? Number(data.minBookingHours) : undefined,
    maxBookingHours: data.maxBookingHours != null ? Number(data.maxBookingHours) : undefined,
    advanceBookingHours:
      data.advanceBookingHours != null ? Number(data.advanceBookingHours) : undefined,
  };
}

export async function createGuideBooking(payload: CreateGuideBookingPayload): Promise<GuideBooking> {
  const data = await post<AnyRecord>('/bookings', {
    bookingType: 'guide',
    paymentMethod: toBackendPaymentMethod(payload.paymentMethod),
    guideBooking: {
      providerId: payload.providerId,
      serviceId: payload.serviceId,
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      durationHours: payload.durationHours,
      guests: payload.guests,
      meetingPoint: payload.meetingPoint,
      availableLocation: payload.availableLocation,
      specialRequest: payload.specialRequest,
      guestDetails: {
        name: payload.guest.name,
        email: payload.guest.email,
        phone: payload.guest.phone,
        specialRequests: payload.guest.specialRequests,
      },
    },
  });
  return mapGuideBooking(data);
}

export async function getGuideBookings(): Promise<GuideBooking[]> {
  const data = await get<unknown>('/bookings/my-bookings');
  return asArray<AnyRecord>(data)
    .filter((item) => item.bookingType === 'guide')
    .map(mapGuideBooking);
}

export async function getGuideBookingById(id: string): Promise<GuideBooking | null> {
  try {
    const data = await get<AnyRecord>(`/bookings/${id}`);
    if (data.bookingType !== 'guide') return null;
    return mapGuideBooking(data);
  } catch {
    return null;
  }
}
