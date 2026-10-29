import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
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
import { nextProviderSetupRoute } from '@/constants/providerOptions';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import {
  usePinnedLocationPicker,
  useLocationSearch,
} from '@/hooks/useLocationPicker';
import { getApiErrorMessage } from '@/services/apiError';
import * as locationService from '@/services/locationService';
import { useProviderStore } from '@/store/providerStore';
import type { LocationPickerValue } from '@/types/location';

export default function BusinessLocationScreen() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const mapHeight = Math.max(240, Math.min(320, Math.round(screenHeight * 0.36)));
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isOnboarding = mode === 'onboarding';

  const draft = useProviderStore((s) => s.draft);
  const provider = useProviderStore((s) => s.provider);
  const setLocationDraft = useProviderStore((s) => s.setLocationDraft);
  const setProvider = useProviderStore((s) => s.setProvider);
  const saveProgress = useProviderStore((s) => s.saveProgress);
  const saving = useProviderStore((s) => s.saving);
  const [advancing, setAdvancing] = useState(false);
  const [candidate] = useState(() => isOnboarding ? useProviderStore.getState().formDrafts['location.candidate'] as Partial<LocationPickerValue> | undefined : undefined);

  const search = useLocationSearch();
  const { picker, current, reversing, reverseError, pinConfirmed, onPinStatusChange, onRegionSettled, selectPlace, onUseCurrent } = usePinnedLocationPicker({
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
    ...candidate,
  });

  useEffect(() => {
    if (isOnboarding) useProviderStore.getState().setFormDraft('location.candidate', picker.value);
  }, [isOnboarding, picker.value]);

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

  const onConfirmSave = async () => {
    if (!pinConfirmed || reversing || current.loading || advancing || saving) return;
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
        setAdvancing(true);
        await saveProgress();
        if (draft.selectedServices.includes('transport')) await useProviderStore.getState().checkpoint('location');
        useProviderStore.getState().clearFormDraft('location.candidate');
        router.push(nextProviderSetupRoute(draft.selectedServices) as never);
      } catch (error) {
        Alert.alert('Could not save', getApiErrorMessage(error));
      } finally {
        setAdvancing(false);
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
            saving={isOnboarding ? saving || advancing : picker.saving}
            error={picker.saveError}
            onEdit={() => picker.setConfirming(false)}
            onConfirm={() => void onConfirmSave()}
          />
        </ScrollView>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={Keyboard.dismiss}
          contentContainerStyle={[styles.content, {
            padding: Spacing.lg,
            paddingBottom: Spacing.lg,
            gap: Spacing.md,
          }]}
          showsVerticalScrollIndicator={false}
        >
          <View>
            <Text style={styles.heading}>Pin your business</Text>
            <Text style={styles.sub}>
              Search for your address, then move the map to place the pin at your entrance.
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
              selectPlace(place);
              search.clear();
            }}
          />

          <LocationMap
            latitude={picker.value.latitude}
            longitude={picker.value.longitude}
            onRegionSettled={(lat, lng) => void onRegionSettled(lat, lng)}
            height={mapHeight}
            pinMode="center"
            pinLabel="Business pin"
            requirePinConfirmation
            pinConfirmed={pinConfirmed}
            onPinStatusChange={onPinStatusChange}
            pinning={reversing || current.loading}
          />

          <AddressPreview
            title={pinConfirmed ? 'Pinned location' : 'Location preview'}
            placeName={picker.value.placeName || businessName}
            address={picker.value.address}
            updating={reversing || current.loading}
            latitude={picker.value.latitude}
            longitude={picker.value.longitude}
          />

          {reverseError ? <Text style={styles.offline}>Address unavailable. Your pin coordinates are kept; tap Pin location to retry.</Text> : null}

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

        </ScrollView>
      )}
      {!picker.confirming ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <CurrentLocationButton
            onPress={() => void onUseCurrent()}
            loading={current.loading}
          />

          <Button
            title="Confirm Location"
            onPress={() => picker.setConfirming(true)}
            disabled={!pinConfirmed || reversing || current.loading}
          />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center' },
  footer: { paddingTop: Spacing.md, paddingHorizontal: Spacing.lg, gap: Spacing.sm, backgroundColor: Colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  heading: { ...Typography.h3, color: Colors.dark },
  sub: { ...Typography.body, color: Colors.muted, marginTop: Spacing.xs, lineHeight: 21 },
  updated: { ...Typography.small, color: Colors.muted, marginTop: Spacing.sm },
  offline: { ...Typography.caption, color: Colors.danger },
});
