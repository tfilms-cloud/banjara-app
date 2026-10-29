import { Stack } from 'expo-router';
import { useThemedStackOptions } from '@/hooks/useThemedStackOptions';

export default function CustomerLayout() {
  const screenOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="results" />
      <Stack.Screen name="trip/[id]" />
      <Stack.Screen name="agency/[id]" />
      <Stack.Screen name="pickup/[id]" />
      <Stack.Screen name="seat/[id]" />
      <Stack.Screen name="booking/review" />
      <Stack.Screen name="booking/payment" />
      <Stack.Screen name="booking/success" />
      <Stack.Screen name="ticket/[id]" />
      <Stack.Screen name="booking-details/[id]" />
      <Stack.Screen name="rate/[bookingId]" options={{ title: 'Rate provider' }} />
      <Stack.Screen name="messages/index" />
      <Stack.Screen name="messages/[userId]" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="hotels/search" />
      <Stack.Screen name="hotels/results" />
      <Stack.Screen name="hotels/[id]" />
      <Stack.Screen name="hotels/rooms/[id]" />
      <Stack.Screen name="hotels/room-detail/[roomId]" />
      <Stack.Screen name="hotels/booking/[id]" />
      <Stack.Screen name="hotels/review" />
      <Stack.Screen name="hotels/payment" />
      <Stack.Screen name="hotels/success" />
      <Stack.Screen name="hotels/confirmation/[id]" />
      <Stack.Screen name="hotels/booking-details/[id]" />
      <Stack.Screen name="explore/map" />
      <Stack.Screen name="restaurants/[id]" />
      <Stack.Screen name="tours/[id]" />
      <Stack.Screen name="tours/book/[id]" />
      <Stack.Screen name="tours/review" />
      <Stack.Screen name="tours/payment" />
      <Stack.Screen name="tours/success" />
      <Stack.Screen name="guides/index" />
      <Stack.Screen name="guides/[id]" />
      <Stack.Screen name="guides/book/[id]" />
      <Stack.Screen name="guides/review" />
      <Stack.Screen name="guides/payment" />
      <Stack.Screen name="guides/success" />
      <Stack.Screen name="payments/index" />
      <Stack.Screen name="payments/[paymentId]" />
      <Stack.Screen name="payments/proof/[paymentId]" />
    </Stack>
  );
}
