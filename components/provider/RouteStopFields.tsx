import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LocationPinField, formatPickedPlace } from '@/components/location';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { LocationPickerValue } from '@/types/location';
import { addUniquePlace, formatCorridor } from '@/utils/corridors';

type RouteStopFieldsProps = {
  origin: string;
  destination: string;
  pickups: string[];
  dropoffs: string[];
  onChangePickups: (next: string[]) => void;
  onChangeDropoffs: (next: string[]) => void;
};

function StopChips({
  values,
  onRemove,
}: {
  values: string[];
  onRemove: (value: string) => void;
}) {
  if (!values.length) return null;
  return (
    <View style={styles.chipRow}>
      {values.map((item) => (
        <Pressable key={item} onPress={() => onRemove(item)} style={styles.chip}>
          <Text style={styles.chipText}>{item}  ×</Text>
        </Pressable>
      ))}
    </View>
  );
}

function StopEditor({
  label,
  hint,
  mapTitle,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  hint: string;
  mapTitle: string;
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const add = (raw?: string) => {
    const next = addUniquePlace(values, raw ?? draft);
    if (next === values) {
      setDraft('');
      return;
    }
    onChange(next);
    setDraft('');
  };

  return (
    <View style={styles.stopBlock}>
      <LocationPinField
        label={label}
        value={draft}
        onChangeText={setDraft}
        onPicked={(picked: LocationPickerValue) => add(formatPickedPlace(picked))}
        result="place"
        hint={hint}
        mapTitle={mapTitle}
        placeholder={placeholder}
      />
      <StopChips values={values} onRemove={(item) => onChange(values.filter((value) => value !== item))} />
      {draft.trim() ? (
        <Button title="Add this stop" variant="outline" compact onPress={() => add()} />
      ) : null}
    </View>
  );
}

export function RouteStopFields({
  origin,
  destination,
  pickups,
  dropoffs,
  onChangePickups,
  onChangeDropoffs,
}: RouteStopFieldsProps) {
  const from = origin.trim() || 'the start city';
  const to = destination.trim() || 'the end city';
  const corridor = origin.trim() && destination.trim() ? formatCorridor(origin, destination) : '';

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        {corridor
          ? `Travelers board in ${from} and get off in ${to}. These stops belong to this route only.`
          : 'Pin From and To first, then add boarding and drop-off for that corridor.'}
      </Text>
      <StopEditor
        label={`Board in ${from}`}
        hint="Pickup stand, hotel, or landmark in the start city."
        mapTitle={`Pin a pickup in ${from}`}
        placeholder="Search or pin a boarding point"
        values={pickups}
        onChange={onChangePickups}
      />
      <StopEditor
        label={`Drop off in ${to}`}
        hint={`Only for this route — not for other destinations.`}
        mapTitle={`Pin a drop-off in ${to}`}
        placeholder="Search or pin where they get off"
        values={dropoffs}
        onChange={onChangeDropoffs}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  hint: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  stopBlock: { gap: Spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    backgroundColor: Colors.inputBg,
    borderRadius: 999,
    paddingHorizontal: Spacing.md,
    minHeight: 32,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: { ...Typography.caption, color: Colors.dark },
});
