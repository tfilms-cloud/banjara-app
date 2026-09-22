export type StructuredAddress = {
  street?: string;
  area?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  formattedAddress?: string;
};

export type GeoPoint = {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
};

export type PlaceSearchResult = {
  name: string;
  address: StructuredAddress;
  latitude: number;
  longitude: number;
  location: GeoPoint;
};

export type BusinessLocationPayload = {
  businessId: string;
  businessName: string;
  address: StructuredAddress;
  location: GeoPoint;
  latitude: number;
  longitude: number;
  locationUpdatedAt?: string | null;
};

export type LocationPickerValue = {
  latitude: number;
  longitude: number;
  address: StructuredAddress;
  placeName?: string;
};
