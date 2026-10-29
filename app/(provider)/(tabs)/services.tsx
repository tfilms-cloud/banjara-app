import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CatalogEmpty,
  CatalogSection,
  ChildServiceCard,
  ParentServiceCard,
  SubServicePills,
  type CatalogTone,
  type ChildServiceItem,
  type ParentStat,
  type SubServiceChip,
} from '@/components/provider/ServiceCatalog';
import { GuideServicesTab } from '@/components/provider/GuideServicesTab';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Colors, useThemeColors } from '@/constants/colors';
import {
  ROOM_TYPE_OPTIONS,
  SERVICE_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  canOrganizeTripsFromList,
  editServiceHref,
  isGuideService,
  isHotelService,
  isRestaurantService,
  isTourOperatorService,
  isTransportService,
  serviceLabel,
  stayTypeLabel,
} from '@/constants/providerOptions';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import * as providerService from '@/services/providerService';
import * as tourItineraryService from '@/services/tourItineraryService';
import { useProviderStore } from '@/store/providerStore';
import type { ProviderRoom } from '@/types/provider';
import type { TourItinerary } from '@/types/tourItinerary';
import { formatCurrency } from '@/utils/formatCurrency';
import { normalizeMediaUrl } from '@/utils/mediaUrl';
import { pushEditor, pushPath } from '@/utils/navigation';
import { requireProviderPaymentAccounts } from '@/utils/requireProviderPaymentAccounts';

async function withPaymentAccounts(action: () => void, label: string) {
  if (!(await requireProviderPaymentAccounts(label))) return;
  action();
}

function optionLabel(options: { value: string; label: string }[], value: string) {
  return options.find((item) => item.value === value)?.label ?? value;
}

function vehicleIcon(type: string): SubServiceChip['icon'] {
  if (type === 'car') return 'car-outline';
  if (type === 'bus') return 'bus-outline';
  if (type === 'minibus') return 'bus-outline';
  return 'car-sport-outline';
}

function roomIcon(type: string): SubServiceChip['icon'] {
  if (type === 'suite' || type === 'deluxe') return 'bed-outline';
  if (type === 'family') return 'home-outline';
  return 'bed-outline';
}

function vehicleStatusTone(status: string): ChildServiceItem['statusTone'] {
  if (status === 'active') return 'green';
  if (status === 'pending') return 'amber';
  if (status === 'rejected' || status === 'suspended') return 'red';
  return 'gray';
}

function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= Math.round(rating) ? 'star' : 'star-outline'}
          size={14}
          color="#F5B83D"
        />
      ))}
    </View>
  );
}

function ExpandableRoomType({
  room,
  onRefresh,
}: {
  room: ProviderRoom;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [discount, setDiscount] = useState(String(room.discountPercent ?? ''));
  const [offer, setOffer] = useState(room.offerNote ?? '');
  const free = room.availableCount ?? (room.available ? room.quantity : 0);

  const onSaveOffers = async () => {
    setSaving(true);
    try {
      await providerService.updateRoom(room.id, {
        discountPercent: Number(discount) || 0,
        offerNote: offer.trim() || undefined,
      });
      onRefresh();
      Alert.alert('Saved', 'Discount and offer updated.');
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={hStyles.expandCard}>
      <Pressable style={hStyles.expandHead} onPress={() => setOpen((v) => !v)}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={hStyles.expandTitle}>{room.name}</Text>
          <Text style={hStyles.expandSub}>
            {optionLabel(ROOM_TYPE_OPTIONS, room.roomType)} · {free}/{room.quantity} available ·{' '}
            {formatCurrency(room.pricePerNight)}/night
          </Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.primary} />
      </Pressable>
      {open ? (
        <View style={hStyles.expandBody}>
          <Text style={hStyles.detailLine}>
            Capacity {room.capacity} · {room.bedType} · {room.sizeSqm} m²
          </Text>
          <Text style={hStyles.detailLine}>
            {room.breakfastIncluded ? 'Breakfast included' : 'No breakfast'} ·{' '}
            {room.freeCancellation ? 'Free cancellation' : 'Non-refundable'}
          </Text>
          {room.amenities.length ? (
            <Text style={hStyles.detailLine}>{room.amenities.join(' · ')}</Text>
          ) : null}
          <Input
            label="Discount %"
            value={discount}
            onChangeText={(v) => setDiscount(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            leftIcon="pricetag-outline"
          />
          <Input
            label="Offer / promo note"
            value={offer}
            onChangeText={setOffer}
            placeholder="e.g. 2 nights free breakfast"
          />
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button title="Save offers" loading={saving} onPress={() => void onSaveOffers()} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Edit room"
                variant="outline"
                onPress={() =>
                  router.push({ pathname: '/(provider)/rooms/add', params: { id: room.id } } as never)
                }
              />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function HospitalityServices() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { provider, loading, rooms, reviews, refreshDashboard } = useProviderStore();

  useFocusEffect(
    useCallback(() => {
      void useProviderStore.getState().refreshDashboard();
    }, [])
  );

  const photos = useMemo(() => {
    const fromHotel = provider?.hotel?.images ?? [];
    const fromRooms = rooms.flatMap((r) => r.images);
    return [...new Set([...fromHotel, ...fromRooms])].filter(Boolean).slice(0, 12);
  }, [provider?.hotel?.images, rooms]);

  const totalRooms = rooms.reduce((s, r) => s + r.quantity, 0);
  const availableRooms = rooms.reduce(
    (s, r) => s + (r.availableCount ?? (r.available ? r.quantity : 0)),
    0
  );
  const roomTypes = useMemo(
    () => Array.from(new Set(rooms.map((r) => r.roomType))),
    [rooms]
  );

  const locationLine = [
    provider?.hotel?.village,
    provider?.hotel?.district,
    provider?.hotel?.city || provider?.city,
  ]
    .filter(Boolean)
    .join(', ');

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : provider?.rating ?? 0;

  if (loading && !provider) return <LoadingState title="Loading services..." />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.lg,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refreshDashboard} tintColor={colors.primary} />
      }
    >
      <View>
        <Text style={styles.title}>My Service</Text>
        <Text style={styles.sub}>Overview of your property, room types, offers, and reviews.</Text>
      </View>

      {/* 1. Property overview */}
      <View style={hStyles.sectionCard}>
        <Text style={hStyles.sectionTitle}>
          {provider?.hotel?.hotelName || provider?.businessName || 'Your property'}
        </Text>
        <Text style={hStyles.sectionSub}>
          {stayTypeLabel(provider?.hotel?.hotelType) || 'Lodging'}
          {locationLine ? ` · ${locationLine}` : ''}
        </Text>

        {photos.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
            {photos.map((uri) => (
              <Image
                key={uri}
                source={{ uri: normalizeMediaUrl(uri) }}
                style={hStyles.photo}
                contentFit="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <View style={hStyles.photoEmpty}>
            <Ionicons name="images-outline" size={28} color={Colors.muted} />
            <Text style={hStyles.sectionSub}>Add property photos from lodging setup.</Text>
          </View>
        )}

        <View style={hStyles.overviewStats}>
          <View style={hStyles.statTile}>
            <Text style={hStyles.statValue}>{totalRooms}</Text>
            <Text style={hStyles.statLabel}>Total rooms</Text>
          </View>
          <View style={hStyles.statTile}>
            <Text style={hStyles.statValue}>{roomTypes.length}</Text>
            <Text style={hStyles.statLabel}>Room types</Text>
          </View>
          <View style={hStyles.statTile}>
            <Text style={hStyles.statValue}>{availableRooms}</Text>
            <Text style={hStyles.statLabel}>Available</Text>
          </View>
        </View>

        {locationLine ? (
          <View style={hStyles.locRow}>
            <Ionicons name="location-outline" size={16} color={Colors.primary} />
            <Text style={hStyles.locText}>{locationLine}</Text>
          </View>
        ) : null}

        {reviews.length ? (
          <View style={hStyles.ratingRow}>
            <Stars rating={avgRating} />
            <Text style={hStyles.ratingText}>
              {avgRating.toFixed(1)} · {reviews.length} reviews
            </Text>
          </View>
        ) : null}

        <Button
          title="Edit property"
          variant="outline"
          onPress={() => pushEditor('/(provider)/register/hotel')}
        />
      </View>

      {/* 2. Room types expandable */}
      <View style={hStyles.sectionCard}>
        <View style={hStyles.sectionHead}>
          <Text style={hStyles.sectionTitle}>Room types</Text>
          <Pressable onPress={() => void withPaymentAccounts(() => router.push('/(provider)/rooms/add'), 'add rooms')}>
            <Text style={hStyles.link}>Add</Text>
          </Pressable>
        </View>
        <Text style={hStyles.sectionSub}>
          Tap a room type to expand details, edit, and set discounts or offers.
        </Text>
        {rooms.length === 0 ? (
          <CatalogEmpty
            icon="bed-outline"
            title="No room types yet"
            message="Add rooms so travelers can book a stay."
            actionLabel="Add room"
            onAction={() => void withPaymentAccounts(() => router.push('/(provider)/rooms/add'), 'add rooms')}
          />
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {rooms.map((room) => (
              <ExpandableRoomType key={room.id} room={room} onRefresh={() => void refreshDashboard()} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function RestaurantServicesTab() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const provider = useProviderStore((s) => s.provider);
  const loading = useProviderStore((s) => s.loading);
  const restaurant = provider?.restaurant;
  const status = provider?.verificationStatus ?? 'pending';

  useFocusEffect(
    useCallback(() => {
      void useProviderStore.getState().refreshDashboard();
    }, [])
  );

  if (loading && !provider) return <LoadingState title="Loading restaurant..." />;

  const statusTone =
    status === 'approved' ? 'green' : status === 'rejected' || status === 'suspended' ? 'red' : 'amber';
  const statusText =
    status === 'approved'
      ? '✓ Restaurant approved'
      : status === 'rejected'
        ? 'Rejected — needs changes'
        : status === 'suspended'
          ? 'Suspended'
          : 'Pending approval';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.lg,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.lg,
      }}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => void useProviderStore.getState().refreshDashboard()}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={[styles.heading, { color: colors.dark }]}>
        {restaurant?.restaurantName || provider?.businessName || 'Restaurant'}
      </Text>
      <Text style={[styles.sub, { color: colors.muted }]}>
        Manage your listing, photos, and traveler offers.
      </Text>

      <Pressable
        onPress={() => router.push('/(provider)/status')}
        style={[
          styles.statusBanner,
          {
            backgroundColor:
              status === 'approved'
                ? colors.actionSoft
                : status === 'rejected' || status === 'suspended'
                  ? colors.softDanger
                  : colors.softAmber,
            borderColor: colors.border,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Status: ${status}`}
      >
        <Badge label={statusText} tone={statusTone} />
        <Text style={[styles.statusHint, { color: colors.dark }]}>
          {status === 'approved'
            ? 'Visible to travelers searching by destination.'
            : status === 'rejected'
              ? 'Edit your details and resubmit for review.'
              : 'Under review by BANJARA. Tap for details.'}
        </Text>
        <Text style={[styles.statusLink, { color: colors.primary }]}>View status →</Text>
      </Pressable>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.dark }]}>Restaurant profile</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>
          {[restaurant?.city || provider?.city, (restaurant?.cuisineTypes ?? []).slice(0, 2).join(' · ')]
            .filter(Boolean)
            .join(' · ') || 'Complete your listing'}
        </Text>
        <Text style={[styles.sub, { color: colors.muted }]}>
          {(restaurant?.offers ?? []).filter((o) => o.active !== false).length} active offers ·{' '}
          {(restaurant?.images ?? []).length} photos
        </Text>
        <Button
          title="Edit restaurant details"
          onPress={() => pushEditor('/(provider)/register/restaurant')}
        />
      </View>
    </ScrollView>
  );
}

export default function ProviderServicesScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const {
    provider,
    services,
    loading,
    rooms,
    vehicles,
    trips,
    bookings,
    reviews,
    refreshDashboard,
  } = useProviderStore();
  const [subFilter, setSubFilter] = useState<string | null>(null);
  const [itineraries, setItineraries] = useState<TourItinerary[]>([]);

  useFocusEffect(
    useCallback(() => {
      void useProviderStore.getState().refreshDashboard();
      const servicesNow = useProviderStore.getState().provider?.services ?? [];
      if (servicesNow.some(isTourOperatorService)) {
        void tourItineraryService
          .listMine()
          .then(setItineraries)
          .catch(() => setItineraries([]));
      } else {
        setItineraries([]);
      }
    }, [])
  );

  const isTransporter = canOrganizeTripsFromList(provider?.services ?? []);
  const isHospitality = Boolean(provider?.services.some(isHotelService));
  const isGuideOnly =
    Boolean(provider?.services.some(isGuideService)) && !isTransporter && !isHospitality;
  const isRestaurantOnly =
    Boolean(provider?.services.some(isRestaurantService)) && !isTransporter && !isHospitality;

  if (isGuideOnly) {
    return <GuideServicesTab />;
  }

  if (isRestaurantOnly) {
    return <RestaurantServicesTab />;
  }

  if (isHospitality && !isTransporter) {
    return <HospitalityServices />;
  }

  // Keep transporter services UI from previous rewrite — re-import path via inline for transport
  // For transporter, show the transporter-specific UI that was in services.tsx before
  // We'll keep the rest of the original non-hotel flow below.

  const current = services[0] ?? (provider?.services[0]
    ? {
        id: provider.services[0],
        type: provider.services[0],
        label: serviceLabel(provider.services[0]),
        status: 'active' as const,
      }
    : null);

  const type = current?.type ?? '';
  const isTransport = Boolean(type && isTransportService(type));
  const isHotel = Boolean(type && isHotelService(type));
  const isGuide = Boolean(type && isGuideService(type));
  const isTour = Boolean(type && isTourOperatorService(type));
  const canTrips = canOrganizeTripsFromList(provider?.services ?? []);
  const serviceMeta = SERVICE_OPTIONS.find((item) => item.type === type);

  const actionSummary = useMemo(() => {
    const locations = new Set<string>();
    for (const trip of trips) {
      if (trip.origin) locations.add(trip.origin);
      if (trip.destination) locations.add(trip.destination);
    }
    for (const city of provider?.transport?.operatingCities ?? []) if (city) locations.add(city);
    const transportBookings = bookings.filter((b) => b.kind === 'transport');
    return {
      trips: trips.length,
      activeTrips: trips.filter((t) => t.status === 'upcoming' || t.status === 'active').length,
      locations: locations.size,
      bookings: transportBookings.length,
      completed: transportBookings.filter((b) => b.status === 'completed').length,
    };
  }, [bookings, provider?.transport?.operatingCities, trips]);

  const recentReviews = useMemo(() => reviews.slice(0, 6), [reviews]);
  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  const parentTone: CatalogTone = isHotel ? 'amber' : isGuide || isTour ? 'green' : 'teal';
  const parentTitle =
    provider?.hotel?.hotelName ||
    provider?.transport?.businessName ||
    provider?.tour?.companyName ||
    provider?.businessName ||
    current?.label ||
    'Service';
  const parentSubtitle = isGuide
    ? [
        provider?.tour?.gender === 'female'
          ? 'Female guide'
          : provider?.tour?.gender === 'male'
            ? 'Male guide'
            : 'Guide',
        provider?.tour?.yearsExperience != null
          ? `${provider.tour.yearsExperience} yrs experience`
          : null,
        'Hire only · no trips',
      ]
        .filter(Boolean)
        .join(' · ')
    : provider?.description?.trim() ||
      provider?.hotel?.description?.trim() ||
      provider?.transport?.description?.trim() ||
      provider?.tour?.description?.trim() ||
      serviceMeta?.description ||
      'Your service';

  const placeChips = useMemo(() => {
    if (isTransport) {
      const cities = [...(provider?.transport?.operatingCities ?? [])];
      if (provider?.city && !cities.includes(provider.city)) cities.unshift(provider.city);
      return cities.filter(Boolean).slice(0, 5);
    }
    if (isGuide && provider?.tour?.operatingAreas?.length) {
      return provider.tour.operatingAreas.slice(0, 5);
    }
    if (provider?.tour?.destination) return [provider.tour.destination];
    return provider?.city ? [provider.city] : [];
  }, [isGuide, isTransport, provider]);

  const parentStats: ParentStat[] = useMemo(() => {
    const items: ParentStat[] = [];
    if (isTransport) {
      items.push({ value: String(vehicles.length), label: vehicles.length === 1 ? 'vehicle' : 'vehicles' });
      if (canTrips) items.push({ value: String(trips.length), label: trips.length === 1 ? 'trip' : 'trips' });
    }
    if (isTour) {
      items.push({
        value: String(itineraries.length || (provider?.tour?.tourName ? 1 : 0)),
        label: 'packages',
      });
      if (provider?.tour?.duration) {
        items.push({ value: provider.tour.duration, label: 'duration' });
      }
    }
    if (isGuide) {
      const years = provider?.tour?.yearsExperience ?? provider?.yearsExperience ?? 0;
      const reg = provider?.tour?.regionalLanguages?.length ?? 0;
      const intl = provider?.tour?.internationalLanguages?.length ?? 0;
      if (years) items.push({ value: String(years), label: 'yrs exp.' });
      items.push({ value: String(reg + intl), label: 'languages' });
      const rate = provider?.tour?.dailyHireRate ?? provider?.tour?.price;
      if (rate) items.push({ value: formatCurrency(rate), label: 'daily rate' });
    }
    return items;
  }, [
    canTrips,
    isGuide,
    isTour,
    isTransport,
    itineraries.length,
    provider?.tour?.dailyHireRate,
    provider?.tour?.duration,
    provider?.tour?.internationalLanguages?.length,
    provider?.tour?.price,
    provider?.tour?.regionalLanguages?.length,
    provider?.tour?.tourName,
    provider?.tour?.yearsExperience,
    provider?.yearsExperience,
    trips.length,
    vehicles.length,
  ]);

  const subServices: SubServiceChip[] = useMemo(() => {
    if (isTransport) {
      const declared = provider?.transport?.vehicleTypes ?? [];
      const fromFleet = vehicles.map((item) => item.type);
      const keys = Array.from(new Set([...declared, ...fromFleet].filter(Boolean)));
      return keys.map((key) => {
        const count = vehicles.filter((item) => item.type === key).length;
        return {
          key,
          label: optionLabel(VEHICLE_TYPE_OPTIONS, key),
          icon: vehicleIcon(key),
          count,
          countLabel: `${count} vehicle${count === 1 ? '' : 's'}`,
        };
      });
    }
    if (isTour && (provider?.tour?.tourName || provider?.tour?.destination || itineraries.length)) {
      return [
        {
          key: 'package',
          label: 'Itineraries',
          icon: 'compass-outline' as const,
          count: Math.max(itineraries.length, provider?.tour?.tourName ? 1 : 0),
          countLabel: `${Math.max(itineraries.length, 0)} package${itineraries.length === 1 ? '' : 's'}`,
        },
      ];
    }
    if (isGuide && provider?.tour?.specialties?.length) {
      return provider.tour.specialties.slice(0, 6).map((spec, index) => ({
        key: `spec-${index}`,
        label: spec,
        icon: 'ribbon-outline' as const,
        count: 1,
        countLabel: 'specialty',
      }));
    }
    return [];
  }, [isGuide, isTour, isTransport, itineraries.length, provider, vehicles]);

  const vehicleChildren: ChildServiceItem[] = useMemo(() => {
    const list =
      subFilter && isTransport ? vehicles.filter((item) => item.type === subFilter) : vehicles;
    return list.map((item) => {
      const status = item.status ?? (item.active ? 'active' : 'pending');
      return {
        id: item.id,
        title: item.name,
        subtitle: `${optionLabel(VEHICLE_TYPE_OPTIONS, item.type)} · ${item.model} · ${item.totalSeats} seats`,
        meta: item.registrationNumber,
        image: item.images[0],
        icon: vehicleIcon(item.type),
        status: status.charAt(0).toUpperCase() + status.slice(1),
        statusTone: vehicleStatusTone(status),
        onPress: () => pushPath('/(provider)/transport'),
      };
    });
  }, [isTransport, subFilter, vehicles]);

  const tourChildren: ChildServiceItem[] = useMemo(() => {
    if (!isTour) return [];
    if (itineraries.length) {
      return itineraries.slice(0, 6).map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: [item.tourType, item.destination, `${item.durationDays}d`].filter(Boolean).join(' · '),
        meta: formatCurrency(item.pricePerPerson),
        image: item.coverImage,
        icon: 'compass-outline' as const,
        status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
        statusTone: vehicleStatusTone(
          item.status === 'published' ? 'active' : item.status === 'pending' ? 'pending' : item.status
        ),
        onPress: () => pushPath('/(provider)/itineraries'),
      }));
    }
    const tour = provider?.tour;
    if (!tour || (!tour.tourName && !tour.destination && !tour.companyName)) return [];
    return [
      {
        id: 'tour-package',
        title: tour.tourName || tour.companyName || 'Tour package',
        subtitle: [tour.destination, tour.duration].filter(Boolean).join(' · '),
        meta: tour.price ? formatCurrency(tour.price) : undefined,
        image: tour.images[0],
        icon: 'compass-outline' as const,
        status: current?.status,
        statusTone: current?.status === 'active' ? 'green' : 'amber',
        onPress: () => pushPath('/(provider)/itineraries'),
      },
    ];
  }, [current?.status, isTour, itineraries, provider?.tour]);

  const childItems = isTour ? tourChildren : vehicleChildren;

  if (loading && !provider) return <LoadingState title="Loading services..." />;

  if (isTransporter) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: Spacing.lg,
          gap: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshDashboard} tintColor={colors.primary} />
        }
      >
        <View>
          <Text style={styles.title}>My Service</Text>
          <Text style={styles.sub}>Your trips, routes, bookings, and customer feedback.</Text>
        </View>
        <View style={hStyles.sectionCard}>
          <Text style={hStyles.sectionTitle}>Activity summary</Text>
          <View style={hStyles.overviewStats}>
            <View style={hStyles.statTile}>
              <Text style={hStyles.statValue}>{actionSummary.trips}</Text>
              <Text style={hStyles.statLabel}>Trips</Text>
            </View>
            <View style={hStyles.statTile}>
              <Text style={hStyles.statValue}>{actionSummary.locations}</Text>
              <Text style={hStyles.statLabel}>Locations</Text>
            </View>
            <View style={hStyles.statTile}>
              <Text style={hStyles.statValue}>{actionSummary.bookings}</Text>
              <Text style={hStyles.statLabel}>Bookings</Text>
            </View>
          </View>
        </View>
        <View style={hStyles.sectionCard}>
          <View style={hStyles.sectionHead}>
            <Text style={hStyles.sectionTitle}>Your fleet</Text>
            <Pressable onPress={() => pushPath('/(provider)/transport')}>
              <Text style={hStyles.link}>Manage</Text>
            </Pressable>
          </View>
          {vehicleChildren.length ? (
            <View style={styles.stack}>
              {vehicleChildren.slice(0, 4).map((item) => (
                <ChildServiceCard key={item.id} item={item} />
              ))}
            </View>
          ) : (
            <CatalogEmpty
              icon="bus-outline"
              title="No vehicles listed"
              message="Add a vehicle so travelers can ride with you."
              actionLabel="Add vehicle"
              onAction={() =>
                void withPaymentAccounts(
                  () => router.push('/(provider)/vehicles/add'),
                  'add vehicles'
                )
              }
            />
          )}
        </View>
        <View style={hStyles.sectionCard}>
          <View style={hStyles.sectionHead}>
            <Text style={hStyles.sectionTitle}>Customer reviews</Text>
            <Pressable onPress={() => pushPath('/(provider)/reviews')}>
              <Text style={hStyles.link}>See all</Text>
            </Pressable>
          </View>
          {recentReviews.length === 0 ? (
            <Text style={hStyles.sectionSub}>No reviews yet.</Text>
          ) : (
            <View style={styles.stack}>
              {recentReviews.map((item) => (
                <View key={item.id} style={hStyles.reviewCard}>
                  <View style={hStyles.ratingRow}>
                    <Text style={hStyles.expandTitle}>{item.customerName}</Text>
                    <Stars rating={item.rating} />
                  </View>
                  <Text style={hStyles.sectionSub} numberOfLines={3}>
                    {item.comment}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.lg,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refreshDashboard} tintColor={colors.primary} />
      }
    >
      <View>
        <Text style={styles.title}>My Service</Text>
          <Text style={styles.sub}>
          {isGuide
            ? 'Your hireable guide profile — experience, languages, and daily rate. No trips or packages.'
            : isTour
              ? 'Your tour operator profile and itineraries travelers can book.'
              : current
                ? 'Your service listing on BANJARA.'
                : 'Add the one service you offer on BANJARA.'}
        </Text>
      </View>

      {!current ? (
        <EmptyState
          title="No service yet"
          message="Add the one service you offer. After that you can edit it, but you cannot add another."
          icon="layers-outline"
          actionLabel="Add your service"
          onAction={() => router.push('/(provider)/register/services')}
        />
      ) : (
        <>
          <ParentServiceCard
            emoji={serviceMeta?.emoji ?? '✓'}
            eyebrow={current.label}
            title={parentTitle}
            subtitle={parentSubtitle}
            stats={parentStats}
            chips={placeChips}
            status={current.status.charAt(0).toUpperCase() + current.status.slice(1)}
            statusTone={current.status === 'active' ? 'green' : 'amber'}
            tone={parentTone}
            onEdit={() => pushEditor(editServiceHref(current.type))}
          />
          {isGuide ? (
            <View style={hStyles.sectionCard}>
              <Text style={hStyles.sectionTitle}>Guide profile</Text>
              <Text style={hStyles.sectionSub}>
                Travelers hire you as a tour guide. Update your history, experience, and languages —
                you cannot create trips or itineraries.
              </Text>
              {(provider?.tour?.experienceHistory || provider?.tour?.description) ? (
                <Text style={styles.guideHistory} numberOfLines={4}>
                  {provider?.tour?.experienceHistory || provider?.tour?.description}
                </Text>
              ) : null}
              <Button
                title="Edit guide profile"
                onPress={() => pushEditor('/(provider)/register/guide')}
                compact
              />
            </View>
          ) : null}
          {isTour ? (
            <View style={hStyles.sectionCard}>
              <View style={hStyles.sectionHead}>
                <Text style={hStyles.sectionTitle}>Itineraries</Text>
                <Pressable onPress={() => pushPath('/(provider)/itineraries')}>
                  <Text style={hStyles.link}>Manage</Text>
                </Pressable>
              </View>
              <Text style={hStyles.sectionSub}>
                Trek, expedition and summit packages — submitted for admin review before going live.
              </Text>
              <Button
                title="Add itinerary"
                onPress={() =>
                  void withPaymentAccounts(
                    () => router.push('/(provider)/itineraries/add'),
                    'add itineraries'
                  )
                }
                compact
              />
            </View>
          ) : null}
          <CatalogSection
            title={isGuide ? 'Specialties' : isTour ? 'Offerings' : 'Details'}
            caption={isGuide ? 'What you offer as a hireable guide' : 'What travelers book'}
          >
            {subServices.length ? (
              <SubServicePills
                items={subServices}
                selectedKey={subFilter}
                onSelect={setSubFilter}
                allLabel="All"
              />
            ) : null}
            {childItems.length ? (
              <View style={styles.stack}>
                {childItems.slice(0, 6).map((item) => (
                  <ChildServiceCard key={item.id} item={item} />
                ))}
              </View>
            ) : (
              <CatalogEmpty
                icon={isGuide ? 'compass-outline' : isTour ? 'map-outline' : 'layers-outline'}
                title={isGuide ? 'Complete your guide profile' : 'Nothing listed yet'}
                message={
                  isGuide
                    ? 'Add experience history and languages so travelers can hire you.'
                    : isTour
                      ? 'Add an itinerary so travelers can browse your packages.'
                      : 'Complete your offering so travelers can find you.'
                }
                actionLabel={
                  isGuide ? 'Edit guide profile' : isTour ? 'Add itinerary' : undefined
                }
                onAction={
                  isGuide
                    ? () => pushEditor('/(provider)/register/tours')
                    : isTour
                      ? () => router.push('/(provider)/itineraries/add')
                      : undefined
                }
              />
            )}
          </CatalogSection>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { ...Typography.h2, color: Colors.dark },
  heading: { ...Typography.h2, color: Colors.dark },
  sub: { ...Typography.caption, color: Colors.muted, marginTop: Spacing.xs },
  stack: { gap: Spacing.sm },
  guideHistory: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.dark,
    lineHeight: 19,
  },
  statusBanner: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 6,
  },
  statusHint: { ...Typography.caption, lineHeight: 18 },
  statusLink: { fontFamily: Fonts.bodySemiBold, fontSize: 12, marginTop: 2 },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  cardTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 16 },
});

const hStyles = StyleSheet.create({
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontFamily: Fonts.display, fontSize: 18, color: Colors.dark },
  sectionSub: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  link: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.primary },
  photo: { width: 140, height: 100, borderRadius: Radius.lg },
  photoEmpty: {
    height: 100,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  overviewStats: { flexDirection: 'row', gap: Spacing.sm },
  statTile: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: 2,
  },
  statValue: { fontFamily: Fonts.display, fontSize: 20, color: Colors.primary },
  statLabel: { fontFamily: Fonts.body, fontSize: 11, color: Colors.muted },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locText: { flex: 1, fontFamily: Fonts.body, fontSize: 13, color: Colors.dark },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  ratingText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.dark },
  expandCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSecondary,
  },
  expandHead: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  expandTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.dark },
  expandSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted, marginTop: 2 },
  expandBody: {
    padding: Spacing.md,
    paddingTop: 0,
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  detailLine: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted, lineHeight: 17 },
  reviewCard: {
    padding: Spacing.md,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceSecondary,
    gap: 6,
  },
});
