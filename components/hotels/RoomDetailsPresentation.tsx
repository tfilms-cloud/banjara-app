import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FavoriteButton } from './FavoriteButton';
import { HotelAmenityList } from './HotelAmenity';
import { HotelHighlight } from './HotelDetailsPresentation';
import { Button } from '@/components/ui/Button';
import { TravelDesignProvider } from '@/components/ui/TravelDesignProvider';
import { TravelPhotoGallery } from '@/components/ui/TravelPhotoGallery';
import { TravelIconAction, TravelSurface } from '@/components/ui/TravelPrimitives';
import { useHotelDesign } from '@/constants/hotelDesign';
import { Fonts } from '@/constants/typography';
import { useUserStore } from '@/store/userStore';
import type { Hotel, HotelRoom } from '@/types/hotel';
import { formatCurrency } from '@/utils/formatCurrency';
import { hotelPlaceLine } from '@/utils/hotelPresentation';
import { roomInventory, roomSummary } from '@/utils/hotelRoomSelection';
import {
  canSelectRoom,
  roomAbout,
  roomCancellationLabel,
  roomSizeLabel,
  roomTypeLabel,
} from '@/utils/roomDetails';

export function RoomSpecTile({
  icon,
  label,
  value,
  coral = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  coral?: boolean;
}) {
  const theme = useHotelDesign();
  return (
    <TravelSurface style={[s.spec, { backgroundColor: theme.neutral }]}>
      <View style={[s.specIcon, { backgroundColor: theme.soft }]}>
        <Ionicons name={icon} size={19} color={coral ? theme.coral : theme.primary} />
      </View>
      <Text style={[s.specLabel, { color: theme.muted }]}>{label}</Text>
      <Text style={[s.specValue, { color: theme.text }]}>{value}</Text>
    </TravelSurface>
  );
}

export function RoomDetailsPanel({
  title,
  icon,
  accessory,
  children,
}: {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  accessory?: ReactNode;
  children: ReactNode;
}) {
  const theme = useHotelDesign();
  return (
    <TravelSurface style={[s.panel, { backgroundColor: theme.neutral }]}>
      <View style={s.panelHeading}>
        {icon ? <Ionicons name={icon} size={19} color={theme.primary} /> : null}
        <Text accessibilityRole="header" style={[s.panelTitle, { color: theme.text }]}>
          {title}
        </Text>
        {accessory}
      </View>
      {children}
    </TravelSurface>
  );
}

export function RoomDetailsPresentation({
  room,
  hotel,
  selected,
  refreshing,
  onRefresh,
  onBack,
  onShare,
  onProfile,
  onSelect,
}: {
  room: HotelRoom;
  hotel: Hotel | null;
  selected: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onBack: () => void;
  onShare: () => void;
  onProfile: () => void;
  onSelect: () => void;
}) {
  const theme = useHotelDesign();
  const dark = useUserStore((state) => state.settings.darkMode);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [scrolled, setScrolled] = useState(false);
  const heroHeight = Math.min(width * 0.9, 390) + insets.top;
  const count = roomInventory(room);
  const cancellation = roomCancellationLabel(room);
  const amenities = [...new Set(room.amenities.map((value) => value.trim()).filter(Boolean))];
  const available = canSelectRoom(room);
  const nightlyPrice =
    Number.isFinite(room.pricePerNight) && room.pricePerNight > 0
      ? formatCurrency(room.pricePerNight)
      : 'Ask property';
  return (
    <TravelDesignProvider>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar style={dark || !scrolled ? 'light' : 'dark'} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={32}
          contentContainerStyle={{ paddingBottom: 28 }}
          onScroll={(event) => setScrolled(event.nativeEvent.contentOffset.y > heroHeight - 100)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              progressViewOffset={insets.top + 60}
            />
          }
        >
          <TravelPhotoGallery
            images={room.images}
            label="Room"
            height={heroHeight}
            dotsPlacement="start"
            renderHeroOverlay={({ index, count: photoCount, openPhotos }) => (
              <>
                <LinearGradient
                  pointerEvents="none"
                  colors={['rgba(9,22,24,0.35)', 'transparent', 'rgba(9,22,24,0.82)']}
                  locations={[0, 0.4, 1]}
                  style={StyleSheet.absoluteFill}
                />
                {photoCount > 0 ? (
                  <Pressable
                    onPress={openPhotos}
                    accessibilityRole="button"
                    accessibilityLabel="View room photos"
                    style={[s.counter, { top: insets.top + 66, backgroundColor: theme.neutral }]}
                  >
                    <Ionicons name="camera-outline" size={14} color={theme.primary} />
                    <Text style={[s.counterText, { color: theme.text }]}>
                      {index + 1} / {photoCount}
                    </Text>
                  </Pressable>
                ) : null}
                <View pointerEvents="none" style={s.heroCopy}>
                  <Text style={[s.heroMeta, { color: '#FFFFFF' }]}>{roomSummary(room)}</Text>
                  <Text accessibilityRole="header" style={[s.heroTitle, { color: '#FFFFFF' }]}>
                    {room.name}
                  </Text>
                </View>
              </>
            )}
          />
          <View style={[s.sheet, { backgroundColor: theme.background }]}>
            <TravelSurface style={[s.priceCard, { backgroundColor: theme.neutral }]}>
              <View style={s.flex}>
                <Text style={[s.overline, { color: theme.muted }]}>Price per night</Text>
                <Text style={[s.price, { color: theme.primary }]}>
                  {nightlyPrice}
                  {room.pricePerNight > 0 ? (
                    <Text style={[s.perNight, { color: theme.muted }]}> / night</Text>
                  ) : null}
                </Text>
              </View>
              <View style={[s.stock, { backgroundColor: theme.soft }]}>
                <Ionicons
                  name={count ? 'sparkles-outline' : 'alert-circle-outline'}
                  size={13}
                  color={count ? theme.primary : theme.coral}
                />
                <Text style={[s.stockText, { color: count ? theme.primary : theme.coral }]}>
                  {count ? `${count} room${count === 1 ? '' : 's'} left` : 'Sold out'}
                </Text>
              </View>
            </TravelSurface>

            {room.breakfastIncluded || cancellation ? (
              <View style={s.highlights}>
                {room.breakfastIncluded ? (
                  <HotelHighlight icon="restaurant-outline" label="Breakfast included" />
                ) : null}
                {cancellation ? (
                  <HotelHighlight icon="shield-checkmark-outline" label={cancellation} />
                ) : null}
              </View>
            ) : null}

            <View style={s.specGrid}>
              <View style={s.specRow}>
                <RoomSpecTile
                  icon="bed-outline"
                  label="Bed specification"
                  value={room.bedType?.trim() || 'Not provided'}
                />
                <RoomSpecTile
                  icon="people-outline"
                  label="Guest capacity"
                  value={
                    room.capacity > 0
                      ? `Up to ${room.capacity} guest${room.capacity === 1 ? '' : 's'}`
                      : 'Not provided'
                  }
                />
              </View>
              <View style={s.specRow}>
                <RoomSpecTile
                  icon="resize-outline"
                  label="Room size"
                  value={roomSizeLabel(room)}
                  coral
                />
                <RoomSpecTile icon="layers-outline" label="Room type" value={roomTypeLabel(room)} />
              </View>
            </View>

            <RoomDetailsPanel title="About this room" icon="leaf-outline">
              <Text style={[s.copy, { color: theme.muted }]}>{roomAbout(room)}</Text>
            </RoomDetailsPanel>
            {amenities.length ? (
              <RoomDetailsPanel
                title="Room Amenities"
                accessory={
                  <Text style={[s.amenityCount, { color: theme.primary }]}>
                    {amenities.length} featured
                  </Text>
                }
              >
                <HotelAmenityList
                  amenities={amenities as HotelRoom['amenities']}
                  layout="column"
                  tone="surface"
                />
              </RoomDetailsPanel>
            ) : null}

            <TravelSurface style={[s.notice, { backgroundColor: theme.soft }]}>
              <View style={s.panelHeading}>
                <Ionicons name="shield-checkmark-outline" size={19} color={theme.primary} />
                <Text style={[s.noticeTitle, { color: theme.text }]}>Booking information</Text>
              </View>
              {hotel?.name ? (
                <Text style={[s.property, { color: theme.primary }]}>{hotel.name}</Text>
              ) : null}
              <Text style={[s.copy, { color: theme.muted }]}>
                {room.cancellationPolicy?.trim() || 'Contact the property for cancellation terms.'}
              </Text>
              <Text style={[s.copy, { color: theme.muted }]}>
                Review your stay and payment before confirming your booking.
              </Text>
              {hotel?.isVerified ? (
                <View style={s.verified}>
                  <Ionicons name="checkmark-circle" size={12} color={theme.primary} />
                  <Text style={[s.verifiedText, { color: theme.primary }]}>
                    Verified property{hotelPlaceLine(hotel) ? ` · ${hotelPlaceLine(hotel)}` : ''}
                  </Text>
                </View>
              ) : null}
            </TravelSurface>
          </View>
        </ScrollView>

        <View
          pointerEvents="box-none"
          style={[
            s.toolbar,
            {
              paddingTop: insets.top + 8,
              backgroundColor: scrolled ? theme.surface : 'transparent',
            },
          ]}
        >
          <View style={{ borderRadius: 22, backgroundColor: theme.neutral }}>
            <TravelIconAction icon="arrow-back" label="Go back" onPress={onBack} />
          </View>
          <View style={s.headerActions}>
            <View style={{ borderRadius: 22, backgroundColor: theme.neutral }}>
              <TravelIconAction icon="share-social-outline" label="Share room" onPress={onShare} />
            </View>
            {room.hotelId ? <FavoriteButton hotelId={room.hotelId} size={22} /> : null}
            <View style={{ borderRadius: 22, backgroundColor: theme.action }}>
              <TravelIconAction
                icon="person-outline"
                label="Your profile"
                onPress={onProfile}
                color={theme.background}
              />
            </View>
          </View>
        </View>

        <View
          style={[
            s.footer,
            {
              backgroundColor: theme.surface,
              borderTopColor: theme.border,
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          <View style={s.flex}>
            <View style={s.currencyRow}>
              <Text style={[s.overline, { color: theme.muted }]}>Total / night</Text>
              <View style={[s.currencyBadge, { backgroundColor: theme.neutral }]}>
                <Text style={[s.currency, { color: theme.text }]}>PKR</Text>
              </View>
            </View>
            <Text style={[s.price, { color: theme.primary }]}>{nightlyPrice}</Text>
          </View>
          <View style={s.cta}>
            <Button
              compact
              title={
                refreshing
                  ? 'Refreshing…'
                  : !available
                    ? count
                      ? 'Ask property'
                      : 'Sold out'
                    : selected
                      ? 'Selected room'
                      : 'Select this room'
              }
              disabled={!available || refreshing}
              onPress={onSelect}
              style={{ borderRadius: 26, minHeight: 48, paddingHorizontal: 12 }}
              icon={<Ionicons name="checkmark-circle-outline" size={17} color={theme.background} />}
            />
          </View>
        </View>
      </View>
    </TravelDesignProvider>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  toolbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counter: {
    position: 'absolute',
    right: 16,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  counterText: { fontFamily: Fonts.bodySemiBold, fontSize: 11, lineHeight: 17 },
  heroCopy: { position: 'absolute', left: 16, right: 16, bottom: 76, gap: 6 },
  heroMeta: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroTitle: { fontFamily: Fonts.displayBold, fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },
  sheet: {
    marginTop: -24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 16,
    paddingTop: 20,
    gap: 16,
  },
  priceCard: { padding: 16, borderRadius: 36, flexDirection: 'row', alignItems: 'center', gap: 10 },
  overline: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 9,
    lineHeight: 15,
    textTransform: 'uppercase',
  },
  price: { fontFamily: Fonts.displayBold, fontSize: 22, lineHeight: 30, letterSpacing: -0.4 },
  perNight: { fontFamily: Fonts.body, fontSize: 11 },
  stock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  stockText: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 16 },
  highlights: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  specGrid: { gap: 8 },
  specRow: { flexDirection: 'row', gap: 8 },
  spec: { flex: 1, minWidth: 0, borderRadius: 42, minHeight: 118, padding: 14, gap: 4 },
  specIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  specLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 9,
    lineHeight: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  specValue: { fontFamily: Fonts.bodyBold, fontSize: 13, lineHeight: 19 },
  panel: { padding: 16, gap: 12, borderRadius: 38 },
  panelHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  panelTitle: { flex: 1, minWidth: 0, fontFamily: Fonts.display, fontSize: 18, lineHeight: 25 },
  copy: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 22 },
  amenityCount: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 16 },
  notice: { padding: 16, gap: 10, borderRadius: 38 },
  noticeTitle: { fontFamily: Fonts.bodyBold, fontSize: 14, lineHeight: 21 },
  property: { fontFamily: Fonts.bodySemiBold, fontSize: 12, lineHeight: 19 },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  verifiedText: {
    flex: 1,
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  currencyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  currencyBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  currency: { fontFamily: Fonts.bodyMedium, fontSize: 9, lineHeight: 13 },
  cta: { width: '54%', minWidth: 164 },
});
