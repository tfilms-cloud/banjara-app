import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HotelPriceBreakdownCard } from '@/components/hotels/HotelPriceBreakdown';
import { HotelRoomCard, RoomQuantitySelector } from '@/components/hotels/HotelRoomCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useHotel } from '@/hooks/useHotels';
import { useHotelStore } from '@/store/hotelStore';
import type { HotelRoom } from '@/types/hotel';
import { formatCurrency } from '@/utils/formatCurrency';
import { pushPath } from '@/utils/navigation';

export default function HotelRoomsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { hotel, rooms, loading } = useHotel(id);
  const {
    selectedRoom,
    setRoom,
    roomQuantity,
    setRoomQuantity,
    priceBreakdown,
    setHotel,
  } = useHotelStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (hotel) {
      setHotel(hotel);
      setReady(true);
    }
  }, [hotel, setHotel]);

  const onSelect = (room: HotelRoom) => {
    setRoom(room);
  };

  if (loading || !ready) return <LoadingState title="Loading rooms..." />;

  return (
    <View style={styles.container}>
      <Header
        title="Select Room"
        subtitle={hotel?.name}
        showBack
        fallbackHref={`/(customer)/hotels/${id}` as never}
      />
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 180 }]}
        ListEmptyComponent={<EmptyState title="No rooms available" icon="bed-outline" />}
        ListHeaderComponent={
          selectedRoom ? (
            <View style={styles.topBlock}>
              <RoomQuantitySelector
                value={roomQuantity}
                max={selectedRoom.availableRooms}
                onChange={setRoomQuantity}
              />
              {priceBreakdown ? <HotelPriceBreakdownCard breakdown={priceBreakdown} /> : null}
            </View>
          ) : (
            <Text style={styles.hint}>Choose a room to continue booking.</Text>
          )
        }
        renderItem={({ item }) => (
          <HotelRoomCard
            room={item}
            selected={selectedRoom?.id === item.id}
            onSelect={() => onSelect(item)}
          />
        )}
      />

      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Text style={styles.total}>
          {priceBreakdown
            ? formatCurrency(priceBreakdown.total, priceBreakdown.currency)
            : 'Select a room'}
        </Text>
        <Button
          title="Continue"
          disabled={!selectedRoom}
          onPress={() => pushPath(`/(customer)/hotels/booking/${id}`)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.lg, gap: Spacing.md },
  topBlock: { gap: Spacing.md, marginBottom: Spacing.md },
  hint: { ...Typography.caption, color: Colors.muted, marginBottom: Spacing.md },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  total: { ...Typography.h3, color: Colors.primary },
});
