import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors, useThemeColors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ChipItem({
  label,
  value,
  active,
  onPress,
}: {
  label: string;
  value: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 16, stiffness: 350 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 350 });
      }}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.inputBg,
          borderColor: active ? colors.primary : colors.border,
        },
        active && styles.chipActive,
        animStyle,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Text
        style={[
          styles.text,
          {
            color: active ? colors.white : colors.muted,
            fontFamily: active ? Fonts.bodySemiBold : Fonts.bodyMedium,
          },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export function QuickDateChips({ selectedDate, onSelect }: QuickDateChipsProps) {
  const chips: Chip[] = [
    { key: 'today', label: 'Today', value: datePlusDays(0) },
    { key: 'tomorrow', label: 'Tomorrow', value: datePlusDays(1) },
    { key: 'weekend', label: 'This weekend', value: nextWeekendDate() },
  ];

  return (
    <View style={styles.row}>
      {chips.map((chip) => (
        <ChipItem
          key={chip.key}
          label={chip.label}
          value={chip.value}
          active={selectedDate === chip.value}
          onPress={() => onSelect(chip.value)}
        />
      ))}
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
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    ...Shadows.soft,
  },
  text: {
    fontSize: 12,
    letterSpacing: -0.1,
  },
});
