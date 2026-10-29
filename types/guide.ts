/** Guide service provider — mirrors backend ProviderProfile.guideDetails */

export type GuideGender = 'male' | 'female' | 'other';

export type GuideType =
  | 'local'
  | 'tour'
  | 'trekking'
  | 'hiking'
  | 'cultural'
  | 'adventure'
  | 'mountain'
  | 'photography'
  | 'other';

export type LanguageProficiency = 'basic' | 'conversational' | 'fluent' | 'native';

export type GuidePricingType = 'per_person' | 'per_group' | 'per_hour' | 'per_day' | 'custom';

export type GuideDocumentType =
  | 'cnic'
  | 'guide_license'
  | 'tourism_cert'
  | 'first_aid'
  | 'mountain_cert'
  | 'other';

export type GuideDocumentStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export type GuidePhotoCategory =
  | 'profile'
  | 'action'
  | 'mountains'
  | 'destinations'
  | 'trekking'
  | 'tours'
  | 'other';

export type GuideProfileStatus =
  | 'draft'
  | 'pending'
  | 'changes_requested'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface GuideLanguage {
  language: string;
  proficiency: LanguageProficiency;
}

export interface GuideDocument {
  id: string;
  type: GuideDocumentType;
  label?: string;
  number?: string;
  issueDate?: string;
  expiryDate?: string;
  fileUrl: string;
  status: GuideDocumentStatus;
  rejectionReason?: string;
}

export interface GuidePhoto {
  id: string;
  url: string;
  category: GuidePhotoCategory;
  caption?: string;
}

export interface GuideOfferedService {
  id: string;
  name: string;
  category: GuideType;
  description: string;
  durationLabel: string;
  durationHours?: number;
  price: number;
  pricingType: GuidePricingType;
  currency: string;
  minGuests: number;
  maxGuests: number;
  included: string[];
  excluded: string[];
  meetingPoint?: string;
  availableLocations: string[];
  notes?: string;
  active: boolean;
}

export interface GuideDayAvailability {
  day: Weekday;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export interface GuideAvailability {
  weekly: GuideDayAvailability[];
  minBookingHours?: number;
  maxBookingHours?: number;
  advanceBookingHours?: number;
  availableFrom?: string;
  availableUntil?: string;
  blockedDates: string[];
}

export interface GuideDetails {
  profileStatus?: GuideProfileStatus;
  changesRequestedNote?: string;

  fullName?: string;
  profilePhoto?: string;
  gender?: GuideGender;
  dateOfBirth?: string;
  age?: number;
  phone?: string;
  whatsapp?: string;
  email?: string;
  cnicNumber?: string;
  cnicFrontUrl?: string;
  cnicBackUrl?: string;

  country?: string;
  province?: string;
  district?: string;
  city?: string;
  currentLocation?: string;
  areasCovered?: string[];
  pickupLocations?: string[];

  guideTypes?: GuideType[];
  customGuideType?: string;
  yearsExperience?: number;
  shortBio?: string;
  detailedDescription?: string;
  specialSkills?: string[];
  areasOfExpertise?: string[];
  certifications?: string[];
  training?: string[];
  awards?: string[];

  languages?: GuideLanguage[];
  documents?: GuideDocument[];
  photos?: GuidePhoto[];
  services?: GuideOfferedService[];
  availability?: GuideAvailability;

  dailyHireRate?: number;
}

export interface GuideMyProfileResponse {
  providerId: string;
  verificationStatus: string;
  guideDetails: GuideDetails;
  rating?: number;
  totalReviews?: number;
  businessName?: string;
  ownerName?: string;
  city?: string;
  logo?: string;
}

export interface GuideBookingDetails {
  serviceId?: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime?: string;
  durationHours?: number;
  guests: number;
  meetingPoint?: string;
  availableLocation?: string;
  specialRequest?: string;
  pricingType: GuidePricingType;
  unitPrice: number;
  currency?: string;
  guestDetails: {
    name: string;
    email: string;
    phone: string;
    specialRequests?: string;
  };
}

/** Public / traveler-facing guide profile (no CNIC or private docs). */
export type GuidePublicDetails = Pick<
  GuideDetails,
  | 'profileStatus'
  | 'fullName'
  | 'gender'
  | 'profilePhoto'
  | 'phone'
  | 'email'
  | 'yearsExperience'
  | 'shortBio'
  | 'detailedDescription'
  | 'guideTypes'
  | 'areasCovered'
  | 'specialSkills'
  | 'certifications'
  | 'languages'
  | 'dailyHireRate'
  | 'photos'
  | 'services'
> & {
  city?: string;
  currentLocation?: string;
};

export type GuideSearchParams = {
  destination?: string;
  date?: string;
  guests?: number;
  guideType?: string;
  language?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  minExperience?: number;
};

export type GuideListItem = {
  id: string;
  businessName: string;
  ownerName: string;
  city: string;
  logo?: string;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  guide?: GuidePublicDetails;
  fromPrice?: number;
  services: GuideOfferedService[];
};

export type GuideAvailabilityPublic = Pick<
  GuideAvailability,
  | 'weekly'
  | 'blockedDates'
  | 'availableFrom'
  | 'availableUntil'
  | 'minBookingHours'
  | 'maxBookingHours'
  | 'advanceBookingHours'
>;
