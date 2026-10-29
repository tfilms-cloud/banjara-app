import { ArrowRight, MapPin, Star } from 'lucide-react-native';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { FavoriteButton } from '@/components/hotels/FavoriteButton';
import { Button } from '@/components/ui/Button';
import { Colors, useThemeColors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import type { Hotel } from '@/types/hotel';
import { formatCurrency } from '@/utils/formatCurrency';
import { calculateNights } from '@/utils/hotelPricing';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface HotelCardProps {
  hotel: Hotel;
  checkIn?: string;
  checkOut?: string;
  onPress?: () => void;
  compact?: boolean;
}

function hotelTypeLabel(type: Hotel['hotelType']) {
  return type.replace('_', ' ');
}

function formatHotelLocation(area: string, city: string) {
  const cleanArea = area?.trim() || '';
  const cleanCity = city?.trim() || '';
  if (!cleanArea) return cleanCity;
  if (!cleanCity) return cleanArea;
  if (cleanArea.toLowerCase().includes(cleanCity.toLowerCase())) {
    return cleanArea;
  }
  return `${cleanArea}, ${cleanCity}`;
}

export const HotelCard = memo(function HotelCard({
  hotel,
  checkIn,
  checkOut,
  onPress,
  compact,
}: HotelCardProps) {
  const nights = checkIn && checkOut ? calculateNights(checkIn, checkOut) : 1;
  const image = normalizeMediaUrl(hotel.images[0]) ?? hotel.images[0];
  const colors = useThemeColors();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const locationLabel = formatHotelLocation(hotel.location.area, hotel.location.city);

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
      accessibilityLabel={`${hotel.name}, ${locationLabel}, from ${formatCurrency(hotel.priceFrom)} per night`}
      style={animStyle}
    >
      <View
        style={[
          styles.card,
          compact && styles.compact,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[styles.imageWrap, compact && styles.imageWrapCompact]}>
          <Image source={{ uri: image }} style={styles.image} contentFit="cover" transition={250} />

          <View style={styles.topRow}>
            <View style={[styles.typeBadge, { backgroundColor: 'rgba(8,17,31,0.65)' }]}>
              <Text style={styles.typeBadgeText}>{hotelTypeLabel(hotel.hotelType)}</Text>
            </View>
            <View style={styles.favWrap}>
              <FavoriteButton hotelId={hotel.id} />
            </View>
          </View>

          <View style={[styles.ratingBadge, { backgroundColor: 'rgba(8,17,31,0.72)' }]}>
            <Star size={11} color={colors.warning} fill={colors.warning} strokeWidth={0} />
            <Text style={styles.ratingBadgeText}>
              {hotel.rating} {hotel.reviewCount > 0 ? `(${hotel.reviewCount})` : ''}
            </Text>
          </View>
        </View>

        <View style={[styles.body, compact && styles.bodyCompact]}>
          <Text style={[styles.name, { color: colors.dark }]} numberOfLines={1}>
            {hotel.name}
          </Text>

          <View style={styles.locRow}>
            <MapPin size={13} color={colors.primary} strokeWidth={2.2} />
            <Text style={[styles.location, { color: colors.muted }]} numberOfLines={1}>
              {locationLabel}
            </Text>
          </View>

          <View style={styles.footer}>
            <View>
              <Text style={[styles.from, { color: colors.mutedLight }]}>FROM</Text>
              <View style={styles.priceRow}>
                <Text style={[styles.price, { color: colors.dark }]}>
                  {formatCurrency(hotel.priceFrom)}
                </Text>
                <Text style={[styles.night, { color: colors.mutedLight }]}> / night</Text>
              </View>
              {nights > 1 ? (
                <Text style={[styles.total, { color: colors.muted }]}>
                  {formatCurrency(hotel.priceFrom * nights)} total · {nights} nights
                </Text>
              ) : null}
            </View>
            <Button
              title="Book stay"
              onPress={onPress}
              compact
              fullWidth={false}
              icon={<ArrowRight size={14} color={colors.white} strokeWidth={2.4} />}
              iconPosition="right"
              style={styles.bookBtn}
            />
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  compact: {
    width: 272,
    marginRight: Spacing.md,
    marginBottom: 0,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: Colors.border,
    position: 'relative',
  },
  imageWrapCompact: {
    aspectRatio: 16 / 11,
  },
  image: { width: '100%', height: '100%' },
  topRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  typeBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    textTransform: 'uppercase',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  favWrap: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  ratingBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  ratingBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  body: { padding: Spacing.lg },
  bodyCompact: { padding: Spacing.md },
  name: {
    fontFamily: Fonts.display,
    fontSize: 17,
    letterSpacing: -0.2,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  location: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    flex: 1,
  },
  footer: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  from: {
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
    fontSize: 18,
    letterSpacing: -0.3,
  },
  night: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  total: {
    fontFamily: Fonts.body,
    fontSize: 11,
    marginTop: 2,
  },
  bookBtn: {
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    minHeight: 38,
  },
});
