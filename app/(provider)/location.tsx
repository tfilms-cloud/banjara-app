import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AddressPreview,
  CurrentLocationButton,
  LocationConfirmationCard,
  LocationMap,
  LocationPermissionHandler,
  LocationSearchBar,
} from '@/components/location';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { isHotelService, isTourLikeService, isTransportService } from '@/constants/providerOptions';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import {
  useCurrentLocation,
  useLocationPicker,
  useLocationSearch,
  useReverseGeocode,
} from '@/hooks/useLocationPicker';
import { getApiErrorMessage } from '@/services/apiError';
import * as locationService from '@/services/locationService';
import { useProviderStore } from '@/store/providerStore';

function nextSetupRoute(services: string[]) {
  if (services.some((s) => isTransportService(s) || s === 'carRental')) {
    return '/(provider)/register/transport';
  }
  if (services.some((s) => isHotelService(s))) {
    return '/(provider)/register/hotel';
  }
  if (services.some((s) => isTourLikeService(s))) return '/(provider)/register/tours';
  return '/(provider)/register/verification';
}

export default function BusinessLocationScreen() {
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isOnboarding = mode === 'onboarding';

  const draft = useProviderStore((s) => s.draft);
  const provider = useProviderStore((s) => s.provider);
  const setLocationDraft = useProviderStore((s) => s.setLocationDraft);
  const setProvider = useProviderStore((s) => s.setProvider);
  const saveProgress = useProviderStore((s) => s.saveProgress);
  const saving = useProviderStore((s) => s.saving);

  const search = useLocationSearch();
  const { reverse, loading: reversing } = useReverseGeocode();
  const current = useCurrentLocation();
  const picker = useLocationPicker({
    latitude: draft.location?.latitude ?? provider?.latitude,
    longitude: draft.location?.longitude ?? provider?.longitude,
    address:
      draft.location?.address ??
      provider?.structuredAddress ?? {
        city: draft.business.city || provider?.city,
        formattedAddress: draft.business.address || provider?.address,
        country: 'Pakistan',
      },
    placeName: draft.location?.placeName ?? provider?.businessName,
  });

  const [loadedExisting, setLoadedExisting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(
    provider?.locationUpdatedAt ?? null
  );

  useEffect(() => {
    if (isOnboarding || loadedExisting) return;
    let alive = true;
    (async () => {
      try {
        const existing = await locationService.getMyBusinessLocation();
        if (!alive) return;
        if (existing.latitude && existing.longitude) {
          picker.applyCoords(
            existing.latitude,
            existing.longitude,
            existing.address,
            existing.businessName
          );
        }
        setLastUpdated(existing.locationUpdatedAt ?? null);
      } catch {
        // New providers may not have a saved location yet.
      } finally {
        if (alive) setLoadedExisting(true);
      }
    })();
    return () => {
      alive = false;
    };
    // Load once when editing an existing business location.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnboarding, loadedExisting]);

  const onRegionSettled = useCallback(
    async (latitude: number, longitude: number) => {
      picker.applyCoords(latitude, longitude);
      const place = await reverse(latitude, longitude);
      if (place) {
        picker.applyPlace(place);
      }
    },
    [picker, reverse]
  );

  const onUseCurrent = async () => {
    const position = await current.getCurrentPosition();
    if (!position) return;
    picker.applyCoords(position.latitude, position.longitude);
    const place = await reverse(position.latitude, position.longitude);
    if (place) picker.applyPlace(place);
  };

  const onConfirmSave = async () => {
    const { latitude, longitude, address, placeName } = picker.value;
    if (!address.formattedAddress && !address.city) {
      Alert.alert('Select a location', 'Search or move the map to choose your business location.');
      return;
    }

    if (isOnboarding) {
      setLocationDraft({
        latitude,
        longitude,
        placeName,
        address: {
          ...address,
          city: address.city || draft.business.city || '',
          formattedAddress:
            address.formattedAddress ||
            draft.business.address ||
            [address.area, address.city, address.region, address.country].filter(Boolean).join(', '),
        },
      });
      try {
        await saveProgress();
        router.push(nextSetupRoute(draft.selectedServices) as never);
      } catch (error) {
        Alert.alert('Could not save', getApiErrorMessage(error));
      }
      return;
    }

    try {
      const saved = await picker.save();
      setLastUpdated(saved.locationUpdatedAt ?? new Date().toISOString());
      if (provider) {
        setProvider({
          ...provider,
          address: saved.address.formattedAddress || provider.address,
          city: saved.address.city || provider.city,
          latitude: saved.latitude,
          longitude: saved.longitude,
          structuredAddress: saved.address,
          locationUpdatedAt: saved.locationUpdatedAt ?? undefined,
        });
      }
      Alert.alert('Location saved', 'Customers can now find your business at this pin.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (error) {
      // Errors are shown in confirmation card / offline hint
      if (!picker.offlineHint) {
        Alert.alert('Could not save', getApiErrorMessage(error));
      }
    }
  };

  const businessName = provider?.businessName || draft.business.businessName || 'your business';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title="Business Location"
        showBack
        fallbackHref={
          isOnboarding ? '/(provider)/register/business' : '/(provider)/settings'
        }
      />

      {picker.confirming ? (
        <ScrollView
          contentContainerStyle={{
            padding: Spacing.lg,
            paddingBottom: insets.bottom + 24,
            gap: Spacing.lg,
          }}
        >
          <LocationMap
            latitude={picker.value.latitude}
            longitude={picker.value.longitude}
            onRegionSettled={() => undefined}
            height={180}
            interactive={false}
          />
          <LocationConfirmationCard
            businessName={businessName}
            placeName={picker.value.placeName}
            address={picker.value.address}
            latitude={picker.value.latitude}
            longitude={picker.value.longitude}
            saving={isOnboarding ? saving : picker.saving}
            error={picker.saveError}
            onEdit={() => picker.setConfirming(false)}
            onConfirm={() => void onConfirmSave()}
          />
        </ScrollView>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: Spacing.lg,
            paddingBottom: insets.bottom + 32,
            gap: Spacing.lg,
          }}
        >
          <View>
            <Text style={styles.heading}>Business Location</Text>
            <Text style={styles.sub}>
              Tap the map to drop the pin where customers can find your business.
            </Text>
            {lastUpdated ? (
              <Text style={styles.updated}>
                Last updated {new Date(lastUpdated).toLocaleString()}
              </Text>
            ) : null}
          </View>

          <LocationSearchBar
            value={search.query}
            onChangeText={search.search}
            results={search.results}
            searching={search.searching}
            error={search.error}
            onClear={search.clear}
            onSelect={(place) => {
              picker.applyPlace(place);
              search.clear();
            }}
          />

          <LocationMap
            latitude={picker.value.latitude}
            longitude={picker.value.longitude}
            onRegionSettled={(lat, lng) => void onRegionSettled(lat, lng)}
            height={300}
            pinMode="tap"
            pinLabel="Business pin"
          />

          <AddressPreview
            placeName={picker.value.placeName || businessName}
            address={picker.value.address}
            updating={reversing || search.searching || current.loading}
            latitude={picker.value.latitude}
            longitude={picker.value.longitude}
          />

          {current.error ? (
            <LocationPermissionHandler
              message={current.error}
              onOpenSettings={current.openSettings}
              onDismiss={() => current.setError(null)}
            />
          ) : null}

          {picker.offlineHint ? (
            <Text style={styles.offline}>{picker.saveError}</Text>
          ) : null}

          <CurrentLocationButton
            onPress={() => void onUseCurrent()}
            loading={current.loading}
          />

          <Button
            title="Confirm Location"
            onPress={() => picker.setConfirming(true)}
            disabled={reversing}
          />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heading: { ...Typography.h2, color: Colors.primary },
  sub: { ...Typography.body, color: Colors.muted, marginTop: Spacing.xs, lineHeight: 21 },
  updated: { ...Typography.small, color: Colors.muted, marginTop: Spacing.sm },
  offline: { ...Typography.caption, color: Colors.danger },
});
