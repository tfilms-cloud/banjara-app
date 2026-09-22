import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { HotelRoom } from '@/types/hotel';
import { formatCurrency } from '@/utils/formatCurrency';

interface HotelRoomCardProps {
  room: HotelRoom;
  selected?: boolean;
  onSelect?: () => void;
}

export function HotelRoomCard({ room, selected, onSelect }: HotelRoomCardProps) {
  return (
    <Pressable onPress={onSelect} style={[styles.card, selected && styles.selected]}>
      <Image source={{ uri: room.images[0] }} style={styles.image} contentFit="cover" />
      <View style={styles.body}>
        <Text style={styles.name}>{room.name}</Text>
        <Text style={styles.meta}>
          {room.bedType} · {room.capacity} Guests · {room.sizeSqm} m²
        </Text>
        <Text style={styles.amenities} numberOfLines={2}>
          {room.amenities.slice(0, 4).join(' · ')}
        </Text>
        {room.breakfastIncluded ? (
          <Text style={styles.flag}>Breakfast Included</Text>
        ) : null}
        {room.freeCancellation ? (
          <Text style={styles.cancel}>Free cancellation</Text>
        ) : null}
        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>{formatCurrency(room.pricePerNight)} / night</Text>
            <Text style={styles.available}>{room.availableRooms} rooms left</Text>
          </View>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>Select Room</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.secondary} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

interface RoomQuantitySelectorProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
}

export function RoomQuantitySelector({ value, max, onChange }: RoomQuantitySelectorProps) {
  return (
    <View style={styles.qty}>
      <Text style={styles.qtyLabel}>Rooms</Text>
      <View style={styles.qtyControls}>
        <Pressable
          style={styles.qtyBtn}
          onPress={() => onChange(Math.max(1, value - 1))}
        >
          <Ionicons name="remove" size={16} color={Colors.primary} />
        </Pressable>
        <Text style={styles.qtyValue}>{value}</Text>
        <Pressable
          style={styles.qtyBtn}
          onPress={() => onChange(Math.min(max, value + 1))}
        >
          <Ionicons name="add" size={16} color={Colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  selected: { borderColor: Colors.secondary, backgroundColor: '#F5F9FF' },
  image: { width: '100%', height: 140 },
  body: { padding: Spacing.lg, gap: Spacing.sm },
  name: { ...Typography.h3, color: Colors.primary },
  meta: { ...Typography.caption, color: Colors.muted },
  amenities: { ...Typography.caption, color: Colors.secondary },
  flag: { ...Typography.small, color: Colors.primary, fontWeight: '600' },
  cancel: { ...Typography.small, color: Colors.success, fontWeight: '600' },
  footer: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  price: { ...Typography.bodyBold, color: Colors.primary },
  available: { ...Typography.small, color: Colors.muted, marginTop: 2 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ctaText: { ...Typography.caption, color: Colors.secondary, fontWeight: '700' },
  qty: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qtyLabel: { ...Typography.bodyBold, color: Colors.primary },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: { ...Typography.bodyBold, color: Colors.primary, minWidth: 18, textAlign: 'center' },
});
