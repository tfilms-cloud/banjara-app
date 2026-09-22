export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PickupPoint {
  id: string;
  name: string;
  address: string;
  time: string;
  distanceKm: number;
  coordinates: Coordinates;
  tripId?: string;
}

export interface DropoffPoint {
  id: string;
  name: string;
  address: string;
  time: string;
  coordinates: Coordinates;
}

export interface RouteInfo {
  id: string;
  from: string;
  to: string;
  popular: boolean;
  image: string;
  avgPrice: number;
  tripCount: number;
}
