import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { PickupPoint } from '@/types/route';
import { formatTime } from '@/utils/formatTime';
import { useHomeDesign } from '@/constants/homeDesign';
import { useTravelPresentation } from '@/components/ui/TravelDesignProvider';
import { Fonts } from '@/constants/typography';

interface PickupCardProps {
  pickup: PickupPoint;
  selected?: boolean;
  onPress?: () => void;
  index?: number;
}

export function PickupCard({ pickup, selected, onPress, index }: PickupCardProps) {
  const travel = useTravelPresentation();
  const theme = useHomeDesign();
  if (travel)
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityLabel={`${pickup.name}${pickup.time ? `, ${formatTime(pickup.time)}` : ''}`}
        accessibilityState={{ checked: Boolean(selected), selected: Boolean(selected) }}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: selected ? theme.primary : theme.border,
          backgroundColor: selected ? theme.soft : theme.surface,
          padding: 14,
        }}
      >
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: selected ? theme.primary : theme.muted,
            marginTop: 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected ? (
            <View
              style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: theme.action }}
            />
          ) : null}
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Text
              style={{
                flex: 1,
                fontFamily: Fonts.bodySemiBold,
                fontSize: 12,
                lineHeight: 18,
                color: theme.text,
              }}
            >
              {pickup.name}
            </Text>
            {pickup.time ? (
              <Text
                style={{
                  fontFamily: Fonts.bodyMedium,
                  fontSize: 10,
                  lineHeight: 18,
                  color: selected ? theme.primary : theme.muted,
                }}
              >
                {formatTime(pickup.time)}
              </Text>
            ) : null}
          </View>
          <Text
            style={{ fontFamily: Fonts.body, fontSize: 11, lineHeight: 17, color: theme.muted }}
          >
            {pickup.address || 'Pickup location'}
          </Text>
          <Text
            style={{
              alignSelf: 'flex-start',
              borderRadius: 5,
              paddingHorizontal: 6,
              paddingVertical: 2,
              fontFamily: Fonts.bodyMedium,
              fontSize: 10,
              color: theme.primary,
              backgroundColor: selected ? theme.surface : theme.field,
            }}
          >
            {pickup.distanceKm > 0 ? `${pickup.distanceKm.toFixed(1)} km away` : 'Boarding point'}
          </Text>
        </View>
      </Pressable>
    );
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected && styles.selected]}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
    >
      <View style={[styles.icon, selected && styles.iconSelected]}>
        {index != null ? (
          <Text style={[styles.index, selected && styles.indexSelected]}>{index}</Text>
        ) : (
          <Ionicons name="location" size={18} color={selected ? Colors.white : Colors.action} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{pickup.name}</Text>
        <Text style={styles.address}>{pickup.address || 'Pickup location'}</Text>
        <Text style={styles.meta}>
          {pickup.time ? `${formatTime(pickup.time)} · ` : ''}
          {pickup.distanceKm > 0 ? `${pickup.distanceKm.toFixed(1)} km away` : 'On route'}
        </Text>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  selected: {
    borderColor: Colors.action,
    backgroundColor: Colors.actionSoft,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSelected: {
    backgroundColor: Colors.action,
  },
  index: {
    ...Typography.bodyBold,
    color: Colors.primary,
    fontSize: 14,
  },
  indexSelected: {
    color: Colors.white,
  },
  name: {
    ...Typography.bodyBold,
    color: Colors.dark,
  },
  address: {
    ...Typography.caption,
    color: Colors.muted,
    marginTop: 2,
  },
  meta: {
    ...Typography.small,
    color: Colors.action,
    marginTop: 6,
    fontWeight: '600',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.action,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.action,
  },
});
