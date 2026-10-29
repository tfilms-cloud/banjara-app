export type RestaurantOffer = {
  id: string;
  title: string;
  type: 'sale' | 'offer' | 'discount';
  discountPercent?: number;
  description?: string;
  active: boolean;
};

export type Restaurant = {
  id: string;
  providerId: string;
  name: string;
  city: string;
  address: string;
  cuisine: string[];
  menuVariety: string[];
  rating: number;
  reviewCount: number;
  images: string[];
  offers: RestaurantOffer[];
  description: string;
  phone?: string;
  hours?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  /** Score for “most visited” ranking */
  visitScore: number;
};
