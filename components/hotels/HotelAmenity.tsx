import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, Typography } from '@/constants/typography';
import type { HotelAmenity } from '@/types/hotel';
import { useTravelPresentation } from '@/components/ui/TravelDesignProvider';
import { useHotelDesign } from '@/constants/hotelDesign';

const iconMap: Partial<Record<string, keyof typeof Ionicons.glyphMap>> = {
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

const travelIcons: Partial<Record<string, keyof typeof Ionicons.glyphMap>> = {
  'Hot water': 'water',
  'Mountain view': 'image',
  'Private bathroom': 'water-outline',
};

interface HotelAmenityChipProps {
  amenity: HotelAmenity;
  compact?: boolean;
  tone?: 'neutral' | 'surface';
}

export function HotelAmenityChip({ amenity, compact, tone = 'neutral' }: HotelAmenityChipProps) {
  const travel = useTravelPresentation();
  const theme = useHotelDesign();
  return (
    <View
      style={[
        styles.chip,
        travel && {
          backgroundColor: theme.neutral,
          paddingHorizontal: 12,
          paddingVertical: 9,
          maxWidth: '100%',
        },
        travel &&
          tone === 'surface' && {
            backgroundColor: theme.surface,
            paddingVertical: 5,
            borderWidth: 1,
            borderColor: theme.border,
          },
        compact && styles.compact,
      ]}
    >
      <Ionicons
        name={iconMap[amenity] ?? (travel ? travelIcons[amenity] : undefined) ?? 'checkmark'}
        size={14}
        color={travel ? theme.primary : Colors.secondary}
      />
      {!compact ? (
        <Text
          style={[
            styles.label,
            travel && {
              color: theme.text,
              fontFamily: Fonts.bodyMedium,
              fontWeight: 'normal',
              flexShrink: 1,
              lineHeight: 18,
            },
            travel && tone === 'surface' && { fontSize: 11, lineHeight: 17 },
          ]}
        >
          {amenity}
        </Text>
      ) : null}
    </View>
  );
}

export function HotelAmenityList({
  amenities,
  layout = 'wrap',
  tone = 'neutral',
}: {
  amenities: HotelAmenity[];
  layout?: 'wrap' | 'column';
  tone?: 'neutral' | 'surface';
}) {
  return (
    <View
      style={[
        styles.list,
        layout === 'column' && { flexDirection: 'column', alignItems: 'flex-start', gap: 9 },
      ]}
    >
      {amenities.map((amenity) => (
        <HotelAmenityChip key={amenity} amenity={amenity} tone={tone} />
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
