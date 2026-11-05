import { useEffect, type ReactNode } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/constants/colors';
import { useBackendStatus } from '@/hooks/useBackendData';
import { backendAvailability } from '@/services/backendAvailability';
import { clearProviderBackendData } from '@/store/providerStore';
import { useBookingStore } from '@/store/bookingStore';
import { useHotelStore } from '@/store/hotelStore';
import { useTourBookingStore } from '@/store/tourBookingStore';
import { useGuideBookingStore } from '@/store/guideBookingStore';
import { useChatStore } from '@/store/chatStore';
import { useUserStore } from '@/store/userStore';

/** Connection banner only. The app UI and navigation remain mounted. */
export function BackendAvailabilityGate({ children }: { children: ReactNode }) {
  const status = useBackendStatus();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    const reset = backendAvailability.registerReset(() => {
      clearProviderBackendData();
      useBookingStore.setState({ selectedTrip: null, selectedPickup: null, priceBreakdown: null, lastBooking: null });
      useHotelStore.setState({ selectedHotel: null, selectedRoom: null, priceBreakdown: null, lastBooking: null });
      useTourBookingStore.setState({ itinerary: null, priceBreakdown: null, lastBooking: null });
      useGuideBookingStore.setState({ guide: null, service: null, priceBreakdown: null, lastBooking: null, providerName: '' });
      useChatStore.getState().disconnect();
      useUserStore.setState({ notifications: [], profile: null });
    });
    void backendAvailability.check();
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void backendAvailability.check();
    }, 5000);
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') void backendAvailability.check();
    });
    return () => { clearInterval(timer); listener.remove(); reset(); };
  }, []);
  return <View style={{ flex: 1 }}>
    {status !== 'online' && <View accessibilityRole="alert" style={{ backgroundColor: colors.surfaceSecondary, paddingTop: insets.top + 8, paddingBottom: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text style={{ color: colors.dark, flex: 1, fontSize: 12 }}>
        {status === 'checking' ? 'Connecting to live data…' : 'Live data unavailable. You can still browse the app.'}
      </Text>
      <Pressable onPress={() => void backendAvailability.check()} accessibilityRole="button" accessibilityLabel="Retry live data" style={{ padding: 10 }}>
        <Text style={{ color: colors.action, fontWeight: '600' }}>Retry</Text>
      </Pressable>
    </View>}
    {children}
  </View>;
}
