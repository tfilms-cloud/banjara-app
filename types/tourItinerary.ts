export type TourType = 'trek' | 'expedition' | 'summit';
export type TourItineraryStatus = 'draft' | 'pending' | 'published' | 'rejected';
export type TourDifficulty = 'easy' | 'moderate' | 'hard';

export type TourDay = {
  dayNumber: number;
  title: string;
  description: string;
};

export type TourOperatorBrief = {
  id: string;
  businessName: string;
  logo?: string | null;
  rating?: number;
  reviewCount?: number;
  yearsExperience?: number;
  city?: string | null;
  verified?: boolean;
  description?: string;
  itineraryCount?: number;
};

export type TourItinerary = {
  id: string;
  providerId: string;
  title: string;
  tourType: TourType;
  summary: string;
  description: string;
  destination: string;
  region?: string;
  durationDays: number;
  durationNights?: number;
  difficulty?: TourDifficulty;
  maxParticipants: number;
  pricePerPerson: number;
  currency: string;
  included: string[];
  excluded: string[];
  days: TourDay[];
  coverImage: string;
  images: string[];
  departureLocation?: string;
  bestSeason?: string;
  status: TourItineraryStatus;
  featured: boolean;
  rejectionReason?: string;
  publishedAt?: string;
  provider?: TourOperatorBrief | null;
};

export type TourTypeCatalog = {
  tourType: TourType;
  featured: TourItinerary[];
  popular: TourItinerary[];
  newest: TourItinerary[];
};

export type CreateTourItineraryInput = {
  title: string;
  tourType: TourType;
  summary: string;
  description: string;
  destination: string;
  region?: string;
  durationDays: number;
  durationNights?: number;
  difficulty?: TourDifficulty;
  maxParticipants: number;
  pricePerPerson: number;
  currency?: string;
  included?: string[];
  excluded?: string[];
  days?: TourDay[];
  coverImage: string;
  images?: string[];
  departureLocation?: string;
  bestSeason?: string;
  submitForReview?: boolean;
};
