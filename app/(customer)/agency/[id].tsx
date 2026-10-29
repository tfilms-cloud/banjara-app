import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExpandableText } from '@/components/agency/ExpandableText';
import { ServiceArea } from '@/components/agency/ServiceArea';
import { DriverCard } from '@/components/agency/DriverCard';
import { ContactCard } from '@/components/agency/ContactCard';
import { FleetPricingCard } from '@/components/agency/FleetPricingCard';
import { withoutDriverPhoto } from '@/utils/agencyGallery';
import { HotelImageGallery } from '@/components/hotels/HotelImageGallery';
import { TripCard } from '@/components/trip/TripCard';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Rating } from '@/components/ui/Rating';
import { AgencyProfileSkeleton } from '@/components/ui/Skeleton';
import { Colors, useThemeColors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as providerService from '@/services/providerService';
import { getProviderReviews } from '@/services/review.service';
import * as tourItineraryService from '@/services/tourItineraryService';
import * as tripService from '@/services/tripService';
import { useBookingStore } from '@/store/bookingStore';
import type { Provider } from '@/types/provider';
import type { TourItinerary } from '@/types/tourItinerary';
import type { Agency, Review, TripWithDetails } from '@/types/trip';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { vehicleTypeLabel } from '@/utils/helpers';
import { normalizeMediaUrl } from '@/utils/mediaUrl';
import { paramId, pushPath, safeBack } from '@/utils/navigation';
import {
  isGuideService,
  isTourOperatorService,
} from '@/constants/providerOptions';

const SERVICE_LABELS: Record<string, string> = {
  transport: 'Transport',
  hotel: 'Hotels',
  tour: 'Tours',
  carRental: 'Car rental',
  restaurant: 'Restaurant',
  travelGuide: 'Travel guide',
  vanOperator: 'Transport',
};

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const next = value.trim();
    if (!next) return;
    const key = next.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(next);
  });
  return result;
}

function isCityLabel(value: string) {
  // Filter out accidental lat/lng strings saved into operatingCities
  if (/^-?\d+(\.\d+)?$/.test(value.trim())) return false;
  return true;
}

function agencyFromProvider(provider: Provider): Agency {
  return {
    id: provider.id,
    name: provider.businessName || 'Provider',
    logo: provider.logo ?? '',
    rating: provider.rating,
    reviewCount: provider.reviewCount,
    phone: provider.phone,
    email: provider.email,
    description:
      provider.description?.trim() || provider.transport?.description?.trim() || '',
    verified: provider.verificationStatus === 'approved',
    userId: provider.userId || undefined,
    city: provider.city || undefined,
    address: provider.address || provider.structuredAddress?.formattedAddress || undefined,
    website: provider.website || undefined,
    services: provider.services?.map(String),
    yearsExperience: provider.yearsExperience > 0 ? provider.yearsExperience : undefined,
  };
}

function collectGallery(
  provider: Provider | null,
  trips: TripWithDetails[],
): string[] {
  const collected: string[] = [];
  const push = (uri?: string | null) => {
    const raw = String(uri ?? '').trim();
    if (!raw) return;
    const next = normalizeMediaUrl(raw) ?? raw;
    if (next) collected.push(next);
  };

  (provider?.galleryImages ?? []).forEach(push);
  push(provider?.logo);
  push(provider?.transport?.vehicleImageFront);
  push(provider?.transport?.vehicleImageBack);
  provider?.hotel?.images?.forEach(push);
  provider?.hotel?.outlookImages?.forEach(push);
  provider?.hotel?.roomImages?.forEach(push);
  provider?.hotel?.restaurantImages?.forEach(push);
  provider?.tour?.images?.forEach(push);
  provider?.restaurant?.images?.forEach(push);

  trips.forEach((trip) => {
    (trip.vehicleImages ?? []).forEach(push);
    push(trip.image);
  });

  return withoutDriverPhoto(collected, provider?.transport?.driverPhoto);
}

function InfoRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  if (!value.trim()) return null;
  const body = (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.dark }]}>{value}</Text>
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={16} color={colors.mutedLight} />
      ) : null}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {body}
      </Pressable>
    );
  }
  return body;
}

function AgencyGallery({ images }: { images: string[] }) {
  const { width, height } = useWindowDimensions();
  const colors = useThemeColors();
  const [active, setActive] = useState<string | null>(null);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const uris = useMemo(
    () =>
      uniqueStrings(
        images.map((uri) => normalizeMediaUrl(uri) ?? uri).filter(Boolean),
      ),
    [images],
  );

  if (!uris.length) {
    return (
      <View
        style={[
          styles.galleryEmpty,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Ionicons name="images-outline" size={28} color={colors.muted} />
        <Text
          style={{
            color: colors.muted,
            fontFamily: Fonts.bodyMedium,
            fontSize: 13,
          }}
        >
          No photos uploaded yet
        </Text>
      </View>
    );
  }

  const gap = Spacing.sm;
  const tileWidth = Math.floor((width - Spacing.screen * 2 - gap) / 2);
  const tileHeight = Math.floor(tileWidth * 0.75);

  return (
    <>
      <View style={styles.galleryGrid}>
        {uris.map((uri, index) => {
          const broken = Boolean(failed[uri]);
          return (
            <Pressable
              key={`${uri}-${index}`}
              onPress={() => {
                if (!broken) setActive(uri);
              }}
              style={[
                styles.galleryTile,
                {
                  width: tileWidth,
                  height: tileHeight,
                  backgroundColor: colors.inputBg,
                },
              ]}
            >
              {broken ? (
                <View style={styles.galleryFallback}>
                  <Ionicons name="image-outline" size={26} color={colors.muted} />
                </View>
              ) : (
                <Image
                  source={{ uri }}
                  style={{ width: tileWidth, height: tileHeight }}
                  contentFit="cover"
                  transition={150}
                  cachePolicy="memory-disk"
                  onError={() => setFailed((prev) => ({ ...prev, [uri]: true }))}
                />
              )}
            </Pressable>
          );
        })}
      </View>
      <Modal visible={Boolean(active)} transparent animationType="fade" onRequestClose={() => setActive(null)}>
        <Pressable style={styles.galleryModal} onPress={() => setActive(null)}>
          {active ? (
            <Image
              source={{ uri: active }}
              style={{
                width: width - 32,
                height: height * 0.7,
                borderRadius: Radius.lg,
              }}
              contentFit="contain"
            />
          ) : null}
          <Text style={styles.galleryClose}>Close</Text>
        </Pressable>
      </Modal>
    </>
  );
}

export default function AgencyProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const agencyId = paramId(params.id);
  const setTrip = useBookingStore((s) => s.setTrip);
  const scrollRef = useRef<ScrollView>(null);
  const tripsOffset = useRef(0);

  const [agency, setAgency] = useState<Agency | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [itineraries, setItineraries] = useState<TourItinerary[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!agencyId) {
      setLoading(false);
      setError('Provider not found');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [list, reviewList, publicProvider, packages] = await Promise.all([
        tripService.getTripsByAgency(agencyId).catch(() => [] as TripWithDetails[]),
        getProviderReviews(agencyId).catch(() => [] as Review[]),
        providerService.getPublicProviderById(agencyId).catch(() => null),
        tourItineraryService
          .listPublished({ providerId: agencyId, limit: 40 })
          .catch(() => [] as TourItinerary[]),
      ]);

      const nextAgency = publicProvider
        ? agencyFromProvider(publicProvider)
        : (list[0]?.agency ?? null);

      setTrips(list);
      setItineraries(packages);
      setReviews(reviewList);
      setProvider(publicProvider);
      setAgency(nextAgency);

      const collected = collectGallery(publicProvider, list);
      packages.forEach((pkg) => {
        const cover = normalizeMediaUrl(pkg.coverImage) ?? pkg.coverImage;
        if (cover) collected.push(cover);
        pkg.images.forEach((uri) => {
          const next = normalizeMediaUrl(uri) ?? uri;
          if (next) collected.push(next);
        });
      });
      if (!collected.length && publicProvider?.transport) {
        const t = publicProvider.transport;
        [t.vehicleImageFront, t.vehicleImageBack, publicProvider.logo]
          .filter(Boolean)
          .forEach((uri) => collected.push(String(uri)));
      }
      setGalleryImages(
        withoutDriverPhoto(collected, publicProvider?.transport?.driverPhoto),
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const fromPrice = useMemo(() => {
    if (!trips.length) return null;
    return Math.min(...trips.map((t) => t.price));
  }, [trips]);

  const routes = useMemo(() => {
    const fromTrips = trips.map((trip) => `${trip.from} → ${trip.to}`);
    const fromProfile = provider?.transport?.operatingRoutes ?? [];
    return uniqueStrings([...fromTrips, ...fromProfile]);
  }, [provider?.transport?.operatingRoutes, trips]);

  const serviceChips = useMemo(() => {
    if (provider?.services?.length) {
      return uniqueStrings(
        provider.services.map(
          (service) => SERVICE_LABELS[service] ?? vehicleTypeLabel(service),
        ),
      );
    }
    if (agency?.services?.length) {
      return uniqueStrings(
        agency.services.map(
          (service) => SERVICE_LABELS[service] ?? vehicleTypeLabel(service),
        ),
      );
    }
    return uniqueStrings(
      trips.map((trip) => vehicleTypeLabel(trip.vehicleType)),
    );
  }, [agency?.services, provider?.services, trips]);

  const reviewCount = agency?.reviewCount || reviews.length;
  const transport = provider?.transport;
  const isGuide = (provider?.services ?? []).some(isGuideService);
  const isTourOperator = (provider?.services ?? []).some(isTourOperatorService);
  const aboutText =
    agency?.description?.trim() ||
    provider?.tour?.experienceHistory?.trim() ||
    provider?.tour?.description?.trim() ||
    transport?.description?.trim() ||
    '';

  const locationLabel = [agency?.city, agency?.address].filter(Boolean).join(', ');
  const canCall = Boolean(agency?.phone?.trim());
  const canMessage = Boolean(agency?.userId);
  const showStickyCta =
    !loading &&
    !error &&
    (isGuide || trips.length > 0 || itineraries.length > 0);

  const { width: screenWidth } = useWindowDimensions();
  const profileWidth = screenWidth - Spacing.screen * 2;
  const bannerImages = uniqueStrings(
    [
      normalizeMediaUrl(transport?.vehicleImageFront) ?? '',
      ...galleryImages,
    ].filter(Boolean),
  );

  const fromPackagePrice = useMemo(() => {
    if (!itineraries.length) return null;
    return Math.min(...itineraries.map((item) => item.pricePerPerson));
  }, [itineraries]);

  const operatingCities = (transport?.operatingCities ?? []).filter(
    isCityLabel,
  );
  const pickupLocations = transport?.pickupLocations ?? [];
  const dropoffLocations = transport?.dropoffLocations ?? [];

  const stats = useMemo(() => {
    const items: { label: string; value: string }[] = [];
    if (isGuide) {
      const years = provider?.tour?.yearsExperience ?? agency?.yearsExperience;
      const reg = provider?.tour?.regionalLanguages?.length ?? 0;
      const intl = provider?.tour?.internationalLanguages?.length ?? 0;
      if (years) items.push({ label: 'Experience', value: `${years}y` });
      items.push({ label: 'Languages', value: `${reg + intl}` });
      const rate = provider?.tour?.dailyHireRate ?? provider?.tour?.price;
      if (rate) items.push({ label: 'Daily', value: formatCurrency(rate) });
    } else if (isTourOperator && itineraries.length) {
      items.push({ label: 'Packages', value: String(itineraries.length) });
    }
    if (!isGuide && trips.length) items.push({ label: 'Trips', value: String(trips.length) });
    if (!isGuide && routes.length) items.push({ label: 'Routes', value: String(routes.length) });
    if (reviewCount > 0) items.push({ label: 'Reviews', value: String(reviewCount) });
    if (agency && agency.rating > 0) items.push({ label: 'Rating', value: agency.rating.toFixed(1) });
    if (!isGuide && agency?.yearsExperience) {
      items.push({ label: 'Years', value: String(agency.yearsExperience) });
    }
    return items.slice(0, 4);
  }, [
    agency,
    isGuide,
    isTourOperator,
    itineraries.length,
    provider?.tour?.dailyHireRate,
    provider?.tour?.internationalLanguages?.length,
    provider?.tour?.price,
    provider?.tour?.regionalLanguages?.length,
    provider?.tour?.yearsExperience,
    reviewCount,
    routes.length,
    trips.length,
  ]);

  const scrollToTrips = () => {
    scrollRef.current?.scrollTo({
      y: Math.max(0, tripsOffset.current - 8),
      animated: true,
    });
  };

  const openTrip = (trip: TripWithDetails) => {
    setTrip(trip);
    pushPath(`/(customer)/trip/${trip.id}`);
  };

  const contentBottom = showStickyCta ? insets.bottom + 108 : insets.bottom + Spacing['3xl'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={agency?.name ?? 'Provider'}
        showBack
        onBack={() => safeBack('/(customer)/(tabs)')}
      />

      {loading && !agency && trips.length === 0 ? (
        <AgencyProfileSkeleton />
      ) : error && !agency && trips.length === 0 ? (
        <ErrorState
          title="Couldn't load provider"
          message={error}
          onRetry={() => void refresh()}
        />
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ paddingBottom: contentBottom }}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={() => void refresh()} />
            }
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.topRow}>
                <Avatar uri={agency?.logo} name={agency?.name ?? 'P'} size={64} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.name, { color: colors.dark }]}>
                    {agency?.name ?? 'Provider'}
                  </Text>
                </View>
              </View>

              <View style={styles.badgeRow}>
                {agency?.verified ? (
                  <Badge label="Verified" tone="green" />
                ) : null}
                {serviceChips.slice(0, 3).map((chip) => (
                  <Badge key={chip} label={chip} tone="blue" />
                ))}
                {agency?.yearsExperience ? (
                  <Badge
                    label={`${agency.yearsExperience}y exp`}
                    tone="amber"
                  />
                ) : null}
              </View>

              <View style={styles.heroFrame}>
                {bannerImages.length ? (
                  <HotelImageGallery
                    images={bannerImages}
                    height={260}
                    width={profileWidth}
                  />
                ) : (
                  <View
                    style={[
                      styles.bannerFallback,
                      { backgroundColor: colors.primarySoft },
                    ]}
                  >
                    <Ionicons
                  name={isGuide ? 'walk-outline' : isTourOperator ? 'compass-outline' : 'bus-outline'}
                  size={48}
                  color={colors.primary}
                />
                    <Text
                      style={{
                        color: colors.primary,
                        fontFamily: Fonts.bodySemiBold,
                      }}
                    >
                      {agency?.name ?? 'Provider'}
                    </Text>
                  </View>
                )}
              </View>
              {agency && (agency.rating > 0 || reviewCount > 0) ? (
                    <Rating value={agency.rating} count={reviewCount || undefined} />
                  ) : (
                    <Text style={[styles.metaMuted, { color: colors.muted }]}>New on Banjara</Text>
                  )}

              {locationLabel ? (
                <View
                  style={[
                    styles.locationCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons name="location" size={18} color={colors.secondary} />
                  <Text style={[styles.locationText, { color: colors.muted }]}>{locationLabel}</Text>
                </View>
              ) : null}

              {(canCall || canMessage) && agency ? (
                <View style={styles.actions}>
                  {canCall ? (
                    <Pressable
                      style={[
                        styles.actionBtn,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.card,
                        },
                      ]}
                      onPress={() =>
                        Linking.openURL(
                          `tel:${agency.phone.replace(/\s/g, '')}`,
                        )
                      }
                    >
                      <Ionicons name="call-outline" size={18} color={colors.primary} />
                      <Text style={[styles.actionLabel, { color: colors.primary }]}>Call</Text>
                    </Pressable>
                  ) : null}
                  {canMessage ? (
                    <Pressable
                      style={[
                        styles.actionBtn,
                        {
                          borderColor: colors.primarySoft,
                          backgroundColor: colors.primarySoft,
                        },
                      ]}
                      onPress={() => pushPath(`/(customer)/messages/${agency.userId}`)
                      }
                    >
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
                      <Text style={[styles.actionLabel, { color: colors.primary }]}>Message</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              {stats.length ? (
                <View
                  style={[
                    styles.statsRow,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {stats.map((stat, index) => (
                    <View key={stat.label} style={styles.statCell}>
                      {index > 0 ? (
                        <View
                          style={[
                            styles.statDivider,
                            { backgroundColor: colors.border },
                          ]}
                        />
                      ) : null}
                      <View style={styles.stat}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>{stat.value}</Text>
                        <Text style={[styles.statLabel, { color: colors.muted }]}>{stat.label}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}

              <DriverCard driver={transport} />

              <FleetPricingCard transport={transport} trips={trips} onSeeTrips={scrollToTrips} />

              {transport?.ownerName && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.dark }]}>Business owner</Text>
                  <View
                    style={[
                      styles.cardBlock,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {transport?.ownerName ? (
                      <InfoRow icon="person-outline" label="Owner" value={transport.ownerName} />
                    ) : null}
                  </View>
                </>
              )}

              <ServiceArea
                cities={operatingCities}
                routes={routes}
                pickups={pickupLocations}
                dropoffs={dropoffLocations}
                previewTrip={trips.find(
                  (trip) =>
                    trip.originCoordinates && trip.destinationCoordinates,
                )}
              />

              <ContactCard agency={agency} provider={provider} />

              <Text style={[styles.sectionTitle, { color: colors.dark }]}>Gallery</Text>
              <AgencyGallery images={galleryImages} />

              <View
                onLayout={(event) => {
                  tripsOffset.current = event.nativeEvent.layout.y;
                }}
              >
                {isGuide ? (
                  <>
                    <View style={styles.sectionHead}>
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: colors.dark, marginTop: 0 },
                        ]}
                      >
                        Hire this guide
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.listItem,
                        { color: colors.muted, marginBottom: Spacing.md },
                      ]}
                    >
                      Available for hire as a tour guide — not a trip or package operator.
                    </Text>
                    {provider?.tour?.specialties?.length ? (
                      <View style={{ marginBottom: Spacing.md, gap: 4 }}>
                        <Text
                          style={[
                            styles.sectionTitle,
                            { color: colors.dark, fontSize: 15 },
                          ]}
                        >
                          Specialties
                        </Text>
                        {provider.tour.specialties.map((item) => (
                          <Text key={item} style={[styles.listItem, { color: colors.muted }]}>
                            · {item}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                    {provider?.tour?.regionalLanguages?.length ||
                      provider?.tour?.internationalLanguages?.length ? (
                      <View style={{ marginBottom: Spacing.md, gap: 4 }}>
                        <Text
                          style={[
                            styles.sectionTitle,
                            { color: colors.dark, fontSize: 15 },
                          ]}
                        >
                          Languages
                        </Text>
                        <Text style={[styles.listItem, { color: colors.muted }]}>
                          Regional:{' '}
                          {provider?.tour?.regionalLanguages?.length
                            ? provider.tour.regionalLanguages.join(', ')
                            : '—'}
                        </Text>
                        <Text style={[styles.listItem, { color: colors.muted }]}>
                          International:{' '}
                          {provider?.tour?.internationalLanguages?.length
                            ? provider.tour.internationalLanguages.join(', ')
                            : '—'}
                        </Text>
                      </View>
                    ) : null}
                    {provider?.tour?.operatingAreas?.length ? (
                      <View style={{ marginBottom: Spacing.md, gap: 4 }}>
                        <Text
                          style={[
                            styles.sectionTitle,
                            { color: colors.dark, fontSize: 15 },
                          ]}
                        >
                          Operating areas
                        </Text>
                        <Text style={[styles.listItem, { color: colors.muted }]}>
                          {provider.tour.operatingAreas.join(' · ')}
                        </Text>
                      </View>
                    ) : null}
                    {provider?.tour?.dailyHireRate || provider?.tour?.price ? (
                      <Text
                        style={[
                          styles.packagePrice,
                          { color: colors.primary, marginBottom: Spacing.lg },
                        ]}
                      >
                        {formatCurrency(
                          provider.tour.dailyHireRate || provider.tour.price || 0,
                        )}
                        <Text
                          style={{
                            color: colors.muted,
                            fontFamily: Fonts.body,
                            fontSize: 12,
                          }}
                        >
                          {' '}
                          / day hire
                        </Text>
                      </Text>
                    ) : null}
                    {agencyId ? (
                      <View style={{ gap: Spacing.sm, marginBottom: Spacing.lg }}>
                        <Button
                          title="Book this guide"
                          onPress={() => pushPath(`/(customer)/guides/book/${agencyId}`)
                          }
                        />
                        <Button
                          title="View full profile"
                          variant="outline"
                          onPress={() => pushPath(`/(customer)/guides/${agencyId}`)
                          }
                        />
                      </View>
                    ) : null}
                  </>
                ) : null}
                {isTourOperator ? (
                  <>
                    <View style={styles.sectionHead}>
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: colors.dark, marginTop: 0 },
                        ]}
                      >
                        Tour packages
                      </Text>
                      {fromPackagePrice != null ? (
                        <Text
                          style={[
                            styles.pricePill,
                            {
                              backgroundColor: colors.actionSoft,
                              color: colors.action,
                            },
                          ]}
                        >
                          From {formatCurrency(fromPackagePrice)}
                        </Text>
                      ) : null}
                    </View>
                    {itineraries.length ? (
                      <View style={styles.tripList}>
                        {itineraries.map((pkg) => (
                          <Pressable
                            key={pkg.id}
                            style={[
                              styles.packageCard,
                              {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                              },
                            ]}
                            onPress={() => pushPath(`/(customer)/tours/${pkg.id}`)
                            }
                          >
                            <Image
                              source={{
                                uri:
                                  normalizeMediaUrl(pkg.coverImage) ||
                                  pkg.coverImage ||
                                  galleryImages[0] ||
                                  '',
                              }}
                              style={styles.packageCover}
                              contentFit="cover"
                            />
                            <View style={styles.packageBody}>
                              <Text
                                style={[
                                  styles.packageType,
                                  { color: colors.primary },
                                ]}
                              >
                                {pkg.tourType}
                                {pkg.featured ? ' · Featured' : ''}
                              </Text>
                              <Text
                                style={[
                                  styles.packageTitle,
                                  { color: colors.dark },
                                ]}
                                numberOfLines={2}
                              >
                                {pkg.title}
                              </Text>
                              <Text
                                style={[
                                  styles.packageMeta,
                                  { color: colors.muted },
                                ]}
                                numberOfLines={1}
                              >
                                {[
                                  pkg.destination,
                                  `${pkg.durationDays} days`,
                                  pkg.difficulty,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </Text>
                              <Text
                                style={[
                                  styles.packagePrice,
                                  { color: colors.primary },
                                ]}
                              >
                                {formatCurrency(pkg.pricePerPerson)}
                                <Text
                                  style={{
                                    color: colors.muted,
                                    fontFamily: Fonts.body,
                                    fontSize: 12,
                                  }}
                                >
                                  {' '}
                                  / person
                                </Text>
                              </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                          </Pressable>
                        ))}
                      </View>
                    ) : (
                      <EmptyState
                        title="No packages yet"
                        message="This operator hasn’t published itineraries yet."
                        icon="compass-outline"
                      />
                    )}
                  </>
                ) : null}

                {!isGuide && (!isTourOperator || trips.length > 0) ? (
                  <>
                    <View style={styles.sectionHead}>
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: colors.dark, marginTop: 0 },
                        ]}
                      >
                        Available trips
                      </Text>
                      {fromPrice != null ? (
                        <Text
                          style={[
                            styles.pricePill,
                            {
                              backgroundColor: colors.actionSoft,
                              color: colors.action,
                            },
                          ]}
                        >
                          From{' '}
                          {formatCurrency(
                            fromPrice,
                            trips[0]?.currency || 'PKR',
                          )}
                        </Text>
                      ) : null}
                    </View>
                    {trips.length ? (
                      <View style={styles.tripList}>
                        {trips.map((trip) => (
                          <TripCard key={trip.id} trip={trip} onPress={() => openTrip(trip)} />
                        ))}
                      </View>
                    ) : !isTourOperator ? (
                      <EmptyState
                        title="No upcoming trips"
                        message="No upcoming trips are available right now."
                        icon="bus-outline"
                      />
                    ) : null}
                  </>
                ) : null}
              </View>

              {aboutText ? (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.dark }]}>About</Text>
                  <View
                    style={[
                      styles.cardBlock,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <ExpandableText text={aboutText} />
                  </View>
                </>
              ) : null}

              {routes.length ? (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.dark }]}>Popular routes</Text>
                  <View style={styles.routeList}>
                    {routes.map((route) => {
                      const [from, to] = route.includes('→')
                        ? route.split('→').map((s) => s.trim())
                        : [route, ''];
                      return (
                        <View
                          key={route}
                          style={[
                            styles.routeRow,
                            {
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.routeIcon,
                              { backgroundColor: colors.primarySoft },
                            ]}
                          >
                            <Ionicons name="navigate-outline" size={16} color={colors.primary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.routeFrom, { color: colors.dark }]}>{from}</Text>
                            {to ? (
                              <Text
                                style={[
                                  styles.routeTo,
                                  { color: colors.muted },
                                ]}
                              >
                                {to}
                              </Text>
                            ) : null}
                          </View>
                          <Ionicons name="chevron-forward" size={16} color={colors.mutedLight} />
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : null}

              <Text style={[styles.sectionTitle, { color: colors.dark }]}>Reviews</Text>
              {reviews.length ? (
                <View style={styles.reviewList}>
                  {reviews.map((review) => {
                    const displayName =
                      review.userName && review.userName !== 'Guest' ? review.userName : 'Customer';
                    return (
                      <Card key={review.id} elevated={false}>
                        <View style={styles.reviewHead}>
                          <Avatar uri={review.userAvatar} name={displayName} size={40} />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.reviewName,
                                { color: colors.dark },
                              ]}
                            >
                              {displayName}
                            </Text>
                            {review.date ? (
                              <Text
                                style={[
                                  styles.reviewDate,
                                  { color: colors.muted },
                                ]}
                              >
                                {formatDate(review.date, false)}
                              </Text>
                            ) : null}
                          </View>
                          {review.rating > 0 ? (
                            <Rating value={review.rating} />
                          ) : null}
                        </View>
                        {review.comment.trim() ? (
                          <Text
                            style={[
                              styles.reviewComment,
                              { color: colors.muted },
                            ]}
                          >
                            {review.comment}
                          </Text>
                        ) : null}
                      </Card>
                    );
                  })}
                </View>
              ) : (
                <Text style={[styles.metaMuted, { color: colors.muted }]}>
                  Travelers have not left reviews for this provider yet.
                </Text>
              )}
            </View>
          </ScrollView>

          {showStickyCta ? (
            <View
              style={[
                styles.cta,
                {
                  paddingBottom: insets.bottom + Spacing.md,
                  backgroundColor: colors.card,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.ctaLabel, { color: colors.muted }]}>
                  {isGuide
                    ? 'Available for hire'
                    : isTourOperator && itineraries.length
                      ? `${itineraries.length} package${itineraries.length === 1 ? '' : 's'} available`
                      : `${trips.length} trip${trips.length === 1 ? '' : 's'} available`}
                </Text>
                <Text style={[styles.ctaPrice, { color: colors.action }]}>
                  {isGuide
                    ? provider?.tour?.dailyHireRate || provider?.tour?.price
                      ? `From ${formatCurrency(provider.tour.dailyHireRate || provider.tour.price || 0)} / day`
                      : 'Book your dates'
                    : isTourOperator && fromPackagePrice != null
                      ? `From ${formatCurrency(fromPackagePrice)}`
                      : fromPrice != null
                        ? `From ${formatCurrency(fromPrice, trips[0]?.currency || 'PKR')}`
                        : isTourOperator
                          ? 'Browse packages'
                          : 'Browse departures'}
                </Text>
              </View>
              <Button
                title={isGuide ? 'Book guide' : isTourOperator ? 'See packages' : 'See trips'}
                fullWidth={false}
                style={styles.ctaButton}
                onPress={() => {
                  if (isGuide && agencyId) {
                    pushPath(`/(customer)/guides/book/${agencyId}`);
                    return;
                  }
                  scrollToTrips();
                }}
              />
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bannerFallback: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  content: { padding: Spacing.screen, gap: Spacing.md },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
  },
  name: {
    fontFamily: Fonts.displayBold,
    fontSize: 30,
    lineHeight: 40,
    letterSpacing: -0.6,
    writingDirection: 'auto',
  },
  metaMuted: {
    fontFamily: Fonts.body,
    fontSize: 13,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  locationText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 24,
    writingDirection: 'auto',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  actionLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    ...Shadows.premium,
  },
  statCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: Spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  statValue: {
    fontFamily: Fonts.displayBold,
    fontSize: 20,
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
    marginTop: Spacing.xl,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  pricePill: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  cardBlock: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.premium,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  infoValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    marginTop: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  chipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },
  listBlock: { gap: 4 },
  listLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    marginBottom: 2,
  },
  listItem: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 20,
  },
  tripList: { gap: Spacing.md },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  packageCover: {
    width: 84,
    height: 84,
    borderRadius: Radius.lg,
    backgroundColor: Colors.softBlue,
  },
  packageBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  packageType: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  packageTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
  },
  packageMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  packagePrice: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    marginTop: 2,
  },
  routeList: { gap: Spacing.sm },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  routeIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeFrom: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  routeTo: {
    fontFamily: Fonts.body,
    fontSize: 13,
    marginTop: 1,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  galleryTile: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  galleryFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing['2xl'],
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  galleryModal: {
    flex: 1,
    backgroundColor: 'rgba(11, 31, 51, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  galleryClose: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.white,
  },
  reviewList: { gap: Spacing.md },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  reviewName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
  },
  reviewDate: {
    ...Typography.small,
    marginTop: 2,
  },
  reviewComment: {
    ...Typography.body,
    lineHeight: 22,
  },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.lg,
    ...Shadows.premium,
  },
  ctaLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  ctaPrice: { fontFamily: Fonts.displayBold, fontSize: 21, lineHeight: 28 },
  ctaButton: {
    minWidth: 120,
  },
  heroFrame: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSecondary,
  },
  identity: { gap: Spacing.md, paddingTop: Spacing.sm },
});
