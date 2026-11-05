import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { ExploreThumb } from '@/constants/exploreCatalog';
import { useHomeDesign } from '@/constants/homeDesign';
import { Fonts } from '@/constants/typography';
import { normalizeMediaUrl } from '@/utils/mediaUrl';
import { pushPath } from '@/utils/navigation';

export function TravelCatalogGrid({
  items,
  rows = 2,
  onItemPress,
  onShowMore,
  showMoreLabel = 'Show more',
}: {
  items: ExploreThumb[];
  rows?: number;
  onItemPress?: (item: ExploreThumb) => void;
  onShowMore?: () => void;
  showMoreLabel?: string;
}) {
  const theme = useHomeDesign();
  const { width } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  const cardWidth = (width - 44) / 2;
  const limit = 2 * Math.min(rows, 2);
  const visible = expanded ? items : items.slice(0, limit);
  return (
    <View style={s.catalog}>
      <View style={s.grid}>
        {visible.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="link"
            accessibilityLabel={item.title}
            onPress={() => (onItemPress ? onItemPress(item) : item.href && pushPath(item.href))}
            style={[
              s.card,
              { width: cardWidth, backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={[s.imageWrap, { backgroundColor: theme.field }]}>
              <Image
                source={{ uri: normalizeMediaUrl(item.image) ?? item.image }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
              {item.badge ? (
                <View style={[s.badge, { backgroundColor: theme.soft }]}>
                  <Text style={[s.badgeText, { color: theme.primary }]} numberOfLines={1}>
                    {item.badge}
                  </Text>
                </View>
              ) : null}
              {item.rating != null && item.rating > 0 ? (
                <View style={s.rating}>
                  <Ionicons name="star" size={11} color="#E9AC45" />
                  <Text style={s.ratingText}>{item.rating.toFixed(1)}</Text>
                </View>
              ) : null}
            </View>
            <View style={s.copy}>
              <Text style={[s.title, { color: theme.text }]} numberOfLines={2}>
                {item.title}
              </Text>
              {item.subtitle ? (
                <Text style={[s.subtitle, { color: theme.muted }]} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              ) : null}
              {item.meta && item.meta !== item.subtitle ? (
                <Text style={[s.meta, { color: theme.primary }]} numberOfLines={2}>
                  {item.meta}
                </Text>
              ) : null}
            </View>
          </Pressable>
        ))}
      </View>
      {(items.length > limit && !expanded) || onShowMore ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showMoreLabel}
          onPress={onShowMore ?? (() => setExpanded(true))}
          style={[s.more, { borderColor: theme.border }]}
        >
          <Text style={[s.moreText, { color: theme.primary }]}>{showMoreLabel}</Text>
          <Ionicons name="arrow-forward" size={16} color={theme.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function TravelFilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ id: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useHomeDesign();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
      {options.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="radio"
          accessibilityLabel={item.label}
          accessibilityState={{ checked: item.id === value }}
          onPress={() => onChange(item.id)}
          style={[
            s.filter,
            {
              borderColor: item.id === value ? theme.primary : theme.border,
              backgroundColor: item.id === value ? theme.soft : theme.surface,
            },
          ]}
        >
          <Text style={[s.filterText, { color: item.id === value ? theme.primary : theme.muted }]}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  catalog: { paddingHorizontal: 16, gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'stretch' },
  card: { borderWidth: 1, borderRadius: 22, overflow: 'hidden' },
  imageWrap: { aspectRatio: 1.3 },
  badge: {
    position: 'absolute',
    top: 9,
    left: 9,
    maxWidth: '85%',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  badgeText: { fontFamily: Fonts.bodySemiBold, fontSize: 9, textTransform: 'capitalize' },
  rating: {
    position: 'absolute',
    right: 9,
    bottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,25,25,0.78)',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  ratingText: { fontFamily: Fonts.bodySemiBold, fontSize: 10, color: 'rgb(255, 255, 255)' },
  copy: { padding: 12, gap: 5 },
  title: { fontFamily: Fonts.display, fontSize: 15, lineHeight: 20 },
  subtitle: { fontFamily: Fonts.body, fontSize: 11, lineHeight: 16 },
  meta: { fontFamily: Fonts.bodySemiBold, fontSize: 11, lineHeight: 16 },
  more: {
    borderWidth: 1,
    borderRadius: 22,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 44,
    paddingHorizontal: 18,
  },
  moreText: { fontFamily: Fonts.bodySemiBold, fontSize: 12 },
  filters: { paddingHorizontal: 16, gap: 8 },
  filter: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: { fontFamily: Fonts.bodySemiBold, fontSize: 12 },
});
