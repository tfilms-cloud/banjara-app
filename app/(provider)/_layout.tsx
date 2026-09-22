import { Redirect, Stack, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useThemedStackOptions } from '@/hooks/useThemedStackOptions';
import { useAuthStore } from '@/store/authStore';
import { useProviderStore } from '@/store/providerStore';
import { needsProviderOnboarding } from '@/utils/routing';

export default function ProviderLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore.persist.hasHydrated();
  const [providerHydrated, setProviderHydrated] = useState(() =>
    useProviderStore.persist.hasHydrated()
  );
  const segments = useSegments();
  const colors = useThemeColors();
  const screenOptions = useThemedStackOptions();

  useEffect(() => {
    if (useProviderStore.persist.hasHydrated()) {
      setProviderHydrated(true);
      return;
    }
    return useProviderStore.persist.onFinishHydration(() => setProviderHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated || !providerHydrated || !user?.id || user.role !== 'provider') return;
    if (user.providerId) {
      void useProviderStore.getState().loadProvider(user.providerId);
    } else {
      void useProviderStore.getState().loadProviderByUser(user.id);
    }
  }, [hydrated, providerHydrated, user?.id, user?.providerId, user?.role]);

  // Allow traveler/guest accounts to complete provider onboarding without being bounced
  // back to the customer tabs (register review may create a customer account first).
  const inProviderOnboarding = segments.some(
    (segment) => segment === 'register' || segment === 'location' || segment === 'status'
  );

  if (!hydrated || !providerHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.action} />
      </View>
    );
  }

  if (isAuthenticated && user?.role === 'customer' && !inProviderOnboarding) {
    return <Redirect href="/(customer)/(tabs)" />;
  }

  if (isAuthenticated && needsProviderOnboarding(user) && !inProviderOnboarding) {
    return <Redirect href="/(provider)/register/services" />;
  }

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="register/index" />
      <Stack.Screen name="register/services" />
      <Stack.Screen name="register/business" />
      <Stack.Screen name="register/transport" />
      <Stack.Screen name="register/hotel" />
      <Stack.Screen name="register/tours" />
      <Stack.Screen name="register/verification" />
      <Stack.Screen name="register/review" />
      <Stack.Screen name="register/success" />
      <Stack.Screen name="status" />
      <Stack.Screen name="vehicles/add" />
      <Stack.Screen name="rooms/index" />
      <Stack.Screen name="rooms/add" />
      <Stack.Screen name="transport/index" />
      <Stack.Screen name="transport/trips/create" />
      <Stack.Screen name="transport/route-add" />
      <Stack.Screen name="transport/stop-add" />
      <Stack.Screen name="hotel/index" />
      <Stack.Screen name="hotel/availability" />
      <Stack.Screen name="booking/[id]" />
      <Stack.Screen name="passengers" />
      <Stack.Screen name="reviews" />
      <Stack.Screen name="messages" />
      <Stack.Screen name="messages/[id]" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="location" />
    </Stack>
  );
}
