import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import type { PickupPoint } from '@/types/route';
import { formatTime } from '@/utils/formatTime';

interface MapFallbackProps {
  title?: string;
  subtitle?: string;
  latitude?: number;
  longitude?: number;
  height?: number;
  pickups?: PickupPoint[];
  selectedPickupId?: string;
  onSelectPickup?: (pickup: PickupPoint) => void;
  /** Stay inside Banjara — open in-app full map */
  onOpenInAppMap?: () => void;
  /** Stay inside Banjara — show in-app route to selected pin */
  onShowInAppRoute?: () => void;
}

export function MapFallback({
  title = 'Map preview',
  subtitle,
  latitude,
  longitude,
  height = 200,
  pickups = [],
  selectedPickupId,
  onSelectPickup,
  onOpenInAppMap,
  onShowInAppRoute,
}: MapFallbackProps) {
  const selected = pickups.find((p) => p.id === selectedPickupId) ?? pickups[0];
  const lat = selected?.coordinates.latitude ?? latitude;
  const lng = selected?.coordinates.longitude ?? longitude;
  const hasCoords =
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng);

  return (
    <View style={[styles.wrapper, height != null ? { minHeight: height } : styles.wrapperFlex]}>
      <View style={styles.hero}>
        <Ionicons name="map-outline" size={28} color={Colors.action} />
        <Text style={styles.title}>{selected?.name ?? title}</Text>
        <Text style={styles.subtitle}>
          {selected?.address ||
            subtitle ||
            'Maps open inside Banjara — you stay in the app.'}
        </Text>
        {hasCoords ? (
          <Text style={styles.coords}>
            {lat!.toFixed(4)}, {lng!.toFixed(4)}
          </Text>
        ) : null}
      </View>

      {pickups.length > 0 ? (
        <View style={styles.pins}>
          {pickups.map((pickup, index) => {
            const active = pickup.id === (selectedPickupId ?? selected?.id);
            return (
              <Pressable
                key={pickup.id}
                onPress={() => onSelectPickup?.(pickup)}
                style={[styles.pinRow, active && styles.pinRowActive]}
              >
                <View style={[styles.pinBadge, active && styles.pinBadgeActive]}>
                  <Text style={[styles.pinBadgeText, active && styles.pinBadgeTextActive]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pinName} numberOfLines={1}>
                    {pickup.name}
                  </Text>
                  <Text style={styles.pinMeta} numberOfLines={1}>
                    {pickup.time ? `${formatTime(pickup.time)} · ` : ''}
                    {pickup.address || 'Pickup point'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          onPress={() => onOpenInAppMap?.()}
          style={styles.btnGhost}
          disabled={!onOpenInAppMap}
        >
          <Ionicons name="map-outline" size={16} color={Colors.primary} />
          <Text style={styles.btnGhostText}>Open in Banjara</Text>
        </Pressable>
        <Pressable
          onPress={() => onShowInAppRoute?.()}
          style={styles.btn}
          disabled={!onShowInAppRoute}
        >
          <Ionicons name="navigate" size={16} color={Colors.white} />
          <Text style={styles.btnText}>Show route</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    backgroundColor: Colors.primarySoft,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  wrapperFlex: {
    flex: 1,
    borderRadius: 0,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    ...Typography.bodyBold,
    color: Colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  coords: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.action,
    marginTop: 4,
  },
  pins: {
    gap: 8,
  },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pinRowActive: {
    borderColor: Colors.action,
    backgroundColor: Colors.actionSoft,
  },
  pinBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBadgeActive: {
    backgroundColor: Colors.action,
  },
  pinBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.primary,
  },
  pinBadgeTextActive: {
    color: Colors.white,
  },
  pinName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.dark,
  },
  pinMeta: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btn: {
    flex: 1,
    minHeight: 42,
    backgroundColor: Colors.action,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  btnText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '700',
  },
  btnGhost: {
    flex: 1,
    minHeight: 42,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  btnGhostText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
});
