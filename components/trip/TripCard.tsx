import { ArrowRight, CheckCircle2, Star } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { Colors, useThemeColors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import type { TripWithDetails, VehicleType } from '@/types/trip';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDuration, formatTime } from '@/utils/formatTime';
import { vehicleTypeLabel } from '@/utils/helpers';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

interface TripCardProps {
  trip: TripWithDetails;
  onPress?: () => void;
  compact?: boolean;
}

function agencyInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'A';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function vehicleLine(trip: TripWithDetails) {
  const named = trip.vehicleName?.trim();
  if (named) return named;
  const bits = [trip.vehicleBrand, trip.vehicleModel].filter((value) => Boolean(value?.trim()));
  if (bits.length) return bits.join(' ');
  return vehicleTypeLabel(trip.vehicleType);
}

function VehicleGlyph({ type, color }: { type: VehicleType; color: string }) {
  if (type === 'car' || type === 'private') {
    return <Ionicons name="car" size={14} color={color} />;
  }
  return <Ionicons name="bus" size={14} color={color} />;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const TripCard = memo(function TripCard({ trip, onPress, compact }: TripCardProps) {
  const logoUri = useMemo(
    () => normalizeMediaUrl(trip.agency.logo) ?? (trip.agency.logo || undefined),
    [trip.agency.logo]
  );
  const [logoFailed, setLogoFailed] = useState(false);
  const journeyLabel = trip.journeyType === 'round_trip' ? 'Round trip' : 'One way';
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUri]);

  const colors = useThemeColors();
  const showLogo = Boolean(logoUri) && !logoFailed;
  const stops = [...(trip.stops ?? [])].sort((a, b) => a.order - b.order).slice(0, 3);
  const hasRating = typeof trip.rating === 'number' && !Number.isNaN(trip.rating);
  const seats = trip.availableSeats;
  const vehicle = vehicleLine(trip);

  const seatBg =
    seats <= 0
      ? colors.inputBg
      : seats <= 3
        ? colors.softDanger
        : colors.softGreen;

  const seatColor =
    seats <= 0
      ? colors.mutedLight
      : seats <= 3
        ? colors.danger
        : colors.action;

  const seatLabel =
    seats <= 0
      ? 'Sold out'
      : seats <= 3
        ? `Only ${seats} seat${seats === 1 ? '' : 's'} left`
        : `${seats} seats left`;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.985, { damping: 16, stiffness: 280 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 280 });
      }}
      accessibilityRole="button"
      accessibilityLabel={`${trip.agency.name}, ${trip.from} to ${trip.to}, ${formatTime(trip.departureTime)}, ${formatCurrency(trip.price, trip.currency)}, ${seats} seats left`}
      style={animatedStyle}
    >
      <View
        style={[
          styles.card,
          compact && styles.compact,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.top}>
          {showLogo ? (
            <Image
              source={{ uri: logoUri }}
              style={[styles.logo, { borderColor: colors.border }]}
              contentFit="cover"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <View
              style={[
                styles.logo,
                styles.logoFallback,
                { backgroundColor: colors.primarySoft, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.logoInitials, { color: colors.primary }]}>
                {agencyInitials(trip.agency.name)}
              </Text>
            </View>
          )}

          <View style={styles.agencyCopy}>
            <View style={styles.nameRow}>
              <Text style={[styles.agency, { color: colors.dark }]} numberOfLines={1}>
                {trip.agency.name}
              </Text>
              {trip.agency.verified ? (
                <CheckCircle2 size={15} color={colors.action} strokeWidth={2.4} />
              ) : null}
            </View>
            <View style={styles.ratingRow}>
              {hasRating ? (
                <View style={styles.ratingChip}>
                  <Star size={11} color={colors.warning} fill={colors.warning} strokeWidth={0} />
                  <Text style={[styles.rating, { color: colors.dark }]}>
                    {trip.rating.toFixed(1)}
                  </Text>
                </View>
              ) : null}
              <View style={[styles.seatBadge, { backgroundColor: seatBg }]}>
                <Text style={[styles.seatText, { color: seatColor }]}>{seatLabel}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.journeyPill, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.journeyPillText, { color: colors.primary }]}>{journeyLabel}</Text>
          </View>
        </View>

        <View style={[styles.routeBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <View style={styles.route}>
            <View style={styles.timeCol}>
              <Text style={[styles.time, { color: colors.dark }]}>{formatTime(trip.departureTime)}</Text>
              <Text style={[styles.city, { color: colors.muted }]} numberOfLines={1}>
                {trip.from}
              </Text>
            </View>

            <View style={styles.mid}>
              <View style={[styles.durationChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.duration, { color: colors.muted }]}>
                  {formatDuration(trip.durationMinutes)}
                </Text>
              </View>
              <View style={styles.line}>
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                <View style={[styles.dash, { backgroundColor: colors.primary }]} />
                <View style={[styles.vehicleCapsule, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <VehicleGlyph type={trip.vehicleType} color={colors.primary} />
                  <Text style={[styles.vehicle, { color: colors.dark }]} numberOfLines={1}>
                    {vehicle}
                  </Text>
                </View>
                <View style={[styles.dash, { backgroundColor: colors.warning }]} />
                <View style={[styles.dot, { backgroundColor: colors.warning }]} />
              </View>
            </View>

            <View style={[styles.timeCol, styles.timeEnd]}>
              <Text style={[styles.time, { color: colors.dark }]}>{formatTime(trip.arrivalTime)}</Text>
              <Text style={[styles.city, { color: colors.muted }]} numberOfLines={1}>
                {trip.to}
              </Text>
            </View>
          </View>

          {stops.length > 0 ? (
            <View style={[styles.stopsRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.stops, { color: colors.mutedLight }]} numberOfLines={1}>
                Via {stops.map((stop) => stop.name).join(' · ')}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={[styles.fromLabel, { color: colors.mutedLight }]}>FROM</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.dark }]}>
                {formatCurrency(trip.price, trip.currency)}
              </Text>
              <Text style={[styles.perSeat, { color: colors.mutedLight }]}> / seat</Text>
            </View>
          </View>
          <Button
            title="Book seat"
            onPress={onPress}
            compact
            fullWidth={false}
            icon={<ArrowRight size={14} color={colors.white} strokeWidth={2.4} />}
            iconPosition="right"
            style={styles.bookBtn}
          />
        </View>
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    ...Shadows.card,
  },
  compact: {
    width: 320,
    marginRight: Spacing.md,
    marginBottom: 0,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.border,
    marginRight: Spacing.md,
    borderWidth: 1,
  },
  logoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitials: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  agencyCopy: { flex: 1, minWidth: 0, marginRight: Spacing.sm },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  agency: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    flexShrink: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
    flexWrap: 'wrap',
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
  },
  seatBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  seatText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
  },
  journeyPill: {
    minHeight: 26,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyPillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
  },
  routeBox: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeCol: { width: 84 },
  timeEnd: { alignItems: 'flex-end' },
  time: {
    fontFamily: Fonts.display,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  city: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    marginTop: 2,
  },
  mid: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  durationChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginBottom: 4,
  },
  duration: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.1,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  dash: {
    flex: 1,
    height: 1.5,
    marginHorizontal: 3,
    borderRadius: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  vehicleCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    ...Shadows.soft,
  },
  vehicle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    maxWidth: 68,
  },
  stopsRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.xs,
    marginTop: 2,
  },
  stops: {
    fontFamily: Fonts.body,
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: 2,
  },
  fromLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 1,
  },
  price: {
    fontFamily: Fonts.display,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  perSeat: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  bookBtn: {
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    minHeight: 40,
  },
});
