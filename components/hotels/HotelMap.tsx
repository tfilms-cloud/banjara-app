import { useEffect, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useHotelDesign } from '@/constants/hotelDesign';
import { Fonts } from '@/constants/typography';
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
  compactDetails?: boolean;
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
  compactDetails = false,
}: HotelMapProps) {
  const theme = useHotelDesign();
  const { location, request } = useLocation();

  useEffect(() => {
    void request();
  }, [request]);

  const points = useMemo(
    () => hotels.map(hotelToMapPoint).filter((p): p is PickupPoint => p != null),
    [hotels],
  );

  const title = hotels.length === 1 ? (hotels[0]?.name ?? 'Hotel location') : 'Hotels on map';

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
      renderEmbeddedDetails={
        compactDetails
          ? (onOpenMap) => {
              const hotel = hotels.find((item) => item.id === (selectedHotelId ?? points[0]?.id));
              if (!hotel) return null;
              return (
                <Pressable
                  onPress={onOpenMap}
                  accessibilityRole="button"
                  accessibilityLabel="View hotel map"
                  style={{
                    position: 'absolute',
                    bottom: 12,
                    left: 12,
                    right: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    padding: 10,
                    borderRadius: 24,
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: theme.action,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="home-outline" size={18} color={theme.onAction} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      numberOfLines={1}
                      style={{ fontFamily: Fonts.bodyBold, fontSize: 12, color: theme.text }}
                    >
                      {hotel.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: Fonts.body,
                        fontSize: 10,
                        marginTop: 3,
                        color: theme.muted,
                      }}
                    >
                      {hotel.location.address || hotel.location.city}
                    </Text>
                  </View>
                </Pressable>
              );
            }
          : undefined
      }
      allowFullscreen={allowFullscreen}
      title={title}
      pointNoun="hotel"
    />
  );
}
