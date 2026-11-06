import type { ScrollViewInstance } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { TravelDesignProvider } from '@/components/ui/TravelDesignProvider';
import { TravelIconAction, TravelSurface, type TravelIcon } from '@/components/ui/TravelPrimitives';
import { TripPanel } from '@/components/trip/TripDetailsPresentation';
import { useHomeDesign } from '@/constants/homeDesign';
import { Fonts } from '@/constants/typography';
import type { TourDay, TourItinerary } from '@/types/tourItinerary';
import { formatCurrency } from '@/utils/formatCurrency';
import { tourCanReserve, tourDuration, tourPhotos, tourTypeLabel } from '@/utils/tourPresentation';

type Props = {
  item: TourItinerary;
  refreshing: boolean;
  onRefresh: () => void;
  onBack: () => void;
  onShare: () => void;
  onOperator: () => void;
  onMessage: () => void;
  messaging?: boolean;
  onReserve: () => void;
};

// Photo overlays keep their contrast in both app themes, independently of surface colors.
const photoText = { color: '#FFFFFF' } as const;

export function TourDetailsPresentation(props: Props) {
  return (
    <TravelDesignProvider>
      <TourDetailsContent {...props} />
    </TravelDesignProvider>
  );
}

export function TourDetailsFrame({
  children,
  onBack,
}: {
  children: ReactNode;
  onBack: () => void;
}) {
  const theme = useHomeDesign();
  const insets = useSafeAreaInsets();
  return (
    <TravelDesignProvider>
      <View style={[s.root, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={s.stateHeader}>
          <TravelIconAction icon="arrow-back" label="Go back" onPress={onBack} filled />
          <Text accessibilityRole="header" style={[s.sectionTitle, { color: theme.text }]}>
            Tour Details
          </Text>
        </View>
        {children}
      </View>
    </TravelDesignProvider>
  );
}

function TourDetailsContent({
  item,
  refreshing,
  onRefresh,
  onBack,
  onShare,
  onOperator,
  onMessage,
  messaging,
  onReserve,
}: Props) {
  const theme = useHomeDesign();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const scroll = useRef<ScrollViewInstance>(null);
  const bodyY = useRef(0);
  const itineraryY = useRef(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [statusSurface, setStatusSurface] = useState(false);
  const gallery = tourPhotos(item).filter((uri) => !failed[uri]);
  const index = Math.min(photoIndex, Math.max(0, gallery.length - 1));
  const currentPhoto = gallery[index];
  const type = tourTypeLabel(item);
  const bookable = tourCanReserve(item);
  const provider = item.provider;
  const price =
    Number.isFinite(item.pricePerPerson) && item.pricePerPerson >= 0
      ? formatCurrency(item.pricePerPerson, item.currency)
      : 'Ask operator';
  const facts: Array<{ icon: TravelIcon; label: string; value: string }> = [
    { icon: 'time-outline', label: 'Duration', value: tourDuration(item) },
    {
      icon: 'people-outline',
      label: 'Group size',
      value:
        Number.isFinite(item.maxParticipants) && item.maxParticipants > 0
          ? `Max ${item.maxParticipants} travelers`
          : 'Ask operator',
    },
    ...(item.bestSeason
      ? [{ icon: 'sunny-outline' as const, label: 'Best season', value: item.bestSeason }]
      : []),
    ...(item.departureLocation
      ? [{ icon: 'boat-outline' as const, label: 'Departure', value: item.departureLocation }]
      : []),
    ...(item.difficulty
      ? [{ icon: 'walk-outline' as const, label: 'Difficulty', value: item.difficulty }]
      : []),
    { icon: 'trail-sign-outline', label: 'Tour type', value: type },
  ];
  const seeItinerary = () =>
    scroll.current?.scrollTo({
      y: Math.max(0, bodyY.current + itineraryY.current - insets.top - 8),
      animated: true,
    });

  return (
    <View style={[s.root, { backgroundColor: theme.background }]}>
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={32}
        onScroll={(event) => {
          const visible = event.nativeEvent.contentOffset.y > 340;
          if (statusSurface !== visible) setStatusSurface(visible);
        }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 126 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        <View style={[s.hero, { height: insets.top + 340, backgroundColor: theme.soft }]}>
          {currentPhoto ? (
            <Image
              source={{ uri: currentPhoto }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              accessibilityLabel={`${item.title}, photo ${index + 1} of ${gallery.length}`}
              onError={() => setFailed((previous) => ({ ...previous, [currentPhoto]: true }))}
            />
          ) : (
            <View style={s.heroFallback}>
              <Ionicons name="trail-sign-outline" size={76} color={theme.primary} />
            </View>
          )}
          <LinearGradient
            colors={['rgba(7,27,29,0.15)', 'rgba(7,27,29,0.08)', 'rgba(7,27,29,0.94)']}
            locations={[0, 0.35, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={[s.heroHeader, { top: insets.top + 8 }]}>
            <View style={s.headerButton}>
              <TravelIconAction
                icon="arrow-back"
                label="Go back"
                onPress={onBack}
                color="#233331"
              />
            </View>
            <View style={s.headerPill}>
              <Text style={s.headerPillText}>Tour Details</Text>
            </View>
            <View style={s.headerActions}>
              <View style={s.headerButton}>
                <TravelIconAction
                  icon="share-social-outline"
                  label="Share tour"
                  onPress={onShare}
                  color="#233331"
                />
              </View>
              <View style={s.headerButton}>
                <TravelIconAction
                  icon="images-outline"
                  label="View tour photos"
                  onPress={() => setGalleryOpen(true)}
                  color="#233331"
                />
              </View>
            </View>
          </View>
          <View style={s.heroCopy}>
            <View style={s.badges}>
              {provider?.verified ? (
                <View style={[s.badge, { backgroundColor: theme.action }]}>
                  <Ionicons name="checkmark-circle-outline" size={12} color={theme.background} />
                  <Text style={[s.badgeText, { color: theme.background }]}>Verified operator</Text>
                </View>
              ) : null}
              <View style={s.glassBadge}>
                <Text style={[s.badgeText, photoText]}>{type}</Text>
              </View>
              {item.difficulty ? (
                <View style={s.glassBadge}>
                  <Ionicons name="walk-outline" size={12} color="#F5D477" />
                  <Text style={[s.badgeText, photoText]}>{item.difficulty}</Text>
                </View>
              ) : null}
            </View>
            <Text accessibilityRole="header" style={[s.heroTitle, photoText]}>
              {item.title}
            </Text>
            <View style={s.locationRow}>
              <Ionicons name="location-outline" size={14} color="#99e6dc" />
              <Text style={[s.heroLocation, s.flex, photoText]}>
                {[item.destination, item.region].filter(Boolean).join(' · ')}
              </Text>
              {provider?.rating && provider.rating > 0 ? (
                <Text style={[s.heroLocation, photoText]}>
                  ★ {provider.rating.toFixed(1)} operator
                </Text>
              ) : null}
            </View>
            {gallery.length > 1 ? (
              <View style={s.dots}>
                {gallery.map((uri, position) => (
                  <Pressable
                    key={uri}
                    accessibilityRole="button"
                    accessibilityLabel={`Tour photo ${position + 1}`}
                    accessibilityState={{ selected: position === index }}
                    onPress={() => setPhotoIndex(position)}
                    style={s.dotTarget}
                  >
                    <View
                      style={[
                        s.dot,
                        position === index && { width: 20, backgroundColor: '#16b364' },
                      ]}
                    />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        <View
          style={s.body}
          onLayout={(event) => {
            bodyY.current = event.nativeEvent.layout.y;
          }}
        >
          <TripPanel style={s.panel}>
            <View style={[s.investment, { borderBottomColor: theme.border }]}>
              <View style={s.flex}>
                <Text style={[s.eyebrow, { color: theme.muted }]}>Tour investment</Text>
                <Text style={[s.price, { color: theme.primary }]}>
                  {price}
                  <Text style={[s.priceUnit, { color: theme.muted }]}> / person</Text>
                </Text>
              </View>
              <View style={[s.detailPill, { backgroundColor: theme.soft }]}>
                <Text style={[s.small, { color: theme.primary }]}>Per-person fare</Text>
              </View>
            </View>
            <TourFactGrid facts={facts} />
          </TripPanel>

          {provider ? (
            <TripPanel style={s.panel}>
              <View style={s.operatorRow}>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`View ${provider.businessName} profile`}
                  onPress={onOperator}
                  style={[s.operatorIdentity, s.flex]}
                >
                  <Avatar uri={provider.logo ?? undefined} name={provider.businessName} size={48} />
                  <View style={s.flex}>
                    <View style={s.inline}>
                      <Text style={[s.cardTitle, { color: theme.text }]}>
                        {provider.businessName}
                      </Text>
                      {provider.verified ? (
                        <Ionicons name="checkmark-circle" size={14} color={theme.primary} />
                      ) : null}
                    </View>
                    <Text style={[s.small, { color: theme.muted }]}>
                      {[
                        provider.rating && provider.rating > 0
                          ? `★ ${provider.rating.toFixed(1)}${provider.reviewCount ? ` (${provider.reviewCount} reviews)` : ''}`
                          : 'New operator',
                        provider.yearsExperience
                          ? `${provider.yearsExperience} years experience`
                          : provider.city,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                    <Text style={[s.small, { color: theme.primary }]}>View tour operator →</Text>
                  </View>
                </Pressable>
                <Button
                  title="Message ›"
                  variant="secondary"
                  fullWidth={false}
                  loading={messaging}
                  onPress={onMessage}
                  style={s.messageButton}
                />
              </View>
            </TripPanel>
          ) : null}

          {item.summary || item.description ? (
            <View style={s.section}>
              <TourSectionHeading title={`About This ${type}`} />
              <TripPanel style={s.panel}>
                {item.summary ? (
                  <Text style={[s.summary, { color: theme.text }]}>{item.summary}</Text>
                ) : null}
                {item.description ? (
                  <Text style={[s.bodyText, { color: theme.muted }]}>{item.description}</Text>
                ) : null}
                {item.included.length > 0 ? (
                  <TourFactGrid
                    facts={item.included
                      .slice(0, 4)
                      .map((value) => ({ icon: 'checkmark-circle-outline', value }))}
                  />
                ) : null}
              </TripPanel>
            </View>
          ) : null}

          <View
            style={s.section}
            onLayout={(event) => {
              itineraryY.current = event.nativeEvent.layout.y;
            }}
          >
            <TourSectionHeading
              title={`${item.durationDays > 0 ? `${item.durationDays} Days ` : ''}Itinerary`}
              action="View schedule"
              onAction={seeItinerary}
            />
            {item.days.length ? (
              <View>
                {item.days.map((day, position) => (
                  <TourItineraryDay
                    key={`${day.dayNumber}-${position}`}
                    day={day}
                    last={position === item.days.length - 1}
                  />
                ))}
              </View>
            ) : (
              <Text style={[s.bodyText, { color: theme.muted }]}>
                Contact the operator for the detailed daily schedule.
              </Text>
            )}
          </View>

          {item.included.length || item.excluded.length ? (
            <View style={s.section}>
              <TourSectionHeading title="What’s Covered" />
              {item.included.length ? (
                <TourCoverageCard title="Included in Package" entries={item.included} />
              ) : null}
              {item.excluded.length ? (
                <TourCoverageCard title="Not Included" entries={item.excluded} excluded />
              ) : null}
            </View>
          ) : null}

          <View style={s.section}>
            <TourSectionHeading title="Route & Destination" />
            <TripPanel style={s.panel}>
              <View style={[s.routeOverview, { backgroundColor: theme.soft }]}>
                <Ionicons name="trail-sign-outline" size={44} color={theme.primary} />
                <Text style={[s.cardTitle, { color: theme.primary, textAlign: 'center' }]}>
                  {[item.departureLocation, item.destination].filter(Boolean).join(' → ') ||
                    'Ask the operator for the route'}
                </Text>
                {item.region ? (
                  <Text style={[s.small, { color: theme.muted }]}>{item.region}</Text>
                ) : null}
              </View>
              <Text style={[s.bodyText, { color: theme.muted }]}>
                Confirm meeting points, trail conditions and the final route with your tour operator
                before departure.
              </Text>
              {provider ? (
                <Button
                  title="View operator details →"
                  variant="secondary"
                  onPress={onOperator}
                  style={{ borderRadius: 24 }}
                />
              ) : null}
            </TripPanel>
          </View>
        </View>
      </ScrollView>

      {statusSurface ? (
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
          <Text style={[s.eyebrow, { color: theme.muted }]}>Per-person price</Text>
          <Text style={[s.footerPrice, { color: theme.text }]}>
            {price}
            <Text style={[s.priceUnit, { color: theme.muted }]}> / person</Text>
          </Text>
        </View>
        <Button
          title={bookable ? 'Reserve Spot →' : 'Unavailable'}
          fullWidth={false}
          disabled={!bookable}
          onPress={onReserve}
          style={s.reserveButton}
        />
      </View>

      <Modal
        visible={galleryOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setGalleryOpen(false)}
      >
        {galleryOpen ? <StatusBar style="light" /> : null}
        <View accessibilityViewIsModal style={s.galleryModal}>
          <View style={[s.galleryHeader, { paddingTop: insets.top + 12 }]}>
            <Text style={[s.galleryTitle, photoText]}>
              Tour photos {gallery.length ? `· ${index + 1} / ${gallery.length}` : ''}
            </Text>
            <TravelIconAction
              icon="close"
              label="Close tour photos"
              onPress={() => setGalleryOpen(false)}
              color="#FFFFFF"
            />
          </View>
          {currentPhoto ? (
            <Image
              source={{ uri: currentPhoto }}
              style={{ width, height: height * 0.65 }}
              contentFit="contain"
              accessibilityLabel={`${item.title}, enlarged photo ${index + 1}`}
              onError={() => setFailed((previous) => ({ ...previous, [currentPhoto]: true }))}
            />
          ) : (
            <Text style={[s.galleryTitle, photoText]}>No tour photos available</Text>
          )}
          {gallery.length > 1 ? (
            <View style={s.galleryControls}>
              <TravelIconAction
                icon="chevron-back"
                label="Previous tour photo"
                onPress={() => setPhotoIndex((index - 1 + gallery.length) % gallery.length)}
                color="#FFFFFF"
              />
              <TravelIconAction
                icon="chevron-forward"
                label="Next tour photo"
                onPress={() => setPhotoIndex((index + 1) % gallery.length)}
                color="#FFFFFF"
              />
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

type TourFact = { icon: TravelIcon; label?: string; value: string };

export function TourFactGrid({ facts }: { facts: TourFact[] }) {
  return (
    <View style={{ gap: 8 }}>
      {Array.from({ length: Math.ceil(facts.length / 2) }, (_, row) => (
        <View key={row} style={s.factRow}>
          <TourFactTile {...facts[row * 2]} />
          {facts[row * 2 + 1] ? <TourFactTile {...facts[row * 2 + 1]} /> : <View style={s.flex} />}
        </View>
      ))}
    </View>
  );
}

export function TourFactTile({
  icon,
  label,
  value,
}: {
  icon: TravelIcon;
  label?: string;
  value: string;
}) {
  const theme = useHomeDesign();
  return (
    <View style={[s.fact, { backgroundColor: theme.field, borderColor: theme.border }]}>
      <View style={[s.factIcon, { backgroundColor: theme.soft }]}>
        <Ionicons name={icon} size={19} color={theme.primary} />
      </View>
      <View style={s.flex}>
        {label ? <Text style={[s.factLabel, { color: theme.muted }]}>{label}</Text> : null}
        <Text style={[s.factValue, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
  );
}

export function TourItineraryDay({ day, last }: { day: TourDay; last: boolean }) {
  const theme = useHomeDesign();
  return (
    <View style={s.dayRow}>
      <View style={s.rail}>
        <View style={[s.dayNumber, { backgroundColor: theme.action }]}>
          <Text style={[s.dayNumberText, { color: theme.background }]}>
            {String(day.dayNumber).padStart(2, '0')}
          </Text>
        </View>
        {!last ? <View style={[s.railLine, { backgroundColor: theme.action }]} /> : null}
      </View>
      <TravelSurface
        style={[
          s.dayCard,
          { borderColor: theme.border, backgroundColor: last ? theme.field : theme.surface },
        ]}
      >
        <Text style={[s.eyebrow, { color: theme.primary }]}>Day {day.dayNumber}</Text>
        <Text style={[s.cardTitle, { color: theme.text }]}>{day.title}</Text>
        {day.description ? (
          <Text style={[s.bodyText, { color: theme.muted }]}>{day.description}</Text>
        ) : null}
      </TravelSurface>
    </View>
  );
}

export function TourCoverageCard({
  title,
  entries,
  excluded = false,
}: {
  title: string;
  entries: string[];
  excluded?: boolean;
}) {
  const theme = useHomeDesign();
  const color = excluded ? theme.coral : theme.primary;
  return (
    <TripPanel style={s.panel}>
      <View style={s.inline}>
        <Ionicons
          name={excluded ? 'close-circle-outline' : 'checkmark-circle-outline'}
          size={18}
          color={color}
        />
        <Text style={[s.cardTitle, { color }]}>{title}</Text>
      </View>
      <View style={s.coverageList}>
        {entries.map((entry, position) => (
          <View
            key={`${position}-${entry}`}
            style={[s.coveragePill, { backgroundColor: excluded ? theme.coralSoft : theme.soft }]}
          >
            <Ionicons name={excluded ? 'remove' : 'checkmark'} size={13} color={color} />
            <Text style={[s.coverageText, { color }]}>{entry}</Text>
          </View>
        ))}
      </View>
    </TripPanel>
  );
}

function TourSectionHeading({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const theme = useHomeDesign();
  return (
    <View style={s.spread}>
      <Text accessibilityRole="header" style={[s.sectionTitle, s.flex, { color: theme.text }]}>
        {title}
      </Text>
      {action && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action}
          onPress={onAction}
          style={s.scheduleAction}
        >
          <Text style={[s.small, { color: theme.primary }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  stateHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  hero: { overflow: 'hidden' },
  heroFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerButton: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 22 },
  headerPill: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerPillText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: '#233331' },
  heroCopy: { position: 'absolute', left: 16, right: 16, bottom: 8, gap: 8 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  glassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  badgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    lineHeight: 15,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  heroTitle: { fontFamily: Fonts.displayBold, fontSize: 24, lineHeight: 30, color: '#FFFFFF' },
  heroLocation: { fontFamily: Fonts.bodyMedium, fontSize: 11, lineHeight: 17, color: '#FFFFFF' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dots: { flexDirection: 'row', alignSelf: 'center' },
  dotTarget: { minWidth: 24, height: 28, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  body: { padding: 16, gap: 24 },
  panel: { borderRadius: 22, padding: 16, gap: 14 },
  section: { gap: 12 },
  spread: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'space-between' },
  sectionTitle: { fontFamily: Fonts.displayBold, fontSize: 18, lineHeight: 25 },
  cardTitle: { fontFamily: Fonts.bodyBold, fontSize: 13, lineHeight: 20, flexShrink: 1 },
  bodyText: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 21 },
  summary: { fontFamily: Fonts.bodySemiBold, fontSize: 13, lineHeight: 21 },
  small: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 16 },
  eyebrow: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  investment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  price: { fontFamily: Fonts.displayBold, fontSize: 23, lineHeight: 31 },
  priceUnit: { fontFamily: Fonts.body, fontSize: 11, lineHeight: 17 },
  detailPill: { borderRadius: 14, paddingHorizontal: 9, paddingVertical: 5, maxWidth: '38%' },
  factRow: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  fact: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 22,
    padding: 12,
    minHeight: 64,
  },
  factIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 9,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  factValue: { fontFamily: Fonts.bodySemiBold, fontSize: 11, lineHeight: 17 },
  operatorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  operatorIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56 },
  messageButton: { borderRadius: 24, paddingHorizontal: 12, alignSelf: 'center' },
  inline: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  scheduleAction: { minHeight: 44, justifyContent: 'center' },
  dayRow: { flexDirection: 'row', gap: 10 },
  rail: { width: 28, alignItems: 'center' },
  dayNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  dayNumberText: { fontFamily: Fonts.bodyBold, fontSize: 10, lineHeight: 16 },
  railLine: { width: 1, flex: 1, minHeight: 18, opacity: 0.3, marginTop: 4 },
  dayCard: { flex: 1, padding: 14, borderRadius: 20, borderWidth: 1, gap: 6, marginBottom: 12 },
  coverageList: { alignItems: 'flex-start', gap: 8 },
  coveragePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 7,
    maxWidth: '100%',
  },
  coverageText: { flexShrink: 1, fontFamily: Fonts.bodyMedium, fontSize: 11, lineHeight: 17 },
  routeOverview: {
    minHeight: 160,
    padding: 20,
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  footerPrice: { fontFamily: Fonts.displayBold, fontSize: 20, lineHeight: 28 },
  reserveButton: { minWidth: 140, borderRadius: 26, alignSelf: 'center' },
  galleryModal: {
    flex: 1,
    backgroundColor: '#128a4c',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  galleryHeader: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  galleryTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: '#FFFFFF', flexShrink: 1 },
  galleryControls: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
});
