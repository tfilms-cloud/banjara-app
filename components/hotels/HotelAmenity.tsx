import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import type { HotelAmenity } from '@/types/hotel';

const iconMap: Partial<Record<HotelAmenity, keyof typeof Ionicons.glyphMap>> = {
  WiFi: 'wifi',
  'Air Conditioning': 'snow',
  Breakfast: 'cafe',
  Parking: 'car',
  Restaurant: 'restaurant',
  'Room Service': 'notifications',
  'Swimming Pool': 'water',
  'Mountain View': 'image',
  '24/7 Reception': 'time',
  'Airport Transfer': 'airplane',
  Heating: 'flame',
  Laundry: 'shirt',
};

interface HotelAmenityChipProps {
  amenity: HotelAmenity;
  compact?: boolean;
}

export function HotelAmenityChip({ amenity, compact }: HotelAmenityChipProps) {
  return (
    <View style={[styles.chip, compact && styles.compact]}>
      <Ionicons name={iconMap[amenity] ?? 'checkmark'} size={14} color={Colors.secondary} />
      {!compact ? <Text style={styles.label}>{amenity}</Text> : null}
    </View>
  );
}

export function HotelAmenityList({ amenities }: { amenities: HotelAmenity[] }) {
  return (
    <View style={styles.list}>
      {amenities.map((amenity) => (
        <HotelAmenityChip key={amenity} amenity={amenity} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.softBlue,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  compact: { paddingHorizontal: 8 },
  label: { ...Typography.small, color: Colors.primary, fontWeight: '600' },
});
