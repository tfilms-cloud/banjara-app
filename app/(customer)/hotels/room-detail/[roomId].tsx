import { createURL } from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { Alert, Share } from 'react-native';
import { HotelBookingFrame } from '@/components/hotels/HotelBookingPresentation';
import { RoomDetailsPresentation } from '@/components/hotels/RoomDetailsPresentation';
import { ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { useHotelRoomDetails } from '@/hooks/useHotelRoomDetails';
import { getApiErrorMessage } from '@/services/apiError';
import { useHotelStore } from '@/store/hotelStore';
import { paramId, pushPath, safeBack } from '@/utils/navigation';
import { canSelectRoom } from '@/utils/roomDetails';

export default function HotelRoomDetailScreen() {
  const params = useLocalSearchParams<{ roomId: string | string[]; hotelId?: string | string[] }>();
  const roomId = paramId(params.roomId);
  const { room, hotel, loading, refresh } = useHotelRoomDetails(roomId);
  const selectedRoom = useHotelStore((state) => state.selectedRoom);
  const setRoom = useHotelStore((state) => state.setRoom);
  const onProfile = () => pushPath('/(customer)/(tabs)/profile');
  const propertyId = room?.hotelId || paramId(params.hotelId);
  const onBack = () =>
    safeBack(
      propertyId
        ? (`/(customer)/hotels/rooms/${propertyId}` as never)
        : '/(customer)/hotels/results',
    );

  if (!room)
    return (
      <HotelBookingFrame title="Room Details" onBack={onBack} onProfile={onProfile}>
        {loading ? (
          <LoadingState title="Loading room…" />
        ) : (
          <ErrorState
            title="Room unavailable"
            message="This room could not be loaded. Please try again."
            onRetry={() => void refresh()}
          />
        )}
      </HotelBookingFrame>
    );

  return (
    <RoomDetailsPresentation
      key={room.id}
      room={room}
      hotel={hotel}
      selected={selectedRoom?.id === room.id}
      refreshing={loading}
      onRefresh={() => void refresh()}
      onBack={onBack}
      onProfile={onProfile}
      onShare={() => {
        void Share.share({
          message: `${room.name}${hotel?.name ? ` · ${hotel.name}` : ''}\n${createURL(`/hotels/room-detail/${room.id}`, { queryParams: { hotelId: room.hotelId } })}`,
        }).catch((error) => Alert.alert('Could not share room', getApiErrorMessage(error)));
      }}
      onSelect={() => {
        if (loading || !canSelectRoom(room)) return;
        if (selectedRoom?.id !== room.id) setRoom(room);
        pushPath(`/(customer)/hotels/rooms/${room.hotelId}`);
      }}
    />
  );
}
