import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { TravelIconAction, TravelSection, type TravelIcon } from '@/components/ui/TravelPrimitives';
import { useExploreDesign } from '@/constants/exploreDesign';
import type { ExploreServiceTab } from '@/constants/exploreCatalog';
import { Fonts } from '@/constants/typography';
import type { TripWithDetails } from '@/types/trip';
import { groupTripsByAgency } from '@/utils/groupTripsByAgency';
import {
  exploreVehicleFilters,
  exploreVehicles,
  isExploreTripAvailable,
  type ExploreVehicleFilter,
} from '@/utils/exploreTransport';
import { formatCurrency } from '@/utils/formatCurrency';
import { normalizeMediaUrl } from '@/utils/mediaUrl';
import { pushPath } from '@/utils/navigation';

const BANNER = require('@/assets/explore/transport-banner.jpg');
const ROUTES = [
  {
    from: 'Islamabad',
    to: 'Hunza',
    label: 'DIRECT ROUTE',
    image: require('@/assets/explore/hunza-route.jpg'),
  },
  {
    from: 'Lahore',
    to: 'Skardu',
    label: 'EXPRESS ROUTE',
    image: require('@/assets/explore/skardu-route.jpg'),
  },
] as const;

const SERVICES: Array<{ id: ExploreServiceTab; label: string; title: string; icon: TravelIcon }> = [
  { id: 'transport', label: 'Ride', title: 'Transport', icon: 'car-sport' },
  { id: 'hotels', label: 'Stay', title: 'Stays', icon: 'business-outline' },
  { id: 'tours', label: 'Tours', title: 'Tours', icon: 'trail-sign-outline' },
  { id: 'guides', label: 'Guides', title: 'Guides', icon: 'compass-outline' },
  { id: 'restaurants', label: 'Food', title: 'Restaurants', icon: 'restaurant' },
];

const VEHICLE_ICONS: Record<ExploreVehicleFilter, { outline: TravelIcon; selected: TravelIcon }> = {
  all: { outline: 'grid-outline', selected: 'grid' },
  car: { outline: 'car-outline', selected: 'car' },
  jeep: { outline: 'car-sport-outline', selected: 'car-sport' },
  suv: { outline: 'car-sport-outline', selected: 'car-sport' },
  van: { outline: 'bus-outline', selected: 'bus' },
  mini_bus: { outline: 'bus-outline', selected: 'bus' },
  bus: { outline: 'bus-outline', selected: 'bus' },
  other: { outline: 'ellipsis-horizontal-outline', selected: 'ellipsis-horizontal' },
};

/** Equal-width service controls share one capsule and retain accessible service names. */
export function ExploreServiceSelector({
  value,
  onChange,
}: {
  value: ExploreServiceTab;
  onChange: (value: ExploreServiceTab) => void;
}) {
  const theme = useExploreDesign();
  return (
    <View style={[s.services, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {SERVICES.map((item) => {
        const selected = value === item.id;
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            accessibilityRole="tab"
            accessibilityLabel={item.title}
            accessibilityState={{ selected }}
            style={s.service}
          >
            <View
              style={[s.serviceIcon, { backgroundColor: selected ? theme.accent : theme.field }]}
            >
              <Ionicons name={item.icon} size={23} color={selected ? theme.primary : theme.muted} />
            </View>
            <Text style={[s.serviceLabel, { color: selected ? theme.primary : theme.muted }]}>
              {item.label}
            </Text>
            <View
              style={[
                s.serviceIndicator,
                { backgroundColor: selected ? theme.primary : 'transparent' },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export function ExploreBanner({ service }: { service: ExploreServiceTab }) {
  const activeService = SERVICES.find((item) => item.id === service) ?? SERVICES[0];
  const descriptions: Record<ExploreServiceTab, string> = {
    transport: 'Find the right ride for your next adventure.',
    hotels: 'Find a welcoming stay along your journey.',
    tours: 'Discover new places with local tour operators.',
    guides: 'See more of the north with a local guide.',
    restaurants: 'Discover local flavors along the way.',
  };
  return (
    <View style={s.banner}>
      <Image
        source={BANNER}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="center"
      />
      <LinearGradient
        colors={['rgba(7,30,29,0.12)', 'rgba(7,30,29,0.24)', 'rgba(7,30,29,0.9)']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.bannerBadge}>
        <View style={s.bannerBadgeIcon}>
          <Ionicons name={activeService.icon} size={15} color="white" accessible={false} />
        </View>
        <Text style={s.bannerBadgeText}>Explore the north</Text>
      </View>
      <View>
        <Text accessibilityRole="header" style={s.bannerTitle}>
          Explore {activeService.title}
        </Text>
        <Text style={s.bannerSubtitle}>{descriptions[service]}</Text>
      </View>
    </View>
  );
}

export function ExploreVehicleFilters({
  value,
  onChange,
  options,
}: {
  value: ExploreVehicleFilter;
  onChange: (value: ExploreVehicleFilter) => void;
  options: ReturnType<typeof exploreVehicleFilters>;
}) {
  const theme = useExploreDesign();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
      {options.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="radio"
          accessibilityLabel={`Vehicle type: ${item.label}`}
          accessibilityState={{ checked: value === item.id }}
          onPress={() => onChange(item.id)}
          style={[
            s.filter,
            {
              backgroundColor: value === item.id ? theme.accent : theme.field,
              borderColor: value === item.id ? theme.primary : theme.border,
            },
          ]}
        >
          <Ionicons
            name={value === item.id ? VEHICLE_ICONS[item.id].selected : VEHICLE_ICONS[item.id].outline}
            size={17}
            color={value === item.id ? theme.primary : theme.muted}
            accessible={false}
          />
          <Text style={[s.filterText, { color: value === item.id ? theme.primary : theme.text }]}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function ExploreVehicleCard({ trip, width }: { trip: TripWithDetails; width: number }) {
  const theme = useExploreDesign();
  const rating = trip.agency?.rating || trip.rating;
  const image = normalizeMediaUrl(trip.vehicleImages?.[0] || trip.image);
  return (
    <Pressable
      style={[s.vehicle, { width, backgroundColor: theme.surface, borderColor: theme.border }]}
      accessibilityRole="button"
      accessibilityLabel={`${trip.vehicleName || trip.vehicleType}, ${trip.agency.name}, from ${formatCurrency(trip.price, trip.currency)}`}
      onPress={() => pushPath(`/(customer)/agency/${trip.agencyId}`)}
    >
      <View style={[s.vehiclePhoto, { backgroundColor: theme.field }]}>
        {image ? (
          <Image source={{ uri: image }} contentFit="cover" style={StyleSheet.absoluteFill} />
        ) : (
          <Ionicons name="car-sport-outline" size={30} color={theme.muted} />
        )}
        {rating > 0 ? (
          <View style={s.ratingOverlay}>
            <Ionicons name="star" size={10} color="#F7C75B" />
            <Text style={s.ratingOverlayText}>{rating.toFixed(1)}</Text>
          </View>
        ) : null}
        {trip.availableSeats > 0 && trip.availableSeats <= 4 ? (
          <View style={[s.scarcity, { backgroundColor: theme.coral }]}>
            <Text style={s.scarcityText}>
              {trip.availableSeats} {trip.availableSeats === 1 ? 'seat' : 'seats'} left
            </Text>
          </View>
        ) : null}
      </View>
      <View style={s.vehicleCopy}>
        <Text numberOfLines={2} style={[s.vehicleName, { color: theme.text }]}>
          {trip.vehicleName || trip.vehicleType}
        </Text>
        <Text numberOfLines={1} style={[s.vehicleSubtitle, { color: theme.muted }]}>
          {trip.agency.name}
        </Text>
        <Text numberOfLines={1} style={[s.vehiclePrice, { color: theme.primary }]}>
          {formatCurrency(trip.price, trip.currency)}
        </Text>
      </View>
    </Pressable>
  );
}

export function ExploreTransporterCard({
  group,
}: {
  group: ReturnType<typeof groupTripsByAgency>[number];
}) {
  const theme = useExploreDesign();
  const { agency } = group;
  return (
    <Pressable
      onPress={() => pushPath(`/(customer)/agency/${group.agencyId}`)}
      accessibilityRole="button"
      accessibilityLabel={`View driver ${agency.name}`}
      style={[s.transporter, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <View style={s.row}>
        {agency.logo ? (
          <Avatar uri={agency.logo} name={agency.name} size={36} />
        ) : (
          <View style={[s.transporterIcon, { backgroundColor: theme.accent }]}>
            <Ionicons name="bus-outline" size={20} color={theme.primary} />
          </View>
        )}
        <View style={s.flex}>
          <View style={s.providerNameRow}>
            <Text numberOfLines={1} style={[s.transporterName, { color: theme.text }]}>
              {agency.name}
            </Text>
            {agency.verified ? (
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={theme.primary}
                accessibilityLabel="Verified"
              />
            ) : null}
          </View>
          <Text numberOfLines={1} style={[s.providerSubtitle, { color: theme.muted }]}>
            {group.trips[0]?.vehicleName || 'Transport partner'}
          </Text>
        </View>
      </View>
      <View style={s.providerFoot}>
        {agency.rating > 0 ? (
          <View style={[s.ratingPill, { backgroundColor: theme.field }]}>
            <Ionicons name="star" size={12} color="#EBA237" />
            <Text style={[s.providerSmall, { color: theme.text }]}>
              {agency.rating.toFixed(1)}
              {agency.reviewCount > 0 ? ` (${agency.reviewCount})` : ''}
            </Text>
          </View>
        ) : null}
        <View style={[s.tripCount, { backgroundColor: theme.positiveSoft }]}>
          <Text style={[s.providerSmall, { color: theme.positive }]}>
            {group.tripCount} {group.tripCount === 1 ? 'trip' : 'trips'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function ExploreRouteCard({
  route,
  trips,
  savedIds,
  onSave,
  onOpen,
}: {
  route: (typeof ROUTES)[number];
  trips: TripWithDetails[];
  savedIds: string[];
  onSave: (id: string) => void;
  onOpen: (from: string, to: string) => void;
}) {
  const { width } = useWindowDimensions();
  const matches = trips.filter(
    (trip) =>
      isExploreTripAvailable(trip) &&
      trip.from.toLowerCase().includes(route.from.toLowerCase()) &&
      trip.to.toLowerCase().includes(route.to.toLowerCase()),
  );
  const cheapest = matches.reduce<TripWithDetails | undefined>(
    (best, trip) => (!best || trip.price < best.price ? trip : best),
    undefined,
  );
  const saved = Boolean(cheapest && savedIds.includes(cheapest.id));
  return (
    <View style={[s.route, { width: (width - 44) / 2 }]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => onOpen(route.from, route.to)}
        accessibilityRole="button"
        accessibilityLabel={`Find rides from ${route.from} to ${route.to}`}
      >
        <Image
          source={route.image}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="top"
        />
        <LinearGradient
          colors={['transparent', 'rgba(14,22,21,0.9)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.routeCopy}>
          <Text style={s.routeEyebrow}>{route.label}</Text>
          <Text style={s.routeTitle}>
            {route.from} to {route.to}
          </Text>
          <Text style={s.routeDescription}>
            {cheapest
              ? `${matches.length} ${matches.length === 1 ? 'ride' : 'rides'} · From ${formatCurrency(cheapest.price, cheapest.currency)}`
              : 'Explore departures'}
          </Text>
        </View>
      </Pressable>
      {cheapest ? (
        <View style={s.routeSave}>
          <TravelIconAction
            icon={saved ? 'heart' : 'heart-outline'}
            color="white"
            label={`${saved ? 'Unsave' : 'Save'} ride to ${route.to}`}
            onPress={() => onSave(cheapest.id)}
          />
        </View>
      ) : null}
    </View>
  );
}

export function ExploreTransportPanel({
  trips,
  loading,
  error,
  onRetry,
  onOpenRoute,
  savedIds,
  onSave,
  onGuides,
}: {
  trips: TripWithDetails[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenRoute: (from: string, to: string) => void;
  savedIds: string[];
  onSave: (id: string) => void;
  onGuides: () => void;
}) {
  const theme = useExploreDesign();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<ExploreVehicleFilter>('all');
  const [expanded, setExpanded] = useState(false);
  const filters = useMemo(() => exploreVehicleFilters(trips), [trips]);
  const activeFilter = filters.some((option) => option.id === filter) ? filter : 'all';
  const vehicles = useMemo(() => exploreVehicles(trips, activeFilter), [trips, activeFilter]);
  const agencies = useMemo(() => groupTripsByAgency(trips.filter(isExploreTripAvailable)), [trips]);
  const visible = expanded ? vehicles : vehicles.slice(0, 6);
  return (
    <>
      <ExploreVehicleFilters
        value={activeFilter}
        options={filters}
        onChange={(value) => {
          setFilter(value);
          setExpanded(false);
        }}
      />
      <TravelSection
        compact
        title="Popular vehicles"
        actionLabel={vehicles.length > 6 ? (expanded ? 'Show less' : 'View all ›') : undefined}
        onAction={() => setExpanded((value) => !value)}
      >
        {loading && !trips.length ? (
          <View style={[s.message, { backgroundColor: theme.field }]}>
            <ActivityIndicator color={theme.primary} />
            <Text style={[s.messageText, { color: theme.muted }]}>Loading available vehicles…</Text>
          </View>
        ) : visible.length ? (
          <View style={s.grid}>
            {visible.map((trip) => (
              <ExploreVehicleCard
                key={`${trip.agencyId}-${trip.vehicleId || trip.id}`}
                trip={trip}
                width={(width - 48) / 3}
              />
            ))}
          </View>
        ) : (
          <View style={[s.message, { backgroundColor: theme.field }]}>
            <Ionicons name="car-sport-outline" size={26} color={theme.muted} />
            <Text style={[s.messageTitle, { color: theme.text }]}>
              {error ? 'Vehicles are unavailable right now' : 'No vehicles found'}
            </Text>
            <Text style={[s.messageText, { color: theme.muted }]}>
              {error
                ? 'Please try again to load the latest listings.'
                : 'Try another vehicle type or search.'}
            </Text>
            {error ? (
              <Pressable accessibilityRole="button" onPress={onRetry} style={s.retry}>
                <Text style={[s.filterText, { color: theme.primary }]}>Try again</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </TravelSection>
      {agencies.length ? (
        <TravelSection
          compact
          title="Local drivers"
          accessory={
            <Text style={[s.providerSmall, { color: theme.muted }]}>
              {agencies.every((g) => g.agency.verified) ? 'Verified drivers' : 'Drive with locals'}
            </Text>
          }
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.providerRail}
          >
            {agencies.map((group) => (
              <ExploreTransporterCard key={group.agencyId} group={group} />
            ))}
          </ScrollView>
        </TravelSection>
      ) : null}
      <TravelSection
        compact
        title="Popular routes"
        actionLabel="View map"
        onAction={() =>
          pushPath(
            '/(customer)/explore/map?title=Hunza&subtitle=Popular%20route%20destination&lat=36.3167&lng=74.65&category=Transport',
          )
        }
      >
        <View style={s.routes}>
          {ROUTES.map((route) => (
            <ExploreRouteCard
              key={route.to}
              route={route}
              trips={trips}
              savedIds={savedIds}
              onSave={onSave}
              onOpen={onOpenRoute}
            />
          ))}
        </View>
      </TravelSection>
      <ExploreGuideSuggestion onPress={onGuides} />
    </>
  );
}

export function ExploreGuideSuggestion({ onPress }: { onPress: () => void }) {
  const theme = useExploreDesign();
  return (
    <View style={[s.suggestion, { backgroundColor: theme.soft }]}>
      <View style={[s.suggestionIcon, { backgroundColor: theme.accent }]}>
        <Ionicons name="compass-outline" size={23} color={theme.primary} />
      </View>
      <View style={s.flex}>
        <Text style={[s.suggestionTitle, { color: theme.text }]}>Heading to Hunza?</Text>
        <Text style={[s.suggestionBody, { color: theme.muted }]}>Find a local mountain guide</Text>
      </View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Explore guides"
        style={[s.suggestionButton, { backgroundColor: theme.action }]}
      >
        <Text style={[s.suggestionButtonText, { color: theme.background }]}>Explore guides</Text>
      </Pressable>
    </View>
  );
}

export function ExploreHelp() {
  const theme = useExploreDesign();
  return (
    <View style={s.helpRow}>
      <Pressable
        onPress={() => pushPath('/(customer)/(tabs)/inbox')}
        accessibilityRole="button"
        accessibilityLabel="Travel help: open messages"
        style={[s.help, { backgroundColor: theme.coral }]}
      >
        <Ionicons name="headset-outline" size={17} color="white" />
        <Text style={s.helpText}>Travel help</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  services: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 4,
    paddingVertical: 8,
    flexDirection: 'row',
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
  },
  service: { flex: 1, alignItems: 'center', gap: 4, minHeight: 66 },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceLabel: { fontFamily: Fonts.bodyMedium, fontSize: 12, lineHeight: 17 },
  serviceIndicator: { width: 28, height: 2, borderRadius: 1 },
  banner: {
    minHeight: 176,
    borderRadius: 28,
    overflow: 'hidden',
    marginHorizontal: 16,
    padding: 18,
    gap: 28,
    justifyContent: 'space-between',
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(8,39,38,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingLeft: 4,
    paddingRight: 12,
    paddingVertical: 4,
    borderRadius: 18,
  },
  bannerBadgeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerBadgeText: { fontFamily: Fonts.bodyMedium, fontSize: 11, color: 'rgb(255, 255, 255)' },
  bannerTitle: {
    fontFamily: Fonts.displayBold,
    fontSize: 26,
    lineHeight: 32,
    color: 'rgb(255, 255, 255)',
  },
  bannerSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    color: 'rgb(255, 255, 255)',
  },
  filters: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  filter: {
    paddingHorizontal: 14,
    minHeight: 44,
    flexDirection: 'row',
    gap: 7,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  filterText: { fontFamily: Fonts.bodySemiBold, fontSize: 12 },
  grid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 8,
  },
  vehicle: { borderRadius: 16, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  vehiclePhoto: { aspectRatio: 4 / 3, alignItems: 'center', justifyContent: 'center' },
  ratingOverlay: {
    position: 'absolute',
    left: 6,
    top: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(30,27,25,0.68)',
  },
  ratingOverlayText: { color: 'rgb(255, 255, 255)', fontFamily: Fonts.bodySemiBold, fontSize: 10 },
  scarcity: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  scarcityText: { fontFamily: Fonts.bodySemiBold, fontSize: 9, color: 'rgb(255, 255, 255)' },
  vehicleCopy: { padding: 8, gap: 3, minHeight: 84 },
  vehicleName: { fontFamily: Fonts.bodySemiBold, fontSize: 11, lineHeight: 15 },
  vehicleSubtitle: { fontFamily: Fonts.body, fontSize: 10, lineHeight: 15 },
  vehiclePrice: { fontFamily: Fonts.bodyBold, fontSize: 11, lineHeight: 16 },
  providerRail: { paddingHorizontal: 16, gap: 12 },
  transporter: {
    width: 240,
    minHeight: 102,
    borderRadius: 20,
    padding: 14,
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  transporterIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  transporterName: { flexShrink: 1, fontFamily: Fonts.bodyBold, fontSize: 12, lineHeight: 17 },
  providerSubtitle: { fontFamily: Fonts.body, fontSize: 11, lineHeight: 16 },
  providerFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  ratingPill: {
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  providerSmall: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 15 },
  tripCount: { borderRadius: 14, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 'auto' },
  routes: { paddingHorizontal: 16, flexDirection: 'row', gap: 12 },
  route: { height: 218, borderRadius: 20, overflow: 'hidden' },
  routeSave: {
    position: 'absolute',
    right: 4,
    top: 4,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  routeCopy: { position: 'absolute', left: 12, right: 12, bottom: 14, gap: 5 },
  routeEyebrow: { color: '#99e6dc', fontFamily: Fonts.bodySemiBold, fontSize: 10, lineHeight: 15 },
  routeTitle: {
    color: 'rgb(255, 255, 255)',
    fontFamily: Fonts.display,
    fontSize: 14,
    lineHeight: 20,
  },
  routeDescription: {
    color: 'rgb(255, 255, 255)',
    fontFamily: Fonts.body,
    fontSize: 11,
    lineHeight: 17,
  },
  suggestion: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionTitle: { fontFamily: Fonts.display, fontSize: 14, lineHeight: 20 },
  suggestionBody: { fontFamily: Fonts.body, fontSize: 11, lineHeight: 17 },
  suggestionButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionButtonText: { fontFamily: Fonts.bodySemiBold, fontSize: 10 },
  helpRow: { position: 'absolute', right: 16, bottom: 12, alignItems: 'flex-end' },
  help: {
    minHeight: 44,
    borderRadius: 24,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  helpText: { color: 'rgb(255, 255, 255)', fontFamily: Fonts.bodySemiBold, fontSize: 12 },
  message: { marginHorizontal: 16, padding: 20, borderRadius: 20, alignItems: 'center', gap: 8 },
  messageTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 13, textAlign: 'center' },
  messageText: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 },
});
