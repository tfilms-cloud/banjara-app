import type { Amenity, VehicleType } from './trip';
import type { SeatLayout } from './seat';

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  plateNumber: string;
  capacity: number;
  amenities: Amenity[];
  image: string;
  seatLayout: SeatLayout;
  agencyId: string;
}
