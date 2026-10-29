import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { useThemeColors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { useRestaurant } from '@/hooks/useRestaurants';
import { normalizeMediaUrl } from '@/utils/mediaUrl';
import { paramId, safeBack } from '@/utils/navigation';

const FALLBACK =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80&auto=format&fit=crop';

function offerTone(type: string) {
  if (type === 'sale') return { bg: '#FEF3C7', fg: '#92400E', label: 'Sale' };
  if (type === 'discount') return { bg: '#DCFCE7', fg: '#166534', label: 'Discount' };
  return { bg: '#E0F2FE', fg: '#075985', label: 'Offer' };
}

export default function RestaurantProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = paramId(params.id);
  const { restaurant, loading } = useRestaurant(id);
  const [photoIndex, setPhotoIndex] = useState(0);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Restaurant" showBack onBack={() => safeBack()} />
        <LoadingState title="Loading restaurant..." />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Restaurant" showBack onBack={() => safeBack()} />
        <EmptyState title="Restaurant not found" message="This listing may have been removed." />
      </View>
    );
  }

  const photos = restaurant.images.length ? restaurant.images : [FALLBACK];
  const activeOffers = restaurant.offers.filter((o) => o.active);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={restaurant.name} showBack onBack={() => safeBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const next = Math.round(e.nativeEvent.contentOffset.x / width);
            setPhotoIndex(next);
          }}
        >
          {photos.map((uri, index) => (
            <Image
              key={`${uri}-${index}`}
              source={{ uri: normalizeMediaUrl(uri) ?? uri }}
              style={{ width, height: 240 }}
              contentFit="cover"
            />
          ))}
        </ScrollView>
        {photos.length > 1 ? (
          <View style={styles.dots}>
            {photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === photoIndex ? colors.primary : colors.border,
                  },
                ]}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.body}>
          <Text style={[styles.name, { color: colors.dark }]}>{restaurant.name}</Text>
          <Text style={[styles.meta, { color: colors.muted }]}>
            {[restaurant.city, restaurant.cuisine?.slice(0, 3).join(' · ')].filter(Boolean).join(' · ')}
          </Text>
          {restaurant.rating > 0 ? (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#F5B83D" />
              <Text style={[styles.ratingText, { color: colors.dark }]}>
                {restaurant.rating.toFixed(1)} · {restaurant.reviewCount} reviews
              </Text>
            </View>
          ) : null}

          {restaurant.description ? (
            <Text style={[styles.desc, { color: colors.dark }]}>{restaurant.description}</Text>
          ) : null}

          {restaurant.menuVariety?.length ? (
            <View style={styles.block}>
              <Text style={[styles.blockTitle, { color: colors.primary }]}>Menu variety</Text>
              <View style={styles.chipRow}>
                {restaurant.menuVariety.map((item) => (
                  <View
                    key={item}
                    style={[styles.chip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  >
                    <Text style={[styles.chipText, { color: colors.dark }]}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {activeOffers.length ? (
            <View style={styles.block}>
              <Text style={[styles.blockTitle, { color: colors.primary }]}>Sales, offers & discounts</Text>
              {activeOffers.map((offer) => {
                const tone = offerTone(offer.type);
                return (
                  <View
                    key={offer.id}
                    style={[styles.offerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={[styles.offerBadge, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.offerBadgeText, { color: tone.fg }]}>
                        {offer.discountPercent != null
                          ? `${offer.discountPercent}% off`
                          : tone.label}
                      </Text>
                    </View>
                    <Text style={[styles.offerTitle, { color: colors.dark }]}>{offer.title}</Text>
                    {offer.description ? (
                      <Text style={[styles.offerMeta, { color: colors.muted }]}>{offer.description}</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : null}

          {restaurant.hours ? (
            <View style={styles.block}>
              <Text style={[styles.blockTitle, { color: colors.primary }]}>Hours</Text>
              <Text style={[styles.blockBody, { color: colors.dark }]}>{restaurant.hours}</Text>
            </View>
          ) : null}

          {restaurant.address ? (
            <View style={styles.block}>
              <Text style={[styles.blockTitle, { color: colors.primary }]}>Address</Text>
              <Text style={[styles.blockBody, { color: colors.dark }]}>{restaurant.address}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            {restaurant.phone ? (
              <Button
                title="Call restaurant"
                onPress={() => void Linking.openURL(`tel:${restaurant.phone}`)}
                icon={<Ionicons name="call-outline" size={18} color={colors.white} />}
              />
            ) : null}

            {restaurant.website ? (
              <Button
                title="Open website"
                variant="outline"
                onPress={() => void Linking.openURL(restaurant.website!)}
              />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { padding: Spacing.lg, gap: Spacing.md },
  name: { fontFamily: Fonts.display, fontSize: 26 },
  meta: { fontFamily: Fonts.body, fontSize: 14 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingText: { fontFamily: Fonts.bodySemiBold, fontSize: 13 },
  desc: { fontFamily: Fonts.body, fontSize: 15, lineHeight: 22 },
  block: { gap: 8 },
  blockTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  blockBody: { fontFamily: Fonts.body, fontSize: 15, lineHeight: 22 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontFamily: Fonts.bodyMedium, fontSize: 12 },
  offerCard: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: 6,
    ...Shadows.card,
  },
  offerBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  offerBadgeText: { fontFamily: Fonts.bodySemiBold, fontSize: 11 },
  offerTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 15 },
  offerMeta: { fontFamily: Fonts.body, fontSize: 13 },
  actions: { gap: Spacing.sm, marginTop: Spacing.sm },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: -18,
    marginBottom: 8,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
