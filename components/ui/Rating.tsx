import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

interface RatingProps {
  value: number;
  count?: number;
  size?: number;
}

export function Rating({ value, count, size = 14 }: RatingProps) {
  return (
    <View style={styles.row}>
      <Ionicons name="star" size={size} color={Colors.accent} />
      <Text style={styles.value}>{value.toFixed(1)}</Text>
      {count != null ? <Text style={styles.count}>({count})</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  value: {
    ...Typography.caption,
    color: Colors.dark,
    fontWeight: '700',
  },
  count: {
    ...Typography.small,
    color: Colors.muted,
  },
});
