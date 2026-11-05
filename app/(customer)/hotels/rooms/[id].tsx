import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { HotelBookingFrame } from '@/components/hotels/HotelBookingPresentation';
import { SelectRoomPresentation } from '@/components/hotels/SelectRoomPresentation';
import { ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { useHotel } from '@/hooks/useHotels';
import { useHotelStore } from '@/store/hotelStore';
import { calculateNights } from '@/utils/hotelPricing';
import { roomInventory } from '@/utils/hotelRoomSelection';
import { paramId, pushPath, safeBack } from '@/utils/navigation';

export default function HotelRoomsScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = paramId(params.id);
  const { hotel, rooms, loading, error, refresh } = useHotel(id);
  const {
    selectedHotel,
    selectedRoom,
    setRoom,
    roomQuantity,
    setRoomQuantity,
    priceBreakdown,
    priceLoading,
    priceEstimated,
    syncHotelRooms,
    checkIn,
    checkOut,
    adults,
    children,
  } = useHotelStore();
  const onBack = () => safeBack(`/(customer)/hotels/${id}` as never);
  const onProfile = () => pushPath('/(customer)/(tabs)/profile');

  useEffect(() => {
    if (hotel && !loading && !error) syncHotelRooms(hotel, rooms);
  }, [hotel, rooms, loading, error, syncHotelRooms]);

  if (!hotel)
    return (
      <HotelBookingFrame title="Select Room" onBack={onBack} onProfile={onProfile}>
        {loading ? (
          <LoadingState title="Loading rooms…" />
        ) : (
          <ErrorState
            title="Rooms unavailable"
            message={error || 'This property is unavailable.'}
            onRetry={() => void refresh()}
          />
        )}
      </HotelBookingFrame>
    );

  const selection = selectedHotel?.id === id && selectedRoom?.hotelId === id ? selectedRoom : null;
  return (
    <SelectRoomPresentation
      hotel={hotel}
      rooms={rooms}
      selectedRoom={selection}
      quantity={roomQuantity}
      breakdown={selection ? priceBreakdown : null}
      guests={adults + children}
      nights={calculateNights(checkIn, checkOut)}
      priceLoading={!!selection && priceLoading}
      priceEstimated={priceEstimated}
      refreshing={loading}
      onRefresh={() => void refresh()}
      onBack={onBack}
      onProfile={onProfile}
      onSelect={setRoom}
      onQuantityChange={setRoomQuantity}
      onView={(room) =>
        pushPath(`/(customer)/hotels/room-detail/${room.id}?hotelId=${encodeURIComponent(id)}`)
      }
      onContinue={() => {
        const state = useHotelStore.getState();
        if (
          !loading &&
          state.selectedHotel?.id === id &&
          state.selectedRoom?.hotelId === id &&
          state.priceBreakdown &&
          !state.priceLoading &&
          roomInventory(state.selectedRoom) >= state.roomQuantity
        ) {
          pushPath(`/(customer)/hotels/booking/${id}`);
        }
      }}
    />
  );
}
