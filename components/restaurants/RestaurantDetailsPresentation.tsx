import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { TravelDesignProvider } from '@/components/ui/TravelDesignProvider';
import { TravelPhotoGallery } from '@/components/ui/TravelPhotoGallery';
import { TravelIconAction, TravelSurface, type TravelIcon } from '@/components/ui/TravelPrimitives';
import { useHomeDesign } from '@/constants/homeDesign';
import { Fonts } from '@/constants/typography';
import { useUserStore } from '@/store/userStore';
import type { Restaurant, RestaurantOffer } from '@/types/restaurant';
import { restaurantMenuIcon, restaurantOfferBadge } from '@/utils/restaurantPresentation';

export function RestaurantDetailsFrame({
  children,
  onBack,
}: {
  children: ReactNode;
  onBack: () => void;
}) {
  const theme = useHomeDesign();
  return (
    <TravelDesignProvider>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <Header title="Restaurant Details" showBack onBack={onBack} />
        {children}
      </View>
    </TravelDesignProvider>
  );
}

/** Reusable bordered promotion surface with provider-supplied copy. */
export function RestaurantOfferCard({ offer }: { offer: RestaurantOffer }) {
  const theme = useHomeDesign();
  return (
    <TravelSurface style={[s.offer, { borderColor: theme.border }]}>
      <View style={s.row}>
        <View style={[s.offerBadge, { backgroundColor: theme.soft }]}>
          <Text style={[s.badgeText, { color: theme.primary }]}>{restaurantOfferBadge(offer)}</Text>
        </View>
        <Ionicons
          name={offer.type === 'offer' ? 'gift-outline' : 'pricetag-outline'}
          size={21}
          color={theme.primary}
        />
      </View>
      <Text style={[s.offerTitle, { color: theme.text }]}>{offer.title}</Text>
      {offer.description?.trim() ? (
        <Text style={[s.copy, { color: theme.muted }]}>{offer.description}</Text>
      ) : null}
    </TravelSurface>
  );
}

export function RestaurantInfoCard({
  icon,
  title,
  detail,
}: {
  icon: TravelIcon;
  title: string;
  detail?: string;
}) {
  const theme = useHomeDesign();
  return (
    <TravelSurface style={[s.info, { backgroundColor: theme.field, borderColor: theme.border }]}>
      <View style={[s.infoIcon, { backgroundColor: theme.soft }]}>
        <Ionicons name={icon} size={20} color={theme.primary} />
      </View>
      <View style={s.flex}>
        <Text style={[s.offerTitle, { color: theme.text }]}>{title}</Text>
        {detail ? <Text style={[s.copy, { color: theme.muted }]}>{detail}</Text> : null}
      </View>
    </TravelSurface>
  );
}

export function RestaurantDetailsPresentation({
  restaurant,
  saved,
  saving,
  refreshing,
  onBack,
  onShare,
  onSave,
  onRefresh,
  onCall,
  onWebsite,
}: {
  restaurant: Restaurant;
  saved: boolean;
  saving: boolean;
  refreshing: boolean;
  onBack: () => void;
  onShare: () => void;
  onSave: () => void;
  onRefresh: () => void;
  onCall?: () => void;
  onWebsite?: () => void;
}) {
  const theme = useHomeDesign();
  const insets = useSafeAreaInsets();
  const [overPhoto, setOverPhoto] = useState(true);
  const darkMode = useUserStore((state) => state.settings.darkMode);
  const offers = restaurant.offers.filter((offer) => offer.active && offer.title.trim());
  const menu = [...new Set(restaurant.menuVariety.map((label) => label.trim()).filter(Boolean))];
  const cuisine = [...new Set(restaurant.cuisine.map((label) => label.trim()).filter(Boolean))];
  return (
    <TravelDesignProvider>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar
          style={(overPhoto && restaurant.images.length > 0) || darkMode ? 'light' : 'dark'}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          onScroll={(event) => setOverPhoto(event.nativeEvent.contentOffset.y < 280 + insets.top)}
          scrollEventThrottle={32}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
        >
          <View>
            <TravelPhotoGallery
              images={restaurant.images}
              label="Restaurant"
              height={280 + insets.top}
            />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(7,27,29,0.5)', 'transparent']}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 100 }}
            />
            <View style={[s.heroControls, { top: insets.top + 12 }]}>
              <View style={s.overlayButton}>
                <TravelIconAction
                  icon="chevron-back"
                  label="Go back"
                  color="#FFFFFF"
                  onPress={onBack}
                />
              </View>
              <View style={s.flex} />
              <View style={s.overlayButton}>
                <TravelIconAction
                  icon="share-social-outline"
                  label="Share restaurant"
                  color="#FFFFFF"
                  onPress={onShare}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={saved ? 'Remove restaurant from saved' : 'Save restaurant'}
                accessibilityState={{ selected: saved, disabled: saving, busy: saving }}
                disabled={saving}
                onPress={onSave}
                style={[s.overlayButton, s.save, { opacity: saving ? 0.55 : 1 }]}
              >
                <Ionicons
                  name={saved ? 'heart' : 'heart-outline'}
                  size={23}
                  color={saved ? '#FFAA96' : '#FFFFFF'}
                />
              </Pressable>
            </View>
            {restaurant.city?.trim() ? (
              <View pointerEvents="none" style={s.locationBadge}>
                <Ionicons name="location-outline" size={14} color="#FFFFFF" />
                <Text style={[s.badgeText, { color: '#FFFFFF', flexShrink: 1 }]}>
                  {restaurant.city}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={s.body}>
            <View style={s.identity}>
              <View style={s.nameRow}>
                <Text accessibilityRole="header" style={[s.name, { color: theme.text }]}>
                  {restaurant.name}
                </Text>
                {restaurant.verified ? (
                  <View
                    style={[s.verified, { backgroundColor: theme.soft, borderColor: theme.border }]}
                  >
                    <Ionicons name="checkmark-circle" size={13} color={theme.primary} />
                    <Text style={[s.badgeText, { color: theme.primary }]}>Verified host</Text>
                  </View>
                ) : null}
              </View>
              {[restaurant.city, cuisine.join(' & ')].filter(Boolean).length ? (
                <Text style={[s.meta, { color: theme.muted }]}>
                  {[restaurant.city, cuisine.join(' & ')].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
              <View style={s.rating}>
                <Ionicons name="star" size={16} color="#E99A20" />
                <Text style={[s.ratingValue, { color: theme.text }]}>
                  {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : 'New'}
                </Text>
                <Text style={[s.small, { color: theme.muted }]}>
                  {restaurant.reviewCount > 0
                    ? `(${restaurant.reviewCount} reviews)`
                    : 'No reviews yet'}
                </Text>
              </View>
            </View>

            {restaurant.description?.trim() ? (
              <TravelSurface
                style={[s.description, { backgroundColor: theme.field, borderColor: theme.border }]}
              >
                <Text style={[s.descriptionText, { color: theme.text }]}>
                  {restaurant.description}
                </Text>
              </TravelSurface>
            ) : null}

            {menu.length || cuisine.length ? (
              <View style={s.section}>
                <Text accessibilityRole="header" style={[s.sectionTitle, { color: theme.primary }]}>
                  MENU HIGHLIGHTS & SPECIALTIES
                </Text>
                <View style={s.chips}>
                  {(menu.length ? menu : cuisine).map((label) => (
                    <View
                      key={label}
                      style={[s.chip, { backgroundColor: theme.field, borderColor: theme.border }]}
                    >
                      <Ionicons name={restaurantMenuIcon(label)} size={16} color={theme.primary} />
                      <Text style={[s.chipText, { color: theme.text }]}>{label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {offers.length ? (
              <View style={s.section}>
                <View style={s.row}>
                  <Text
                    accessibilityRole="header"
                    style={[s.sectionTitle, s.flex, { color: theme.primary }]}
                  >
                    SALES, OFFERS & DISCOUNTS
                  </Text>
                  <Text style={[s.eyebrow, { color: theme.primary }]}>ACTIVE PERKS</Text>
                </View>
                {offers.map((offer, index) => (
                  <RestaurantOfferCard key={offer.id || `${offer.title}-${index}`} offer={offer} />
                ))}
              </View>
            ) : null}

            {restaurant.hours?.trim() || restaurant.address?.trim() ? (
              <View style={s.section}>
                {restaurant.hours?.trim() ? (
                  <RestaurantInfoCard
                    icon="time-outline"
                    title="Opening hours"
                    detail={restaurant.hours}
                  />
                ) : null}
                {restaurant.address?.trim() ? (
                  <RestaurantInfoCard
                    icon="location-outline"
                    title={restaurant.address}
                    detail={
                      restaurant.city && !restaurant.address.includes(restaurant.city)
                        ? restaurant.city
                        : undefined
                    }
                  />
                ) : null}
              </View>
            ) : null}

            {onCall || onWebsite ? (
              <View style={s.actions}>
                {onCall ? (
                  <Button
                    title={`Call restaurant (${restaurant.phone})`}
                    onPress={onCall}
                    icon={<Ionicons name="call-outline" size={18} color={theme.background} />}
                    style={{ minHeight: 50 }}
                  />
                ) : null}
                {onWebsite ? (
                  <Button
                    title="Visit website"
                    variant="outline"
                    onPress={onWebsite}
                    textColor={theme.text}
                    icon={<Ionicons name="globe-outline" size={19} color={theme.text} />}
                    style={{ minHeight: 50 }}
                  />
                ) : null}
              </View>
            ) : null}
          </View>
        </ScrollView>
        {!overPhoto ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: insets.top,
              backgroundColor: theme.background,
            }}
          />
        ) : null}
      </View>
    </TravelDesignProvider>
  );
}

const s = StyleSheet.create({
  heroControls: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  overlayButton: { backgroundColor: 'rgba(7,27,29,0.52)', borderRadius: 24 },
  save: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  locationBadge: {
    position: 'absolute',
    bottom: 48,
    left: 16,
    maxWidth: '85%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: 'rgba(7,27,29,0.66)',
  },
  body: { paddingHorizontal: 16, paddingTop: 22, gap: 28 },
  identity: { gap: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  name: {
    fontFamily: Fonts.displayBold,
    fontSize: 27,
    lineHeight: 34,
    letterSpacing: -0.6,
    flexGrow: 1,
    flexShrink: 1,
  },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  badgeText: { fontFamily: Fonts.bodySemiBold, fontSize: 11, lineHeight: 15 },
  meta: { fontFamily: Fonts.body, fontSize: 14, lineHeight: 22 },
  rating: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' },
  ratingValue: { fontFamily: Fonts.bodyBold, fontSize: 14 },
  small: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 19 },
  description: { borderRadius: 18, borderWidth: 1, padding: 16 },
  descriptionText: { fontFamily: Fonts.body, fontSize: 14, lineHeight: 23 },
  section: { gap: 12 },
  sectionTitle: { fontFamily: Fonts.bodyBold, fontSize: 11, lineHeight: 17, letterSpacing: 0.3 },
  eyebrow: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  chipText: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 18, flexShrink: 1 },
  offer: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  offerBadge: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  offerTitle: { fontFamily: Fonts.bodyBold, fontSize: 13, lineHeight: 21 },
  copy: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 21 },
  info: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { gap: 12, marginTop: 4 },
});
