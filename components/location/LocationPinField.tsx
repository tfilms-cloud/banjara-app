import { useState } from 'react';
import { View } from 'react-native';
import {
  LocationPinSheet,
  formatPickedAddress,
  formatPickedPlace,
  resolvePickedValue,
} from '@/components/location/LocationPinSheet';
import { Input } from '@/components/ui/Input';
import type { LocationPickerValue } from '@/types/location';

type LocationPinFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onPicked?: (value: LocationPickerValue) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  /** `address` fills a street line; `place` fills a city / stop name. */
  result?: 'address' | 'place';
  /** Append the pinned name to a comma-separated list. */
  append?: boolean;
  mapTitle?: string;
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
  initialLatitude,
  initialLongitude,
}: LocationPinFieldProps) {
  const [open, setOpen] = useState(false);

  const apply = (picked: LocationPickerValue) => {
    const resolved = resolvePickedValue(picked);
    const next =
      result === 'place' ? formatPickedPlace(resolved) : formatPickedAddress(resolved);
    if (append) {
      const trimmed = value.replace(/,\s*$/, '').trim();
      onChangeText(trimmed ? `${trimmed}, ${next}` : next);
    } else {
      onChangeText(next);
    }
    onPicked?.(resolved);
    setOpen(false);
  };

  return (
    <View>
      <Input
        label={label}
        value={value}
        onChangeText={onChangeText}
        error={error}
        placeholder={placeholder}
        hint={hint ?? 'Type here, or tap the map icon to drop a pin'}
        leftIcon="location-outline"
        rightIcon="map-outline"
        onRightPress={() => setOpen(true)}
      />
      <LocationPinSheet
        visible={open}
        onClose={() => setOpen(false)}
        onConfirm={apply}
        title={mapTitle ?? `Pin ${label.toLowerCase()}`}
        initial={
          initialLatitude != null && initialLongitude != null
            ? { latitude: initialLatitude, longitude: initialLongitude }
            : undefined
        }
      />
    </View>
  );
}
