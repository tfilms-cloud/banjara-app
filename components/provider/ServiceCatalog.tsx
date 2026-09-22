import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useThemeColors, type ColorTokens } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

export type CatalogTone = 'teal' | 'amber' | 'green';

export type SubServiceChip = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  count: number;
  countLabel: string;
};

export type ChildServiceItem = {
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  image?: string;
  icon: keyof typeof Ionicons.glyphMap;
  status?: string;
  statusTone?: 'green' | 'amber' | 'red' | 'gray' | 'blue';
  actionLabel?: string;
  onPress?: () => void;
};

export type ParentStat = {
  value: string;
  label: string;
};

function tonePalette(colors: ColorTokens, tone: CatalogTone) {
  if (tone === 'amber') {
    return { soft: colors.softAmber, fg: colors.warning };
  }
  if (tone === 'green') {
    return { soft: colors.softGreen, fg: colors.action };
  }
  return { soft: colors.primarySoft, fg: colors.primary };
}

export function ParentServiceCard({
  emoji,
  eyebrow,
  title,
  subtitle,
  stats,
  chips,
  status,
  statusTone = 'green',
  tone = 'teal',
  onEdit,
}: {
  emoji: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  stats?: ParentStat[];
  chips?: string[];
  status: string;
  statusTone?: 'green' | 'amber' | 'gray';
  tone?: CatalogTone;
  onEdit: () => void;
}) {
  const colors = useThemeColors();
  const palette = tonePalette(colors, tone);

  return (
    <View style={[styles.parent, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.parentBody}>
        <View style={styles.parentTop}>
          <View style={[styles.parentIcon, { backgroundColor: palette.soft }]}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>
          <View style={styles.parentCopy}>
            <View style={styles.eyebrowRow}>
              <Text style={[styles.eyebrow, { color: palette.fg }]} numberOfLines={1}>
                {eyebrow}
              </Text>
              <View style={styles.badgeWrap}>
                <Badge label={status} tone={statusTone} />
              </View>
            </View>
            <Text style={[styles.parentTitle, { color: colors.dark }]} numberOfLines={2}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={[styles.parentSub, { color: colors.muted }]} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {stats?.length ? (
          <View style={styles.statRow}>
            {stats.map((item) => (
              <View
                key={item.label}
                style={[styles.stat, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
              >
                <Text style={[styles.statValue, { color: colors.dark }]}>{item.value}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {chips?.length ? (
          <View style={styles.chipRow}>
            {chips.map((chip) => (
              <View
                key={chip}
                style={[styles.placeChip, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
              >
                <Ionicons name="location-outline" size={12} color={palette.fg} />
                <Text style={[styles.placeChipText, { color: colors.dark }]}>{chip}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Button title="Edit profile" onPress={onEdit} variant="outline" compact />
      </View>
    </View>
  );
}

export function CatalogSection({
  title,
  caption,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  caption?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionCopy}>
          <Text style={[styles.sectionTitle, { color: colors.dark }]}>{title}</Text>
          {caption ? (
            <Text style={[styles.sectionCaption, { color: colors.mutedLight }]}>{caption}</Text>
          ) : null}
        </View>
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            style={styles.seeAll}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function SubServicePills({
  items,
  selectedKey,
  onSelect,
  allLabel = 'All',
}: {
  items: SubServiceChip[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  allLabel?: string;
}) {
  const colors = useThemeColors();
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.pills}
    >
      <Pill
        label={allLabel}
        count={total}
        icon="apps-outline"
        selected={selectedKey == null}
        onPress={() => onSelect(null)}
        colors={colors}
      />
      {items.map((item) => (
        <Pill
          key={item.key}
          label={item.label}
          count={item.count}
          icon={item.icon}
          selected={selectedKey === item.key}
          onPress={() => onSelect(selectedKey === item.key ? null : item.key)}
          colors={colors}
        />
      ))}
    </ScrollView>
  );
}

function Pill({
  label,
  count,
  icon,
  selected,
  onPress,
  colors,
}: {
  label: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  colors: ColorTokens;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${count}`}
    >
      <View
        style={[
          styles.pill,
          {
            backgroundColor: selected ? colors.primary : colors.card,
            borderColor: selected ? colors.primary : colors.border,
          },
        ]}
      >
        <Ionicons name={icon} size={15} color={selected ? colors.white : colors.primary} />
        <Text style={[styles.pillLabel, { color: selected ? colors.white : colors.dark }]}>{label}</Text>
        <View
          style={[
            styles.pillCount,
            { backgroundColor: selected ? 'rgba(255,255,255,0.2)' : colors.inputBg },
          ]}
        >
          <Text style={[styles.pillCountText, { color: selected ? colors.white : colors.muted }]}>
            {count}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function ChildServiceCard({ item }: { item: ChildServiceItem }) {
  const colors = useThemeColors();
  const image = normalizeMediaUrl(item.image) ?? item.image;

  const content = (
    <View style={[styles.child, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.thumb, { backgroundColor: colors.primarySoft }]}>
        {image ? (
          <Image source={{ uri: image }} style={styles.childImage} contentFit="cover" />
        ) : (
          <Ionicons name={item.icon} size={20} color={colors.primary} />
        )}
      </View>

      <View style={styles.childCopy}>
        <Text style={[styles.childTitle, { color: colors.dark }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.childSub, { color: colors.muted }]} numberOfLines={1}>
          {item.subtitle}
        </Text>
        {item.meta ? (
          <Text style={[styles.childMeta, { color: colors.mutedLight }]} numberOfLines={1}>
            {item.meta}
          </Text>
        ) : null}
      </View>

      {item.status ? (
        <View style={styles.childStatus}>
          <Badge label={item.status} tone={item.statusTone ?? 'gray'} />
        </View>
      ) : null}

      {item.actionLabel ? (
        <Text style={[styles.actionLabel, { color: colors.primary }]}>{item.actionLabel}</Text>
      ) : null}
      {item.onPress ? (
        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={16} color={colors.muted} />
        </View>
      ) : null}
    </View>
  );

  if (!item.onPress) return content;

  return (
    <Pressable
      onPress={item.onPress}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      {content}
    </Pressable>
  );
}

export function CatalogEmpty({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const colors = useThemeColors();
  return (
    <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.actionSoft }]}>
        <Ionicons name={icon} size={22} color={colors.action} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.dark }]}>{title}</Text>
      <Text style={[styles.emptyMessage, { color: colors.muted }]}>{message}</Text>
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} compact fullWidth={false} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  parent: {
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  parentBody: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  parentTop: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'flex-start',
    width: '100%',
  },
  parentIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  emoji: {
    fontSize: 22,
  },
  parentCopy: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  eyebrowRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  eyebrow: {
    ...Typography.label,
    flexShrink: 1,
  },
  badgeWrap: {
    flexShrink: 0,
  },
  parentTitle: {
    ...Typography.h3,
  },
  parentSub: {
    ...Typography.caption,
    marginTop: 4,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  stat: {
    minWidth: 88,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  statValue: {
    ...Typography.h3,
  },
  statLabel: {
    ...Typography.small,
    marginTop: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  placeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    minHeight: 28,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  placeChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  section: {
    gap: Spacing.md,
  },
  sectionHead: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  sectionCopy: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    paddingRight: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  sectionCaption: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  seeAll: {
    minHeight: 44,
    justifyContent: 'center',
    flexShrink: 0,
  },
  seeAllText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
  },
  pills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  pill: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  pillLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  pillCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    flexShrink: 0,
  },
  pillCountText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    lineHeight: 14,
  },
  child: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    width: '100%',
    minHeight: 72,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  childImage: {
    width: 52,
    height: 52,
  },
  childCopy: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    marginRight: Spacing.sm,
    justifyContent: 'center',
  },
  childTitle: {
    ...Typography.cardTitle,
  },
  childSub: {
    ...Typography.caption,
    marginTop: 2,
  },
  childMeta: {
    ...Typography.small,
    marginTop: 1,
  },
  childStatus: {
    flexShrink: 0,
    marginRight: Spacing.xs,
  },
  actionLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    marginRight: 2,
    flexShrink: 0,
  },
  chevron: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pressed: {
    opacity: 0.72,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...Typography.cardTitle,
    textAlign: 'center',
  },
  emptyMessage: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
