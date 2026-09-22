import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import {
  distanceKmBetween,
  formatDistanceKm,
  isValidCoord,
  type MapPerson,
  type MapVehicleInfo,
} from '@/components/map/mapHelpers';
import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import type { Coordinates, PickupPoint } from '@/types/route';
import { formatTime } from '@/utils/formatTime';

type MapDetailPanelProps = {
  pickup: PickupPoint;
  pickupIndex: number;
  userLocation?: Coordinates | null;
  traveler?: MapPerson | null;
  vehicle?: MapVehicleInfo | null;
  directionsMode?: boolean;
  compact?: boolean;
  /** Prefer road-route distance when available */
  distanceKmOverride?: number | null;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  secondaryActionLabel: string;
  onSecondaryAction: () => void;
  onHide?: () => void;
};

export function MapDetailPanel({
  pickup,
  pickupIndex,
  userLocation,
  traveler,
  vehicle,
  directionsMode,
  compact,
  distanceKmOverride,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  onHide,
}: MapDetailPanelProps) {
  const distance =
    distanceKmOverride != null && Number.isFinite(distanceKmOverride)
      ? formatDistanceKm(distanceKmOverride)
      : isValidCoord(userLocation) && isValidCoord(pickup.coordinates)
        ? formatDistanceKm(
            pickup.distanceKm > 0
              ? pickup.distanceKm
              : distanceKmBetween(userLocation, pickup.coordinates)
          )
        : pickup.distanceKm > 0
          ? formatDistanceKm(pickup.distanceKm)
          : null;

  const callPhone = (phone?: string) => {
    if (!phone) return;
    void Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
  };

  return (
    <View style={[styles.shell, compact && styles.shellCompact]}>
      <View style={styles.handleRow}>
        <Pressable
          onPress={onHide}
          style={styles.handleHit}
          accessibilityRole="button"
          accessibilityLabel="Hide details"
          disabled={!onHide}
        >
          <View style={styles.handle} />
        </Pressable>
        {onHide ? (
          <Pressable
            onPress={onHide}
            style={styles.hideBtn}
            accessibilityRole="button"
            accessibilityLabel="Hide details"
            hitSlop={8}
          >
            <Ionicons name="chevron-down" size={16} color={Colors.muted} />
            <Text style={styles.hideText}>Hide</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.card}
        showsVerticalScrollIndicator={false}
        bounces={false}
        nestedScrollEnabled
      >
        <View style={styles.pickupRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>#{pickupIndex}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pickupName} numberOfLines={1}>
              {pickup.name}
            </Text>
            <Text style={styles.pickupAddress} numberOfLines={1}>
              {[pickup.address, pickup.time ? formatTime(pickup.time) : null]
                .filter(Boolean)
                .join(' · ') || 'Pickup location'}
            </Text>
          </View>
          {distance ? (
            <View style={styles.distancePill}>
              <Ionicons name="navigate-outline" size={12} color={Colors.action} />
              <Text style={styles.distanceText}>{distance}</Text>
            </View>
          ) : null}
        </View>

        {traveler ? (
          <PersonCard
            title={traveler.label || 'Traveler'}
            name={traveler.name}
            phone={traveler.phone}
            avatarUrl={traveler.avatarUrl}
            tone="you"
            onCall={() => callPhone(traveler.phone)}
          />
        ) : null}

        {vehicle ? (
          <View style={styles.vehicleCard}>
            <PersonCard
              title="Provider"
              name={vehicle.agencyName || vehicle.name}
              phone={vehicle.phone}
              avatarUrl={vehicle.agencyLogo || vehicle.imageUrl}
              tone="provider"
              onCall={() => callPhone(vehicle.phone)}
              embedded
            />
            <View style={styles.vehicleStrip}>
              <Avatar uri={vehicle.imageUrl || vehicle.agencyLogo} name={vehicle.name} size={32} />
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleName} numberOfLines={1}>
                  {vehicle.name}
                  {vehicle.typeLabel ? ` · ${vehicle.typeLabel}` : ''}
                </Text>
                <Text style={styles.vehicleSub} numberOfLines={1}>
                  {vehicle.plate ? `Plate ${vehicle.plate}` : 'Trip vehicle'}
                  {vehicle.rating != null && vehicle.rating > 0
                    ? ` · ★ ${vehicle.rating.toFixed(1)}`
                    : ''}
                </Text>
              </View>
              {vehicle.phone ? (
                <Pressable
                  style={styles.callBtn}
                  onPress={() => callPhone(vehicle.phone)}
                  accessibilityRole="button"
                  accessibilityLabel="Call provider"
                >
                  <Ionicons name="call" size={14} color={Colors.white} />
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          style={styles.btn}
          onPress={onSecondaryAction}
          accessibilityRole="button"
          accessibilityLabel={secondaryActionLabel}
        >
          <Ionicons
            name={compact ? 'map-outline' : 'arrow-back'}
            size={16}
            color={Colors.primary}
          />
          <Text style={styles.btnText} numberOfLines={1}>
            {secondaryActionLabel}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.btnPrimary]}
          onPress={onPrimaryAction}
          accessibilityRole="button"
          accessibilityLabel={primaryActionLabel}
        >
          <Ionicons name="navigate" size={16} color={Colors.white} />
          <Text style={[styles.btnText, { color: Colors.white }]} numberOfLines={1}>
            {primaryActionLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function PersonCard({
  title,
  name,
  phone,
  avatarUrl,
  tone,
  onCall,
  embedded,
}: {
  title: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  tone: 'you' | 'provider';
  onCall: () => void;
  embedded?: boolean;
}) {
  return (
    <View
      style={[
        styles.personCard,
        tone === 'you' ? styles.personYou : styles.personProvider,
        embedded && styles.personEmbedded,
      ]}
    >
      <Avatar uri={avatarUrl} name={name} size={36} />
      <View style={{ flex: 1 }}>
        <Text style={styles.personTitle}>{title}</Text>
        <Text style={styles.personName} numberOfLines={1}>
          {name}
        </Text>
        {phone ? (
          <Text style={styles.personPhone} numberOfLines={1}>
            {phone}
          </Text>
        ) : null}
      </View>
      {phone ? (
        <Pressable style={styles.personCall} onPress={onCall} hitSlop={8}>
          <Ionicons name="call-outline" size={15} color={Colors.action} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.float,
  },
  shellCompact: {
    marginTop: Spacing.sm,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 2,
    paddingHorizontal: Spacing.md,
    minHeight: 22,
  },
  handleHit: {
    paddingVertical: 4,
    paddingHorizontal: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  hideBtn: {
    position: 'absolute',
    right: Spacing.sm,
    top: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  hideText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.muted,
  },
  scroll: {
    maxHeight: 220,
  },
  card: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.white,
  },
  pickupName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.dark,
  },
  pickupAddress: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    marginTop: 1,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.actionSoft,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  distanceText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.action,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    padding: 8,
  },
  personEmbedded: {
    marginBottom: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  personYou: {
    backgroundColor: Colors.elevated,
  },
  personProvider: {
    backgroundColor: Colors.primarySoft,
  },
  personTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 9,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  personName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.dark,
  },
  personPhone: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.muted,
    marginTop: 1,
  },
  personCall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  vehicleCard: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  vehicleStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    backgroundColor: Colors.card,
  },
  vehicleName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.dark,
  },
  vehicleSub: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.muted,
    marginTop: 1,
  },
  callBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
  btn: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  btnPrimary: {
    backgroundColor: Colors.action,
    borderColor: Colors.action,
  },
  btnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.primary,
  },
});
