import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { View } from 'react-native';
import {
  LocationPinSheet,
  formatPickedAddress,
  formatPickedCity,
  formatPickedPlace,
  resolvePickedValue,
} from '@/components/location/LocationPinSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useThemeColors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import type { LocationPickerValue } from '@/types/location';

type LocationPinFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onPicked?: (value: LocationPickerValue) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  /** Choose the address, city, or place/stop name appropriate for the field. */
  result?: 'address' | 'place' | 'city';
  /** Append the pinned name to a comma-separated list. */
  append?: boolean;
  mapTitle?: string;
  mapButtonLabel?: string;
  /** Show a dedicated button that opens the full-page map. Default true. */
  showMapButton?: boolean;
  initialLatitude?: number;
  initialLongitude?: number;
};

export function LocationPinField({
  label,
  value,
  onChangeText,
  onPicked,
  error,
  hint,
  placeholder,
  result = 'address',
  append = false,
  mapTitle,
  mapButtonLabel = 'Open full map',
  showMapButton = true,
  initialLatitude,
  initialLongitude,
}: LocationPinFieldProps) {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const [lastPicked, setLastPicked] = useState<{ text: string; value: LocationPickerValue } | null>(null);

  const openMap = () => setOpen(true);

  const apply = (picked: LocationPickerValue) => {
    const resolved = resolvePickedValue(picked);
    const next =
      result === 'city' ? formatPickedCity(resolved) : result === 'place' ? formatPickedPlace(resolved) : formatPickedAddress(resolved);
    const trimmed = value.replace(/,\s*$/, '').trim();
    const nextText = append && trimmed ? `${trimmed}, ${next}` : next;
    setLastPicked({ text: nextText, value: resolved });
    onChangeText(nextText);
    onPicked?.(resolved);
    setOpen(false);
  };

  return (
    <View style={{ gap: Spacing.sm }}>
      <Input
        label={label}
        value={value}
        onChangeText={onChangeText}
        error={error}
        placeholder={placeholder}
        hint={hint ?? 'Type the address, or tap Open full map'}
        leftIcon="location-outline"
        rightIcon="map-outline"
        onRightPress={openMap}
      />

      {showMapButton ? (
        <Button
          title={mapButtonLabel}
          onPress={openMap}
          variant="primary"
          icon={<Ionicons name="map" size={18} color={colors.white} />}
          iconPosition="left"
        />
      ) : null}

      <LocationPinSheet
        visible={open}
        onClose={() => setOpen(false)}
        onConfirm={apply}
        title={mapTitle ?? `Pin ${label.toLowerCase()}`}
        initial={
          initialLatitude != null && initialLongitude != null
            ? { latitude: initialLatitude, longitude: initialLongitude }
            : lastPicked?.text === value ? lastPicked.value : undefined
        }
      />
    </View>
  );
}
