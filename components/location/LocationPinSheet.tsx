import { Ionicons } from '@expo/vector-icons';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddressPreview } from '@/components/location/AddressPreview';
import { CurrentLocationButton } from '@/components/location/CurrentLocationButton';
import { LocationMap } from '@/components/location/LocationMap';
import { LocationPermissionHandler } from '@/components/location/LocationPermissionHandler';
import { LocationSearchBar } from '@/components/location/LocationSearchBar';
import { Button } from '@/components/ui/Button';
import { useThemeColors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import {
  usePinnedLocationPicker,
  useLocationSearch,
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

export function formatPickedCity(value: LocationPickerValue): string {
  return text(value.address.city) || formatPickedPlace(value);
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

/** Every map-based address field uses the same explicit pin-and-confirm flow. */
export function LocationPinSheet({ visible, onClose, ...props }: LocationPinSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      {visible ? <LocationPinSheetContent {...props} onClose={onClose} /> : null}
    </Modal>
  );
}

// Mount a fresh selection session each time: Back discards unconfirmed map changes.
function LocationPinSheetContent({
  onClose,
  onConfirm,
  title = 'Pin location',
  confirmLabel = 'Use this pin',
  initial,
}: Omit<LocationPinSheetProps, 'visible'>) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { height } = useWindowDimensions();
  const mapHeight = Math.max(240, Math.min(320, Math.round(height * 0.36)));
  const search = useLocationSearch();
  const {
    picker, current, reversing, reverseError, pinConfirmed,
    onPinStatusChange, onRegionSettled, selectPlace, onUseCurrent,
  } = usePinnedLocationPicker(initial);
  const canConfirm = pinConfirmed && !reversing && !current.loading;
  const close = () => { Keyboard.dismiss(); onClose(); };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable
          onPress={close}
          style={[styles.back, { backgroundColor: colors.card, borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel="Back from location picker"
        >
          <Ionicons name="arrow-back" size={22} color={colors.dark} />
        </Pressable>
        <Text style={[styles.title, { color: colors.dark }]} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={Keyboard.dismiss}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.hint, { color: colors.muted }]}>
          Search or use your current location. Move the map, then tap Pin location.
        </Text>
        <LocationSearchBar
          value={search.query}
          onChangeText={search.search}
          results={search.results}
          searching={search.searching}
          error={search.error}
          onClear={search.clear}
          onSelect={place => { selectPlace(place); search.clear(); }}
        />
        <LocationMap
          latitude={picker.value.latitude}
          longitude={picker.value.longitude}
          onRegionSettled={(lat, lng) => void onRegionSettled(lat, lng)}
          height={mapHeight}
          pinLabel="Your location"
          pinMode="center"
          requirePinConfirmation
          pinConfirmed={pinConfirmed}
          onPinStatusChange={onPinStatusChange}
          pinning={reversing || current.loading}
        />
        <AddressPreview
          title={pinConfirmed ? 'Pinned location' : 'Location preview'}
          placeName={picker.value.placeName}
          address={picker.value.address}
          updating={reversing || current.loading}
          showCoords
          latitude={picker.value.latitude}
          longitude={picker.value.longitude}
        />
        {reverseError ? (
          <Text style={[styles.hint, { color: colors.danger }]} accessibilityRole="alert">
            Address unavailable. Your pin coordinates are kept; tap Pin location to retry.
          </Text>
        ) : null}
        {current.error ? (
          <LocationPermissionHandler
            message={current.error}
            onOpenSettings={current.openSettings}
            onDismiss={() => current.setError(null)}
          />
        ) : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.md), backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <CurrentLocationButton onPress={() => void onUseCurrent()} loading={current.loading} />
        <Button
          title={confirmLabel}
          disabled={!canConfirm}
          onPress={() => {
            if (!canConfirm) return;
            Keyboard.dismiss();
            onConfirm(resolvePickedValue(picker.value));
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  back: { width: 44, height: 44, borderRadius: Radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center', ...Shadows.soft },
  headerSpacer: { width: 44 },
  title: { flex: 1, textAlign: 'center', fontFamily: Fonts.bodyBold, fontSize: 18 },
  content: { padding: Spacing.lg, gap: Spacing.md, width: '100%', maxWidth: 640, alignSelf: 'center' },
  hint: { fontFamily: Fonts.body, fontSize: 14, lineHeight: 21 },
  footer: { paddingTop: Spacing.md, paddingHorizontal: Spacing.lg, gap: Spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
});
