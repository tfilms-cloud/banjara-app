import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Colors, useThemeColors } from '@/constants/colors';
import { Radius } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import type { Seat as SeatType, SeatStatus } from '@/types/seat';

interface SeatProps {
  seat: SeatType;
  onPress?: (seat: SeatType) => void;
}

const statusCopy: Record<SeatStatus, string> = {
  available: 'available',
  selected: 'selected',
  occupied: 'booked',
  reserved: 'unavailable',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Seat({ seat, onPress }: SeatProps) {
  const theme = useThemeColors();
  const statusColors: Record<SeatStatus, { bg: string; fg: string; border: string }> = {
    available: { bg: theme.white, fg: theme.dark, border: theme.primary },
    selected: { bg: theme.action, fg: theme.white, border: theme.actionDark },
    occupied: { bg: theme.seatOccupied, fg: theme.muted, border: theme.seatOccupied },
    reserved: { bg: theme.softAmber, fg: theme.primary, border: theme.accent },
  };
  const scale = useSharedValue(1);
  const colors = statusColors[seat.status];
  const disabled = seat.status === 'occupied' || seat.status === 'reserved';
  const selected = seat.status === 'selected';

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={() => onPress?.(seat)}
      onPressIn={() => {
        if (disabled) return;
        scale.value = withSpring(0.92, { damping: 16, stiffness: 280 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 280 });
      }}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={`Seat ${seat.label}, ${statusCopy[seat.status]}`}
      accessibilityState={{ disabled, selected }}
      style={[
        styles.seat,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          opacity: disabled ? 0.7 : 1,
        },
        animatedStyle,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: colors.fg },
          seat.status === 'occupied' && styles.bookedLabel,
        ]}
      >
        {seat.label}
      </Text>
      {selected ? <View style={styles.selectedMark} /> : null}
      {seat.status === 'occupied' ? <View style={styles.bookedBar} /> : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  seat: {
    minWidth: 48,
    minHeight: 48,
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
  },
  bookedLabel: {
    textDecorationLine: 'line-through',
  },
  selectedMark: {
    position: 'absolute',
    bottom: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
  },
  bookedBar: {
    position: 'absolute',
    width: 22,
    height: 2,
    backgroundColor: Colors.muted,
    transform: [{ rotate: '-18deg' }],
  },
});
