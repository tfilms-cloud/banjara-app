import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, useThemeColors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import type { HotelRoom } from '@/types/hotel';
import { formatCurrency } from '@/utils/formatCurrency';

interface HotelRoomCardProps {
  room: HotelRoom;
  selected?: boolean;
  onSelect?: () => void;
  onView?: () => void;
}

export function HotelRoomCard({ room, selected, onSelect, onView }: HotelRoomCardProps) {
  const colors = useThemeColors();
  const meta = [
    room.roomType?.replace(/_/g, ' '),
    room.bedType,
    `${room.capacity} guests`,
    room.sizeSqm ? `${room.sizeSqm} m²` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const amenityLabels = room.amenities
    .filter((a) => {
      const lower = a.toLowerCase();
      if (room.breakfastIncluded && lower.includes('breakfast')) return false;
      return true;
    })
    .slice(0, 3);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: selected ? colors.action : colors.border,
        },
        selected ? Shadows.card : Shadows.soft,
      ]}
    >
      <Pressable
        onPress={onView}
        accessibilityRole="button"
        accessibilityLabel={`View details for ${room.name}`}
      >
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: room.images[0] || undefined }}
            style={styles.image}
            contentFit="cover"
          />
          {selected ? (
            <View style={[styles.selectedPill, { backgroundColor: colors.action }]}>
              <Ionicons name="checkmark" size={12} color="#fff" />
              <Text style={styles.selectedPillText}>Selected</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={[styles.name, { color: colors.dark }]} numberOfLines={1}>
                {room.name}
              </Text>
              <Text style={[styles.meta, { color: colors.muted }]} numberOfLines={1}>
                {meta}
              </Text>
            </View>

            <Pressable
              onPress={onSelect}
              hitSlop={12}
              style={[
                styles.radio,
                {
                  borderColor: selected ? colors.action : colors.border,
                  backgroundColor: selected ? colors.action : colors.card,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: !!selected }}
              accessibilityLabel={selected ? `${room.name} selected` : `Select ${room.name}`}
            >
              {selected ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
            </Pressable>
          </View>

          <View style={styles.chips}>
            {room.breakfastIncluded ? (
              <MiniChip label="Breakfast" tint={colors.primarySoft} color={colors.primary} />
            ) : null}
            {room.freeCancellation ? (
              <MiniChip label="Free cancel" tint={colors.actionSoft} color={colors.action} />
            ) : null}
            {amenityLabels.map((a) => (
              <MiniChip key={a} label={a} tint={colors.inputBg} color={colors.muted} />
            ))}
          </View>

          <View style={styles.footer}>
            <View>
              <Text style={[styles.price, { color: colors.action }]}>
                {formatCurrency(room.pricePerNight)}
                <Text style={[styles.perNight, { color: colors.muted }]}> / night</Text>
              </Text>
              <Text style={[styles.available, { color: colors.muted }]}>
                {room.availableRooms} room{room.availableRooms === 1 ? '' : 's'} left
              </Text>
            </View>

            <View style={styles.detailsRow}>
              <Text style={[styles.detailsText, { color: colors.primary }]}>See details</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function MiniChip({
  label,
  tint,
  color,
}: {
  label: string;
  tint: string;
  color: string;
}) {
  return (
    <View style={[styles.miniChip, { backgroundColor: tint }]}>
      <Text style={[styles.miniChipText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

interface RoomQuantitySelectorProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
}

export function RoomQuantitySelector({ value, max, onChange }: RoomQuantitySelectorProps) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        styles.qty,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.qtyLabel, { color: colors.primary }]}>Rooms</Text>
      <View style={styles.qtyControls}>
        <Pressable
          style={[styles.qtyBtn, { backgroundColor: colors.primarySoft }]}
          onPress={() => onChange(Math.max(1, value - 1))}
        >
          <Ionicons name="remove" size={16} color={colors.primary} />
        </Pressable>
        <Text style={[styles.qtyValue, { color: colors.primary }]}>{value}</Text>
        <Pressable
          style={[styles.qtyBtn, { backgroundColor: colors.primarySoft }]}
          onPress={() => onChange(Math.min(max, value + 1))}
        >
          <Ionicons name="add" size={16} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  imageWrap: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.primarySoft,
  },
  image: {
    width: '100%',
    height: 160,
  },
  selectedPill: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  selectedPillText: {
    color: '#fff',
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
  },
  body: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  titleBlock: {
    flex: 1,
  },
  name: {
    fontFamily: Fonts.display,
    fontSize: 20,
    letterSpacing: -0.2,
  },
  meta: {
    ...Typography.caption,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  radio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  miniChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  miniChipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  price: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
  },
  perNight: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
  },
  available: {
    ...Typography.small,
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailsText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },
  qty: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  qtyLabel: { ...Typography.bodyBold },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    ...Typography.bodyBold,
    minWidth: 18,
    textAlign: 'center',
  },
});
