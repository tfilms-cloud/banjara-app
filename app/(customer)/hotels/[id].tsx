import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FavoriteButton } from '@/components/hotels/FavoriteButton';
import { HotelAmenityList } from '@/components/hotels/HotelAmenity';
import { HotelImageGallery } from '@/components/hotels/HotelImageGallery';
import { HotelMap } from '@/components/hotels/HotelMap';
import { HotelRating } from '@/components/hotels/HotelRating';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Colors, useThemeColors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { useHotel } from '@/hooks/useHotels';
import { useHotelStore } from '@/store/hotelStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatTime } from '@/utils/formatTime';
import { pushPath } from '@/utils/navigation';

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const colors = useThemeColors();
  if (!value.trim()) return null;
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.dark }]}>{value}</Text>
      </View>
    </View>
  );
}

function HighlightChip({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  const colors = useThemeColors();
  return (
    <View style={[styles.chip, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
      <Ionicons name={icon} size={14} color={colors.primary} />
      <Text style={[styles.chipText, { color: colors.dark }]}>{label}</Text>
    </View>
  );
}

export default function HotelDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { hotel, loading, error } = useHotel(id);
  const setHotel = useHotelStore((state) => state.setHotel);

  if (loading) return <LoadingState title="Loading property..." />;
  if (error || !hotel) return <ErrorState message={error ?? 'Property not found'} />;

  const placeLine = [hotel.village, hotel.district, hotel.location.city]
    .filter(Boolean)
    .filter((part, index, arr) => arr.indexOf(part) === index)
    .join(' · ');

  const aboutText =
    hotel.description?.trim() ||
    [
      hotel.name,
      placeLine ? `located in ${placeLine}` : null,
      hotel.managerName ? `managed by ${hotel.managerName}` : null,
      hotel.yearsExperience ? `with ${hotel.yearsExperience}+ years in hospitality` : null,
    ]
      .filter(Boolean)
      .join(' ') + '.';

  const openMaps = () => {
    const url =
      hotel.googleMapsUrl ||
      `https://www.google.com/maps/search/?api=1&query=${hotel.location.latitude},${hotel.location.longitude}`;
    void Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={hotel.name} showBack fallbackHref="/(customer)/hotels/results" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <HotelImageGallery images={hotel.images} hotelId={hotel.id} height={280} />

        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={[styles.name, { color: colors.primary }]}>{hotel.name}</Text>
              <HotelRating rating={hotel.rating} reviewCount={hotel.reviewCount} />
            </View>
            <FavoriteButton hotelId={hotel.id} size={26} />
          </View>

          <View style={styles.badgeRow}>
            <Badge label={hotel.hotelType.replace('_', ' ')} tone="amber" />
            {hotel.isVerified ? <Badge label="Verified" tone="green" /> : null}
            {hotel.businessRegistered ? <Badge label="Registered" tone="blue" /> : null}
            {hotel.restaurantAvailable ? <Badge label="Restaurant" tone="blue" /> : null}
          </View>

          <View style={[styles.locationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="location" size={18} color={colors.secondary} />
            <View style={{ flex: 1, gap: 2 }}>
              {placeLine ? (
                <Text style={[styles.placeLine, { color: colors.dark }]}>{placeLine}</Text>
              ) : null}
              <Text style={[styles.address, { color: colors.muted }]}>
                {hotel.location.address}
                {hotel.location.distanceKm > 0
                  ? ` · ${hotel.location.distanceKm} km from center`
                  : ''}
              </Text>
            </View>
            <Pressable onPress={openMaps} style={[styles.mapBtn, { backgroundColor: colors.action }]}>
              <Ionicons name="map" size={16} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.chipRow}>
            {hotel.managerName ? (
              <HighlightChip icon="person-outline" label={`Manager: ${hotel.managerName}`} />
            ) : null}
            {hotel.yearsExperience ? (
              <HighlightChip
                icon="ribbon-outline"
                label={`${hotel.yearsExperience} yrs hospitality`}
              />
            ) : null}
            {hotel.freeCancellation ? (
              <HighlightChip icon="checkmark-circle-outline" label="Free cancellation" />
            ) : null}
            {hotel.breakfastIncluded ? (
              <HighlightChip icon="cafe-outline" label="Breakfast" />
            ) : null}
          </View>

          <Text style={[styles.section, { color: colors.primary }]}>About</Text>
          <Text style={[styles.body, { color: colors.muted }]}>{aboutText}</Text>

          {hotel.amenities.length ? (
            <>
              <Text style={[styles.section, { color: colors.primary }]}>Amenities</Text>
              <HotelAmenityList amenities={hotel.amenities} />
            </>
          ) : null}

          <Text style={[styles.section, { color: colors.primary }]}>Property details</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <InfoRow icon="time-outline" label="Check-in" value={formatTime(hotel.checkInTime)} />
            <InfoRow icon="exit-outline" label="Check-out" value={formatTime(hotel.checkOutTime)} />
            <InfoRow icon="call-outline" label="Mobile" value={hotel.phone} />
            <InfoRow icon="phone-portrait-outline" label="Landline" value={hotel.landline ?? ''} />
            <InfoRow icon="mail-outline" label="Email" value={hotel.email} />
            {hotel.website ? (
              <InfoRow icon="globe-outline" label="Website" value={hotel.website} />
            ) : null}
          </View>

          <Text style={[styles.section, { color: colors.primary }]}>Location</Text>
          <HotelMap hotels={[hotel]} height={240} />

          <Text style={[styles.section, { color: colors.primary }]}>Policies</Text>
          <Text style={[styles.body, { color: colors.muted }]}>
            {hotel.cancellationPolicy ||
              'Free cancellation up to 24 hours before check-in.'}
          </Text>

          <View style={styles.actionsRow}>
            {hotel.phone ? (
              <Button
                title="Call property"
                variant="outline"
                style={{ flex: 1 }}
                onPress={() => Linking.openURL(`tel:${hotel.phone.replace(/\s/g, '')}`)}
              />
            ) : null}
            <Button
              title="Open map"
              variant="outline"
              style={{ flex: 1 }}
              onPress={openMaps}
            />
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.cta,
          {
            paddingBottom: insets.bottom + Spacing.md,
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View>
          <Text style={[styles.from, { color: colors.muted }]}>From</Text>
          <Text style={[styles.price, { color: colors.primary }]}>
            {formatCurrency(hotel.priceFrom)} / night
          </Text>
        </View>
        <Button
          title="Select room"
          fullWidth={false}
          style={{ minWidth: 150 }}
          onPress={() => {
            setHotel(hotel);
            pushPath(`/(customer)/hotels/rooms/${hotel.id}`);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md },
  topRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  name: { ...Typography.h2 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  placeLine: { fontFamily: Fonts.bodySemiBold, fontSize: 14 },
  address: { ...Typography.caption, lineHeight: 18 },
  mapBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { fontFamily: Fonts.bodyMedium, fontSize: 12 },
  section: { ...Typography.h3, marginTop: Spacing.sm },
  body: { ...Typography.body, lineHeight: 22 },
  infoCard: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.soft,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { ...Typography.small },
  infoValue: { fontFamily: Fonts.bodySemiBold, fontSize: 14 },
  actionsRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  from: { ...Typography.small },
  price: { ...Typography.h3 },
});
