import type { ReactNode } from 'react';
import { TravelFormCard, TravelSelectField, TravelSearchButton } from '@/components/ui/TravelForm';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from '@/components/brand/BrandMark';
import { HomeStoriesRow, type StoryGroup } from '@/components/home/HomeStories';
import { Avatar } from '@/components/ui/Avatar';
import {
  TravelIconAction,
  TravelSection,
  TravelSurface,
  type TravelIcon,
} from '@/components/ui/TravelPrimitives';
import { destinationImageFor, POPULAR_DESTINATIONS } from '@/constants/destinations';
import { SERVICE_CATEGORIES, type HomeServiceCategory } from '@/constants/productModes';
import { useHomeDesign } from '@/constants/homeDesign';
import { Fonts } from '@/constants/typography';
import type { TripWithDetails } from '@/types/trip';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { formatDuration, formatTime } from '@/utils/formatTime';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

export function HomeTopBar({
  name,
  avatar,
  unread,
  onSearch,
  onNotifications,
  onProfile,
}: {
  name?: string;
  avatar?: string;
  unread: boolean;
  onSearch: () => void;
  onNotifications: () => void;
  onProfile: () => void;
}) {
  const theme = useHomeDesign();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        s.topBar,
        {
          paddingTop: insets.top + 4,
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <View style={s.brand}>
        <BrandMark size={30} />
        <Text style={[s.wordmark, { color: theme.primary }]}>BANJARA</Text>
      </View>
      <View style={s.row}>
        <TravelIconAction icon="search-outline" label="Search" onPress={onSearch} />
        <TravelIconAction
          icon="notifications-outline"
          label="Notifications"
          onPress={onNotifications}
          badge={unread}
        />
        <Pressable
          style={s.profile}
          onPress={onProfile}
          accessibilityRole="button"
          accessibilityLabel="Your profile"
        >
          <Avatar name={name ?? 'Traveler'} uri={avatar} size={32} />
        </Pressable>
      </View>
    </View>
  );
}

export function HomeHighlights({
  onExplore,
  onGuides,
  onNotifications,
}: {
  onExplore: () => void;
  onGuides: () => void;
  onNotifications: () => void;
}) {
  const groups: StoryGroup[] = [
    {
      id: 'road-updates',
      label: 'Road updates',
      image: destinationImageFor('Hunza'),
      cta: 'See road updates',
      onAction: onNotifications,
      slides: [
        {
          video: require('@/assets/stories/4283.mp4'),
          place: 'Karakoram Highway',
          posted: '2h ago',
          caption: 'KKH is open end to end today. Expect short stops near Dasu for road work.',
        },
        {
          video: require('@/assets/stories/50267.mp4'),
          place: 'Babusar Top',
          posted: '5h ago',
          caption: 'Babusar Pass is clear for jeeps and cars until 4 pm. Start early.',
        },
      ],
    },
    {
      id: 'discover',
      label: 'Discover',
      icon: 'pricetag',
      coral: true,
      cta: 'Explore deals',
      onAction: onExplore,
      slides: [
        {
          video: require('@/assets/stories/41576.mp4'),
          place: 'Islamabad → Hunza',
          posted: '1h ago',
          caption: 'Seats from Rs 6,500 on today’s coaster departures. Compare and book in seconds.',
        },
        {
          video: require('@/assets/stories/3352.mp4'),
          place: 'Deosai Plains',
          posted: '3h ago',
          caption: 'Charter a whole Land Cruiser with a local driver. Your route, your pace.',
        },
      ],
    },
    {
      id: 'trending',
      label: 'Trending',
      image: destinationImageFor('Skardu'),
      cta: 'Explore destinations',
      onAction: onExplore,
      slides: [
        {
          video: require('@/assets/stories/4132.mp4'),
          place: 'Hunza Valley',
          posted: '3h ago',
          caption: 'Storm clouds and sunshine over the peaks this week. Perfect for photos.',
        },
        {
          video: require('@/assets/stories/51791.mp4'),
          place: 'Fairy Meadows',
          posted: '8h ago',
          caption: 'Clear views of Nanga Parbat from the meadows this morning.',
        },
        {
          video: require('@/assets/stories/46384.mp4'),
          place: 'Skardu',
          posted: '1d ago',
          caption: 'Hidden waterfalls on the road to Shigar, an easy half-day trip.',
        },
      ],
    },
    {
      id: 'local-guides',
      label: 'Guides',
      image: destinationImageFor('Passu'),
      cta: 'Find a guide',
      onAction: onGuides,
      slides: [
        {
          video: require('@/assets/stories/2385.mp4'),
          place: 'Passu',
          posted: '4h ago',
          caption: 'Our guides know every trail, viewpoint and tea stop in the valley.',
        },
        {
          video: require('@/assets/stories/5360.mp4'),
          place: 'Nagar',
          posted: '1d ago',
          caption: 'Book a verified local guide for treks, jeep safaris and village walks.',
        },
      ],
    },
    {
      id: 'snow-season',
      label: 'Travel alerts',
      icon: 'snow-outline',
      cta: 'See all alerts',
      onAction: onNotifications,
      slides: [
        {
          video: require('@/assets/stories/4695.mp4'),
          place: 'Khunjerab Pass',
          posted: '6h ago',
          caption: 'First snowfall at Khunjerab. Carry warm layers above 4,000 m.',
        },
        {
          video: require('@/assets/stories/3371.mp4'),
          place: 'Naltar',
          posted: '1d ago',
          caption: 'Naltar forest roads need chains after fresh snow. Check before you go.',
        },
      ],
    },
  ];
  return <HomeStoriesRow groups={groups} />;
}

const serviceLabels: Record<HomeServiceCategory, string> = {
  transport: 'Ride',
  hotels: 'Stay',
  tours: 'Tours',
  guides: 'Guides',
  restaurants: 'Restaurants',
};
export function HomeServices({
  mode,
  onChange,
}: {
  mode: HomeServiceCategory;
  onChange: (mode: HomeServiceCategory) => void;
}) {
  const theme = useHomeDesign();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.services}
    >
      {SERVICE_CATEGORIES.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onChange(item.id)}
          accessibilityRole="tab"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: mode === item.id }}
          style={[s.service, mode === item.id && { backgroundColor: theme.surface }]}
        >
          <Ionicons
            name={item.icon as TravelIcon}
            size={22}
            color={mode === item.id ? theme.primary : theme.muted}
          />
          <Text style={[s.serviceLabel, { color: mode === item.id ? theme.primary : theme.muted }]}>
            {serviceLabels[item.id]}
          </Text>
          {mode === item.id ? (
            <View style={[s.serviceLine, { backgroundColor: theme.action }]} />
          ) : null}
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function HomeScenicHero({
  mode,
  from,
  to,
  name,
  duration,
  liveCount,
  onPress,
}: {
  mode: HomeServiceCategory;
  from: string;
  to: string;
  name?: string;
  duration?: string;
  liveCount: number;
  onPress: () => void;
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const title =
    mode === 'transport'
      ? `${from || 'Islamabad'} to ${to || 'Hunza'}`
      : mode === 'hotels'
        ? `Stay in ${to || 'the north'}`
        : mode === 'guides'
          ? 'Explore with a local'
          : mode === 'restaurants'
            ? 'A taste of the north'
            : 'Your next adventure';
  return (
    <Pressable
      onPress={onPress}
      style={s.hero}
      accessibilityRole="button"
      accessibilityLabel={`Explore ${title}`}
    >
      <Image
        source={{ uri: destinationImageFor(to) }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={['rgba(0,30,35,0.04)', 'rgba(0,25,30,0.74)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.livePill}>
        <View style={s.liveDot} />
        <Text style={s.heroSmall}>
          {liveCount > 0
            ? `${liveCount} ${mode === 'hotels' ? `stay${liveCount === 1 ? '' : 's'} available` : `ride${liveCount === 1 ? '' : 's'} today`}`
            : 'Discover the north'}
        </Text>
      </View>
      <View style={s.heroCopy}>
        <Text style={s.heroGreeting}>
          {greeting}
          {name ? `, ${name.trim().split(/\s+/)[0]}` : ''}
        </Text>
        <View style={[s.row, { gap: 8 }]}>
          <Text style={s.heroTitle} numberOfLines={1}>
            {title}
          </Text>
          {duration && mode === 'transport' ? (
            <View style={s.durationBadge}>
              <Ionicons name="time-outline" size={12} color="white" />
              <Text style={s.heroSmall}>{duration}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export function HomeRouteSearch({
  from,
  to,
  date,
  passengers,
  returnDate,
  onFrom,
  onTo,
  onDate,
  onReturnDate,
  onPassengers,
  onSwap,
  onSearch,
  cta,
  preferences,
}: {
  from: string;
  to: string;
  date: string;
  passengers: string;
  returnDate?: string;
  onFrom: () => void;
  onTo: () => void;
  onDate: () => void;
  onReturnDate: () => void;
  onPassengers: () => void;
  onSwap: () => void;
  onSearch: () => void;
  cta: string;
  preferences?: ReactNode;
}) {
  const theme = useHomeDesign();
  const dateField = (label: string, value: string, onPress: () => void) => (
    <TravelSelectField
      label={label}
      value={value}
      onPress={onPress}
      compact
      icon={<Ionicons name="calendar-outline" size={18} color={theme.primary} />}
    />
  );
  const guestField = (
    <TravelSelectField
      label="Travelers"
      value={passengers}
      onPress={onPassengers}
      compact
      icon={<Ionicons name="person-outline" size={18} color={theme.primary} />}
    />
  );
  return (
    <TravelFormCard>
      <View
        style={{
          borderRadius: 20,
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.field,
          overflow: 'hidden',
        }}
      >
        <TravelSelectField
          label="From"
          value={from || 'Departure city'}
          onPress={onFrom}
          chevron={false}
          icon={<Ionicons name="radio-button-on-outline" size={19} color={theme.primary} />}
          style={{ borderWidth: 0, borderRadius: 0, paddingRight: 62 }}
        />
        <View
          style={{ height: 1, marginLeft: 52, marginRight: 62, backgroundColor: theme.border }}
        />
        <TravelSelectField
          label="To"
          value={to || 'Destination city'}
          onPress={onTo}
          chevron={false}
          icon={<Ionicons name="location-outline" size={19} color={theme.coral} />}
          style={{ borderWidth: 0, borderRadius: 0, paddingRight: 62 }}
        />
        <Pressable
          onPress={onSwap}
          accessibilityRole="button"
          accessibilityLabel="Swap departure and destination"
          style={{
            position: 'absolute',
            zIndex: 1,
            right: 12,
            top: '50%',
            transform: [{ translateY: -22 }],
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="swap-vertical" size={20} color={theme.primary} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 10 }}>
        {dateField('Travel date', date, onDate)}
        {returnDate ? dateField('Return date', returnDate, onReturnDate) : guestField}
      </View>
      {returnDate ? guestField : null}
      {preferences}
      <TravelSearchButton title={cta} onPress={onSearch} />
    </TravelFormCard>
  );
}

export function HomeRideCard({
  trip,
  saved,
  onSave,
  onPress,
}: {
  trip: TripWithDetails;
  saved: boolean;
  onSave: () => void;
  onPress: () => void;
}) {
  const theme = useHomeDesign();
  const fullVehicle = trip.bookingMode === 'vehicle';
  const soldOut = trip.availableSeats <= 0;
  const lowSeats = !fullVehicle && trip.availableSeats > 0 && trip.availableSeats <= 3;
  const warn = soldOut || lowSeats;
  const photo = normalizeMediaUrl(trip.vehicleImages?.[0] || trip.image);
  const when = formatDate(trip.date.slice(0, 10), true).replace(/\s\d{4}$/, '');
  const pickup = trip.pickupLocations?.[0]?.name;
  const hasReviews = trip.agency.reviewCount > 0;
  const badge = soldOut
    ? 'Sold out'
    : fullVehicle
      ? `Whole vehicle · up to ${trip.availableSeats}`
      : lowSeats
        ? `Only ${trip.availableSeats} ${trip.availableSeats === 1 ? 'seat' : 'seats'} left`
        : `${trip.availableSeats} seats available`;
  return (
    <TravelSurface style={[s.tripCard, { borderColor: theme.border }]}>
      <View style={s.tripMedia}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${trip.from} to ${trip.to}, ${trip.vehicleName}`}
          style={StyleSheet.absoluteFill}
        >
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.soft }]} />
          )}
          <LinearGradient
            colors={['rgba(15,30,28,0.28)', 'rgba(15,30,28,0)', 'rgba(15,30,28,0.72)']}
            locations={[0, 0.42, 1]}
            style={StyleSheet.absoluteFill}
          />
        </Pressable>
        <View
          pointerEvents="none"
          style={[
            s.tripBadge,
            { backgroundColor: warn ? theme.coralSoft : 'rgba(255,255,255,0.94)' },
          ]}
        >
          {warn ? <Ionicons name="flash-outline" size={12} color={theme.coral} /> : null}
          <Text style={[s.tripBadgeText, { color: warn ? theme.coral : theme.primary }]}>
            {badge}
          </Text>
        </View>
        <Pressable
          onPress={onSave}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Unsave ride' : 'Save ride'}
          style={s.tripHeart}
        >
          <Ionicons
            name={saved ? 'heart' : 'heart-outline'}
            size={19}
            color={saved ? theme.coral : '#292D2C'}
          />
        </Pressable>
        <View pointerEvents="none" style={s.tripVehicle}>
          <Ionicons name="car-sport-outline" size={14} color="#FFFFFF" />
          <Text style={s.tripVehicleText} numberOfLines={1}>
            {trip.vehicleName}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${trip.from} to ${trip.to}, departs ${formatTime(trip.departureTime)}, arrives ${formatTime(trip.arrivalTime)}`}
        style={s.tripBody}
      >
        <View style={s.row}>
          <Text style={[s.tripRoute, { color: theme.text }]} numberOfLines={2}>
            {trip.from}
            <Text style={{ color: theme.primary }}>{'  →  '}</Text>
            {trip.to}
          </Text>
        </View>
        <Text style={[s.small, { color: theme.muted }]} numberOfLines={1}>
          {when}
          {pickup ? `  ·  ${pickup}` : ''}
        </Text>
        <View style={[s.tripTimes, { backgroundColor: theme.field }]}>
          <Text style={[s.tripTime, { color: theme.text }]}>{formatTime(trip.departureTime)}</Text>
          <View style={s.tripLineRow}>
            <View style={[s.tripDash, { borderColor: theme.primary }]} />
            <Text style={[s.duration, { color: theme.primary }]}>
              {formatDuration(trip.durationMinutes)}
            </Text>
            <View style={[s.tripDash, { borderColor: theme.primary }]} />
            <Ionicons name="chevron-forward" size={13} color={theme.primary} />
          </View>
          <Text style={[s.tripTime, { color: theme.text }]}>{formatTime(trip.arrivalTime)}</Text>
        </View>
        {trip.amenities.length ? (
          <View style={s.tripChips}>
            {trip.amenities.slice(0, 3).map((amenity) => (
              <View key={amenity} style={[s.tripChip, { backgroundColor: theme.soft }]}>
                <Text style={[s.tripChipText, { color: theme.primary }]}>{amenity}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Pressable>

      <View style={[s.tripProvider, { borderTopColor: theme.border }]}>
        <Avatar name={trip.agency.name} uri={trip.agency.logo} size={32} />
        <View style={[s.row, s.flex, { gap: 4 }]}>
          <Text style={[s.tripProviderName, { color: theme.text }]} numberOfLines={1}>
            {trip.agency.name}
          </Text>
          {trip.agency.verified ? (
            <MaterialIcons name="verified" size={15} color={theme.primary} />
          ) : null}
        </View>
        <View style={[s.tripRating, { backgroundColor: theme.field }]}>
          <Text style={{ color: '#ff6b6b', fontSize: 11 }}>★</Text>
          <Text style={[s.tripRatingText, { color: theme.text }]}>
            {hasReviews ? (trip.rating || trip.agency.rating || 0).toFixed(1) : 'New'}
          </Text>
        </View>
      </View>

      <View style={[s.tripFooter, { backgroundColor: theme.field }]}>
        <View style={s.flex}>
          <Text style={[s.price, { color: theme.text }]}>
            {formatCurrency(trip.price, trip.currency)}
          </Text>
          <Text style={[s.small, { color: theme.muted }]}>
            {fullVehicle ? 'per vehicle' : 'per seat'}
          </Text>
        </View>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`View and book ${trip.agency.name}`}
          style={[s.book, { backgroundColor: theme.action }]}
        >
          <Text style={[s.buttonText, { color: theme.background }]}>
            {soldOut ? 'View ride' : 'Book now'}
          </Text>
        </Pressable>
      </View>
    </TravelSurface>
  );
}

export function HomeDestinationCards({
  trips,
  onOpen,
  onExplore,
}: {
  trips: TripWithDetails[];
  onOpen: (name: string) => void;
  onExplore: () => void;
}) {
  const { width } = useWindowDimensions();
  const theme = useHomeDesign();
  return (
    <TravelSection title="Popular destinations" actionLabel="Explore all" onAction={onExplore}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.destinationRail}
      >
        {POPULAR_DESTINATIONS.map((item) => {
          const matches = trips.filter(
            (trip) =>
              trip.to.toLowerCase().includes(item.name.toLowerCase()) && trip.availableSeats > 0,
          );
          const cheapest = matches.reduce<TripWithDetails | undefined>(
            (best, trip) => (!best || trip.price < best.price ? trip : best),
            undefined,
          );
          return (
            <Pressable
              key={item.id}
              onPress={() => onOpen(item.name)}
              accessibilityRole="button"
              accessibilityLabel={`Explore ${item.name}`}
              style={[s.destination, { width: Math.min(230, (width - 44) / 2) }]}
            >
              <Image
                source={{ uri: item.image }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(10,29,27,0.85)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={[s.destinationTag, { backgroundColor: theme.soft }]}>
                <Text style={[s.tagText, { color: theme.primary }]}>
                  {cheapest
                    ? `From ${formatCurrency(cheapest.price, cheapest.currency)}`
                    : item.tag}
                </Text>
              </View>
              <View style={s.destinationCopy}>
                <Text style={s.destinationName}>{item.name}</Text>
                <Text style={s.destinationSubtitle}>{item.subtitle}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </TravelSection>
  );
}

/** Provider-published trips fill the editorial feed until a traveler-post API exists. */
export function HomeInspiration({
  trips,
  savedIds,
  onSave,
  onOpen,
}: {
  trips: TripWithDetails[];
  savedIds: string[];
  onSave: (id: string) => void;
  onOpen: (trip: TripWithDetails) => void;
}) {
  const theme = useHomeDesign();
  const seen = new Set<string>();
  const stories = trips
    .filter((trip) => {
      if (seen.has(trip.agencyId)) return false;
      seen.add(trip.agencyId);
      return true;
    })
    .slice(0, 2);
  if (!stories.length) return null;
  return (
    <TravelSection
      title="Travel inspiration"
      subtitle="Discover journeys from our travel providers"
    >
      <View style={s.storyStack}>
        {stories.map((trip) => (
          <TravelSurface key={trip.id}>
            <Pressable
              onPress={() => onOpen(trip)}
              accessibilityRole="button"
              accessibilityLabel={`Explore ${trip.agency.name}'s trip`}
              style={s.storyHead}
            >
              <Avatar name={trip.agency.name} uri={trip.agency.logo} size={34} />
              <View style={s.flex}>
                <Text style={[s.providerName, { color: theme.text }]}>{trip.agency.name}</Text>
                <Text style={[s.small, { color: theme.muted }]}>
                  {trip.from} → {trip.to}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={19} color={theme.muted} />
            </Pressable>
            <Pressable
              onPress={() => onOpen(trip)}
              accessibilityRole="button"
              accessibilityLabel={`View trip to ${trip.to}`}
            >
              <Image
                source={{
                  uri:
                    normalizeMediaUrl(trip.image || trip.vehicleImages?.[0]) ||
                    destinationImageFor(trip.to),
                }}
                style={s.storyImage}
                contentFit="cover"
              />
            </Pressable>
            <View style={s.storyActions}>
              <TravelIconAction
                icon={savedIds.includes(trip.id) ? 'heart' : 'heart-outline'}
                label={savedIds.includes(trip.id) ? 'Unsave ride' : 'Save ride'}
                onPress={() => onSave(trip.id)}
                color={theme.coral}
              />
              <Pressable
                onPress={() => onOpen(trip)}
                accessibilityRole="button"
                style={s.storyDetails}
              >
                <Text style={[s.small, { color: theme.primary }]}>Explore this journey</Text>
              </Pressable>
              <TravelIconAction
                icon={savedIds.includes(trip.id) ? 'bookmark' : 'bookmark-outline'}
                label="Save this journey"
                onPress={() => onSave(trip.id)}
              />
            </View>
            <View style={[s.storyChip, { backgroundColor: theme.field }]}>
              <Ionicons name="bus-outline" size={14} color={theme.primary} />
              <Text style={[s.small, { color: theme.muted }]}>Published by {trip.agency.name}</Text>
            </View>
          </TravelSurface>
        ))}
      </View>
    </TravelSection>
  );
}

export function HomeBenefits() {
  const theme = useHomeDesign();
  const benefits: Array<{ icon: TravelIcon; title: string; text: string; coral?: boolean }> = [
    {
      icon: 'shield-checkmark',
      title: 'Provider profiles',
      text: 'View ratings, reviews and provider details before you book.',
    },
    {
      icon: 'lock-closed',
      title: 'Secure payment',
      text: 'Follow your booking and payment status in one place.',
    },
    {
      icon: 'headset',
      title: 'Travel support',
      text: 'Reach your provider through in-app messages.',
    },
    {
      icon: 'cash-outline',
      title: 'Compare fares',
      text: 'Find published fares for your route and travel date.',
      coral: true,
    },
  ];
  return (
    <TravelSection title="Why travelers choose BANJARA">
      <View style={s.benefits}>
        {benefits.map((item) => (
          <TravelSurface key={item.title} style={s.benefit}>
            <View
              style={[
                s.benefitIcon,
                { backgroundColor: item.coral ? theme.coralSoft : theme.soft },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={item.coral ? theme.coral : theme.primary}
              />
            </View>
            <Text style={[s.benefitTitle, { color: theme.text }]}>{item.title}</Text>
            <Text style={[s.small, { color: theme.muted }]}>{item.text}</Text>
          </TravelSurface>
        ))}
      </View>
    </TravelSection>
  );
}

export function HomeHelp({ onPress }: { onPress: () => void }) {
  const theme = useHomeDesign();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open travel messages for help"
      style={[s.help, { backgroundColor: theme.coral }]}
    >
      <Ionicons name="headset-outline" size={17} color={theme.background} />
      <Text style={[s.buttonText, { color: theme.background }]}>Travel help</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center' },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  wordmark: { fontFamily: Fonts.displayBold, fontSize: 19, letterSpacing: -0.5 },
  profile: { width: 40, height: 44, justifyContent: 'center', alignItems: 'flex-end' },
  highlights: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 8, gap: 10 },
  highlight: { width: 70, alignItems: 'center', gap: 6 },
  highlightRing: { width: 60, height: 60, borderRadius: 30, borderWidth: 1.6, padding: 3 },
  highlightInner: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightLabel: { fontFamily: Fonts.bodyMedium, fontSize: 10 },
  services: { paddingHorizontal: 16, gap: 14, paddingBottom: 14 },
  service: {
    width: 66,
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    paddingHorizontal: 3,
    gap: 4,
  },
  serviceLabel: { fontFamily: Fonts.bodyMedium, fontSize: 10 },
  serviceLine: { width: 20, height: 3, borderRadius: 2, marginTop: 1 },
  hero: {
    height: 202,
    marginHorizontal: 16,
    borderRadius: 28,
    overflow: 'hidden',
    padding: 16,
    justifyContent: 'space-between',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#99e6dc' },
  heroSmall: { color: 'rgb(255, 255, 255)', fontFamily: Fonts.bodyMedium, fontSize: 10 },
  heroCopy: { paddingBottom: 26, gap: 4 },
  heroGreeting: { color: 'rgb(255, 255, 255)', fontFamily: Fonts.body, fontSize: 11 },
  heroTitle: {
    flex: 1,
    fontFamily: Fonts.displayBold,
    fontSize: 22,
    color: 'rgb(255, 255, 255)',
    letterSpacing: -0.5,
  },
  durationBadge: {
    borderRadius: 20,
    backgroundColor: '#16b364',
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  small: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 15, flexShrink: 1 },
  buttonText: { fontFamily: Fonts.bodySemiBold, fontSize: 12 },
  tripCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 20,
    boxShadow: '0 6px 20px rgba(10,52,49,0.09)',
  },
  tripMedia: { height: 158, backgroundColor: '#dbe3ed' },
  tripBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  tripBadgeText: { fontFamily: Fonts.bodySemiBold, fontSize: 11 },
  tripHeart: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  tripVehicle: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tripVehicleText: { flex: 1, fontFamily: Fonts.bodySemiBold, fontSize: 13, color: '#FFFFFF' },
  tripBody: { paddingHorizontal: 16, paddingTop: 14, gap: 8 },
  tripRoute: { flex: 1, fontFamily: Fonts.displayBold, fontSize: 19, lineHeight: 25 },
  tripTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  tripTime: { fontFamily: Fonts.displayBold, fontSize: 15 },
  tripLineRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  tripDash: { flex: 1, height: 0, borderTopWidth: 1.5, borderStyle: 'dashed', opacity: 0.55 },
  tripChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tripChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tripChipText: { fontFamily: Fonts.bodyMedium, fontSize: 11 },
  tripProvider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  tripProviderName: { fontFamily: Fonts.bodySemiBold, fontSize: 13, flexShrink: 1 },
  tripRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tripRatingText: { fontFamily: Fonts.bodySemiBold, fontSize: 11 },
  tripFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  providerName: { fontFamily: Fonts.display, fontSize: 16, lineHeight: 20, flexShrink: 1 },
  duration: { fontFamily: Fonts.bodySemiBold, fontSize: 10 },
  price: { fontFamily: Fonts.displayBold, fontSize: 17 },
  book: {
    borderRadius: 22,
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationRail: { paddingHorizontal: 16, gap: 12 },
  destination: {
    height: 224,
    borderRadius: 28,
    overflow: 'hidden',
    padding: 12,
    justifyContent: 'space-between',
  },
  destinationTag: {
    alignSelf: 'flex-end',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  tagText: { fontFamily: Fonts.bodySemiBold, fontSize: 10 },
  destinationCopy: { gap: 3 },
  destinationName: { fontFamily: Fonts.display, fontSize: 17, color: 'rgb(255, 255, 255)' },
  destinationSubtitle: { fontFamily: Fonts.body, fontSize: 10, color: 'rgb(255, 255, 255)' },
  storyStack: { paddingHorizontal: 16, gap: 16 },
  storyHead: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  storyImage: { width: '100%', aspectRatio: 1.4 },
  storyActions: { paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center' },
  storyDetails: { flex: 1, minHeight: 44, justifyContent: 'center' },
  storyChip: {
    alignSelf: 'flex-start',
    maxWidth: '90%',
    marginHorizontal: 14,
    marginBottom: 16,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  benefits: { marginHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  benefit: { flexBasis: '46%', flexGrow: 1, padding: 16, gap: 7, minHeight: 148 },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  benefitTitle: { fontFamily: Fonts.display, fontSize: 16 },
  help: {
    alignSelf: 'flex-end',
    marginHorizontal: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    minHeight: 40,
    borderRadius: 22,
    elevation: 3,
  },
});
