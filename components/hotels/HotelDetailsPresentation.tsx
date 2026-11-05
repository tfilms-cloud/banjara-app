import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FavoriteButton } from '@/components/hotels/FavoriteButton';
import { HotelAmenityList } from '@/components/hotels/HotelAmenity';
import { HotelMap } from '@/components/hotels/HotelMap';
import { Button } from '@/components/ui/Button';
import { TravelDesignProvider } from '@/components/ui/TravelDesignProvider';
import { TravelPhotoGallery } from '@/components/ui/TravelPhotoGallery';
import { TravelIconAction, TravelSurface, type TravelIcon } from '@/components/ui/TravelPrimitives';
import { useHotelDesign } from '@/constants/hotelDesign';
import { Fonts } from '@/constants/typography';
import { useUserStore } from '@/store/userStore';
import type { Hotel } from '@/types/hotel';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  hotelAbout,
  hotelCancellationLabel,
  hotelPlaceLine,
  hotelStartingPrice,
  hotelTimeLabel,
} from '@/utils/hotelPresentation';

function HotelDetailsHeader({
  title,
  hotelId,
  onBack,
  onProfile,
}: {
  title: string;
  hotelId?: string;
  onBack: () => void;
  onProfile: () => void;
}) {
  const theme = useHotelDesign();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        s.header,
        {
          paddingTop: insets.top + 8,
          borderBottomColor: theme.border,
          backgroundColor: theme.background,
        },
      ]}
    >
      <TravelIconAction icon="arrow-back" label="Go back" onPress={onBack} filled />
      <Text
        accessibilityRole="header"
        numberOfLines={2}
        style={[s.headerTitle, { color: theme.text }]}
      >
        {title}
      </Text>
      {hotelId ? <FavoriteButton hotelId={hotelId} /> : null}
      <View style={{ backgroundColor: theme.action, borderRadius: 22 }}>
        <TravelIconAction
          icon="person-outline"
          label="Your profile"
          onPress={onProfile}
          color={theme.background}
        />
      </View>
    </View>
  );
}

export function HotelDetailsFrame({
  children,
  onBack,
  onProfile,
}: {
  children: ReactNode;
  onBack: () => void;
  onProfile: () => void;
}) {
  const theme = useHotelDesign();
  const dark = useUserStore((state) => state.settings.darkMode);
  return (
    <TravelDesignProvider>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <HotelDetailsHeader title="Hotel Details" onBack={onBack} onProfile={onProfile} />
        {children}
      </View>
    </TravelDesignProvider>
  );
}

export function HotelDetailBadge({
  label,
  icon,
  type = false,
}: {
  label: string;
  icon: TravelIcon;
  type?: boolean;
}) {
  const theme = useHotelDesign();
  return (
    <View
      style={[
        s.badge,
        { backgroundColor: type ? theme.typeFill : theme.soft, borderColor: theme.border },
      ]}
    >
      <Ionicons name={icon} size={13} color={type ? theme.typeText : theme.primary} />
      <Text style={[s.badgeText, { color: type ? theme.typeText : theme.primary }]}>{label}</Text>
    </View>
  );
}

export function HotelHighlight({ label, icon }: { label: string; icon: TravelIcon }) {
  const theme = useHotelDesign();
  return (
    <View style={[s.highlight, { backgroundColor: theme.neutral, borderColor: theme.border }]}>
      <Ionicons name={icon} size={13} color={theme.primary} />
      <Text style={[s.highlightText, { color: theme.text }]}>{label}</Text>
    </View>
  );
}

export function HotelContactRow({
  label,
  value,
  icon,
  onPress,
}: {
  label: string;
  value: string;
  icon: TravelIcon;
  onPress?: () => void;
}) {
  const theme = useHotelDesign();
  if (!value.trim()) return null;
  const content = (
    <>
      <View style={[s.infoIcon, { backgroundColor: theme.neutral }]}>
        <Ionicons name={icon} size={18} color={theme.primary} />
      </View>
      <View style={s.flex}>
        <Text style={[s.infoLabel, { color: theme.muted }]}>{label.toUpperCase()}</Text>
        <Text
          style={[
            s.infoValue,
            {
              color: onPress ? theme.primary : theme.text,
              textDecorationLine: onPress ? 'underline' : 'none',
            },
          ]}
        >
          {value}
        </Text>
      </View>
    </>
  );
  return onPress ? (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={s.infoRow}
    >
      {content}
    </Pressable>
  ) : (
    <View style={s.infoRow}>{content}</View>
  );
}

export function HotelPolicyCard({ policy }: { policy: string }) {
  const theme = useHotelDesign();
  return (
    <TravelSurface
      style={[s.policy, { backgroundColor: theme.neutral, borderColor: theme.border }]}
    >
      <View style={[s.infoIcon, { backgroundColor: theme.soft }]}>
        <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
      </View>
      <View style={[s.flex, { gap: 5 }]}>
        <Text style={[s.policyTitle, { color: theme.text }]}>Cancellation policy</Text>
        <Text style={[s.copy, { color: theme.muted }]}>{policy}</Text>
      </View>
    </TravelSurface>
  );
}

const typeLabels = {
  hotel: 'Hotel',
  resort: 'Resort',
  guest_house: 'Guest house',
  lodge: 'Lodge',
  homestay: 'Homestay',
};

export function HotelDetailsPresentation({
  hotel,
  loading,
  onRefresh,
  onBack,
  onProfile,
  onSelectRoom,
  onMap,
  onCall,
  onLandline,
  onEmail,
  onWebsite,
}: {
  hotel: Hotel;
  loading: boolean;
  onRefresh: () => void;
  onBack: () => void;
  onProfile: () => void;
  onSelectRoom: () => void;
  onMap: () => void;
  onCall?: () => void;
  onLandline?: () => void;
  onEmail?: () => void;
  onWebsite?: () => void;
}) {
  const theme = useHotelDesign();
  const insets = useSafeAreaInsets();
  const dark = useUserStore((state) => state.settings.darkMode);
  const place = hotelPlaceLine(hotel);
  const cancellation = hotelCancellationLabel(hotel);
  const price = hotelStartingPrice(hotel);
  return (
    <TravelDesignProvider>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <HotelDetailsHeader
          title={`${hotel.name} Details`}
          hotelId={hotel.id}
          onBack={onBack}
          onProfile={onProfile}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 130 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={theme.primary} />
          }
        >
          <View>
            <TravelPhotoGallery images={hotel.images} label="Hotel" height={280} />
            <View style={s.heroFavorite}>
              <FavoriteButton hotelId={hotel.id} size={23} />
            </View>
          </View>
          <View style={s.body}>
            <View style={s.identity}>
              <View style={s.titleRow}>
                <View style={[s.flex, { gap: 7 }]}>
                  <Text accessibilityRole="header" style={[s.name, { color: theme.primary }]}>
                    {hotel.name}
                  </Text>
                  <View style={s.rating}>
                    <Ionicons name="star" size={15} color="#E99A20" />
                    <Text style={[s.ratingValue, { color: theme.text }]}>
                      {hotel.rating.toFixed(1)}
                    </Text>
                    <Text style={[s.small, { color: theme.muted }]}>
                      ({hotel.reviewCount} reviews)
                    </Text>
                    {hotel.reviewCount === 0 ? (
                      <>
                        <Text style={{ color: theme.border }}>•</Text>
                        <Text style={[s.newLabel, { color: theme.primary }]}>NEW LISTING</Text>
                      </>
                    ) : null}
                  </View>
                </View>
                <FavoriteButton hotelId={hotel.id} size={23} />
              </View>
              <View style={s.badges}>
                <HotelDetailBadge
                  icon="bed-outline"
                  label={typeLabels[hotel.hotelType] || hotel.hotelType.replace(/_/g, ' ')}
                  type
                />
                {hotel.isVerified ? (
                  <HotelDetailBadge icon="checkmark-circle-outline" label="Verified" />
                ) : null}
                {hotel.businessRegistered ? (
                  <HotelDetailBadge icon="business-outline" label="Registered business" />
                ) : null}
                {hotel.restaurantAvailable ? (
                  <HotelDetailBadge icon="restaurant-outline" label="Restaurant on-site" />
                ) : null}
              </View>
            </View>

            <TravelSurface style={[s.location, { borderColor: theme.border }]}>
              <View style={[s.infoIcon, { backgroundColor: theme.field }]}>
                <Ionicons name="location-outline" size={20} color={theme.primary} />
              </View>
              <View style={[s.flex, { gap: 4 }]}>
                {place ? <Text style={[s.place, { color: theme.text }]}>{place}</Text> : null}
                <Text style={[s.small, { color: theme.muted }]}>
                  {hotel.location.address || 'Address not provided'}
                  {hotel.location.distanceKm > 0
                    ? ` · ${hotel.location.distanceKm} km from center`
                    : ''}
                </Text>
              </View>
              <View style={{ backgroundColor: theme.action, borderRadius: 22 }}>
                <TravelIconAction
                  icon="map-outline"
                  label="Open property map"
                  onPress={onMap}
                  color={theme.onAction}
                />
              </View>
            </TravelSurface>

            {hotel.managerName ||
            (hotel.yearsExperience ?? 0) > 0 ||
            cancellation ||
            hotel.breakfastIncluded ? (
              <View style={s.highlights}>
                {hotel.managerName ? (
                  <HotelHighlight icon="person-outline" label={`Managed by ${hotel.managerName}`} />
                ) : null}
                {hotel.yearsExperience && hotel.yearsExperience > 0 ? (
                  <HotelHighlight
                    icon="ribbon-outline"
                    label={`${hotel.yearsExperience}+ years experience`}
                  />
                ) : null}
                {cancellation ? (
                  <HotelHighlight icon="shield-checkmark-outline" label={cancellation} />
                ) : null}
                {hotel.breakfastIncluded ? (
                  <HotelHighlight icon="cafe-outline" label="Breakfast included" />
                ) : null}
              </View>
            ) : null}

            <View style={s.section}>
              <Text accessibilityRole="header" style={[s.sectionTitle, { color: theme.text }]}>
                About
              </Text>
              <Text style={[s.copy, { color: theme.muted }]}>{hotelAbout(hotel)}</Text>
            </View>
            {hotel.amenities.length ? (
              <View style={s.section}>
                <Text accessibilityRole="header" style={[s.sectionTitle, { color: theme.text }]}>
                  Amenities
                </Text>
                <HotelAmenityList amenities={hotel.amenities} layout="column" />
              </View>
            ) : null}

            <TravelSurface style={[s.details, { borderColor: theme.border }]}>
              <Text accessibilityRole="header" style={[s.sectionTitle, { color: theme.text }]}>
                Property details
              </Text>
              <HotelContactRow
                icon="enter-outline"
                label="Check-in"
                value={hotelTimeLabel(hotel.checkInTime)}
              />
              <HotelContactRow
                icon="exit-outline"
                label="Check-out"
                value={hotelTimeLabel(hotel.checkOutTime)}
              />
              <HotelContactRow
                icon="call-outline"
                label="Contact phone"
                value={hotel.phone}
                onPress={onCall}
              />
              <HotelContactRow
                icon="phone-portrait-outline"
                label="Landline"
                value={hotel.landline || ''}
                onPress={onLandline}
              />
              <HotelContactRow
                icon="mail-outline"
                label="Email"
                value={hotel.email}
                onPress={onEmail}
              />
              <HotelContactRow
                icon="globe-outline"
                label="Website"
                value={hotel.website || ''}
                onPress={onWebsite}
              />
            </TravelSurface>

            <View style={s.section}>
              <View style={s.sectionHeading}>
                <Text accessibilityRole="header" style={[s.sectionTitle, { color: theme.text }]}>
                  Location
                </Text>
                <Text style={[s.mapPlace, { color: theme.primary }]}>
                  {[hotel.village, hotel.location.city]
                    .filter(Boolean)
                    .filter((value, index, values) => values.indexOf(value) === index)
                    .join(', ')}
                </Text>
              </View>
              <View style={[s.map, { borderColor: theme.border }]}>
                <HotelMap hotels={[hotel]} height={240} compactDetails />
              </View>
            </View>
            <View style={s.section}>
              <Text accessibilityRole="header" style={[s.sectionTitle, { color: theme.text }]}>
                Policies
              </Text>
              <HotelPolicyCard
                policy={hotel.cancellationPolicy || 'Contact the property for cancellation terms.'}
              />
            </View>
            <View style={s.actions}>
              {onCall ? (
                <Button
                  title="Call property"
                  variant="outline"
                  textColor={theme.text}
                  onPress={onCall}
                  icon={<Ionicons name="call-outline" size={15} color={theme.primary} />}
                  style={s.secondaryButton}
                />
              ) : null}
              <Button
                title="Open map"
                variant="outline"
                textColor={theme.text}
                onPress={onMap}
                icon={<Ionicons name="navigate-outline" size={15} color={theme.primary} />}
                style={s.secondaryButton}
              />
            </View>
          </View>
        </ScrollView>
        <View
          style={[
            s.footer,
            {
              paddingBottom: insets.bottom + 12,
              backgroundColor: theme.surface,
              borderTopColor: theme.border,
            },
          ]}
        >
          <View style={s.flex}>
            <Text style={[s.from, { color: theme.muted }]}>
              {price === undefined ? 'Nightly rate' : 'From'}
            </Text>
            <Text style={[s.price, { color: theme.primary }]}>
              {price === undefined ? 'Ask property' : formatCurrency(price)}
              {price === undefined ? null : (
                <Text style={[s.perNight, { color: theme.muted }]}> / night</Text>
              )}
            </Text>
          </View>
          <View style={s.cta}>
            <Button
              title="Select room"
              onPress={onSelectRoom}
              textColor={theme.onAction}
              style={{ backgroundColor: theme.action }}
              iconPosition="right"
              icon={<Ionicons name="arrow-forward" size={17} color={theme.onAction} />}
            />
          </View>
        </View>
      </View>
    </TravelDesignProvider>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
  },
  headerTitle: { flex: 1, minWidth: 0, fontFamily: Fonts.bodyBold, fontSize: 13, lineHeight: 19 },
  flex: { flex: 1, minWidth: 0 },
  heroFavorite: { position: 'absolute', top: 16, right: 16 },
  body: { padding: 16, gap: 24 },
  identity: { gap: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { fontFamily: Fonts.displayBold, fontSize: 20, lineHeight: 27, letterSpacing: -0.4 },
  rating: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5 },
  ratingValue: { fontFamily: Fonts.bodyBold, fontSize: 13, lineHeight: 20 },
  small: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 18 },
  newLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 10, lineHeight: 16 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    maxWidth: '100%',
  },
  badgeText: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 15, flexShrink: 1 },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  place: { fontFamily: Fonts.bodyBold, fontSize: 13, lineHeight: 20 },
  highlights: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: '100%',
  },
  highlightText: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 16, flexShrink: 1 },
  section: { gap: 12 },
  sectionTitle: { fontFamily: Fonts.display, fontSize: 16, lineHeight: 23 },
  copy: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 22 },
  details: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  infoLabel: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 15 },
  infoValue: { fontFamily: Fonts.bodySemiBold, fontSize: 12, lineHeight: 19 },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  mapPlace: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    lineHeight: 16,
    flexShrink: 1,
    textAlign: 'right',
  },
  map: { borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
  policy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  policyTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 13, lineHeight: 20 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  secondaryButton: { flex: 1, minWidth: 135, borderRadius: 26, paddingHorizontal: 12 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  from: { fontFamily: Fonts.body, fontSize: 10, lineHeight: 16 },
  price: { fontFamily: Fonts.displayBold, fontSize: 18, lineHeight: 25 },
  perNight: { fontFamily: Fonts.bodyMedium, fontSize: 10 },
  cta: { width: '48%', minWidth: 154 },
});
