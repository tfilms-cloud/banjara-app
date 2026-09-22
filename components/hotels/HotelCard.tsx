import { MapPin, Star } from 'lucide-react-native';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FavoriteButton } from '@/components/hotels/FavoriteButton';
import { Button } from '@/components/ui/Button';
import { Colors, useThemeColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import type { Hotel } from '@/types/hotel';
import { formatCurrency } from '@/utils/formatCurrency';
import { calculateNights } from '@/utils/hotelPricing';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

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

export function HotelCard({ hotel, checkIn, checkOut, onPress, compact }: HotelCardProps) {
  const nights = checkIn && checkOut ? calculateNights(checkIn, checkOut) : 1;
  const image = normalizeMediaUrl(hotel.images[0]) ?? hotel.images[0];
  const colors = useThemeColors();

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <View
        style={[
          styles.card,
          compact && styles.compact,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[styles.imageWrap, compact && styles.imageWrapCompact]}>
          <Image source={{ uri: image }} style={styles.image} contentFit="cover" />
          <View style={styles.fav}>
            <FavoriteButton hotelId={hotel.id} />
          </View>
          <View style={[styles.ratingBadge, { backgroundColor: 'rgba(8,17,31,0.72)' }]}>
            <Star size={11} color={colors.warning} fill={colors.warning} strokeWidth={0} />
            <Text style={styles.ratingBadgeText}>
              {hotel.rating} ({hotel.reviewCount})
            </Text>
          </View>
        </View>

        <View style={[styles.body, compact && styles.bodyCompact]}>
          <Text style={[styles.type, { color: colors.primary }]}>{hotelTypeLabel(hotel.hotelType)}</Text>
          <Text style={[styles.name, { color: colors.dark }]} numberOfLines={1}>
            {hotel.name}
          </Text>
          <View style={styles.locRow}>
            <MapPin size={13} color={colors.primary} strokeWidth={2} />
            <Text style={[styles.location, { color: colors.muted }]} numberOfLines={1}>
              {hotel.location.area}, {hotel.location.city}
            </Text>
          </View>
          <View style={styles.footer}>
            <View>
              <Text style={[styles.from, { color: colors.mutedLight }]}>From</Text>
              <Text style={[styles.price, { color: colors.dark }]}>
                {formatCurrency(hotel.priceFrom)}
                <Text style={[styles.night, { color: colors.muted }]}> / night</Text>
              </Text>
              {nights > 1 ? (
                <Text style={[styles.total, { color: colors.muted }]}>{nights} nights</Text>
              ) : null}
            </View>
            <Button title="Book stay" onPress={onPress} compact fullWidth={false} style={styles.bookBtn} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  compact: {
    width: 268,
    marginRight: Spacing.md,
    marginBottom: 0,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: Colors.border,
  },
  imageWrapCompact: {
    aspectRatio: 16 / 11,
  },
  image: { width: '100%', height: '100%' },
  fav: { position: 'absolute', top: 10, right: 10 },
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
  },
  ratingBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  body: { padding: Spacing.lg },
  bodyCompact: { padding: Spacing.md },
  type: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  name: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  location: {
    fontFamily: Fonts.body,
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
    fontFamily: Fonts.body,
    fontSize: 11,
  },
  price: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
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
    paddingHorizontal: 14,
    minHeight: 36,
  },
});
