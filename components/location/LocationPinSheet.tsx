import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddressPreview } from '@/components/location/AddressPreview';
import { CurrentLocationButton } from '@/components/location/CurrentLocationButton';
import { LocationMap } from '@/components/location/LocationMap';
import { LocationPermissionHandler } from '@/components/location/LocationPermissionHandler';
import { LocationSearchBar } from '@/components/location/LocationSearchBar';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import {
  useCurrentLocation,
  useLocationPicker,
  useLocationSearch,
  useReverseGeocode,
} from '@/hooks/useLocationPicker';
import type { LocationPickerValue, PlaceSearchResult } from '@/types/location';

function text(...parts: Array<string | undefined>) {
  for (const part of parts) {
    if (typeof part === 'string' && part.trim()) return part.trim();
  }
  return '';
}

export function formatPickedPlace(value: LocationPickerValue): string {
  return (
    text(value.placeName, value.address.city, value.address.area, value.address.formattedAddress) ||
    `${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}`
  );
}

export function formatPickedAddress(value: LocationPickerValue): string {
  const joined = [value.address.street, value.address.area, value.address.city, value.address.region]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
  return text(value.address.formattedAddress, joined) || formatPickedPlace(value);
}

export function resolvePickedValue(value: LocationPickerValue): LocationPickerValue {
  const addressLine = formatPickedAddress(value);
  const place = formatPickedPlace(value);
  return {
    ...value,
    placeName: text(value.placeName) || place,
    address: {
      ...value.address,
      city: text(value.address.city) || place,
      formattedAddress: text(value.address.formattedAddress) || addressLine,
    },
  };
}

export function toPlaceSearchResult(value: LocationPickerValue): PlaceSearchResult {
  const resolved = resolvePickedValue(value);
  return {
    name: formatPickedPlace(resolved),
    address: resolved.address,
    latitude: resolved.latitude,
    longitude: resolved.longitude,
    location: {
      type: 'Point',
      coordinates: [resolved.longitude, resolved.latitude],
    },
  };
}

type LocationPinSheetProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (value: LocationPickerValue) => void;
  title?: string;
  confirmLabel?: string;
  initial?: Partial<LocationPickerValue>;
};

export function LocationPinSheet({
  visible,
  onClose,
  onConfirm,
  title = 'Pin location',
  confirmLabel = 'Use this pin',
  initial,
}: LocationPinSheetProps) {
  const insets = useSafeAreaInsets();
  const search = useLocationSearch();
  const { reverse, loading: reversing } = useReverseGeocode();
  const current = useCurrentLocation();
  const picker = useLocationPicker(initial);

  useEffect(() => {
    if (!visible) return;
    if (initial?.latitude != null && initial?.longitude != null) {
      picker.applyCoords(
        initial.latitude,
        initial.longitude,
        initial.address,
        initial.placeName
      );
    }
    // Reset only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const dropAt = useCallback(
    async (latitude: number, longitude: number) => {
      picker.applyCoords(latitude, longitude);
      const place = await reverse(latitude, longitude);
      if (place) picker.applyPlace(place);
    },
    [picker, reverse]
  );

  const onUseCurrent = async () => {
    const position = await current.getCurrentPosition();
    if (!position) return;
    await dropAt(position.latitude, position.longitude);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
          <Pressable
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close map"
          >
            <Ionicons name="close" size={22} color={Colors.dark} />
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.closeBtn} />
        </View>

        <Text style={styles.sub}>Tap the map to drop your pin. You can search or use GPS too.</Text>

        <View style={styles.searchWrap}>
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
        </View>

        <View style={styles.mapWrap}>
          <LocationMap
            latitude={picker.value.latitude}
            longitude={picker.value.longitude}
            onRegionSettled={(lat, lng) => void dropAt(lat, lng)}
            allowFullscreen={false}
            pinLabel="Your pin"
            pinMode="tap"
          />
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <AddressPreview
            title="Pinned location"
            placeName={picker.value.placeName}
            address={picker.value.address}
            updating={reversing || search.searching || current.loading}
            showCoords
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

          <CurrentLocationButton
            onPress={() => void onUseCurrent()}
            loading={current.loading}
          />

          <Button
            title={confirmLabel}
            onPress={() => onConfirm(resolvePickedValue(picker.value))}
            disabled={reversing}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.inputBg,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    color: Colors.dark,
    paddingHorizontal: Spacing.sm,
  },
  sub: {
    ...Typography.caption,
    color: Colors.muted,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    lineHeight: 18,
  },
  searchWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    zIndex: 20,
  },
  mapWrap: {
    flex: 1,
    minHeight: 220,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
});
