import { useThemedStyles } from '@/hooks/useThemedStyles';
import { ArrowRight, CheckCircle2, Star } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { useThemeColors, type ColorTokens } from '@/constants/colors';
import { Radius, Shadows, Spacing, Size } from '@/constants/spacing';
import { CustomerType, Fonts, TypeSize } from '@/constants/typography';
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
    return <Ionicons name="car" size={Size.iconSmall} color={color} />;
  }
  return <Ionicons name="bus" size={Size.iconSmall} color={color} />;
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
  const styles = useThemedStyles(createStyles);
  const showLogo = Boolean(logoUri) && !logoFailed;
  const stops = [...(trip.stops ?? [])].sort((a, b) => a.order - b.order).slice(0, 3);
  const hasRating = typeof trip.rating === 'number' && !Number.isNaN(trip.rating);
  const seats = trip.availableSeats;
  const vehicle = vehicleLine(trip);

  const seatBg =
    seats <= 0
      ? colors.inputBg
      : seats <= 3
        ? colors.coralSoft
        : colors.softGreen;

  const seatColor =
    seats <= 0
      ? colors.mutedLight
      : seats <= 3
        ? colors.coralText
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
              <Text style={[styles.agency, { color: colors.dark }]} numberOfLines={2}>
                {trip.agency.name}
              </Text>
              {trip.agency.verified ? (
                <CheckCircle2 size={Size.iconDetail} color={colors.action} strokeWidth={2.4} />
              ) : null}
            </View>
            <View style={styles.ratingRow}>
              {hasRating ? (
                <View style={styles.ratingChip}>
                  <Star size={Size.iconXs} color={colors.warning} fill={colors.warning} strokeWidth={0} />
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
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.fromLabel, { color: colors.mutedLight }]}>FROM</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.action }]}>
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
            icon={<ArrowRight size={Size.iconSmall} color={colors.white} strokeWidth={2.4} />}
            iconPosition="right"
            style={styles.bookBtn}
          />
        </View>
      </View>
    </AnimatedPressable>
  );
});

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: Size.border,
    borderColor: colors.border,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    ...Shadows.card,
  },
  compact: {
    width: Size.compactCard,
    marginRight: Spacing.md,
    marginBottom: 0,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: Size.touch,
    height: Size.touch,
    borderRadius: Radius.md,
    backgroundColor: colors.border,
    marginRight: Spacing.md,
    borderWidth: Size.border,
  },
  logoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitials: {
    fontFamily: Fonts.bodyBold,
    fontSize: TypeSize.body,
  },
  agencyCopy: { flex: 1, minWidth: 0, marginRight: Spacing.sm },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.micro,
  },
  agency: {
    ...CustomerType.card,
    flexShrink: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.micro,
    flexWrap: 'wrap',
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.tight,
  },
  rating: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: TypeSize.caption,
  },
  seatBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radius.full,
  },
  seatText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: TypeSize.micro,
  },
  journeyPill: {
    minHeight: Size.badge,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyPillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: TypeSize.micro,
  },
  routeBox: {
    borderRadius: Radius.lg,
    borderWidth: Size.border,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeCol: { flex: 1, minWidth: 0 },
  timeEnd: { alignItems: 'flex-end' },
  time: {
    fontFamily: Fonts.display,
    fontSize: TypeSize.subtitle,
    letterSpacing: -0.2,
  },
  city: {
    fontFamily: Fonts.bodyMedium,
    fontSize: TypeSize.caption,
    marginTop: Spacing.xxs,
  },
  mid: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  durationChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radius.full,
    borderWidth: Size.border,
    marginBottom: Spacing.xs,
  },
  duration: {
    fontFamily: Fonts.bodyMedium,
    fontSize: TypeSize.overline,
    letterSpacing: 0.1,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  dash: {
    flex: 1,
    height: Size.borderStrong,
    marginHorizontal: Spacing.tight,
    borderRadius: Radius.full,
  },
  dot: {
    width: Size.photoDot,
    height: Size.photoDot,
    borderRadius: Radius.full,
  },
  vehicleCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.tight,
    borderRadius: Radius.full,
    borderWidth: Size.border,
    ...Shadows.soft,
  },
  vehicle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: TypeSize.micro,
    maxWidth: Size.thumbnail,
  },
  stopsRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.xs,
    marginTop: Spacing.xxs,
  },
  stops: {
    fontFamily: Fonts.body,
    fontSize: TypeSize.micro,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.xxs,
  },
  fromLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: TypeSize.overline,
    letterSpacing: 0.4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginTop: Spacing.hairline,
  },
  price: {
    ...CustomerType.hero,
  },
  perSeat: {
    fontFamily: Fonts.body,
    fontSize: TypeSize.caption,
  },
  bookBtn: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    minHeight: Size.compactControl,
  },
});
