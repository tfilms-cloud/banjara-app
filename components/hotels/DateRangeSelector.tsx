import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { formatDate } from '@/utils/formatDate';
import { calculateNights } from '@/utils/hotelPricing';

interface DateRangeSelectorProps {
  checkIn: string;
  checkOut: string;
  onChangeCheckIn: (value: string) => void;
  onChangeCheckOut: (value: string) => void;
}

export function DateRangeSelector({
  checkIn,
  checkOut,
  onChangeCheckIn,
  onChangeCheckOut,
}: DateRangeSelectorProps) {
  const [mode, setMode] = useState<'in' | 'out' | null>(null);
  const nights = calculateNights(checkIn, checkOut);

  return (
    <>
      <View style={styles.row}>
        <Pressable style={styles.item} onPress={() => setMode('in')} accessibilityLabel="Select check-in">
          <Ionicons name="calendar-outline" size={18} color={Colors.secondary} />
          <View>
            <Text style={styles.label}>Check-in</Text>
            <Text style={styles.value}>{formatDate(checkIn, false)}</Text>
          </View>
        </Pressable>
        <Pressable style={styles.item} onPress={() => setMode('out')} accessibilityLabel="Select check-out">
          <Ionicons name="calendar-outline" size={18} color={Colors.action} />
          <View>
            <Text style={styles.label}>Check-out</Text>
            <Text style={styles.value}>{formatDate(checkOut, false)}</Text>
          </View>
        </Pressable>
      </View>
      <Text style={styles.nights}>
        {nights} night{nights === 1 ? '' : 's'}
      </Text>

      <DatePickerModal
        visible={mode === 'in'}
        title="Check-in"
        value={checkIn}
        minimumDate={new Date()}
        onChange={(date) => {
          onChangeCheckIn(date);
          if (new Date(date) >= new Date(checkOut)) {
            const next = new Date(date);
            next.setDate(next.getDate() + 1);
            onChangeCheckOut(next.toISOString().slice(0, 10));
          }
        }}
        onClose={() => setMode(null)}
      />
      <DatePickerModal
        visible={mode === 'out'}
        title="Check-out"
        value={checkOut}
        minimumDate={new Date(checkIn)}
        onChange={onChangeCheckOut}
        onClose={() => setMode(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.md },
  item: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: { ...Typography.small, color: Colors.muted },
  value: { ...Typography.bodyBold, color: Colors.primary, marginTop: 2 },
  nights: {
    ...Typography.caption,
    color: Colors.action,
    fontWeight: '600',
    marginTop: -Spacing.sm,
  },
});
