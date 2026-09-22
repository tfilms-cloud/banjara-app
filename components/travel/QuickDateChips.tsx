import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, useThemeColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { toISODate } from '@/utils/formatDate';

export function datePlusDays(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Next Saturday (or today if already Saturday). */
export function nextWeekendDate(): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  const day = date.getDay();
  const add = day === 6 ? 0 : (6 - day + 7) % 7 || 7;
  date.setDate(date.getDate() + add);
  return toISODate(date);
}

type Chip = { key: string; label: string; value: string };

type QuickDateChipsProps = {
  selectedDate: string;
  onSelect: (isoDate: string) => void;
};

export function QuickDateChips({ selectedDate, onSelect }: QuickDateChipsProps) {
  const colors = useThemeColors();
  const chips: Chip[] = [
    { key: 'today', label: 'Today', value: datePlusDays(0) },
    { key: 'tomorrow', label: 'Tomorrow', value: datePlusDays(1) },
    { key: 'weekend', label: 'This weekend', value: nextWeekendDate() },
  ];

  return (
    <View style={styles.row}>
      {chips.map((chip) => {
        const active = selectedDate === chip.value;
        return (
          <Pressable
            key={chip.key}
            onPress={() => onSelect(chip.value)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.primary : colors.inputBg,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={chip.label}
          >
            <Text
              style={[
                styles.text,
                { color: active ? colors.white : colors.muted },
              ]}
            >
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.muted,
  },
});
