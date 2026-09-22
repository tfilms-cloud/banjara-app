import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaceAutocompleteSelect } from '@/components/ui/PlaceAutocompleteSelect';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { TRIP_CITY_OPTIONS } from '@/constants/tripPlaces';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as providerService from '@/services/providerService';
import { useProviderStore } from '@/store/providerStore';
import { formatCorridor } from '@/utils/corridors';
import { paramId } from '@/utils/navigation';
import type { PlaceSearchResult } from '@/types/location';

function toPlace(name: string, place?: PlaceSearchResult) {
  return {
    name: place?.name || name,
    latitude: place?.latitude ?? 0,
    longitude: place?.longitude ?? 0,
  };
}

export default function AddRouteScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string | string[];
    from?: string | string[];
    to?: string | string[];
    stops?: string | string[];
    previous?: string | string[];
  }>();
  const routeId = paramId(params.id);
  const previousLabel = paramId(params.previous);
  const isEditing = Boolean(routeId || previousLabel || paramId(params.from));
  const provider = useProviderStore((s) => s.provider);
  const routes = useProviderStore((s) => s.routes);
  const setTransport = useProviderStore((s) => s.setTransport);
  const saveProgress = useProviderStore((s) => s.saveProgress);
  const refreshDashboard = useProviderStore((s) => s.refreshDashboard);
  const existing = useMemo(
    () => (routeId ? routes.find((item) => item.id === routeId) : undefined),
    [routeId, routes]
  );

  const [saving, setSaving] = useState(false);
  const [origin, setOrigin] = useState(paramId(params.from) || existing?.origin || '');
  const [destination, setDestination] = useState(paramId(params.to) || existing?.destination || '');
  const [originPlace, setOriginPlace] = useState<PlaceSearchResult | undefined>();
  const [destinationPlace, setDestinationPlace] = useState<PlaceSearchResult | undefined>();
  const [stops, setStops] = useState(
    paramId(params.stops) || existing?.stops?.join(', ') || ''
  );

  const replaceProfileLabel = async (nextLabel: string) => {
    const current = provider?.transport?.operatingRoutes ?? [];
    const withoutOld = current.filter((item) => {
      if (previousLabel && item === previousLabel) return false;
      if (existing) {
        const old = formatCorridor(existing.origin, existing.destination);
        if (item === old) return false;
      }
      return true;
    });
    const next = withoutOld.some((item) => item.toLowerCase() === nextLabel.toLowerCase())
      ? withoutOld
      : [...withoutOld, nextLabel];
    setTransport({ ...provider?.transport, operatingRoutes: next });
    await saveProgress();
  };

  const onSave = async () => {
    if (!origin.trim() || !destination.trim()) {
      Alert.alert('Choose both places', 'Pin or search a start city and an end city.');
      return;
    }
    if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      Alert.alert('Same places', 'Start and end must be different.');
      return;
    }

    const stopList = stops
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const label = formatCorridor(origin, destination);
    const payload = {
      origin: toPlace(origin, originPlace),
      destination: toPlace(destination, destinationPlace),
      stops: stopList,
    };
    setSaving(true);
    try {
      try {
        if (routeId && !routeId.startsWith('profile-')) {
          await providerService.updateProviderRoute(routeId, payload);
        } else {
          await providerService.createProviderRoute(payload);
        }
      } catch (error) {
        const message = getApiErrorMessage(error);
        if (!message.toLowerCase().includes('approved')) {
          throw error;
        }
      }
      await replaceProfileLabel(label);
      await refreshDashboard();
      Alert.alert(isEditing ? 'Route updated' : 'Route saved', `${label} is on your Transport listing.`);
      router.back();
    } catch (error) {
      Alert.alert('Could not save route', getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Remove route', `Remove ${formatCorridor(origin || 'this', destination || 'route')}?`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            if (routeId && !routeId.startsWith('profile-')) {
              await providerService.deleteProviderRoute(routeId);
            }
            const current = provider?.transport?.operatingRoutes ?? [];
            const oldLabel =
              previousLabel ||
              (existing ? formatCorridor(existing.origin, existing.destination) : labelFallback(origin, destination));
            setTransport({
              ...provider?.transport,
              operatingRoutes: current.filter((item) => item !== oldLabel),
            });
            await saveProgress();
            await refreshDashboard();
            router.back();
          } catch (error) {
            Alert.alert('Could not remove', getApiErrorMessage(error));
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header
        title={isEditing ? 'Edit route' : 'Add route'}
        showBack
        fallbackHref={'/(provider)/transport/index' as never}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: Spacing.lg,
            paddingBottom: insets.bottom + 40,
            gap: Spacing.lg,
          }}
        >
          <Text style={styles.heading}>The corridor you drive</Text>
          <Text style={styles.sub}>
            A route is Islamabad → Hunza. Pickup points are boarding spots — add those on Pickups.
          </Text>
          <PlaceAutocompleteSelect
            label="From"
            leftIcon="navigate-outline"
            placeholder="Search or pin start city"
            value={origin}
            suggestions={TRIP_CITY_OPTIONS}
            onChange={(name, place) => {
              setOrigin(name);
              setOriginPlace(place);
            }}
            hint="Same map search travelers use for pickup"
          />
          <PlaceAutocompleteSelect
            label="To"
            leftIcon="flag-outline"
            placeholder="Search or pin end city"
            value={destination}
            suggestions={TRIP_CITY_OPTIONS.filter((name) => name !== origin)}
            onChange={(name, place) => {
              setDestination(name);
              setDestinationPlace(place);
            }}
          />
          <Input
            label="Stops along the way (optional)"
            value={stops}
            onChangeText={setStops}
            placeholder="Chilas, Gilgit"
            hint="Comma-separated towns between From and To"
          />
          <Button title={isEditing ? 'Save changes' : 'Save route'} loading={saving} onPress={() => void onSave()} />
          {isEditing ? <Button title="Remove route" variant="danger" onPress={onDelete} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function labelFallback(origin: string, destination: string) {
  if (!origin) return '';
  return destination ? formatCorridor(origin, destination) : origin;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heading: { ...Typography.h2, color: Colors.dark },
  sub: { ...Typography.caption, color: Colors.muted, lineHeight: 18, marginTop: -8 },
});
