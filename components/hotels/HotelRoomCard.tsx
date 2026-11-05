import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TravelSurface } from '@/components/ui/TravelPrimitives';
import { useHotelDesign } from '@/constants/hotelDesign';
import { Fonts } from '@/constants/typography';
import type { HotelRoom } from '@/types/hotel';
import { formatCurrency } from '@/utils/formatCurrency';
import { roomInventory, roomSummary } from '@/utils/hotelRoomSelection';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

interface HotelRoomCardProps {
  room: HotelRoom;
  selected?: boolean;
  onSelect?: () => void;
  onView?: () => void;
}

/** Separate photo/detail and radio actions prevent nested press targets from competing. */
export function HotelRoomCard({ room, selected, onSelect, onView }: HotelRoomCardProps) {
  const theme = useHotelDesign();
  const [failed, setFailed] = useState<string[]>([]);
  const photo = room.images.map(normalizeMediaUrl).find((uri) => uri && !failed.includes(uri));
  const count = roomInventory(room);
  const amenities = [...new Set(room.amenities.map((value) => value.trim()).filter(Boolean))]
    .filter((value) => !(room.breakfastIncluded && /breakfast/i.test(value)))
    .slice(0, 3);
  return (
    <TravelSurface
      style={[
        s.card,
        { borderColor: selected ? theme.primary : theme.border, borderWidth: selected ? 2 : 1 },
      ]}
    >
      <Pressable
        onPress={onView}
        accessibilityRole="button"
        accessibilityLabel={`View photos and details for ${room.name}`}
      >
        <View style={[s.photo, { backgroundColor: theme.soft }]}>
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              accessibilityLabel={`${room.name} photo`}
              onError={() => setFailed((previous) => [...previous, photo])}
            />
          ) : (
            <Ionicons name="bed-outline" size={36} color={theme.primary} />
          )}
          {selected ? (
            <View style={[s.selected, { backgroundColor: theme.action }]}>
              <Ionicons name="checkmark" size={14} color={theme.background} />
              <Text style={[s.selectedText, { color: theme.background }]}>Selected Room</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      <View style={s.body}>
        <View style={s.titleRow}>
          <View style={s.flex}>
            <Text style={[s.name, { color: theme.text }]}>{room.name}</Text>
            <Text style={[s.meta, { color: theme.muted }]}>{roomSummary(room)}</Text>
          </View>
          <Pressable
            onPress={onSelect}
            disabled={count === 0}
            accessibilityRole="radio"
            accessibilityState={{ selected: !!selected, disabled: count === 0 }}
            accessibilityLabel={`Select ${room.name}`}
            style={s.radioTarget}
          >
            <View
              style={[
                s.radio,
                {
                  backgroundColor: selected ? theme.primary : theme.neutral,
                  borderColor: selected ? theme.primary : theme.border,
                  opacity: count === 0 ? 0.5 : 1,
                },
              ]}
            >
              {selected ? <Ionicons name="checkmark" size={18} color={theme.background} /> : null}
            </View>
          </Pressable>
        </View>
        <View style={s.chips}>
          {room.breakfastIncluded ? (
            <RoomChip label="Breakfast included" icon="restaurant-outline" />
          ) : null}
          {amenities.map((label) => (
            <RoomChip key={label} label={label} icon={amenityIcon(label)} />
          ))}
          {room.freeCancellation ? (
            <RoomChip label="Free cancellation" icon="shield-checkmark-outline" />
          ) : null}
        </View>
        <View style={s.footer}>
          <View style={s.flex}>
            <Text style={[s.price, { color: selected ? theme.primary : theme.text }]}>
              {room.pricePerNight > 0 ? formatCurrency(room.pricePerNight) : 'Ask property'}
              {room.pricePerNight > 0 ? (
                <Text style={[s.perNight, { color: theme.muted }]}> / night</Text>
              ) : null}
            </Text>
            <Text style={[s.stock, { color: count <= 3 ? theme.coral : theme.muted }]}>
              {count === 0
                ? 'Sold out for these dates'
                : `${count} room${count === 1 ? '' : 's'} remaining`}
            </Text>
          </View>
          <Pressable
            onPress={onView}
            style={s.details}
            accessibilityRole="button"
            accessibilityLabel={`See details for ${room.name}`}
          >
            <Text style={[s.detailsText, { color: theme.primary }]}>See details</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.primary} />
          </Pressable>
        </View>
      </View>
    </TravelSurface>
  );
}

function amenityIcon(label: string): keyof typeof Ionicons.glyphMap {
  if (/wi.?fi|internet/i.test(label)) return 'wifi-outline';
  if (/heat|stove|fire/i.test(label)) return 'flame-outline';
  if (/kitchen/i.test(label)) return 'restaurant-outline';
  if (/view|terrace|balcony/i.test(label)) return 'image-outline';
  if (/water|bath/i.test(label)) return 'water-outline';
  if (/air|cool/i.test(label)) return 'snow-outline';
  return 'checkmark-circle-outline';
}

function RoomChip({ label, icon }: { label: string; icon: keyof typeof Ionicons.glyphMap }) {
  const theme = useHotelDesign();
  return (
    <View style={[s.chip, { backgroundColor: theme.neutral }]}>
      <Ionicons name={icon} size={12} color={theme.primary} />
      <Text style={[s.chipText, { color: theme.text }]}>{label}</Text>
    </View>
  );
}

export function RoomQuantitySelector({
  value,
  max,
  onChange,
  disabled = false,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const theme = useHotelDesign();
  return (
    <TravelSurface style={[s.quantity, { borderColor: theme.border }]}>
      <View style={s.flex}>
        <Text style={[s.quantityTitle, { color: theme.text }]}>Rooms</Text>
        <Text style={[s.meta, { color: theme.muted }]}>
          {disabled
            ? 'Select a room type below'
            : `${value} room${value === 1 ? '' : 's'} selected (max ${max} available)`}
        </Text>
      </View>
      <View style={s.controls}>
        <QuantityButton
          icon="remove"
          label="Remove one room"
          disabled={disabled || value <= 1}
          onPress={() => onChange(value - 1)}
        />
        <Text accessibilityLiveRegion="polite" style={[s.quantityValue, { color: theme.text }]}>
          {disabled ? '0' : value}
        </Text>
        <QuantityButton
          icon="add"
          label="Add one room"
          disabled={disabled || value >= max}
          onPress={() => onChange(value + 1)}
        />
      </View>
    </TravelSurface>
  );
}
function QuantityButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'add' | 'remove';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useHotelDesign();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[s.quantityButton, { backgroundColor: disabled ? theme.field : theme.soft }]}
    >
      <Ionicons name={icon} size={20} color={disabled ? theme.muted : theme.primary} />
    </Pressable>
  );
}
const s = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: { borderRadius: 30 },
  photo: { height: 176, alignItems: 'center', justifyContent: 'center' },
  selected: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  selectedText: { fontFamily: Fonts.bodySemiBold, fontSize: 11, lineHeight: 16 },
  body: { padding: 15, gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { fontFamily: Fonts.display, fontSize: 17, lineHeight: 23, letterSpacing: -0.3 },
  meta: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 18, marginTop: 3 },
  radioTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  radio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    maxWidth: '100%',
  },
  chipText: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 15, flexShrink: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontFamily: Fonts.bodyBold, fontSize: 15, lineHeight: 23 },
  perNight: { fontFamily: Fonts.body, fontSize: 11 },
  stock: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 17 },
  details: { minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingLeft: 3 },
  detailsText: { fontFamily: Fonts.bodySemiBold, fontSize: 11, lineHeight: 18 },
  quantity: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityTitle: { fontFamily: Fonts.bodyBold, fontSize: 14, lineHeight: 20 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: { fontFamily: Fonts.bodyBold, fontSize: 17, minWidth: 20, textAlign: 'center' },
});
