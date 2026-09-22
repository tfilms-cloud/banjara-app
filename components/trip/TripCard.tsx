import { Bus, Car, CheckCircle2, Star } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { Colors, useThemeColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
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
    return <Car size={14} color={color} strokeWidth={2} />;
  }
  return <Bus size={14} color={color} strokeWidth={2} />;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function TripCard({ trip, onPress, compact }: TripCardProps) {
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
  const seatTone = seats <= 0 ? colors.muted : seats <= 3 ? colors.accent : colors.action;
  const vehicle = vehicleLine(trip);

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
              style={styles.logo}
              contentFit="cover"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <View style={[styles.logo, styles.logoFallback, { backgroundColor: colors.primarySoft }]}>
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
                <>
                  <Star size={12} color={colors.warning} fill={colors.warning} strokeWidth={0} />
                  <Text style={[styles.rating, { color: colors.dark }]}>{trip.rating.toFixed(1)}</Text>
                </>
              ) : null}
              <Text style={[styles.seatInline, { color: seatTone }]}>
                {seats > 0 ? `${seats} seat${seats === 1 ? '' : 's'} left` : 'Sold out'}
              </Text>
            </View>
          </View>
          <View style={[styles.journeyPill, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.journeyPillText, { color: colors.filterText }]}>{journeyLabel}</Text>
          </View>
        </View>

        <View style={styles.route}>
          <View style={styles.timeCol}>
            <Text style={[styles.time, { color: colors.dark }]}>{formatTime(trip.departureTime)}</Text>
            <Text style={[styles.city, { color: colors.muted }]} numberOfLines={1}>
              {trip.from}
            </Text>
          </View>
          <View style={styles.mid}>
            <Text style={[styles.duration, { color: colors.muted }]}>
              {formatDuration(trip.durationMinutes)}
            </Text>
            <View style={styles.line}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <View style={[styles.dash, { backgroundColor: colors.primary }]} />
              <VehicleGlyph type={trip.vehicleType} color={colors.primary} />
              <View style={[styles.dash, { backgroundColor: colors.warning }]} />
              <View style={[styles.dot, { backgroundColor: colors.warning }]} />
            </View>
            <Text style={[styles.vehicle, { color: colors.muted }]} numberOfLines={1}>
              {vehicle}
            </Text>
          </View>
          <View style={[styles.timeCol, styles.timeEnd]}>
            <Text style={[styles.time, { color: colors.dark }]}>{formatTime(trip.arrivalTime)}</Text>
            <Text style={[styles.city, { color: colors.muted }]} numberOfLines={1}>
              {trip.to}
            </Text>
          </View>
        </View>

        {stops.length > 0 ? (
          <Text style={[styles.stops, { color: colors.muted }]} numberOfLines={1}>
            {trip.from} → {stops.map((stop) => stop.name).join(' → ')} → {trip.to}
          </Text>
        ) : null}

        <View style={styles.footer}>
          <View>
            <Text style={[styles.fromLabel, { color: colors.mutedLight }]}>From</Text>
            <Text style={[styles.price, { color: colors.dark }]}>
              {formatCurrency(trip.price, trip.currency)}
            </Text>
          </View>
          <Button title="Book seat" onPress={onPress} compact fullWidth={false} style={styles.bookBtn} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    gap: Spacing.md,
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
  },
  logoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitials: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
  agencyCopy: { flex: 1, minWidth: 0, marginRight: Spacing.sm },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  agency: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    flexShrink: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  rating: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
  },
  seatInline: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
  },
  journeyPill: {
    minHeight: 28,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyPillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeCol: { width: 78 },
  timeEnd: { alignItems: 'flex-end' },
  time: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
  },
  city: {
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  mid: {
    flex: 1,
    alignItems: 'center',
  },
  duration: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    marginBottom: 4,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  dash: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    borderRadius: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  vehicle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    marginTop: 4,
  },
  stops: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  fromLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
  },
  price: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 18,
    marginTop: 1,
  },
  bookBtn: {
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    minHeight: 36,
  },
});
