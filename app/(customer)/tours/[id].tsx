import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { useThemeColors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { useTourItinerary } from '@/hooks/useTourItineraries';
import { formatCurrency } from '@/utils/formatCurrency';
import { normalizeMediaUrl } from '@/utils/mediaUrl';
import { paramId, pushPath, safeBack } from '@/utils/navigation';

const FALLBACK =
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80&auto=format&fit=crop';

function MetaChip({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  const colors = useThemeColors();
  return (
    <View style={[styles.metaChip, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
      <Ionicons name={icon} size={13} color={colors.primary} />
      <Text style={[styles.metaChipText, { color: colors.dark }]}>{label}</Text>
    </View>
  );
}

function FactTile({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const colors = useThemeColors();
  return (
    <View style={[styles.factTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.factIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={[styles.factLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.factValue, { color: colors.dark }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export default function TourItineraryDetailScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = paramId(params.id);
  const { item, loading } = useTourItinerary(id);
  const [heroIndex, setHeroIndex] = useState(0);

  const gallery = useMemo(() => {
    if (!item) return [FALLBACK];
    const urls = [item.coverImage, ...item.images]
      .map((uri) => normalizeMediaUrl(uri) || uri)
      .filter(Boolean);
    return uniqueKeepOrder(urls.length ? urls : [FALLBACK]);
  }, [item]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingState title="Loading package…" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Pressable
          onPress={() => safeBack()}
          style={[styles.floatBack, { top: insets.top + 8, backgroundColor: colors.card }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
        </Pressable>
        <EmptyState title="Package not found" message="This itinerary may be unpublished." />
      </View>
    );
  }

  const typeLabel =
    item.tourType === 'summit'
      ? 'Summit'
      : item.tourType === 'expedition'
        ? 'Expedition'
        : 'Trek';
  const durationLabel =
    item.durationNights != null
      ? `${item.durationDays}D / ${item.durationNights}N`
      : `${item.durationDays} days`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroWrap, { height: Math.min(340, width * 0.88) }]}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width
              );
              setHeroIndex(index);
            }}
          >
            {gallery.map((uri) => (
              <Image
                key={uri}
                source={{ uri }}
                style={{ width, height: Math.min(340, width * 0.88) }}
                contentFit="cover"
              />
            ))}
          </ScrollView>
          <LinearGradient
            colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.55)']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <Pressable
            onPress={() => safeBack()}
            style={[styles.floatBack, { top: insets.top + 8, backgroundColor: 'rgba(255,255,255,0.92)' }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#111" />
          </Pressable>
          <View style={[styles.heroBottom, { paddingBottom: Spacing.lg }]}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{typeLabel}</Text>
              </View>
              {item.difficulty ? (
                <View style={[styles.heroBadge, styles.heroBadgeSoft]}>
                  <Text style={styles.heroBadgeTextSoft}>{item.difficulty}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.heroSub} numberOfLines={1}>
              {item.destination}
              {item.region ? ` · ${item.region}` : ''}
            </Text>
            {gallery.length > 1 ? (
              <View style={styles.dots}>
                {gallery.map((uri, index) => (
                  <View
                    key={`${uri}-dot`}
                    style={[styles.dot, index === heroIndex && styles.dotActive]}
                  />
                ))}
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.metaRow}>
            <MetaChip icon="time-outline" label={durationLabel} />
            <MetaChip icon="people-outline" label={`Up to ${item.maxParticipants}`} />
            {item.bestSeason ? (
              <MetaChip icon="sunny-outline" label={item.bestSeason} />
            ) : null}
            {item.departureLocation ? (
              <MetaChip icon="navigate-outline" label={`From ${item.departureLocation}`} />
            ) : null}
          </View>

          <View style={[styles.priceCard, { backgroundColor: colors.primarySoft }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.priceLabel, { color: colors.primary }]}>From</Text>
              <Text style={[styles.priceValue, { color: colors.primary }]}>
                {formatCurrency(item.pricePerPerson)}
              </Text>
            </View>
            <Text style={[styles.priceUnit, { color: colors.primary }]}>per person</Text>
          </View>

          {item.summary || item.description ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.dark }]}>About this trip</Text>
              {item.summary ? (
                <Text style={[styles.summary, { color: colors.dark }]}>{item.summary}</Text>
              ) : null}
              {item.description ? (
                <Text style={[styles.desc, { color: colors.muted }]}>{item.description}</Text>
              ) : null}
            </View>
          ) : null}

          {item.provider ? (
            <Pressable
              style={[styles.operatorCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => pushPath(`/(customer)/agency/${item.providerId}`)}
            >
              <Avatar
                uri={item.provider.logo ?? undefined}
                name={item.provider.businessName}
                size={48}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.opEyebrow, { color: colors.muted }]}>Tour operator</Text>
                <Text style={[styles.opTitle, { color: colors.dark }]} numberOfLines={1}>
                  {item.provider.businessName}
                </Text>
                <Text style={[styles.opMeta, { color: colors.muted }]} numberOfLines={1}>
                  {[
                    item.provider.city,
                    item.provider.verified ? 'Verified' : null,
                    item.provider.rating
                      ? `${item.provider.rating.toFixed(1)}★`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ) : null}

          {item.days.length ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.dark }]}>Day by day</Text>
              <View style={styles.timeline}>
                {item.days.map((day, index) => {
                  const last = index === item.days.length - 1;
                  return (
                    <View key={day.dayNumber} style={styles.timelineRow}>
                      <View style={styles.timelineRail}>
                        <View style={[styles.timelineDot, { backgroundColor: colors.primary }]}>
                          <Text style={styles.timelineDotText}>{day.dayNumber}</Text>
                        </View>
                        {!last ? (
                          <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                        ) : null}
                      </View>
                      <View
                        style={[
                          styles.dayCard,
                          { backgroundColor: colors.card, borderColor: colors.border },
                          last && { marginBottom: 0 },
                        ]}
                      >
                        <Text style={[styles.dayEyebrow, { color: colors.primary }]}>
                          Day {day.dayNumber}
                        </Text>
                        <Text style={[styles.dayTitle, { color: colors.dark }]}>{day.title}</Text>
                        {day.description ? (
                          <Text style={[styles.dayDesc, { color: colors.muted }]}>
                            {day.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {(item.included.length > 0 || item.excluded.length > 0) && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.dark }]}>What’s covered</Text>
              {item.included.length ? (
                <View style={styles.coverBlock}>
                  <Text style={[styles.coverHead, { color: colors.action }]}>Included</Text>
                  <View style={styles.chipWrap}>
                    {item.included.map((entry) => (
                      <View
                        key={entry}
                        style={[styles.coverChip, { backgroundColor: colors.actionSoft }]}
                      >
                        <Ionicons name="checkmark-circle" size={14} color={colors.action} />
                        <Text style={[styles.coverChipText, { color: colors.dark }]}>{entry}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
              {item.excluded.length ? (
                <View style={styles.coverBlock}>
                  <Text style={[styles.coverHead, { color: colors.danger }]}>Not included</Text>
                  <View style={styles.chipWrap}>
                    {item.excluded.map((entry) => (
                      <View
                        key={entry}
                        style={[styles.coverChip, { backgroundColor: colors.softDanger }]}
                      >
                        <Ionicons name="close-circle" size={14} color={colors.danger} />
                        <Text style={[styles.coverChipText, { color: colors.dark }]}>{entry}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.dark }]}>Good to know</Text>
            <View style={styles.factGrid}>
              {item.departureLocation ? (
                <FactTile icon="airplane-outline" label="Departs" value={item.departureLocation} />
              ) : null}
              {item.bestSeason ? (
                <FactTile icon="calendar-outline" label="Best season" value={item.bestSeason} />
              ) : null}
              <FactTile
                icon="people-outline"
                label="Group size"
                value={`Up to ${item.maxParticipants}`}
              />
              <FactTile icon="trail-sign-outline" label="Type" value={typeLabel} />
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.stickyBar,
          {
            paddingBottom: insets.bottom + Spacing.md,
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.stickyPrice, { color: colors.primary }]}>
            {formatCurrency(item.pricePerPerson)}
          </Text>
          <Text style={[styles.stickyHint, { color: colors.muted }]}>per person</Text>
        </View>
        <Button
          title="Book package"
          fullWidth={false}
          compact
          onPress={() => pushPath(`/(customer)/tours/book/${item.id}`)}
          style={{ minWidth: 150 }}
        />
      </View>
    </View>
  );
}

function uniqueKeepOrder(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  floatBack: {
    position: 'absolute',
    left: Spacing.lg,
    zIndex: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  heroWrap: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#1a2a2a',
  },
  heroBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.lg,
    gap: 6,
  },
  heroBadgeRow: { flexDirection: 'row', gap: 8 },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  heroBadgeSoft: { backgroundColor: 'rgba(0,0,0,0.35)' },
  heroBadgeText: {
    color: '#fff',
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  heroBadgeTextSoft: {
    color: '#fff',
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  heroTitle: {
    color: '#fff',
    fontFamily: Fonts.display,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    alignSelf: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#fff',
  },
  body: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: Spacing.xl,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  metaChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  priceCard: {
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
  },
  priceLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
  },
  priceValue: {
    fontFamily: Fonts.display,
    fontSize: 28,
    letterSpacing: -0.4,
  },
  priceUnit: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    marginBottom: 4,
  },
  section: { gap: Spacing.md },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 20,
    letterSpacing: -0.2,
  },
  summary: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 22,
  },
  desc: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 22,
  },
  operatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  opEyebrow: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  opTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
  },
  opMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  timeline: { gap: 0 },
  timelineRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timelineRail: {
    width: 28,
    alignItems: 'center',
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotText: {
    color: '#fff',
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 18,
    marginVertical: 4,
  },
  dayCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 4,
  },
  dayEyebrow: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
  },
  dayDesc: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  coverBlock: { gap: Spacing.sm },
  coverHead: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  coverChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  coverChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
  },
  factGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  factTile: {
    width: '48%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 6,
  },
  factIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
  },
  factValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
  },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.card,
  },
  stickyPrice: {
    fontFamily: Fonts.display,
    fontSize: 20,
  },
  stickyHint: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
});
