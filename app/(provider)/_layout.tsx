import { Redirect, Stack, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { useThemeColors } from '@/constants/colors';
import { useThemedStackOptions } from '@/hooks/useThemedStackOptions';
import { useAuthStore } from '@/store/authStore';
import { useProviderStore } from '@/store/providerStore';
import { needsProviderOnboarding } from '@/utils/routing';
import {
  TRANSPORT_STEPS,
  transportDashboardAllowed,
  transportResumeStep,
  transportStepHref,
  type TransportStep,
} from '@/utils/providerOnboarding';

export default function ProviderLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const provider = useProviderStore((state) => state.provider);
  const draft = useProviderStore((state) => state.draft);
  const loadedFor = useProviderStore((state) => state.profileLoadedFor);
  const error = useProviderStore((state) => state.error);
  const loading = useProviderStore((state) => state.loading);
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());
  const [providerHydrated, setProviderHydrated] = useState(() =>
    useProviderStore.persist.hasHydrated(),
  );
  const segments = useSegments();
  const colors = useThemeColors();
  const screenOptions = useThemedStackOptions();

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) { setHydrated(true); return; }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (useProviderStore.persist.hasHydrated()) {
      setProviderHydrated(true);
      return;
    }
    return useProviderStore.persist.onFinishHydration(() =>
      setProviderHydrated(true),
    );
  }, []);

  useEffect(() => {
    if (!hydrated || !providerHydrated || !user?.id || user.role !== 'provider')
      return;
    void useProviderStore.getState().loadProviderByUser(user.id);
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active')
        void useProviderStore.getState().loadProviderByUser(user.id);
    });
    return () => listener.remove();
  }, [hydrated, providerHydrated, user?.id, user?.role]);

  // Allow traveler/guest accounts to complete provider onboarding without being bounced
  // back to the customer tabs (register review may create a customer account first).
  const inProviderOnboarding = segments.some(
    (segment) =>
      segment === 'register' || segment === 'location' || segment === 'status',
  );

  if (
    !hydrated ||
    !providerHydrated ||
    (isAuthenticated && user?.role === 'provider' && loadedFor !== user.id)
  ) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        {error && !loading ? (
          <>
            <Text
              style={{ color: colors.dark, padding: 20, textAlign: 'center' }}
            >
              Could not check signup progress. Your draft is saved on this
              device.
            </Text>
            <Button
              title="Try again"
              onPress={() =>
                user &&
                void useProviderStore.getState().loadProviderByUser(user.id)
              }
            />
          </>
        ) : (
          <ActivityIndicator color={colors.action} />
        )}
      </View>
    );
  }

  if (isAuthenticated && user?.role === 'provider') {
    const nextStep = transportResumeStep(provider, draft);
    if (nextStep && !transportDashboardAllowed(provider)) {
      const currentStep: TransportStep | undefined =
        segments.includes('vehicles' as never) &&
        segments.includes('add' as never)
          ? 'vehicle'
          : (segments.includes('register' as never) ? segments.find((segment) =>
              TRANSPORT_STEPS.includes(segment as TransportStep),
            ) as TransportStep | undefined : segments.includes('location' as never) ? 'location' : undefined);
      const statusPage = segments.some(
        (segment) => segment === 'status' || segment === 'success',
      );
      if (
        (!currentStep && !(statusPage && nextStep === 'submitted')) ||
        (currentStep &&
          TRANSPORT_STEPS.indexOf(currentStep) >
            TRANSPORT_STEPS.indexOf(nextStep)) ||
        (statusPage && nextStep !== 'submitted')
      )
        return <Redirect href={transportStepHref(nextStep)} />;
    }
  }

  if (isAuthenticated && user?.role === 'customer' && !inProviderOnboarding) {
    return <Redirect href="/(customer)/(tabs)" />;
  }

  if (
    isAuthenticated &&
    needsProviderOnboarding(user) &&
    !inProviderOnboarding
  ) {
    return <Redirect href="/(provider)/register/services" />;
  }

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="resume" options={{ animation: 'none' }} />
      <Stack.Screen name="register/index" />
      <Stack.Screen name="register/services" />
      <Stack.Screen name="register/business" />
      <Stack.Screen name="register/transport" />
      <Stack.Screen name="register/hotel" />
      <Stack.Screen name="register/tours" />
      <Stack.Screen name="register/guide" />
      <Stack.Screen name="register/restaurant" />
      <Stack.Screen name="register/verification" />
      <Stack.Screen name="register/review" />
      <Stack.Screen name="register/success" />
      <Stack.Screen name="status" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="vehicles/add" />
      <Stack.Screen name="rooms/index" />
      <Stack.Screen name="rooms/add" />
      <Stack.Screen name="transport/index" />
      <Stack.Screen name="transport/trips/create" />
      <Stack.Screen name="transport/route-add" />
      <Stack.Screen name="transport/stop-add" />
      <Stack.Screen name="hotel/index" />
      <Stack.Screen name="hotel/availability" />
      <Stack.Screen name="hotel/check-in" />
      <Stack.Screen name="itineraries/index" />
      <Stack.Screen name="itineraries/add" />
      <Stack.Screen name="booking/[id]" />
      <Stack.Screen name="passengers" />
      <Stack.Screen name="reviews" />
      <Stack.Screen name="messages" />
      <Stack.Screen name="messages/[id]" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="payment-accounts" />
      <Stack.Screen name="payments/index" />
      <Stack.Screen name="payments/verify/[paymentId]" />
      <Stack.Screen name="location" />
      <Stack.Screen name="topup" />
    </Stack>
  );
}
