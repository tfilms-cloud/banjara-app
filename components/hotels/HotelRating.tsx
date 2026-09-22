import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

interface HotelRatingProps {
  rating: number;
  reviewCount?: number;
  size?: number;
}

export function HotelRating({ rating, reviewCount, size = 14 }: HotelRatingProps) {
  return (
    <View style={styles.row}>
      <Ionicons name="star" size={size} color={Colors.accent} />
      <Text style={styles.rating}>{rating.toFixed(1)}</Text>
      {reviewCount != null ? (
        <Text style={styles.count}>({reviewCount})</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { ...Typography.caption, color: Colors.dark, fontWeight: '700' },
  count: { ...Typography.small, color: Colors.muted },
});
