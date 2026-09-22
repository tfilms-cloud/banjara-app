export type SeatStatus = 'available' | 'selected' | 'occupied' | 'reserved';

export interface Seat {
  id: string;
  label: string;
  row: number;
  column: number;
  status: SeatStatus;
  price: number;
  isAisle?: boolean;
  isDriver?: boolean;
}

export interface SeatLayout {
  rows: number;
  columns: number;
  aisleAfterColumn: number;
  seats: Seat[];
}
