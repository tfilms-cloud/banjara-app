import { useEffect, useMemo } from 'react';
import { PickupMap } from '@/components/map/PickupMap';
import { isValidCoord } from '@/components/map/mapHelpers';
import { useLocation } from '@/hooks/useLocation';
import type { Hotel } from '@/types/hotel';
import type { PickupPoint } from '@/types/route';
import { formatCurrency } from '@/utils/formatCurrency';

interface HotelMapProps {
  hotels: Hotel[];
  selectedHotelId?: string;
  onSelectHotel?: (hotel: Hotel) => void;
  height?: number;
  showControls?: boolean;
  allowFullscreen?: boolean;
}

function hotelToMapPoint(hotel: Hotel): PickupPoint | null {
  const coordinates = {
    latitude: hotel.location.latitude,
    longitude: hotel.location.longitude,
  };
  if (!isValidCoord(coordinates)) return null;

  const place =
    [hotel.location.area, hotel.location.city].filter(Boolean).join(', ') ||
    hotel.location.address ||
    'Hotel location';

  return {
    id: hotel.id,
    name: hotel.name,
    address: `${place} · From ${formatCurrency(hotel.priceFrom)}`,
    time: '',
    distanceKm: hotel.location.distanceKm ?? 0,
    coordinates,
  };
}

/**
 * Customer hotel location map — same stack as trip/ride PickupMap
 * (native maps + InAppWebMap fallback, fullscreen, layers, directions).
 */
export function HotelMap({
  hotels,
  selectedHotelId,
  onSelectHotel,
  height = 280,
  showControls = true,
  allowFullscreen = true,
}: HotelMapProps) {
  const { location, request } = useLocation();

  useEffect(() => {
    void request();
  }, [request]);

  const points = useMemo(
    () => hotels.map(hotelToMapPoint).filter((p): p is PickupPoint => p != null),
    [hotels]
  );

  const title =
    hotels.length === 1 ? hotels[0]?.name ?? 'Hotel location' : 'Hotels on map';

  return (
    <PickupMap
      pickups={points}
      selectedPickupId={selectedHotelId ?? points[0]?.id}
      onSelectPickup={(point) => {
        const hotel = hotels.find((item) => item.id === point.id);
        if (hotel) onSelectHotel?.(hotel);
      }}
      userLocation={location}
      height={height}
      showControls={showControls}
      showSelectedCard
      allowFullscreen={allowFullscreen}
      title={title}
      pointNoun="hotel"
    />
  );
}
