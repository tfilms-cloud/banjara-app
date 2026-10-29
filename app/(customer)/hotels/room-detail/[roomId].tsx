import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HotelAmenityList } from '@/components/hotels/HotelAmenity';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { useThemeColors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import * as hotelService from '@/services/hotelService';
import { useHotelStore } from '@/store/hotelStore';
import type { HotelRoom } from '@/types/hotel';
import { formatCurrency } from '@/utils/formatCurrency';
import { pushPath } from '@/utils/navigation';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = Math.min(width * 0.92, 360);

export default function HotelRoomDetailScreen() {
  const { roomId, hotelId } = useLocalSearchParams<{ roomId: string; hotelId?: string }>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const setRoom = useHotelStore((s) => s.setRoom);
  const selectedRoom = useHotelStore((s) => s.selectedRoom);
  const [room, setLocalRoom] = useState<HotelRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const loaded = await hotelService.getRoomById(String(roomId));
        if (!alive) return;
        if (!loaded) {
          setError('Room not found');
          setLocalRoom(null);
        } else {
          setLocalRoom(loaded);
        }
      } catch {
        if (alive) setError('Could not load room details');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [roomId]);

  useEffect(() => {
    if (!room) return;
    fadeIn.setValue(0);
    slideUp.setValue(18);
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, friction: 9, tension: 60, useNativeDriver: true }),
    ]).start();
  }, [room, fadeIn, slideUp]);

  if (loading) return <LoadingState title="Loading room..." />;
  if (error || !room) return <ErrorState message={error ?? 'Room not found'} />;

  const images = room.images.length ? room.images : [''];
  const hotelPath = hotelId || room.hotelId;
  const isSelected = selectedRoom?.id === room.id;
  const roomTypeLabel = room.roomType ? room.roomType.replace(/_/g, ' ') : 'Standard';

  const onSelect = () => {
    setRoom(room);
    pushPath(`/(customer)/hotels/rooms/${hotelPath}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      >
        <View style={[styles.heroWrap, { height: HERO_HEIGHT }]}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const next = Math.round(e.nativeEvent.contentOffset.x / width);
              setImageIndex(next);
            }}
          >
            {images.map((uri, index) => (
              <View key={`${uri}-${index}`} style={[styles.heroSlide, { width }]}>
                {uri ? (
                  <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      styles.heroFallback,
                      { backgroundColor: colors.primarySoft },
                    ]}
                  >
                    <Ionicons name="bed-outline" size={56} color={colors.primary} />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          <LinearGradient
            colors={['rgba(28,25,23,0.45)', 'transparent', 'rgba(28,25,23,0.72)']}
            locations={[0, 0.35, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <View style={[styles.heroTop, { paddingTop: insets.top + 8 }]}>
            <Pressable
              onPress={() => router.back()}
              style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.92)' }]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={20} color={colors.dark} />
            </Pressable>
            {images.length > 1 ? (
              <View style={styles.photoBadge}>
                <Ionicons name="images-outline" size={14} color="#fff" />
                <Text style={styles.photoBadgeText}>
                  {imageIndex + 1}/{images.length}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.heroBottom}>
            <Text style={styles.heroTitle}>{room.name}</Text>
            <Text style={styles.heroMeta}>
              {roomTypeLabel}
              {room.bedType ? ` · ${room.bedType}` : ''}
              {` · ${room.capacity} guest${room.capacity === 1 ? '' : 's'}`}
            </Text>
            {images.length > 1 ? (
              <View style={styles.dots}>
                {images.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: i === imageIndex ? '#fff' : 'rgba(255,255,255,0.45)',
                        width: i === imageIndex ? 18 : 7,
                      },
                    ]}
                  />
                ))}
              </View>
            ) : null}
          </View>
        </View>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              opacity: fadeIn,
              transform: [{ translateY: slideUp }],
            },
          ]}
        >
          <View style={[styles.priceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fromLabel, { color: colors.muted }]}>Price per night</Text>
              <Text style={[styles.priceValue, { color: colors.action }]}>
                {formatCurrency(room.pricePerNight)}
              </Text>
            </View>
            <View
              style={[
                styles.availPill,
                {
                  backgroundColor:
                    room.availableRooms > 0 ? colors.actionSoft : colors.softDanger,
                },
              ]}
            >
              <Ionicons
                name={room.availableRooms > 0 ? 'checkmark-circle' : 'alert-circle'}
                size={14}
                color={room.availableRooms > 0 ? colors.action : colors.danger}
              />
              <Text
                style={{
                  fontFamily: Fonts.bodySemiBold,
                  fontSize: 12,
                  color: room.availableRooms > 0 ? colors.actionDark : colors.danger,
                }}
              >
                {room.availableRooms > 0
                  ? `${room.availableRooms} left`
                  : 'Sold out'}
              </Text>
            </View>
          </View>

          <View style={styles.specRow}>
            <Spec icon="bed-outline" label="Bed" value={room.bedType || '—'} tint={colors.primarySoft} iconColor={colors.primary} />
            <Spec icon="people-outline" label="Guests" value={String(room.capacity)} tint={colors.actionSoft} iconColor={colors.action} />
            <Spec
              icon="resize-outline"
              label="Size"
              value={room.sizeSqm ? `${room.sizeSqm} m²` : '—'}
              tint="#FEF3C7"
              iconColor="#B45309"
            />
            <Spec
              icon="layers-outline"
              label="Type"
              value={roomTypeLabel}
              tint="#E2E8F0"
              iconColor={colors.dark}
            />
          </View>

          <View style={styles.chipRow}>
            <HighlightChip
              icon="cafe-outline"
              label={room.breakfastIncluded ? 'Breakfast included' : 'No breakfast'}
              active={room.breakfastIncluded}
            />
            <HighlightChip
              icon="shield-checkmark-outline"
              label={room.freeCancellation ? 'Free cancellation' : 'Check policy'}
              active={room.freeCancellation}
            />
          </View>

          <View style={[styles.sectionBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.dark }]}>About this room</Text>
            <Text style={[styles.body, { color: colors.muted }]}>
              {room.description?.trim() ||
                `Comfortable ${room.bedType || 'guest'} room for up to ${room.capacity} guest${
                  room.capacity === 1 ? '' : 's'
                }${room.sizeSqm ? `, about ${room.sizeSqm} m²` : ''}.`}
            </Text>
          </View>

          {room.amenities.length ? (
            <View style={[styles.sectionBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.dark }]}>Amenities</Text>
              <HotelAmenityList amenities={room.amenities} />
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      <View
        style={[
          styles.cta,
          {
            paddingBottom: insets.bottom + Spacing.md,
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            ...Shadows.soft,
          },
        ]}
      >
        <View style={styles.ctaPrice}>
          <Text style={[styles.ctaFrom, { color: colors.muted }]}>Total / night</Text>
          <Text style={[styles.ctaAmount, { color: colors.primary }]}>
            {formatCurrency(room.pricePerNight)}
          </Text>
        </View>
        <View style={{ flex: 1.4 }}>
          <Button
            title={isSelected ? 'Selected ✓' : 'Select this room'}
            onPress={onSelect}
          />
        </View>
      </View>
    </View>
  );
}

function Spec({
  icon,
  label,
  value,
  tint,
  iconColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tint: string;
  iconColor: string;
}) {
  const colors = useThemeColors();
  return (
    <View style={[styles.spec, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.specIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[styles.specLabel, { color: colors.muted }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.specValue, { color: colors.dark }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function HighlightChip({
  icon,
  label,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
}) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.actionSoft : colors.inputBg,
          borderColor: active ? colors.action : colors.border,
        },
      ]}
    >
      <Ionicons name={icon} size={15} color={active ? colors.action : colors.muted} />
      <Text
        style={{
          fontFamily: Fonts.bodySemiBold,
          fontSize: 12,
          color: active ? colors.actionDark : colors.muted,
          flexShrink: 1,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroWrap: { width: '100%', overflow: 'hidden' },
  heroSlide: { height: '100%' },
  heroFallback: { alignItems: 'center', justifyContent: 'center' },
  heroTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  photoBadgeText: {
    color: '#fff',
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
  },
  heroBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 8,
    gap: 4,
  },
  heroTitle: {
    fontFamily: Fonts.displayBold,
    fontSize: 28,
    lineHeight: 34,
    color: '#fff',
    letterSpacing: -0.3,
  },
  heroMeta: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.88)',
    textTransform: 'capitalize',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
  sheet: {
    marginTop: -20,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.soft,
  },
  fromLabel: { ...Typography.small, marginBottom: 2 },
  priceValue: {
    fontFamily: Fonts.displayBold,
    fontSize: 26,
    letterSpacing: -0.3,
  },
  availPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  specRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  spec: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 6,
  },
  specIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specLabel: { ...Typography.small },
  specValue: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    textTransform: 'capitalize',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '100%',
  },
  sectionBlock: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  body: { ...Typography.body, lineHeight: 23 },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  ctaPrice: { flex: 1 },
  ctaFrom: { ...Typography.small },
  ctaAmount: {
    fontFamily: Fonts.displayBold,
    fontSize: 18,
  },
});
