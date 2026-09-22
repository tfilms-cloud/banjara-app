import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HotelConfirmation } from '@/components/hotels/HotelConfirmation';
import { ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useHotelBooking } from '@/hooks/useHotels';
import * as hotelService from '@/services/hotelService';
import { useHotelStore } from '@/store/hotelStore';
import type { Hotel, HotelRoom } from '@/types/hotel';

export default function HotelConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { booking, loading } = useHotelBooking(id);
  const lastBooking = useHotelStore((state) => state.lastBooking);
  const selectedHotel = useHotelStore((state) => state.selectedHotel);
  const selectedRoom = useHotelStore((state) => state.selectedRoom);
  const [hotel, setHotel] = useState<Hotel | null>(selectedHotel);
  const [room, setRoom] = useState<HotelRoom | null>(selectedRoom);

  const active = booking ?? (lastBooking?.id === id ? lastBooking : null);

  useEffect(() => {
    if (!active) return;
    let mounted = true;
    (async () => {
      const [hotelData, roomData] = await Promise.all([
        hotelService.getHotelById(active.hotelId),
        hotelService.getRoomById(active.roomId),
      ]);
      if (!mounted) return;
      setHotel(hotelData ?? selectedHotel);
      setRoom(roomData ?? selectedRoom);
    })();
    return () => {
      mounted = false;
    };
  }, [active, selectedHotel, selectedRoom]);

  if (loading && !active) return <LoadingState title="Loading confirmation..." />;
  if (!active || !hotel || !room) {
    return <ErrorState message="Confirmation not found" />;
  }

  return (
    <View style={styles.container}>
      <Header title="Digital Confirmation" showBack fallbackHref="/(customer)/(tabs)/bookings" />
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 24 }}>
        <HotelConfirmation
          booking={active}
          hotel={hotel}
          room={room}
          onDownload={() =>
            Alert.alert('Download', 'Save or screenshot this confirmation for offline access.')
          }
          onShare={() => Alert.alert('Share', 'Share your booking code with your travel companions.')}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
});
