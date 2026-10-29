import { serviceLabel, normalizeServiceKey } from '@/constants/providerOptions';
import type { AppNotification, Booking, BookingStatus, PaymentMethod, PaymentStatus } from '@/types/booking';
import type {
  Hotel,
  HotelAmenity,
  HotelBooking,
  HotelBookingStatus,
  HotelPaymentMethod,
  HotelRoom,
  HotelType,
} from '@/types/hotel';
import type {
  Provider,
  ProviderBooking,
  ProviderBookingKind,
  ProviderBookingStatus,
  ProviderDashboardStats,
  ProviderEarningsSummary,
  ProviderHotelSetup,
  ProviderRestaurantOffer,
  ProviderRestaurantSetup,
  ProviderReview,
  ProviderRoom,
  ProviderRoute,
  ProviderServiceItem,
  ProviderServiceType,
  ProviderTourSetup,
  ProviderTransportSetup,
  ProviderTrip,
  ProviderVehicle,
  RoomAvailabilityDay,
} from '@/types/provider';
import type { Coordinates, PickupPoint, RouteInfo } from '@/types/route';
import type { Seat, SeatLayout, SeatStatus } from '@/types/seat';
import type { Agency, Amenity, Review, Trip, TripWithDetails, VehicleType } from '@/types/trip';
import type {
  GuideAvailability,
  GuideDetails,
  GuideDocument,
  GuideLanguage,
  GuideOfferedService,
  GuidePhoto,
} from '@/types/guide';
import type { ProviderAccountStatus, User, UserRole } from '@/types/user';
import { DEFAULT_GUIDE_WEEKLY } from '@/constants/guideOptions';
import { resolveCoordinates } from '@/constants/geoPlaces';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

export type AnyRecord = Record<string, unknown>;

function mediaUrl(value: unknown): string | undefined {
  return normalizeMediaUrl(value ? String(value) : undefined);
}

function mediaUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => mediaUrl(item)).filter(Boolean) as string[];
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function asRecord(value: unknown): AnyRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as AnyRecord) : undefined;
}

function mapStayType(value: unknown): ProviderHotelSetup['hotelType'] {
  const raw = String(value ?? '')
    .replace(/[_-\s]/g, '')
    .toLowerCase();
  if (raw === 'resort') return 'resort';
  if (raw === 'lodge') return 'lodge';
  if (raw === 'hostel') return 'hostel';
  if (raw === 'guesthouse' || raw === 'homestay') return 'guestHouse';
  return 'hotel';
}

function mapYesNo(value: unknown): 'yes' | 'no' | '' {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'yes' || raw === 'true' || raw === '1') return 'yes';
  if (raw === 'no' || raw === 'false' || raw === '0') return 'no';
  return '';
}

function mapHotelSetup(raw: unknown): ProviderHotelSetup | undefined {
  const data = asRecord(raw);
  if (!data || (!data.hotelName && !data.address && !data.city && !data.managerName)) return undefined;
  const outlookImages = mediaUrls(data.outlookImages).length
    ? mediaUrls(data.outlookImages)
    : stringList(data.outlookImages);
  const roomImages = mediaUrls(data.roomImages).length
    ? mediaUrls(data.roomImages)
    : stringList(data.roomImages);
  const restaurantImages = mediaUrls(data.restaurantImages).length
    ? mediaUrls(data.restaurantImages)
    : stringList(data.restaurantImages);
  const legacyImages = mediaUrls(data.images).length
    ? mediaUrls(data.images)
    : stringList(data.images);
  const images =
    [...outlookImages, ...roomImages, ...restaurantImages].length > 0
      ? [...outlookImages, ...roomImages, ...restaurantImages]
      : legacyImages;
  return {
    hotelName: String(data.hotelName ?? ''),
    hotelType: mapStayType(data.hotelType),
    managerName: String(data.managerName ?? data.ownerName ?? ''),
    landline: data.landline ? String(data.landline) : undefined,
    phone: String(data.phone ?? ''),
    address: String(data.address ?? ''),
    village: String(data.village ?? ''),
    district: String(data.district ?? data.region ?? ''),
    city: String(data.city ?? ''),
    latitude: Number(data.latitude ?? 0),
    longitude: Number(data.longitude ?? 0),
    googleMapsUrl: data.googleMapsUrl ? String(data.googleMapsUrl) : undefined,
    businessRegistered: mapYesNo(data.businessRegistered),
    businessRegistrationNumber: String(data.businessRegistrationNumber ?? data.registrationNumber ?? ''),
    yearsExperience: Number(data.yearsExperience ?? 0),
    website: data.website ? String(data.website) : undefined,
    socialFacebook: data.socialFacebook ? String(data.socialFacebook) : undefined,
    socialInstagram: data.socialInstagram ? String(data.socialInstagram) : undefined,
    socialTiktok: data.socialTiktok ? String(data.socialTiktok) : undefined,
    restaurantAvailable: mapYesNo(data.restaurantAvailable),
    outlookImages,
    roomImages,
    restaurantImages,
    description: String(data.description ?? ''),
    email: String(data.email ?? ''),
    checkInTime: String(data.checkInTime ?? '14:00'),
    checkOutTime: String(data.checkOutTime ?? '12:00'),
    amenities: stringList(data.amenities),
    images,
  };
}

function mapTransportSetup(raw: unknown): ProviderTransportSetup | undefined {
  const data = asRecord(raw);
  if (
    !data ||
    (!data.businessName &&
      !stringList(data.operatingCities).length &&
      !data.description &&
      !data.registrationNumber &&
      !data.vehicleImageFront &&
      !data.vehicleImageBack &&
      !data.vehicleModel &&
      !data.driverName)
  ) {
    return undefined;
  }
  const ownership = String(data.ownershipType ?? 'owned');
  const pricing = String(data.pricingMethod ?? 'per_seat');
  const vehicleClassRaw = String(
    data.vehicleClass ?? (Array.isArray(data.vehicleTypes) ? data.vehicleTypes[0] : '') ?? ''
  );
  const vehicleClass = (['car', 'jeep', 'suv', 'van', 'mini_bus', 'bus', 'minibus'].includes(vehicleClassRaw)
    ? vehicleClassRaw === 'minibus'
      ? 'mini_bus'
      : vehicleClassRaw
    : undefined) as ProviderTransportSetup['vehicleClass'];
  const insurance = String(data.hasInsurance ?? '').toLowerCase();
  return {
    businessName: String(data.businessName ?? ''),
    vehicleTypes: stringList(data.vehicleTypes).length
      ? stringList(data.vehicleTypes)
      : vehicleClass
        ? [vehicleClass]
        : [],
    vehicleCount: Number(data.vehicleCount ?? 0),
    ownershipType: ownership === 'leased' || ownership === 'mixed' ? ownership : 'owned',
    operatingCities: stringList(data.operatingCities),
    operatingRoutes: stringList(data.operatingRoutes),
    pickupLocations: stringList(data.pickupLocations),
    dropoffLocations: stringList(data.dropoffLocations),
    description: String(data.description ?? ''),
    pricingMethod: pricing === 'per_vehicle' || pricing === 'negotiable' ? pricing : 'per_seat',
    priceAmount: Number.isFinite(Number(data.priceAmount)) && Number(data.priceAmount) > 0 ? Number(data.priceAmount) : undefined,
    pricePercent:
      data.pricePercent == null || data.pricePercent === ''
        ? undefined
        : Number(data.pricePercent),
    vehicleClass,
    ownerName: data.ownerName ? String(data.ownerName) : undefined,
    vehicleModel: data.vehicleModel ? String(data.vehicleModel) : undefined,
    vehicleMakeYear: data.vehicleMakeYear ? String(data.vehicleMakeYear) : undefined,
    engineNumber: data.engineNumber ? String(data.engineNumber) : undefined,
    registrationNumber: data.registrationNumber ? String(data.registrationNumber) : undefined,
    driverName: data.driverName ? String(data.driverName) : undefined,
    driverPhone: data.driverPhone ? String(data.driverPhone) : undefined,
    driverEmail: data.driverEmail ? String(data.driverEmail) : undefined,
    driverPermanentAddress: data.driverPermanentAddress ? String(data.driverPermanentAddress) : undefined,
    driverCnic: data.driverCnic ? String(data.driverCnic) : undefined,
    hasInsurance: insurance === 'yes' || insurance === 'no' ? insurance : undefined,
    insuranceCompany: data.insuranceCompany ? String(data.insuranceCompany) : undefined,
    insuranceNumber: data.insuranceNumber ? String(data.insuranceNumber) : undefined,
    insuranceYear: data.insuranceYear ? String(data.insuranceYear) : undefined,
    driverExperienceYears: data.driverExperienceYears ? String(data.driverExperienceYears) : undefined,
    driverLicenseNumber: data.driverLicenseNumber ? String(data.driverLicenseNumber) : undefined,
    vehicleImageFront: mediaUrl(data.vehicleImageFront) || (data.vehicleImageFront ? String(data.vehicleImageFront) : undefined),
    vehicleImageBack: mediaUrl(data.vehicleImageBack) || (data.vehicleImageBack ? String(data.vehicleImageBack) : undefined),
    driverPhoto: mediaUrl(data.driverPhoto) || (data.driverPhoto ? String(data.driverPhoto) : undefined),
    driverEmergencyContact: data.driverEmergencyContact ? String(data.driverEmergencyContact) : undefined,
  };
}

function mapTourSetup(raw: unknown): ProviderTourSetup | undefined {
  const data = asRecord(raw);
  if (
    !data ||
    (!data.tourName &&
      !data.destination &&
      !data.companyName &&
      !data.gender &&
      !data.experienceHistory &&
      !data.yearsExperience)
  ) {
    return undefined;
  }
  const genderRaw = String(data.gender ?? '').toLowerCase();
  const gender =
    genderRaw === 'male' || genderRaw === 'female' ? (genderRaw as 'male' | 'female') : undefined;
  return {
    companyName: String(data.companyName ?? ''),
    tourName: String(data.tourName ?? ''),
    description: String(data.description ?? data.experienceHistory ?? ''),
    destination: String(data.destination ?? ''),
    duration: String(data.duration ?? ''),
    departureLocation: String(data.departureLocation ?? ''),
    pickupLocations: stringList(data.pickupLocations),
    price: Number(data.price ?? data.dailyHireRate ?? 0),
    maxParticipants: Number(data.maxParticipants ?? 0),
    included: stringList(data.included),
    excluded: stringList(data.excluded),
    images: mediaUrls(data.images).length ? mediaUrls(data.images) : stringList(data.images),
    gender,
    regionalLanguages: stringList(data.regionalLanguages),
    internationalLanguages: stringList(data.internationalLanguages),
    yearsExperience:
      data.yearsExperience != null && Number.isFinite(Number(data.yearsExperience))
        ? Number(data.yearsExperience)
        : undefined,
    experienceHistory: data.experienceHistory
      ? String(data.experienceHistory)
      : data.description
        ? String(data.description)
        : undefined,
    specialties: stringList(data.specialties),
    operatingAreas: stringList(data.operatingAreas),
    certifications: stringList(data.certifications),
    dailyHireRate:
      data.dailyHireRate != null && Number.isFinite(Number(data.dailyHireRate))
        ? Number(data.dailyHireRate)
        : data.price != null && Number.isFinite(Number(data.price))
          ? Number(data.price)
          : undefined,
  };
}

function mapGuideLanguage(raw: unknown): GuideLanguage | null {
  const data = asRecord(raw);
  if (!data?.language) return null;
  const prof = String(data.proficiency ?? 'basic');
  const proficiency =
    prof === 'conversational' || prof === 'fluent' || prof === 'native' ? prof : 'basic';
  return { language: String(data.language), proficiency };
}

function mapGuideDocument(raw: unknown): GuideDocument | null {
  const data = asRecord(raw);
  if (!data?.id || !data.fileUrl) return null;
  return {
    id: String(data.id),
    type: (String(data.type ?? 'other') as GuideDocument['type']) || 'other',
    label: data.label ? String(data.label) : undefined,
    number: data.number ? String(data.number) : undefined,
    issueDate: data.issueDate ? String(data.issueDate) : undefined,
    expiryDate: data.expiryDate ? String(data.expiryDate) : undefined,
    fileUrl: mediaUrl(data.fileUrl) ?? String(data.fileUrl),
    status: (String(data.status ?? 'pending') as GuideDocument['status']) || 'pending',
    rejectionReason: data.rejectionReason ? String(data.rejectionReason) : undefined,
  };
}

function mapGuidePhoto(raw: unknown): GuidePhoto | null {
  const data = asRecord(raw);
  if (!data?.id || !data.url) return null;
  return {
    id: String(data.id),
    url: mediaUrl(data.url) ?? String(data.url),
    category: (String(data.category ?? 'other') as GuidePhoto['category']) || 'other',
    caption: data.caption ? String(data.caption) : undefined,
  };
}

function mapGuideOfferedService(raw: unknown): GuideOfferedService | null {
  const data = asRecord(raw);
  if (!data?.id || !data.name) return null;
  return {
    id: String(data.id),
    name: String(data.name),
    category: (String(data.category ?? 'local') as GuideOfferedService['category']) || 'local',
    description: String(data.description ?? ''),
    durationLabel: String(data.durationLabel ?? ''),
    durationHours: data.durationHours != null ? Number(data.durationHours) : undefined,
    price: Number(data.price ?? 0),
    pricingType: (String(data.pricingType ?? 'per_day') as GuideOfferedService['pricingType']) || 'per_day',
    currency: String(data.currency ?? 'PKR'),
    minGuests: Number(data.minGuests ?? 1),
    maxGuests: Number(data.maxGuests ?? 10),
    included: stringList(data.included),
    excluded: stringList(data.excluded),
    meetingPoint: data.meetingPoint ? String(data.meetingPoint) : undefined,
    availableLocations: stringList(data.availableLocations),
    notes: data.notes ? String(data.notes) : undefined,
    active: data.active !== false,
  };
}

function mapGuideAvailability(raw: unknown): GuideAvailability | undefined {
  const data = asRecord(raw);
  if (!data) return undefined;
  const weeklyRaw = asArray<unknown>(data.weekly);
  const weekly =
    weeklyRaw.length > 0
      ? weeklyRaw
          .map((row) => {
            const d = asRecord(row);
            if (!d?.day) return null;
            return {
              day: String(d.day) as GuideAvailability['weekly'][0]['day'],
              enabled: Boolean(d.enabled),
              startTime: String(d.startTime ?? '09:00'),
              endTime: String(d.endTime ?? '18:00'),
            };
          })
          .filter(Boolean)
      : DEFAULT_GUIDE_WEEKLY.map((row) => ({ ...row }));
  return {
    weekly: weekly as GuideAvailability['weekly'],
    minBookingHours: data.minBookingHours != null ? Number(data.minBookingHours) : undefined,
    maxBookingHours: data.maxBookingHours != null ? Number(data.maxBookingHours) : undefined,
    advanceBookingHours:
      data.advanceBookingHours != null ? Number(data.advanceBookingHours) : undefined,
    availableFrom: data.availableFrom ? String(data.availableFrom) : undefined,
    availableUntil: data.availableUntil ? String(data.availableUntil) : undefined,
    blockedDates: stringList(data.blockedDates),
  };
}

export function mapGuideDetailsFromApi(raw: unknown): GuideDetails | undefined {
  const data = asRecord(raw);
  if (!data) return undefined;
  const hasContent = Object.keys(data).some((key) => {
    const value = data[key];
    if (Array.isArray(value)) return value.length > 0;
    if (value != null && typeof value === 'object') return Object.keys(value as object).length > 0;
    return value != null && String(value).trim() !== '';
  });
  if (!hasContent) return undefined;

  const genderRaw = String(data.gender ?? '').toLowerCase();
  const gender =
    genderRaw === 'male' || genderRaw === 'female' || genderRaw === 'other'
      ? (genderRaw as GuideDetails['gender'])
      : undefined;

  return {
    profileStatus: data.profileStatus as GuideDetails['profileStatus'],
    changesRequestedNote: data.changesRequestedNote ? String(data.changesRequestedNote) : undefined,
    fullName: data.fullName ? String(data.fullName) : undefined,
    profilePhoto: mediaUrl(data.profilePhoto) ?? (data.profilePhoto ? String(data.profilePhoto) : undefined),
    gender,
    dateOfBirth: data.dateOfBirth ? String(data.dateOfBirth) : undefined,
    age: data.age != null ? Number(data.age) : undefined,
    phone: data.phone ? String(data.phone) : undefined,
    whatsapp: data.whatsapp ? String(data.whatsapp) : undefined,
    email: data.email ? String(data.email) : undefined,
    cnicNumber: data.cnicNumber ? String(data.cnicNumber) : undefined,
    cnicFrontUrl: mediaUrl(data.cnicFrontUrl) ?? (data.cnicFrontUrl ? String(data.cnicFrontUrl) : undefined),
    cnicBackUrl: mediaUrl(data.cnicBackUrl) ?? (data.cnicBackUrl ? String(data.cnicBackUrl) : undefined),
    country: data.country ? String(data.country) : undefined,
    province: data.province ? String(data.province) : undefined,
    district: data.district ? String(data.district) : undefined,
    city: data.city ? String(data.city) : undefined,
    currentLocation: data.currentLocation ? String(data.currentLocation) : undefined,
    areasCovered: stringList(data.areasCovered),
    pickupLocations: stringList(data.pickupLocations),
    guideTypes: stringList(data.guideTypes) as GuideDetails['guideTypes'],
    customGuideType: data.customGuideType ? String(data.customGuideType) : undefined,
    yearsExperience:
      data.yearsExperience != null ? Number(data.yearsExperience) : undefined,
    shortBio: data.shortBio ? String(data.shortBio) : undefined,
    detailedDescription: data.detailedDescription ? String(data.detailedDescription) : undefined,
    specialSkills: stringList(data.specialSkills),
    areasOfExpertise: stringList(data.areasOfExpertise),
    certifications: stringList(data.certifications),
    training: stringList(data.training),
    awards: stringList(data.awards),
    languages: asArray<unknown>(data.languages)
      .map(mapGuideLanguage)
      .filter(Boolean) as GuideLanguage[],
    documents: asArray<unknown>(data.documents)
      .map(mapGuideDocument)
      .filter(Boolean) as GuideDocument[],
    photos: asArray<unknown>(data.photos)
      .map(mapGuidePhoto)
      .filter(Boolean) as GuidePhoto[],
    services: asArray<unknown>(data.services)
      .map(mapGuideOfferedService)
      .filter(Boolean) as GuideOfferedService[],
    availability: mapGuideAvailability(data.availability),
    dailyHireRate:
      data.dailyHireRate != null && Number.isFinite(Number(data.dailyHireRate))
        ? Number(data.dailyHireRate)
        : undefined,
  };
}

function mapRestaurantSetup(raw: unknown): ProviderRestaurantSetup | undefined {
  const data = asRecord(raw);
  if (!data || (!data.restaurantName && !data.city && !data.name)) return undefined;
  const offersRaw = Array.isArray(data.offers) ? data.offers : [];
  const offers: ProviderRestaurantOffer[] = offersRaw.map((item, index) => {
    const row = asRecord(item) ?? {};
    const typeRaw = String(row.type ?? 'offer');
    const type: ProviderRestaurantOffer['type'] =
      typeRaw === 'sale' || typeRaw === 'discount' ? typeRaw : 'offer';
    return {
      id: String(row.id ?? `offer-${index + 1}`),
      title: String(row.title ?? ''),
      type,
      discountPercent:
        row.discountPercent != null ? Number(row.discountPercent) : undefined,
      description: row.description ? String(row.description) : undefined,
      active: row.active !== false,
    };
  }).filter((o) => o.title);

  return {
    restaurantName: String(data.restaurantName ?? data.name ?? ''),
    cuisineTypes: stringList(data.cuisineTypes ?? data.cuisine),
    menuVariety: stringList(data.menuVariety),
    city: String(data.city ?? ''),
    address: String(data.address ?? ''),
    phone: String(data.phone ?? ''),
    description: String(data.description ?? ''),
    images: mediaUrls(data.images).length ? mediaUrls(data.images) : stringList(data.images),
    offers,
    hours: data.hours ? String(data.hours) : undefined,
    website: data.website ? String(data.website) : undefined,
    latitude: data.latitude != null ? Number(data.latitude) : undefined,
    longitude: data.longitude != null ? Number(data.longitude) : undefined,
  };
}

export function idOf(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    const obj = value as AnyRecord;
    if (obj.id != null) return String(obj.id);
    if (obj._id != null) return String(obj._id);
  }
  return '';
}

/** Human-readable place label — never show raw Mongo ObjectIds in the UI. */
export function placeLabel(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value).trim();
    if (/^[a-f\d]{24}$/i.test(text)) return '';
    return text;
  }
  if (typeof value === 'object') {
    const obj = value as AnyRecord;
    const name = String(
      obj.name ?? obj.address ?? obj.placeName ?? obj.formattedAddress ?? ''
    ).trim();
    if (name && !/^[a-f\d]{24}$/i.test(name)) return name;
    const structured = obj.structuredAddress;
    if (structured && typeof structured === 'object') {
      const addr = structured as AnyRecord;
      const formatted = String(
        addr.formattedAddress ?? addr.city ?? addr.area ?? addr.street ?? ''
      ).trim();
      if (formatted) return formatted;
    }
  }
  return '';
}

export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as AnyRecord).items)) {
    return (value as { items: T[] }).items;
  }
  return [];
}

export function mapUser(raw: AnyRecord): User {
  return {
    id: idOf(raw),
    name: String(raw.name ?? ''),
    email: String(raw.email ?? ''),
    phone: String(raw.phone ?? ''),
    avatar: mediaUrl(raw.avatar),
    role: (raw.role as UserRole) ?? 'customer',
    providerId: raw.providerId ? idOf(raw.providerId) : undefined,
    providerStatus: raw.providerStatus as ProviderAccountStatus | undefined,
    savedTripIds: Array.isArray(raw.savedTripIds) ? raw.savedTripIds.map(String) : [],
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

function mapAgency(provider: AnyRecord | undefined, fallbackId = ''): Agency {
  const p = provider ?? {};
  const services = Array.isArray(p.services)
    ? p.services.map((item) => String(item)).filter(Boolean)
    : [];
  const yearsExperience = Number(p.yearsExperience ?? 0);
  const userId = idOf(p.userId) || (typeof p.userId === 'string' ? p.userId : '');
  const city = String(p.city ?? '').trim();
  const formattedAddress =
    p.structuredAddress && typeof p.structuredAddress === 'object'
      ? String((p.structuredAddress as AnyRecord).formattedAddress ?? '')
      : '';
  const address = String(p.address ?? formattedAddress).trim();
  const website = String(p.website ?? '').trim();
  const transport =
    p.transportDetails && typeof p.transportDetails === 'object'
      ? (p.transportDetails as AnyRecord)
      : undefined;
  const description =
    String(p.description ?? '').trim() ||
    String(transport?.description ?? '').trim();

  return {
    id: idOf(p) || fallbackId,
    name: String(p.businessName ?? p.name ?? 'Provider'),
    logo: mediaUrl(p.logo) ?? '',
    rating: Number(p.rating ?? 0),
    reviewCount: Number(p.totalReviews ?? p.reviewCount ?? 0),
    phone: String(p.phone ?? ''),
    email: String(p.email ?? ''),
    description,
    verified: String(p.verificationStatus ?? '') === 'approved',
    userId: userId || undefined,
    city: city || undefined,
    address: address || undefined,
    website: website || undefined,
    services: services.length ? services : undefined,
    yearsExperience: yearsExperience > 0 ? yearsExperience : undefined,
  };
}

function mapVehicleType(type: unknown): VehicleType {
  const value = String(type ?? 'van');
  if (value === 'bus' || value === 'car' || value === 'tour' || value === 'private') return value;
  if (value === 'minibus' || value === 'tourVehicle') return 'van';
  return 'van';
}

function coordsOf(lat: unknown, lng: unknown): Coordinates | undefined {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  if (latitude === 0 && longitude === 0) return undefined;
  return { latitude, longitude };
}

function parseDurationMinutes(departureTime?: string, arrivalTime?: string): number {
  if (!departureTime || !arrivalTime) return 0;
  const [dh, dm] = departureTime.split(':').map(Number);
  const [ah, am] = arrivalTime.split(':').map(Number);
  if ([dh, dm, ah, am].some((n) => Number.isNaN(n))) return 0;
  let mins = ah * 60 + am - (dh * 60 + dm);
  if (mins < 0) mins += 24 * 60;
  return mins;
}

export function mapPickupPoint(raw: AnyRecord, tripId?: string): PickupPoint {
  const name = String(raw.name ?? '');
  const address = String(raw.address ?? '');
  return {
    id: idOf(raw),
    name,
    address,
    time: String(raw.time ?? raw.landmark ?? ''),
    distanceKm: Number(raw.distanceKm ?? 0),
    coordinates: resolveCoordinates(
      Number(raw.latitude ?? 0),
      Number(raw.longitude ?? 0),
      name,
      address
    ),
    tripId,
  };
}

export function mapSeatLayout(trip: AnyRecord): SeatLayout | null {
  const seatsRaw = Array.isArray(trip.seatLayout) ? trip.seatLayout : [];
  if (!seatsRaw.length) return null;

  const seats: Seat[] = seatsRaw.map((seat: AnyRecord) => {
    const backendStatus = String(seat.status ?? 'available');
    let status: SeatStatus = 'available';
    if (backendStatus === 'booked' || backendStatus === 'blocked') status = 'occupied';
    else if (backendStatus === 'reserved') status = 'reserved';

    return {
      id: String(seat.seatNumber ?? `${seat.row}-${seat.column}`),
      label: String(seat.seatNumber ?? ''),
      row: Number(seat.row ?? 1),
      column: Number(seat.column ?? 1),
      status,
      price: Number(trip.price ?? 0),
      isAisle: Number(seat.column) === 2,
    };
  });

  const rows = Math.max(...seats.map((s) => s.row), 1);
  const columns = Math.max(...seats.map((s) => s.column), 1);

  return {
    rows,
    columns,
    aisleAfterColumn: 2,
    seats,
  };
}

export function mapTrip(raw: AnyRecord): TripWithDetails {
  const provider =
    raw.providerId && typeof raw.providerId === 'object'
      ? (raw.providerId as AnyRecord)
      : undefined;
  const vehicle =
    raw.vehicleId && typeof raw.vehicleId === 'object'
      ? (raw.vehicleId as AnyRecord)
      : undefined;

  const pickupLocations = asArray<AnyRecord>(raw.pickupPoints)
    .filter((p) => typeof p === 'object')
    .map((p) => mapPickupPoint(p, idOf(raw)));

  const trip: Trip = {
    id: idOf(raw),
    agencyId: idOf(raw.providerId),
    vehicleId: idOf(raw.vehicleId),
    from: String(raw.origin ?? raw.from ?? ''),
    to: String(raw.destination ?? raw.to ?? ''),
    departureTime: String(raw.departureTime ?? ''),
    arrivalTime: String(raw.arrivalTime ?? ''),
    durationMinutes: parseDurationMinutes(
      String(raw.departureTime ?? ''),
      String(raw.arrivalTime ?? '')
    ),
    date: String(raw.departureDate ?? raw.date ?? ''),
    price: Number(raw.price ?? 0),
    currency: 'PKR',
    availableSeats: Number(raw.availableSeats ?? 0),
    totalSeats: Number(raw.totalSeats ?? 0),
    rating: Number(provider?.rating ?? raw.rating ?? 0),
    pickupPointIds: asArray<unknown>(raw.pickupPoints).map((p) => idOf(p)),
    dropoffPointIds: asArray<unknown>(raw.dropoffPoints).map((p) => idOf(p)),
    stops: [],
    amenities: (Array.isArray(raw.amenities) ? raw.amenities : [])
      .map((item) => String(item).trim())
      .filter(Boolean) as Amenity[],
    image: mediaUrl(
      (Array.isArray(vehicle?.images) && vehicle?.images[0]) ||
        (Array.isArray(raw.images) && (raw.images as string[])[0]) ||
        ''
    ) ?? '',
    popular: Boolean(raw.popular),
    recommended: Boolean(raw.recommended) || Number(provider?.rating ?? 0) >= 4.5,
    journeyType: String(raw.journeyType ?? 'one_way') === 'round_trip' ? 'round_trip' : 'one_way',
    returnDate: raw.returnDate ? String(raw.returnDate) : undefined,
    returnTime: raw.returnTime ? String(raw.returnTime) : undefined,
    bookingMode: String(raw.bookingMode ?? 'seat') === 'vehicle' ? 'vehicle' : 'seat',
    description: String(raw.description ?? '').trim() || undefined,
    status: String(raw.status ?? '').trim() || undefined,
    originCoordinates: coordsOf(raw.originLat, raw.originLng),
    destinationCoordinates: coordsOf(raw.destinationLat, raw.destinationLng),
  };

  const vehicleImages = mediaUrls([
    ...(Array.isArray(vehicle?.images) ? vehicle.images : []),
    (provider?.transportDetails as AnyRecord | undefined)?.vehicleImageFront,
    (provider?.transportDetails as AnyRecord | undefined)?.vehicleImageBack,
    (provider?.transportDetails as AnyRecord | undefined)?.driverPhoto,
    trip.image || undefined,
  ]);

  return {
    ...trip,
    agency: mapAgency(provider, trip.agencyId),
    vehicleType: mapVehicleType(vehicle?.type),
    vehicleName: String(vehicle?.name ?? 'Vehicle'),
    vehicleBrand: String(vehicle?.brand ?? '').trim() || undefined,
    vehicleModel: String(vehicle?.vehicleModel ?? '').trim() || undefined,
    vehiclePlate: vehicle?.registrationNumber
      ? String(vehicle.registrationNumber)
      : undefined,
    vehicleCapacity: Number(vehicle?.seatCount ?? raw.totalSeats ?? 0) || undefined,
    vehicleImages,
    pickupLocations,
  };
}

export function mapFrontendBookingStatus(status: string): BookingStatus {
  if (status === 'pending' || status === 'payment_verification') return 'pending';
  if (status === 'confirmed') return 'upcoming';
  if (status === 'completed') return 'completed';
  if (status === 'cancelled' || status === 'refunded' || status === 'expired') return 'cancelled';
  return (status as BookingStatus) || 'pending';
}

export function mapPaymentMethod(method: unknown): PaymentMethod {
  const value = String(method ?? 'card');
  if (
    value === 'bankTransfer' ||
    value === 'easypaisa' ||
    value === 'jazzcash' ||
    value === 'raast'
  ) {
    return value as PaymentMethod;
  }
  if (value === 'bank_transfer') return 'bankTransfer';
  if (value === 'mobileWallet' || value === 'wallet') return 'wallet';
  if (value === 'cash' || value === 'payAtHotel') return 'cash';
  return 'card';
}

export function toBackendPaymentMethod(
  method: PaymentMethod | HotelPaymentMethod | string
):
  | 'card'
  | 'mobileWallet'
  | 'cash'
  | 'payAtHotel'
  | 'bankTransfer'
  | 'easypaisa'
  | 'jazzcash'
  | 'raast' {
  if (
    method === 'bankTransfer' ||
    method === 'easypaisa' ||
    method === 'jazzcash' ||
    method === 'raast'
  ) {
    return method;
  }
  if (method === 'bank_transfer') return 'bankTransfer';
  if (method === 'wallet') return 'mobileWallet';
  if (method === 'cash') return 'cash';
  if (method === 'payAtHotel') return 'payAtHotel';
  return 'card';
}

export function mapTransportBooking(raw: AnyRecord): Booking {
  const transport = (raw.transportBooking ?? {}) as AnyRecord;
  const passengers = asArray<AnyRecord>(transport.passengerDetails);
  const firstPassenger = passengers[0] ?? {};

  return {
    id: idOf(raw),
    bookingCode: String(raw.bookingNumber ?? raw.bookingCode ?? ''),
    tripId: idOf(transport.tripId),
    userId: idOf(raw.customerId),
    providerId: idOf(raw.providerId),
    providerUserId: raw.providerUserId ? String(raw.providerUserId) : undefined,
    date: String(raw.createdAt ?? new Date().toISOString()).slice(0, 10),
    seats: asArray<string>(transport.seats).map(String),
    pickupPointId: idOf(transport.pickupPoint),
    passengers: Math.max(1, asArray(transport.seats).length || passengers.length || 1),
    passengerDetails: {
      name: String(firstPassenger.name ?? ''),
      email: String(firstPassenger.email ?? ''),
      phone: String(firstPassenger.phone ?? ''),
    },
    paymentMethod: mapPaymentMethod(raw.paymentMethod),
    paymentStatus: (raw.paymentStatus as PaymentStatus) ?? 'pending',
    paymentId: raw.paymentId ? idOf(raw.paymentId) : undefined,
    status: mapFrontendBookingStatus(String(raw.bookingStatus ?? 'pending')),
    priceBreakdown: {
      ticketPrice: Number(raw.subtotal ?? 0),
      serviceFee: Number(raw.serviceFee ?? 0),
      discount: Number(raw.discount ?? 0),
      total: Number(raw.totalAmount ?? 0),
      currency: String(raw.currency ?? 'PKR'),
    },
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    qrPayload: String(raw.ticketQr ?? raw.bookingNumber ?? ''),
  };
}

function mapHotelType(type: unknown): HotelType {
  const value = String(type ?? 'hotel');
  if (value === 'guestHouse') return 'guest_house';
  if (value === 'resort' || value === 'lodge' || value === 'homestay' || value === 'guest_house') {
    return value as HotelType;
  }
  return 'hotel';
}

export function mapHotel(raw: AnyRecord): Hotel {
  const coords = Array.isArray((raw.location as AnyRecord | undefined)?.coordinates)
    ? ((raw.location as AnyRecord).coordinates as number[])
    : [0, 0];

  const village = String(raw.village ?? '').trim();
  const district = String(raw.district ?? '').trim();
  const city = String(raw.city ?? '').trim();
  const area = [village, district].filter(Boolean).join(', ') || String(raw.area ?? raw.address ?? '');

  return {
    id: idOf(raw),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    images: mediaUrls(raw.images),
    location: {
      city,
      area,
      address: String(raw.address ?? ''),
      latitude: Number(coords[1] ?? raw.latitude ?? 0),
      longitude: Number(coords[0] ?? raw.longitude ?? 0),
      distanceKm: Number(raw.distanceKm ?? 0),
    },
    rating: Number(raw.rating ?? 0),
    reviewCount: Number(raw.reviewCount ?? 0),
    hotelType: mapHotelType(raw.hotelType),
    amenities: (Array.isArray(raw.amenities) ? raw.amenities : []).map(String) as HotelAmenity[],
    roomIds: [],
    checkInTime: String(raw.checkInTime ?? '14:00'),
    checkOutTime: String(raw.checkOutTime ?? '12:00'),
    cancellationPolicy: String(
      raw.cancellationPolicy ?? 'Free cancellation up to 24 hours before check-in.'
    ),
    priceFrom: Number(raw.priceFrom ?? 0),
    featured: Boolean(raw.featured),
    popular: Boolean(raw.popular) || Number(raw.rating ?? 0) >= 4.5,
    isVerified: Boolean(raw.isVerified),
    freeCancellation: String(raw.cancellationPolicy ?? 'free cancellation')
      .toLowerCase()
      .includes('free cancellation'),
    breakfastIncluded: (Array.isArray(raw.amenities) ? raw.amenities : []).some((item) =>
      String(item).toLowerCase().includes('breakfast')
    ),
    phone: String(raw.phone ?? ''),
    email: String(raw.email ?? ''),
    providerId: raw.providerId ? idOf(raw.providerId) : undefined,
    managerName: String(raw.managerName ?? '').trim() || undefined,
    village: village || undefined,
    district: district || undefined,
    landline: String(raw.landline ?? '').trim() || undefined,
    yearsExperience: Number(raw.yearsExperience ?? 0) || undefined,
    restaurantAvailable: Boolean(raw.restaurantAvailable),
    googleMapsUrl: String(raw.googleMapsUrl ?? '').trim() || undefined,
    website: String(raw.website ?? '').trim() || undefined,
    businessRegistered: Boolean(raw.businessRegistered),
  };
}

export function mapHotelRoom(raw: AnyRecord): HotelRoom {
  return {
    id: idOf(raw),
    hotelId: idOf(raw.hotelId),
    name: String(raw.name ?? ''),
    images: mediaUrls(raw.images),
    bedType: String(raw.bedType ?? ''),
    capacity: Number(raw.capacity ?? 1),
    sizeSqm: Number(raw.size ?? raw.sizeSqm ?? 0),
    amenities: (Array.isArray(raw.amenities) ? raw.amenities : []).map(String) as HotelAmenity[],
    breakfastIncluded: Boolean(raw.breakfastIncluded),
    freeCancellation: String(raw.cancellationPolicy ?? '')
      .toLowerCase()
      .includes('free cancellation'),
    pricePerNight: Number(raw.pricePerNight ?? 0),
    availableRooms: Number(raw.availableRooms ?? raw.totalRooms ?? 0),
    description: String(raw.description ?? ''),
    roomType: raw.roomType ? String(raw.roomType) : undefined,
  };
}

export function mapHotelBooking(raw: AnyRecord): HotelBooking {
  const hotel = (raw.hotelBooking ?? {}) as AnyRecord;
  const guest = (hotel.guestDetails ?? {}) as AnyRecord;
  const status = mapFrontendBookingStatus(String(raw.bookingStatus ?? 'pending')) as HotelBookingStatus;

  return {
    id: idOf(raw),
    bookingCode: String(raw.bookingNumber ?? ''),
    hotelId: idOf(hotel.hotelId),
    roomId: idOf(hotel.roomId),
    userId: idOf(raw.customerId),
    providerId: idOf(raw.providerId),
    providerUserId: raw.providerUserId ? String(raw.providerUserId) : undefined,
    checkIn: String(hotel.checkIn ?? ''),
    checkOut: String(hotel.checkOut ?? ''),
    adults: Number(hotel.guests ?? hotel.adults ?? 1),
    children: Number(hotel.children ?? 0),
    rooms: Number(hotel.rooms ?? 1),
    guest: {
      name: String(guest.name ?? ''),
      email: String(guest.email ?? ''),
      phone: String(guest.phone ?? ''),
      specialRequests: guest.specialRequests ? String(guest.specialRequests) : undefined,
    },
    paymentMethod: mapPaymentMethod(raw.paymentMethod) as HotelPaymentMethod,
    paymentStatus: (raw.paymentStatus as PaymentStatus) ?? 'pending',
    paymentId: raw.paymentId ? idOf(raw.paymentId) : undefined,
    status,
    priceBreakdown: {
      pricePerNight: Number(hotel.pricePerNight ?? 0),
      nights: Number(hotel.nights ?? 1),
      rooms: Number(hotel.rooms ?? 1),
      roomSubtotal: Number(raw.subtotal ?? 0),
      tax: Number(raw.tax ?? 0),
      serviceFee: Number(raw.serviceFee ?? 0),
      discount: Number(raw.discount ?? 0),
      total: Number(raw.totalAmount ?? 0),
      currency: String(raw.currency ?? 'PKR'),
    },
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    qrPayload: String(raw.ticketQr ?? raw.bookingNumber ?? ''),
  };
}

export function mapNotification(raw: AnyRecord): AppNotification {
  const typeMap: Record<string, AppNotification['type']> = {
    bookingConfirmed: 'booking_confirmed',
    bookingPending: 'booking_pending',
    bookingRequest: 'booking_request',
    bookingReminder: 'booking_reminder',
    bookingCancelled: 'booking_cancelled',
    tripReminder: 'trip_reminder',
    pickupReminder: 'pickup_reminder',
    paymentReceived: 'payment_received',
    paymentFailed: 'payment_failed',
    paymentExpired: 'payment_expired',
    newOffer: 'new_offer',
    newReview: 'new_review',
    newMessage: 'new_message',
    vehicle: 'vehicle',
    cnicVerified: 'cnic_verified',
    cnicFailed: 'cnic_failed',
    system: 'system',
    // already-snake variants
    booking_confirmed: 'booking_confirmed',
    booking_cancelled: 'booking_cancelled',
    booking_pending: 'booking_pending',
    booking_request: 'booking_request',
    booking_reminder: 'booking_reminder',
    trip_reminder: 'trip_reminder',
    pickup_reminder: 'pickup_reminder',
    payment_received: 'payment_received',
    payment_failed: 'payment_failed',
    payment_expired: 'payment_expired',
    new_offer: 'new_offer',
    new_message: 'new_message',
    new_review: 'new_review',
  };
  const backendType = String(raw.type ?? '');
  const data = raw.data && typeof raw.data === 'object' ? (raw.data as AnyRecord) : {};
  const otherUserId = data.otherUserId
    ? String(data.otherUserId)
    : data.senderId
      ? String(data.senderId)
      : undefined;
  return {
    id: idOf(raw),
    type: typeMap[backendType] ?? 'system',
    title: String(raw.title ?? ''),
    message: String(raw.message ?? ''),
    read: Boolean(raw.isRead ?? raw.read),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    bookingId: data.bookingId ? String(data.bookingId) : undefined,
    conversationId: data.conversationId ? String(data.conversationId) : undefined,
    offerId: data.offerId ? String(data.offerId) : undefined,
    otherUserId,
  };
}

function mapBackendServiceToFrontend(
  services: unknown,
  providerType: unknown,
  raw?: AnyRecord
): ProviderServiceType[] {
  const types = Array.isArray(providerType) ? providerType.map(String) : [];

  // Prefer explicit providerType (backend source of truth for catalog role)
  if (types.includes('guestHouse') || types.includes('lodge')) return ['guestHouse'];
  if (types.includes('travelAgency')) return ['travelAgency'];
  if (types.includes('tourOperator')) return ['tour'];
  if (types.includes('travelGuide')) return ['travelGuide'];
  if (types.includes('carRental')) return ['carRental'];
  if (types.includes('restaurant')) return ['restaurant'];
  if (types.includes('hotel') || types.includes('resort')) return ['hotel'];
  if (types.includes('vanOperator') || types.includes('busOperator')) return ['transport'];

  const mapped = (Array.isArray(services) ? services : [])
    .map((item) => normalizeServiceKey(String(item)))
    .filter((item): item is ProviderServiceType => Boolean(item));
  if (mapped.length) return mapped.slice(0, 1);

  // Infer from completed service detail blobs (covers incomplete legacy profiles)
  if (raw?.hotelDetails && typeof raw.hotelDetails === 'object') return ['hotel'];
  if (raw?.transportDetails && typeof raw.transportDetails === 'object') return ['transport'];
  if (raw?.guideDetails && typeof raw.guideDetails === 'object') return ['travelGuide'];
  if (raw?.tourDetails && typeof raw.tourDetails === 'object') return ['tour'];
  if (raw?.restaurantDetails && typeof raw.restaurantDetails === 'object') return ['restaurant'];

  return [];
}

export function mapProvider(raw: AnyRecord): Provider {
  const services = mapBackendServiceToFrontend(raw.services, raw.providerType, raw);
  const coords = (raw.location as AnyRecord | undefined)?.coordinates as number[] | undefined;
  const longitude = Array.isArray(coords) ? Number(coords[0]) : undefined;
  const latitude = Array.isArray(coords) ? Number(coords[1]) : undefined;
  const structured = raw.structuredAddress as AnyRecord | undefined;

  return {
    id: idOf(raw),
    userId: idOf(raw.userId),
    businessName: String(raw.businessName ?? ''),
    ownerName: String(raw.ownerName ?? ''),
    email: String(raw.email ?? ''),
    phone: String(raw.phone ?? ''),
    description: String(raw.description ?? ''),
    address: String(raw.address ?? ''),
    city: String(raw.city ?? ''),
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
    locationUpdatedAt: raw.locationUpdatedAt ? String(raw.locationUpdatedAt) : undefined,
    structuredAddress: structured
      ? {
          street: structured.street ? String(structured.street) : undefined,
          area: structured.area ? String(structured.area) : undefined,
          city: structured.city ? String(structured.city) : undefined,
          region: structured.region ? String(structured.region) : undefined,
          postalCode: structured.postalCode ? String(structured.postalCode) : undefined,
          country: structured.country ? String(structured.country) : undefined,
          formattedAddress: structured.formattedAddress
            ? String(structured.formattedAddress)
            : undefined,
        }
      : undefined,
    logo: mediaUrl(raw.logo),
    services: services.length ? services : [],
    verificationStatus: (raw.verificationStatus as Provider['verificationStatus']) ?? 'pending',
    rating: Number(raw.rating ?? 0),
    reviewCount: Number(raw.totalReviews ?? raw.reviewCount ?? 0),
    yearsExperience: Number(raw.yearsExperience ?? 0),
    website: raw.website ? String(raw.website) : undefined,
    socialMedia: raw.socialMedia ? String(raw.socialMedia) : undefined,
    transport: mapTransportSetup(raw.transportDetails ?? raw.transport),
    onboardingProgress: raw.onboardingProgress as Provider['onboardingProgress'],
    identityVerification: raw.identityVerification as Provider['identityVerification'],
    hotel: mapHotelSetup(raw.hotelDetails ?? raw.hotel),
    tour: mapTourSetup(raw.tourDetails ?? raw.tour),
    guideDetails: mapGuideDetailsFromApi(raw.guideDetails),
    restaurant: mapRestaurantSetup(raw.restaurantDetails ?? raw.restaurant),
    galleryImages: mediaUrls(raw.galleryImages).length
      ? mediaUrls(raw.galleryImages)
      : undefined,
    documents: [],
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

export function mapProviderVehicle(raw: AnyRecord): ProviderVehicle {
  const typeRaw = String(raw.type ?? 'van').toLowerCase();
  const type: ProviderVehicle['type'] =
    typeRaw === 'bus' ||
    typeRaw === 'car' ||
    typeRaw === 'minibus' ||
    typeRaw === 'suv' ||
    typeRaw === 'other'
      ? typeRaw
      : typeRaw === 'mini_bus' || typeRaw === 'jeep'
        ? typeRaw === 'jeep'
          ? 'suv'
          : 'minibus'
        : 'van';

  return {
    id: idOf(raw),
    providerId: idOf(raw.providerId),
    name: String(raw.name ?? ''),
    type,
    model: String(raw.vehicleModel ?? raw.model ?? ''),
    verificationDetails: raw.verificationDetails as ProviderVehicle['verificationDetails'],
    registrationCompletedAt: raw.registrationCompletedAt ? String(raw.registrationCompletedAt) : undefined,
    year: Number(raw.year ?? new Date().getFullYear()),
    registrationNumber: String(raw.registrationNumber ?? ''),
    totalSeats: Number(raw.seatCount ?? raw.totalSeats ?? 0),
    amenities: Array.isArray(raw.amenities) ? raw.amenities.map(String) : [],
    images: mediaUrls(raw.images),
    active: String(raw.status ?? 'pending') === 'active',
    status: (['pending', 'active', 'rejected', 'suspended'].includes(String(raw.status))
      ? String(raw.status)
      : 'pending') as ProviderVehicle['status'],
    rejectionReason: raw.rejectionReason ? String(raw.rejectionReason) : undefined,
  };
}

export function mapProviderTrip(raw: AnyRecord): ProviderTrip {
  const statusRaw = String(raw.status ?? 'scheduled');
  let status: ProviderTrip['status'] = 'upcoming';
  if (statusRaw === 'completed') status = 'completed';
  else if (statusRaw === 'cancelled') status = 'cancelled';
  else if (statusRaw === 'boarding' || statusRaw === 'departed' || statusRaw === 'inTransit') {
    status = 'active';
  }

  return {
    id: idOf(raw),
    providerId: idOf(raw.providerId),
    origin: String(raw.origin ?? raw.from ?? ''),
    destination: String(raw.destination ?? raw.to ?? ''),
    departureDate: String(raw.departureDate ?? raw.date ?? ''),
    departureTime: String(raw.departureTime ?? ''),
    arrivalTime: String(raw.arrivalTime ?? ''),
    vehicleId: idOf(raw.vehicleId),
    pickupPoints: asArray<unknown>(raw.pickupPoints)
      .map((p) => placeLabel(p))
      .filter(Boolean),
    dropoffPoints: asArray<unknown>(raw.dropoffPoints)
      .map((p) => placeLabel(p))
      .filter(Boolean),
    price: Number(raw.price ?? 0),
    totalSeats: Number(raw.totalSeats ?? 0),
    bookedSeats: Number(raw.bookedSeats ?? 0),
    amenities: Array.isArray(raw.amenities) ? raw.amenities.map(String) : [],
    description: String(raw.description ?? ''),
    status,
    journeyType: String(raw.journeyType ?? 'one_way') === 'round_trip' ? 'round_trip' : 'one_way',
    returnDate: raw.returnDate ? String(raw.returnDate) : undefined,
    returnTime: raw.returnTime ? String(raw.returnTime) : undefined,
    bookingMode: String(raw.bookingMode ?? 'seat') === 'vehicle' ? 'vehicle' : 'seat',
  };
}

export function mapProviderRoute(raw: AnyRecord): ProviderRoute {
  const originPlace = raw.origin;
  const destPlace = raw.destination;
  const originName =
    typeof originPlace === 'object' && originPlace
      ? String((originPlace as AnyRecord).name ?? '')
      : String(originPlace ?? raw.from ?? '');
  const destinationName =
    typeof destPlace === 'object' && destPlace
      ? String((destPlace as AnyRecord).name ?? '')
      : String(destPlace ?? raw.to ?? '');
  const originCoords =
    typeof originPlace === 'object' && originPlace
      ? (originPlace as AnyRecord)
      : undefined;
  const destCoords =
    typeof destPlace === 'object' && destPlace ? (destPlace as AnyRecord) : undefined;

  return {
    id: idOf(raw),
    providerId: idOf(raw.providerId),
    origin: originName,
    destination: destinationName,
    stops: Array.isArray(raw.stops) ? raw.stops.map(String) : [],
    pickupPoints: asArray<unknown>(raw.pickupPoints)
      .map((p) => placeLabel(p) || (typeof p === 'string' && !/^[a-f\d]{24}$/i.test(p) ? p : ''))
      .filter(Boolean),
    dropoffPoints: asArray<unknown>(raw.dropoffPoints)
      .map((p) => placeLabel(p) || (typeof p === 'string' && !/^[a-f\d]{24}$/i.test(p) ? p : ''))
      .filter(Boolean),
    durationHours: Number(raw.estimatedDuration ?? raw.durationHours ?? Number(raw.durationMinutes ?? 0) / 60),
    distanceKm: Number(raw.distance ?? raw.distanceKm ?? 0),
    originLatitude: originCoords ? Number(originCoords.latitude ?? 0) : undefined,
    originLongitude: originCoords ? Number(originCoords.longitude ?? 0) : undefined,
    destinationLatitude: destCoords ? Number(destCoords.latitude ?? 0) : undefined,
    destinationLongitude: destCoords ? Number(destCoords.longitude ?? 0) : undefined,
  };
}

export function mapProviderRoom(raw: AnyRecord): ProviderRoom {
  const roomTypeRaw = String(raw.roomType ?? 'double');
  const roomType: ProviderRoom['roomType'] =
    roomTypeRaw === 'single' ||
    roomTypeRaw === 'twin' ||
    roomTypeRaw === 'deluxe' ||
    roomTypeRaw === 'suite' ||
    roomTypeRaw === 'family'
      ? roomTypeRaw
      : 'double';

  return {
    id: idOf(raw),
    providerId: idOf(raw.providerId),
    name: String(raw.name ?? ''),
    roomType,
    capacity: Number(raw.capacity ?? 1),
    bedType: String(raw.bedType ?? ''),
    sizeSqm: Number(raw.size ?? raw.sizeSqm ?? 0),
    pricePerNight: Number(raw.pricePerNight ?? 0),
    quantity: Number(raw.totalRooms ?? raw.quantity ?? 1),
    amenities: Array.isArray(raw.amenities) ? raw.amenities.map(String) : [],
    breakfastIncluded: Boolean(raw.breakfastIncluded),
    freeCancellation: String(raw.cancellationPolicy ?? '')
      .toLowerCase()
      .includes('free'),
    images: mediaUrls(raw.images),
    available: String(raw.status ?? 'active') === 'active',
    availableCount:
      raw.availableRooms != null || raw.availableCount != null
        ? Number(raw.availableRooms ?? raw.availableCount)
        : undefined,
    discountPercent:
      raw.discountPercent != null && raw.discountPercent !== ''
        ? Number(raw.discountPercent)
        : undefined,
    offerNote: raw.offerNote ? String(raw.offerNote) : undefined,
  };
}

export function mapProviderBooking(raw: AnyRecord): ProviderBooking {
  const kind =
    raw.bookingType === 'hotel'
      ? 'hotel'
      : raw.bookingType === 'guide'
        ? 'guide'
        : raw.bookingType === 'package' || raw.bookingType === 'tour'
          ? 'tour'
          : 'transport';
  const transport = (raw.transportBooking ?? {}) as AnyRecord;
  const hotel = (raw.hotelBooking ?? {}) as AnyRecord;
  const pkg = (raw.packageBooking ?? {}) as AnyRecord;
  const guide = (raw.guideBooking ?? {}) as AnyRecord;
  const backendStatus = String(raw.bookingStatus ?? 'pending');
  let status: ProviderBookingStatus = 'pending';
  if (backendStatus === 'confirmed') status = 'confirmed';
  else if (backendStatus === 'completed') status = 'completed';
  else if (backendStatus === 'cancelled' || backendStatus === 'refunded') status = 'cancelled';

  const seats = (
    Array.isArray(raw.seats) ? raw.seats : Array.isArray(transport.seats) ? transport.seats : []
  ).map(String);

  const passengersRaw = Array.isArray(raw.passengerDetails)
    ? raw.passengerDetails
    : Array.isArray(transport.passengerDetails)
      ? transport.passengerDetails
      : [];

  const guestFromPkg =
    pkg.guestDetails && typeof pkg.guestDetails === 'object'
      ? (pkg.guestDetails as AnyRecord)
      : guide.guestDetails && typeof guide.guestDetails === 'object'
        ? (guide.guestDetails as AnyRecord)
        : raw.guestDetails && typeof raw.guestDetails === 'object'
          ? (raw.guestDetails as AnyRecord)
          : null;

  const passengers =
    (kind === 'tour' || kind === 'guide') && guestFromPkg
      ? [
          {
            name: String(guestFromPkg.name ?? raw.customerName ?? 'Traveler'),
            phone: guestFromPkg.phone ? String(guestFromPkg.phone) : undefined,
          },
        ]
      : passengersRaw.map((item: AnyRecord, index: number) => ({
          name: String(item.name ?? raw.customerName ?? 'Passenger'),
          phone: item.phone ? String(item.phone) : undefined,
          age: item.age != null ? Number(item.age) : undefined,
          gender: item.gender ? String(item.gender) : undefined,
          seat: seats[index],
        }));

  const packageTitle =
    String(raw.packageTitle ?? pkg.title ?? guide.serviceName ?? '').trim() ||
    (kind === 'guide' ? 'Guide hire' : 'Tour package');
  const packageDestination = String(
    raw.packageDestination ?? pkg.destination ?? guide.availableLocation ?? guide.meetingPoint ?? ''
  ).trim();

  const routeLabel =
    String(raw.routeLabel ?? '').trim() ||
    (raw.tripOrigin && raw.tripDestination
      ? `${raw.tripOrigin} → ${raw.tripDestination}`
      : '') ||
    (kind === 'tour' || kind === 'guide'
      ? [packageTitle, packageDestination].filter(Boolean).join(' · ')
      : '');

  const travelDate =
    String(raw.packageStartDate ?? pkg.startDate ?? '').trim() ||
    String(guide.date ?? '').trim() ||
    String(raw.tripDate ?? '').trim() ||
    String(hotel.checkIn ?? raw.checkIn ?? '').trim() ||
    String(raw.createdAt ?? '').slice(0, 10);

  const departureTime =
    String(raw.tripDepartureTime ?? '').trim() ||
    (guide.startTime ? String(guide.startTime) : '') ||
    (transport.departureTime ? String(transport.departureTime) : '') ||
    undefined;

  const pickup =
    String(raw.pickupName ?? '').trim() ||
    (transport.pickupPoint && !/^[a-f0-9]{24}$/i.test(String(transport.pickupPoint))
      ? String(transport.pickupPoint)
      : '') ||
    undefined;

  const dropoff = String(raw.dropoffName ?? '').trim() || undefined;

  const paymentRaw = String(raw.paymentStatus ?? 'pending');
  const knownPayment = [
    'pending',
    'unpaid',
    'payment_initiated',
    'proof_submitted',
    'under_review',
    'paid',
    'confirmed',
    'rejected',
    'disputed',
    'failed',
    'refunded',
    'refund_pending',
    'expired',
  ] as const;
  const paymentStatus = knownPayment.includes(paymentRaw as (typeof knownPayment)[number])
    ? (paymentRaw as ProviderBooking['paymentStatus'])
    : 'pending';

  const travelers =
    raw.packageTravelers != null
      ? Number(raw.packageTravelers)
      : pkg.travelers != null
        ? Number(pkg.travelers)
        : undefined;

  return {
    id: idOf(raw),
    bookingCode: String(raw.bookingNumber ?? ''),
    providerId: idOf(raw.providerId),
    customerId: idOf(raw.customerId),
    customerName: String(raw.customerName ?? guestFromPkg?.name ?? 'Customer'),
    customerPhone: String(raw.customerPhone ?? guestFromPkg?.phone ?? ''),
    customerEmail: raw.customerEmail
      ? String(raw.customerEmail)
      : guestFromPkg?.email
        ? String(guestFromPkg.email)
        : undefined,
    kind,
    tripId:
      kind === 'transport'
        ? idOf(transport.tripId ?? raw.tripId) || undefined
        : undefined,
    itineraryId:
      kind === 'tour'
        ? idOf(pkg.itineraryId ?? raw.itineraryId) || undefined
        : undefined,
    serviceLabel:
      kind === 'hotel'
        ? 'Hotel'
        : kind === 'guide'
          ? 'Guide hire'
          : kind === 'tour'
            ? 'Tour'
            : 'Transport',
    detailLabel:
      kind === 'hotel'
        ? String(raw.roomName ?? hotel.roomName ?? 'Room booking')
        : kind === 'guide'
          ? String(guide.serviceName ?? 'Guide booking')
          : kind === 'tour'
            ? packageTitle
            : routeLabel ||
              (seats.length ? `Seats ${seats.join(', ')}` : 'Transport booking'),
    date: travelDate,
    time: departureTime || undefined,
    arrivalTime: raw.tripArrivalTime ? String(raw.tripArrivalTime) : undefined,
    seatsOrRoom:
      kind === 'hotel'
        ? String(raw.roomName ?? hotel.roomName ?? hotel.roomId ?? '')
        : kind === 'guide'
          ? `${Number(guide.guests ?? 1)} guest${Number(guide.guests ?? 1) === 1 ? '' : 's'}`
          : kind === 'tour'
            ? `${travelers ?? 1} traveler${(travelers ?? 1) === 1 ? '' : 's'}`
            : seats.join(', '),
    seats,
    passengerCount: Number(
      raw.passengerCount ?? travelers ?? Math.max(seats.length, passengers.length, 1)
    ),
    passengers,
    amount: Number(raw.totalAmount ?? 0),
    subtotal: raw.subtotal != null ? Number(raw.subtotal) : undefined,
    tax: raw.tax != null ? Number(raw.tax) : undefined,
    serviceFee: raw.serviceFee != null ? Number(raw.serviceFee) : undefined,
    discount: raw.discount != null ? Number(raw.discount) : undefined,
    currency: String(raw.currency ?? 'PKR'),
    paymentId: raw.paymentId ? idOf(raw.paymentId) : undefined,
    paymentStatus,
    status,
    routeLabel: routeLabel || undefined,
    origin: raw.tripOrigin ? String(raw.tripOrigin) : undefined,
    destination:
      kind === 'tour'
        ? packageDestination || undefined
        : raw.tripDestination
          ? String(raw.tripDestination)
          : undefined,
    pickup,
    pickupAddress: raw.pickupAddress ? String(raw.pickupAddress) : undefined,
    dropoff,
    dropoffAddress: raw.dropoffAddress ? String(raw.dropoffAddress) : undefined,
    vehicleName: raw.vehicleName ? String(raw.vehicleName) : undefined,
    vehicleType: raw.vehicleType ? String(raw.vehicleType) : undefined,
    vehiclePlate: raw.vehiclePlate ? String(raw.vehiclePlate) : undefined,
    journeyType: raw.tripJourneyType ? String(raw.tripJourneyType) : undefined,
    bookingMode: raw.tripBookingMode ? String(raw.tripBookingMode) : undefined,
    tripDescription: raw.tripDescription ? String(raw.tripDescription) : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
    specialRequests: raw.specialRequests
      ? String(raw.specialRequests)
      : guestFromPkg?.specialRequests
        ? String(guestFromPkg.specialRequests)
        : undefined,
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
    hotelName: raw.hotelName ? String(raw.hotelName) : undefined,
    roomName: raw.roomName ? String(raw.roomName) : hotel.roomName ? String(hotel.roomName) : undefined,
    checkIn: raw.checkIn ? String(raw.checkIn) : hotel.checkIn ? String(hotel.checkIn) : undefined,
    checkOut: raw.checkOut ? String(raw.checkOut) : hotel.checkOut ? String(hotel.checkOut) : undefined,
    nights: raw.nights != null ? Number(raw.nights) : undefined,
    guestsCount:
      raw.guestsCount != null
        ? Number(raw.guestsCount)
        : travelers != null
          ? travelers
          : undefined,
    roomsCount: raw.roomsCount != null ? Number(raw.roomsCount) : undefined,
  };
}

export function mapEarnings(raw: AnyRecord): ProviderEarningsSummary {
  return {
    totalRevenue: Number(raw.totalRevenue ?? 0),
    today: Number(raw.todayRevenue ?? raw.today ?? 0),
    thisWeek: Number(raw.weeklyRevenue ?? raw.thisWeek ?? 0),
    thisMonth: Number(raw.monthlyRevenue ?? raw.thisMonth ?? 0),
    pendingPayout: Number(raw.pendingPayout ?? 0),
    completedPayout: Number(raw.completedPayout ?? 0),
    platformFees: Number(raw.platformFees ?? 0),
    netEarnings: Number(raw.netEarnings ?? 0),
    platformFeePercent:
      raw.platformFeePercent != null ? Number(raw.platformFeePercent) : undefined,
    serviceKey: raw.serviceKey != null ? String(raw.serviceKey) : null,
    byDay: [],
    byMonth: [],
    byService: [],
    byRoute: [],
  };
}

export function mapDashboardStats(raw: AnyRecord): ProviderDashboardStats {
  const transport = (raw.transport ?? {}) as AnyRecord;
  const hotel = (raw.hotel ?? {}) as AnyRecord;
  const general = (raw.general ?? {}) as AnyRecord;

  return {
    todaysBookings: Number(general.totalBookings ?? 0),
    pendingBookings: Number(general.pendingBookings ?? 0),
    todaysRevenue: Number(general.todaysRevenue ?? 0),
    todaysTrips: Number(transport.todaysTrips ?? 0),
    availableSeats: Number(transport.availableSeats ?? 0),
    occupiedSeats: Number(transport.bookedSeats ?? 0),
    todaysCheckIns: Number(hotel.checkIns ?? 0),
    availableRooms: Number(hotel.availableRooms ?? 0),
    occupiedRooms: Number(hotel.occupiedRooms ?? 0),
  };
}

export function mapProviderReview(raw: AnyRecord): ProviderReview {
  return {
    id: idOf(raw),
    providerId: idOf(raw.providerId),
    customerName: String(raw.customerName ?? raw.userName ?? 'Guest'),
    rating: Number(raw.rating ?? 0),
    comment: String(raw.comment ?? ''),
    reply: raw.reply ? String(raw.reply) : undefined,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    serviceLabel: String(raw.serviceLabel ?? 'Service'),
  };
}

export function mapReview(raw: AnyRecord): Review {
  const customer =
    raw.customerId && typeof raw.customerId === 'object'
      ? (raw.customerId as AnyRecord)
      : undefined;
  const createdAt = raw.createdAt ? String(raw.createdAt) : '';
  const paymentRating =
    raw.paymentRating != null
      ? Number(raw.paymentRating)
      : raw.categories && typeof raw.categories === 'object'
        ? Number((raw.categories as AnyRecord).payment ?? NaN)
        : NaN;
  const serviceRating =
    raw.serviceRating != null
      ? Number(raw.serviceRating)
      : raw.categories && typeof raw.categories === 'object'
        ? Number((raw.categories as AnyRecord).service ?? NaN)
        : NaN;
  return {
    id: idOf(raw),
    userName: String(raw.customerName ?? raw.userName ?? customer?.name ?? 'Guest'),
    userAvatar: mediaUrl(raw.userAvatar ?? customer?.avatar),
    rating: Number(raw.rating ?? 0),
    paymentRating: Number.isFinite(paymentRating) ? paymentRating : undefined,
    serviceRating: Number.isFinite(serviceRating) ? serviceRating : undefined,
    comment: String(raw.comment ?? ''),
    date: createdAt ? createdAt.slice(0, 10) : '',
    tripId: idOf(raw.targetId ?? raw.tripId ?? raw.bookingId),
    providerReply: raw.providerReply ? String(raw.providerReply) : undefined,
  };
}

export function mapRouteInfo(raw: AnyRecord): RouteInfo {
  return {
    id: idOf(raw),
    from: String(raw.origin ?? raw.from ?? ''),
    to: String(raw.destination ?? raw.to ?? ''),
    popular: true,
    image: '',
    avgPrice: Number(raw.basePrice ?? raw.price ?? 0),
    tripCount: Number(raw.tripCount ?? 1),
  };
}

export function mapAvailabilityDay(raw: AnyRecord): RoomAvailabilityDay {
  return {
    roomId: idOf(raw.roomId),
    date: String(raw.date ?? ''),
    status: (raw.status as RoomAvailabilityDay['status']) ?? 'available',
    priceOverride: raw.priceOverride != null ? Number(raw.priceOverride) : undefined,
  };
}

export function mapProviderServices(provider: Provider): ProviderServiceItem[] {
  return provider.services.slice(0, 1).map((type, index) => ({
    id: `${provider.id}-${type}-${index}`,
    type,
    label: serviceLabel(type),
    status: 'active' as const,
  }));
}
