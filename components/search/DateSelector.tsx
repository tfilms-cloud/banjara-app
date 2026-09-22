import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, useIsDarkMode } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { formatDate, toISODate } from '@/utils/formatDate';

interface DateSelectorProps {
  value: string;
  onChange: (isoDate: string) => void;
  label?: string;
}

export function DateSelector({ value, onChange, label = 'Travel Date' }: DateSelectorProps) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(value) : new Date();
  const darkMode = useIsDarkMode();

  return (
    <View>
      <Pressable style={styles.row} onPress={() => setOpen(true)}>
        <Ionicons name="calendar-outline" size={18} color={Colors.secondary} />
        <View style={styles.content}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{formatDate(value)}</Text>
        </View>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={date}
          mode="date"
          minimumDate={new Date()}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          themeVariant={darkMode ? 'dark' : 'light'}
          onChange={(_, selected) => {
            setOpen(Platform.OS === 'ios');
            if (selected) onChange(toISODate(selected));
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  content: { flex: 1 },
  label: {
    ...Typography.small,
    color: Colors.muted,
  },
  value: {
    ...Typography.bodyBold,
    color: Colors.primary,
    marginTop: 2,
  },
});
