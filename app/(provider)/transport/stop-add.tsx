import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationPinField } from '@/components/location';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as providerService from '@/services/providerService';
import { useProviderStore } from '@/store/providerStore';
import { paramId } from '@/utils/navigation';
import type { LocationPickerValue } from '@/types/location';

export default function AddStopScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ kind?: string | string[]; name?: string | string[] }>();
  const kind = paramId(params.kind) === 'dropoff' ? 'dropoff' : 'pickup';
  const previousName = paramId(params.name);
  const isEditing = Boolean(previousName);
  const isPickup = kind === 'pickup';
  const provider = useProviderStore((s) => s.provider);
  const setTransport = useProviderStore((s) => s.setTransport);
  const saveProgress = useProviderStore((s) => s.saveProgress);
  const refreshDashboard = useProviderStore((s) => s.refreshDashboard);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(previousName);
  const [picked, setPicked] = useState<LocationPickerValue | null>(null);

  const onSave = async () => {
    const label = name.trim();
    if (!label) {
      Alert.alert('Choose a place', 'Search or pin the stop on the map, like you do for pickup.');
      return;
    }

    setSaving(true);
    try {
      if (isPickup) {
        try {
          await providerService.createProviderPickup({
            name: label,
            address: picked?.address.formattedAddress || label,
            latitude: picked?.latitude ?? 0,
            longitude: picked?.longitude ?? 0,
          });
        } catch (error) {
          const message = getApiErrorMessage(error);
          if (!message.toLowerCase().includes('approved')) {
            throw error;
          }
        }
        const current = provider?.transport?.pickupLocations ?? [];
        const withoutOld = previousName ? current.filter((item) => item !== previousName) : current;
        if (!withoutOld.some((item) => item.toLowerCase() === label.toLowerCase())) {
          setTransport({ ...provider?.transport, pickupLocations: [...withoutOld, label] });
        } else {
          setTransport({ ...provider?.transport, pickupLocations: withoutOld });
        }
        await saveProgress();
      } else {
        const current = provider?.transport?.dropoffLocations ?? [];
        const withoutOld = previousName ? current.filter((item) => item !== previousName) : current;
        const next = withoutOld.some((item) => item.toLowerCase() === label.toLowerCase())
          ? withoutOld
          : [...withoutOld, label];
        setTransport({ ...provider?.transport, dropoffLocations: next });
        await saveProgress();
      }
      await refreshDashboard();
      Alert.alert(
        isEditing ? (isPickup ? 'Pickup updated' : 'Drop-off updated') : isPickup ? 'Pickup saved' : 'Drop-off saved',
        `${label} is on your listing.`
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
          <Text style={styles.heading}>{isPickup ? 'Where travelers board' : 'Where travelers get off'}</Text>
          <Text style={styles.sub}>
            {isPickup
              ? 'Pin a stand, hotel, or landmark. Travelers choose one of these when they book a trip.'
              : 'Pin the places you drop travelers at the destination.'}
          </Text>
          <LocationPinField
            label={isPickup ? 'Pickup point' : 'Drop-off point'}
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
