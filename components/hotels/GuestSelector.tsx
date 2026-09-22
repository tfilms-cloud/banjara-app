import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

interface CounterProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

function Counter({ label, value, min = 0, max = 8, onChange }: CounterProps) {
  return (
    <View style={styles.counter}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable style={styles.btn} onPress={() => onChange(Math.max(min, value - 1))}>
          <Ionicons name="remove" size={16} color={Colors.primary} />
        </Pressable>
        <Text style={styles.value}>{value}</Text>
        <Pressable style={styles.btn} onPress={() => onChange(Math.min(max, value + 1))}>
          <Ionicons name="add" size={16} color={Colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

interface GuestRoomSelectorProps {
  adults: number;
  children: number;
  rooms: number;
  onChangeAdults: (value: number) => void;
  onChangeChildren: (value: number) => void;
  onChangeRooms: (value: number) => void;
}

export function GuestRoomSelector({
  adults,
  children,
  rooms,
  onChangeAdults,
  onChangeChildren,
  onChangeRooms,
}: GuestRoomSelectorProps) {
  return (
    <View style={styles.wrap}>
      <Counter label="Adults" value={adults} min={1} onChange={onChangeAdults} />
      <Counter label="Children" value={children} min={0} onChange={onChangeChildren} />
      <Counter label="Rooms" value={rooms} min={1} max={5} onChange={onChangeRooms} />
    </View>
  );
}

export function GuestSummary({
  adults,
  children,
  rooms,
}: {
  adults: number;
  children: number;
  rooms: number;
}) {
  return (
    <Text style={styles.summary}>
      {adults + children} Guests · {rooms} Room{rooms > 1 ? 's' : ''}
    </Text>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  counter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { ...Typography.bodyBold, color: Colors.primary },
  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  btn: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { ...Typography.bodyBold, color: Colors.primary, minWidth: 18, textAlign: 'center' },
  summary: { ...Typography.caption, color: Colors.muted },
});
