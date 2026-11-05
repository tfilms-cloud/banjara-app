import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HotelBookingFrame, HotelBookingProgress } from './HotelBookingPresentation';
import { HotelRoomCard, RoomQuantitySelector } from './HotelRoomCard';
import { HotelPriceBreakdownCard } from './HotelPriceBreakdown';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { TravelSurface } from '@/components/ui/TravelPrimitives';
import { useHotelDesign } from '@/constants/hotelDesign';
import { Fonts } from '@/constants/typography';
import type { Hotel, HotelPriceBreakdown, HotelRoom } from '@/types/hotel';
import { formatCurrency } from '@/utils/formatCurrency';
import { hotelPlaceLine } from '@/utils/hotelPresentation';
import { roomInventory } from '@/utils/hotelRoomSelection';

export function SelectRoomPresentation({
  hotel,
  rooms,
  selectedRoom,
  quantity,
  breakdown,
  guests,
  nights,
  priceLoading,
  priceEstimated,
  refreshing,
  onRefresh,
  onBack,
  onProfile,
  onSelect,
  onView,
  onQuantityChange,
  onContinue,
}: {
  hotel: Hotel;
  rooms: HotelRoom[];
  selectedRoom: HotelRoom | null;
  quantity: number;
  breakdown: HotelPriceBreakdown | null;
  guests: number;
  nights: number;
  priceLoading: boolean;
  priceEstimated: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onBack: () => void;
  onProfile: () => void;
  onSelect: (room: HotelRoom) => void;
  onView: (room: HotelRoom) => void;
  onQuantityChange: (quantity: number) => void;
  onContinue: () => void;
}) {
  const theme = useHotelDesign();
  const insets = useSafeAreaInsets();
  const availableTypes = rooms.filter((room) => roomInventory(room) > 0).length;
  const canContinue =
    !!selectedRoom &&
    !!breakdown &&
    !priceLoading &&
    !refreshing &&
    roomInventory(selectedRoom) >= quantity;
  return (
    <HotelBookingFrame
      title="Select Room"
      property={hotel.name}
      onBack={onBack}
      onProfile={onProfile}
    >
      <FlatList
        data={rooms}
        keyExtractor={(room) => room.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        ListHeaderComponent={
          <View style={s.top}>
            <HotelBookingProgress />
            <View style={s.selection}>
              <RoomQuantitySelector
                value={quantity}
                max={selectedRoom ? roomInventory(selectedRoom) : 0}
                disabled={!selectedRoom || refreshing}
                onChange={onQuantityChange}
              />
              {breakdown && !priceLoading ? (
                <HotelPriceBreakdownCard
                  breakdown={breakdown}
                  guests={guests}
                  freeCancellation={selectedRoom?.freeCancellation}
                  estimated={priceEstimated}
                />
              ) : (
                <TravelSurface style={[s.prompt, { backgroundColor: theme.neutral }]}>
                  {priceLoading ? (
                    <ActivityIndicator color={theme.primary} />
                  ) : (
                    <Ionicons name="receipt-outline" size={21} color={theme.primary} />
                  )}
                  <View style={s.flex}>
                    <Text
                      accessibilityLiveRegion="polite"
                      style={[s.promptTitle, { color: theme.text }]}
                    >
                      {priceLoading ? 'Updating your total…' : 'Choose your room'}
                    </Text>
                    <Text style={[s.copy, { color: theme.muted }]}>
                      {priceLoading
                        ? 'Checking the price for your stay.'
                        : 'Select a room below to see the full price breakdown.'}
                    </Text>
                  </View>
                </TravelSurface>
              )}
            </View>
            <View style={s.sectionHeader}>
              <View style={s.flex}>
                <Text accessibilityRole="header" style={[s.sectionTitle, { color: theme.text }]}>
                  Available Lodging
                </Text>
                <Text style={[s.copy, { color: theme.muted }]}>
                  {hotelPlaceLine(hotel)
                    ? `Rooms in ${hotelPlaceLine(hotel)}`
                    : 'Find the right room for your stay'}
                </Text>
              </View>
              <View style={[s.badge, { backgroundColor: theme.soft }]}>
                <Text style={[s.badgeText, { color: theme.primary }]}>
                  {availableTypes} type{availableTypes === 1 ? '' : 's'} available
                </Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <HotelRoomCard
            room={item}
            selected={selectedRoom?.id === item.id}
            onSelect={() => onSelect(item)}
            onView={() => onView(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No rooms available"
            message="Try different dates from hotel search."
            icon="bed-outline"
          />
        }
        ListFooterComponent={
          <TravelSurface style={[s.notice, { backgroundColor: theme.neutral }]}>
            <View style={[s.shield, { backgroundColor: theme.soft }]}>
              <Ionicons name="shield-checkmark-outline" size={24} color={theme.primary} />
            </View>
            <View style={s.flex}>
              <Text style={[s.promptTitle, { color: theme.text }]}>Review before you confirm</Text>
              <Text style={[s.copy, { color: theme.muted }]}>
                Next, add guest details. You can review your stay and payment before confirming.
              </Text>
            </View>
          </TravelSurface>
        }
      />
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
        <View style={s.totalRow}>
          <View style={s.flex}>
            <Text accessibilityLiveRegion="polite" style={[s.total, { color: theme.text }]}>
              {priceLoading
                ? 'Updating total…'
                : breakdown
                  ? `${formatCurrency(breakdown.total, breakdown.currency)} ${breakdown.currency} ${priceEstimated ? 'estimated' : 'total'}`
                  : 'Select a room'}
            </Text>
            <Text style={[s.small, { color: theme.muted }]}>
              {breakdown
                ? `${nights} night${nights === 1 ? '' : 's'} incl. taxes & fees`
                : `${nights} night${nights === 1 ? '' : 's'} · ${guests} guest${guests === 1 ? '' : 's'}`}
            </Text>
          </View>
          <View style={[s.badge, { backgroundColor: theme.soft }]}>
            <Ionicons name="person-outline" size={12} color={theme.primary} />
            <Text style={[s.badgeText, { color: theme.primary }]}>Guest details next</Text>
          </View>
        </View>
        <Button
          title="Continue to Guest Details"
          disabled={!canContinue}
          onPress={onContinue}
          style={{ borderRadius: 26 }}
          iconPosition="right"
          icon={<Ionicons name="arrow-forward" size={17} color={theme.background} />}
        />
      </View>
    </HotelBookingFrame>
  );
}
const s = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  list: { padding: 16, paddingBottom: 32, gap: 20 },
  top: { gap: 24 },
  selection: { gap: 16 },
  prompt: { borderRadius: 28, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  promptTitle: { fontFamily: Fonts.bodyBold, fontSize: 13, lineHeight: 20 },
  copy: { fontFamily: Fonts.body, fontSize: 11, lineHeight: 17, marginTop: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  sectionTitle: { fontFamily: Fonts.display, fontSize: 19, lineHeight: 26 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeText: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 15 },
  notice: {
    borderRadius: 30,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginTop: 4,
  },
  shield: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1, gap: 10 },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  total: { fontFamily: Fonts.displayBold, fontSize: 17, lineHeight: 23 },
  small: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 16, marginTop: 2 },
});
