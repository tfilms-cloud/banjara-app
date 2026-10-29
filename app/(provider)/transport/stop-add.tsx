import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationPinField } from '@/components/location';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as providerService from '@/services/providerService';
import { useProviderStore } from '@/store/providerStore';
import {
  displayStopName,
  formatCorridor,
  formatRouteStop,
  parseCorridor,
  parseRouteStop,
} from '@/utils/corridors';
import { paramId } from '@/utils/navigation';
import type { LocationPickerValue } from '@/types/location';

export default function AddStopScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    kind?: string | string[];
    name?: string | string[];
    route?: string | string[];
  }>();
  const kind = paramId(params.kind) === 'dropoff' ? 'dropoff' : 'pickup';
  const previousName = paramId(params.name);
  const parsedPrevious = parseRouteStop(previousName);
  const isEditing = Boolean(previousName);
  const isPickup = kind === 'pickup';
  const provider = useProviderStore((s) => s.provider);
  const routes = useProviderStore((s) => s.routes);
  const setTransport = useProviderStore((s) => s.setTransport);
  const saveProgress = useProviderStore((s) => s.saveProgress);
  const refreshDashboard = useProviderStore((s) => s.refreshDashboard);

  const routeOptions = useMemo(() => {
    const fromApi = routes
      .filter((item) => item.origin && item.destination)
      .map((item) => formatCorridor(item.origin, item.destination));
    const fromProfile = provider?.transport?.operatingRoutes ?? [];
    return [...new Set([...fromProfile, ...fromApi])]
      .map((item) => parseCorridor(item) ?? { origin: item, destination: '' })
      .filter((item) => item.origin && item.destination)
      .map((item) => {
        const value = formatCorridor(item.origin, item.destination);
        return { value, label: value };
      });
  }, [provider?.transport?.operatingRoutes, routes]);

  const inferredRoute =
    paramId(params.route) ||
    (parsedPrevious.origin && parsedPrevious.destination
      ? formatCorridor(parsedPrevious.origin, parsedPrevious.destination)
      : '') ||
    (routeOptions.length === 1 ? routeOptions[0].value : '');

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(displayStopName(previousName));
  const [route, setRoute] = useState(inferredRoute);
  const [picked, setPicked] = useState<LocationPickerValue | null>(null);
  const selectedCorridor = parseCorridor(route);

  const onSave = async () => {
    const place = displayStopName(name);
    if (!place) {
      Alert.alert('Choose a place', 'Search or pin the stop on the map, like you do for pickup.');
      return;
    }
    if (!selectedCorridor) {
      Alert.alert(
        'Choose a route',
        isPickup
          ? 'Pick the corridor this boarding point belongs to, like Islamabad → Hunza.'
          : 'Pick the corridor this drop-off belongs to. Hunza drop-offs stay on the Hunza route.'
      );
      return;
    }

    const label = formatRouteStop(place, selectedCorridor.origin, selectedCorridor.destination);

    setSaving(true);
    try {
      if (isPickup) {
        try {
          await providerService.createProviderPickup({
            name: place,
            address: picked?.address.formattedAddress || place,
            latitude: picked?.latitude ?? 0,
            longitude: picked?.longitude ?? 0,
          });
        } catch (error) {
          const message = getApiErrorMessage(error);
          if (!message.toLowerCase().includes('approved')) {
            throw error;
          }
        }
      }
      const field = isPickup ? 'pickupLocations' : 'dropoffLocations';
      const current = provider?.transport?.[field] ?? [];
      const withoutOld = previousName ? current.filter((item) => item !== previousName) : current;
      const next = withoutOld.some((item) => item.toLowerCase() === label.toLowerCase())
        ? withoutOld
        : [...withoutOld, label];
      setTransport({ ...provider?.transport, [field]: next });
      await saveProgress();
      await refreshDashboard();
      Alert.alert(
        isEditing ? (isPickup ? 'Pickup updated' : 'Drop-off updated') : isPickup ? 'Pickup saved' : 'Drop-off saved',
        `${place} is on ${formatCorridor(selectedCorridor.origin, selectedCorridor.destination)}.`
      );
      router.back();
    } catch (error) {
      Alert.alert('Could not save', getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={isEditing ? (isPickup ? 'Edit pickup' : 'Edit drop-off') : isPickup ? 'Add pickup' : 'Add drop-off'}
        showBack
        fallbackHref={'/(provider)/transport' as never}
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
          <Text style={styles.heading}>{isPickup ? 'Where travelers board' : 'Where travelers get off'}</Text>
          <Text style={styles.sub}>
            {isPickup
              ? 'Pick the route first, then pin a stand in the start city. Each route keeps its own boarding points.'
              : 'Pick the route first. A Hunza drop-off belongs to Islamabad → Hunza, not to another destination.'}
          </Text>
          {routeOptions.length ? (
            <SearchSelect
              label="Route"
              placeholder="Which corridor is this stop for?"
              value={route}
              options={routeOptions}
              searchable={false}
              leftIcon="navigate-outline"
              onChange={setRoute}
              hint={
                selectedCorridor
                  ? isPickup
                    ? `Board in ${selectedCorridor.origin}`
                    : `Get off in ${selectedCorridor.destination}`
                  : undefined
              }
            />
          ) : (
            <Text style={styles.sub}>
              Add a route first (From → To), then pin pickup and drop-off on that corridor.
            </Text>
          )}
          <LocationPinField
            label={
              isPickup
                ? selectedCorridor
                  ? `Pickup in ${selectedCorridor.origin}`
                  : 'Pickup point'
                : selectedCorridor
                  ? `Drop-off in ${selectedCorridor.destination}`
                  : 'Drop-off point'
            }
            value={name}
            onChangeText={setName}
            onPicked={setPicked}
            result="place"
            mapTitle={isPickup ? 'Pin a pickup' : 'Pin a drop-off'}
            placeholder="Search or pin on the map"
          />
          <Button
            title={isEditing ? 'Save changes' : isPickup ? 'Save pickup' : 'Save drop-off'}
            loading={saving}
            onPress={() => void onSave()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heading: { ...Typography.h2, color: Colors.dark },
  sub: { ...Typography.caption, color: Colors.muted, lineHeight: 18, marginTop: -8 },
});
