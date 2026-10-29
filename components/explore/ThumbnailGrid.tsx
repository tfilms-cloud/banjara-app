import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useThemeColors, type ColorTokens } from '@/constants/colors';
import type { ExploreThumb } from '@/constants/exploreCatalog';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Radius, Shadows, Spacing, Size } from '@/constants/spacing';
import { Fonts, TypeSize, Leading } from '@/constants/typography';
import { pushPath } from '@/utils/navigation';

type ThumbnailGridProps = {
  items: ExploreThumb[];
  /** Columns per row (default 4) */
  columns?: number;
  /** Max rows to show before "show more" */
  rows?: number;
  showMoreLabel?: string;
  onShowMore?: () => void;
  emptyLabel?: string;
  /** Override default navigation to item.href */
  onItemPress?: (item: ExploreThumb) => void;
};

export function ThumbnailGrid({
  items,
  columns = 4,
  rows = 3,
  showMoreLabel = 'Show more',
  onShowMore,
  emptyLabel = 'Nothing to show yet',
  onItemPress,
}: ThumbnailGridProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const pad = Spacing.screen * 2;
  const gap = Spacing.sm;
  const cell = Math.floor((width - pad - gap * (columns - 1)) / columns);
  const limit = columns * rows;
  const visible = items.slice(0, limit);
  const hasMore = items.length > limit || Boolean(onShowMore);

  if (!items.length) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: colors.muted }]}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.grid, { gap }]}>
        {visible.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              if (onItemPress) {
                onItemPress(item);
                return;
              }
              if (item.href) {
                pushPath(item.href);
              }
            }}
            style={[styles.cell, { width: cell }]}
            accessibilityRole="link"
            accessibilityLabel={item.title}
          >
            <View style={[styles.thumbWrap, { width: cell, height: cell * 0.92 }]}>
              <Image source={{ uri: item.image }} style={styles.thumb} contentFit="cover" />
              {item.badge ? (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : null}
              {item.rating != null ? (
                <View style={styles.rating}>
                  <Ionicons name="star" size={Size.iconTiny} color={colors.warning} />
                  <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.title, { color: colors.dark }]} numberOfLines={2}>
              {item.title}
            </Text>
            {item.meta || item.subtitle ? (
              <Text style={[styles.meta, { color: colors.muted }]} numberOfLines={2}>
                {item.meta || item.subtitle}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </View>
      {hasMore && onShowMore ? (
        <Pressable
          onPress={onShowMore}
          style={[styles.moreBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          accessibilityRole="button"
          accessibilityLabel={showMoreLabel}
        >
          <Text style={[styles.moreText, { color: colors.primary }]}>{showMoreLabel}</Text>
          <Ionicons name="chevron-forward" size={Size.iconSm} color={colors.primaryText} />
        </Pressable>
      ) : null}
    </View>
  );
}

type FilterChipsProps<T extends string> = {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
};

export function ExploreFilterChips<T extends string>({
  options,
  value,
  onChange,
}: FilterChipsProps<T>) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.filters, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            style={[
              styles.filterChip,
              active && { backgroundColor: colors.primary },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: active ? colors.white : colors.muted,
                  fontFamily: active ? Fonts.bodySemiBold : Fonts.bodyMedium,
                },
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.screen,
    gap: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    marginBottom: Spacing.sm,
  },
  thumbWrap: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.inputBg,
    ...Shadows.soft,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: Spacing.micro,
    left: Spacing.micro,
    paddingHorizontal: Spacing.micro,
    paddingVertical: Spacing.xxs,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: TypeSize.tiny,
    color: colors.white,
  },
  rating: {
    position: 'absolute',
    bottom: Spacing.micro,
    right: Spacing.micro,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    backgroundColor: colors.mediaScrim,
    paddingHorizontal: Spacing.badge,
    paddingVertical: Spacing.xxs,
    borderRadius: Radius.full,
  },
  ratingText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: TypeSize.overline,
    color: colors.white,
  },
  title: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: TypeSize.micro,
    marginTop: Spacing.badge,
    lineHeight: Leading.caption,
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: TypeSize.overline,
    marginTop: Spacing.hairline,
    lineHeight: Leading.compact,
  },
  moreBtn: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.control,
    borderRadius: Radius.full,
    borderWidth: Size.border,
  },
  moreText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: TypeSize.label,
  },
  empty: {
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: TypeSize.label,
    textAlign: 'center',
  },
  filters: {
    flexDirection: 'row',
    marginHorizontal: Spacing.screen,
    borderRadius: Radius.full,
    borderWidth: Size.border,
    padding: Spacing.tight,
  },
  filterChip: {
    flex: 1,
    minHeight: Size.compactControl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.micro,
  },
  filterText: {
    fontSize: TypeSize.caption,
    letterSpacing: -0.2,
  },
});
