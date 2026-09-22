import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

interface PassengerSelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function PassengerSelector({
  value,
  onChange,
  min = 1,
  max = 8,
}: PassengerSelectorProps) {
  return (
    <View style={styles.row}>
      <Ionicons name="people-outline" size={18} color={Colors.secondary} />
      <View style={styles.content}>
        <Text style={styles.label}>Passengers</Text>
        <Text style={styles.value}>
          {value} {value === 1 ? 'traveler' : 'travelers'}
        </Text>
      </View>
      <View style={styles.controls}>
        <Pressable
          style={styles.btn}
          onPress={() => onChange(Math.max(min, value - 1))}
        >
          <Ionicons name="remove" size={16} color={Colors.primary} />
        </Pressable>
        <Text style={styles.count}>{value}</Text>
        <Pressable
          style={styles.btn}
          onPress={() => onChange(Math.min(max, value + 1))}
        >
          <Ionicons name="add" size={16} color={Colors.primary} />
        </Pressable>
      </View>
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
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    ...Typography.bodyBold,
    color: Colors.primary,
    minWidth: 18,
    textAlign: 'center',
  },
});
