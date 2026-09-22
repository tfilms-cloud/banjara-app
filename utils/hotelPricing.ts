export interface HotelPriceInput {
  pricePerNight: number;
  nights: number;
  rooms: number;
  taxRate?: number;
  serviceFee?: number;
  discount?: number;
  currency?: string;
}

export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Math.max(1, nights);
}

export function calculateHotelPrice({
  pricePerNight,
  nights,
  rooms,
  taxRate = 0.1,
  serviceFee = 2000,
  discount = 0,
  currency = 'PKR',
}: HotelPriceInput) {
  const roomSubtotal = pricePerNight * nights * rooms;
  const tax = Math.round(roomSubtotal * taxRate);
  const total = Math.max(0, roomSubtotal + tax + serviceFee - discount);

  return {
    pricePerNight,
    nights,
    rooms,
    roomSubtotal,
    tax,
    serviceFee,
    discount,
    total,
    currency,
  };
}
