import { CheckCircle2, MapPin, Star } from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExpandableText } from '@/components/agency/ExpandableText';
import { ProviderGallery } from '@/components/agency/ProviderGallery';
import { TripCard } from '@/components/trip/TripCard';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Rating } from '@/components/ui/Rating';
import { AgencyProfileSkeleton } from '@/components/ui/Skeleton';
import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import { getProviderReviews } from '@/services/review.service';
import * as tripService from '@/services/tripService';
import { useBookingStore } from '@/store/bookingStore';
import type { Agency, Review, TripWithDetails } from '@/types/trip';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { vehicleTypeLabel } from '@/utils/helpers';
import { normalizeMediaUrl } from '@/utils/mediaUrl';
import { paramId, pushPath, safeBack } from '@/utils/navigation';

const SERVICE_LABELS: Record<string, string> = {
  transport: 'Transport',
  hotel: 'Hotels',
  tour: 'Tours',
  carRental: 'Car rental',
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

export default function AgencyProfileScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const agencyId = paramId(params.id);
  const setTrip = useBookingStore((s) => s.setTrip);
  const scrollRef = useRef<ScrollView>(null);
  const tripsOffset = useRef(0);

  const [agency, setAgency] = useState<Agency | null>(null);
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverFailed, setCoverFailed] = useState(false);

  const refresh = useCallback(async () => {
    if (!agencyId) {
      setLoading(false);
      setError('Provider not found');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [list, reviewList] = await Promise.all([
        tripService.getTripsByAgency(agencyId),
        getProviderReviews(agencyId).catch(() => [] as Review[]),
      ]);
      setTrips(list);
      setReviews(reviewList);
      setAgency(list[0]?.agency ?? null);
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

  const routes = useMemo(
    () => uniqueStrings(trips.map((trip) => `${trip.from} → ${trip.to}`)),
    [trips]
  );

  const galleryImages = useMemo(() => {
    const collected: string[] = [];
    trips.forEach((trip) => {
      (trip.vehicleImages ?? []).forEach((uri) => collected.push(uri));
      if (trip.image) collected.push(trip.image);
    });
    return uniqueStrings(collected.map((uri) => normalizeMediaUrl(uri) ?? uri).filter(Boolean));
  }, [trips]);

  const serviceChips = useMemo(() => {
    if (agency?.services?.length) {
      return uniqueStrings(
        agency.services.map((service) => SERVICE_LABELS[service] ?? vehicleTypeLabel(service))
      );
    }
    return uniqueStrings(trips.map((trip) => vehicleTypeLabel(trip.vehicleType)));
  }, [agency?.services, trips]);

  const coverUri = galleryImages[0];
  const showCoverImage = Boolean(coverUri) && !coverFailed;
  const hasRating = Boolean(agency && (agency.rating > 0 || agency.reviewCount > 0));
  const reviewCount = agency?.reviewCount || reviews.length;
  const locationLabel = agency?.city || agency?.address;
  const canCall = Boolean(agency?.phone?.trim());
  const canMessage = Boolean(agency?.userId);
  const showStickyCta = trips.length > 0 && !loading && !error;

  const stats = useMemo(() => {
    const items: { label: string; value: string }[] = [];
    if (trips.length) items.push({ label: 'Trips', value: String(trips.length) });
    if (routes.length) items.push({ label: 'Routes', value: String(routes.length) });
    if (reviewCount > 0) items.push({ label: 'Reviews', value: String(reviewCount) });
    if (agency && agency.rating > 0) {
      items.push({ label: 'Rating', value: agency.rating.toFixed(1) });
    }
    return items;
  }, [agency, reviewCount, routes.length, trips.length]);

  const scrollToTrips = () => {
    scrollRef.current?.scrollTo({ y: Math.max(0, tripsOffset.current - 8), animated: true });
  };

  const openTrip = (trip: TripWithDetails) => {
    setTrip(trip);
    pushPath(`/(customer)/trip/${trip.id}`);
  };

  const contentBottom = showStickyCta ? insets.bottom + 108 : insets.bottom + Spacing['3xl'];

  return (
    <View style={styles.container}>
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
            <View>
            <View style={styles.coverWrap}>
              {showCoverImage ? (
                <Image
                  source={{ uri: coverUri }}
                  style={styles.cover}
                  contentFit="cover"
                  transition={200}
                  onError={() => setCoverFailed(true)}
                  accessibilityLabel={`${agency?.name ?? 'Provider'} cover photo`}
                />
              ) : (
                <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.cover} />
              )}
            </View>

            <View style={styles.identity}>
              <View style={styles.logoWrap}>
                <Avatar uri={agency?.logo} name={agency?.name ?? 'P'} size={80} />
              </View>

              <View style={styles.nameRow}>
                <Text style={styles.name} accessibilityRole="header">
                  {agency?.name ?? 'Provider'}
                </Text>
                {agency?.verified ? <Badge label="Verified" tone="green" /> : null}
              </View>

              {hasRating && agency ? (
                <Rating value={agency.rating} count={agency.reviewCount || undefined} />
              ) : null}

              {locationLabel ? (
                <View style={styles.locationRow}>
                  <MapPin size={14} color={Colors.muted} strokeWidth={2} />
                  <Text style={styles.location}>{locationLabel}</Text>
                </View>
              ) : null}

              {(canCall || canMessage) && agency ? (
                <View style={styles.actions}>
                  {canCall ? (
                    <Button
                      title="Call"
                      variant="outline"
                      fullWidth={false}
                      style={styles.actionBtn}
                      onPress={() => Linking.openURL(`tel:${agency.phone.replace(/\s/g, '')}`)}
                    />
                  ) : null}
                  {canMessage ? (
                    <Button
                      title="Message"
                      variant="secondary"
                      fullWidth={false}
                      style={styles.actionBtn}
                      onPress={() => pushPath(`/(customer)/messages/${agency.userId}`)}
                    />
                  ) : null}
                </View>
              ) : null}
            </View>

            {stats.length ? (
              <View style={styles.statsRow} accessibilityLabel="Provider statistics">
                {stats.map((stat) => (
                  <View key={stat.label} style={styles.stat}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {(agency?.verified ||
              hasRating ||
              reviewCount > 0 ||
              (agency?.yearsExperience ?? 0) > 0) &&
            agency ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Trust</Text>
                <View style={styles.chips}>
                  {agency.verified ? (
                    <View style={styles.trustChip}>
                      <CheckCircle2 size={14} color={Colors.success} strokeWidth={2} />
                      <Text style={styles.trustText}>Verified provider</Text>
                    </View>
                  ) : null}
                  {agency.rating > 0 ? (
                    <View style={styles.trustChip}>
                      <Star size={14} color={Colors.accent} fill={Colors.accent} strokeWidth={0} />
                      <Text style={styles.trustText}>{agency.rating.toFixed(1)} rating</Text>
                    </View>
                  ) : null}
                  {reviewCount > 0 ? (
                    <View style={styles.trustChip}>
                      <Text style={styles.trustText}>
                        {reviewCount} review{reviewCount === 1 ? '' : 's'}
                      </Text>
                    </View>
                  ) : null}
                  {agency.yearsExperience ? (
                    <View style={styles.trustChip}>
                      <Text style={styles.trustText}>
                        {agency.yearsExperience} year
                        {agency.yearsExperience === 1 ? '' : 's'} experience
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {agency?.description.trim() ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <ExpandableText text={agency.description} />
              </View>
            ) : null}

            {serviceChips.length ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Services</Text>
                <View style={styles.chips}>
                  {serviceChips.map((chip) => (
                    <View key={chip} style={styles.serviceChip}>
                      <Text style={styles.serviceText}>{chip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {routes.length ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Routes</Text>
                <View style={styles.routeList}>
                  {routes.map((route) => (
                    <View key={route} style={styles.routeRow}>
                      <Text style={styles.routeText}>{route}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : agency ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Routes</Text>
                <Text style={styles.sectionSub}>
                  This provider has no published routes right now.
                </Text>
              </View>
            ) : null}

            <View
              style={styles.section}
              onLayout={(event) => {
                tripsOffset.current = event.nativeEvent.layout.y;
              }}
              accessibilityLabel="Available trips"
            >
              <Text style={styles.sectionTitle}>Available trips</Text>
              {fromPrice != null ? (
                <Text style={styles.sectionSub}>
                  From {formatCurrency(fromPrice, trips[0]?.currency || 'PKR')}
                </Text>
              ) : null}
              {trips.length ? (
                <View style={styles.tripList}>
                  {trips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} onPress={() => openTrip(trip)} />
                  ))}
                </View>
              ) : (
                <EmptyState
                  title="No upcoming trips"
                  message="No upcoming trips are available right now."
                  icon="bus-outline"
                />
              )}
            </View>

            {galleryImages.length ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Gallery</Text>
                <ProviderGallery images={galleryImages} />
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              {reviewCount > 0 && agency && agency.rating > 0 ? (
                <View style={styles.reviewSummary}>
                  <Rating value={agency.rating} count={reviewCount} size={16} />
                </View>
              ) : reviews.length > 0 ? (
                <Text style={styles.sectionSub}>
                  {reviews.length} review{reviews.length === 1 ? '' : 's'}
                </Text>
              ) : null}

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
                            <Text style={styles.reviewName}>{displayName}</Text>
                            {review.date ? (
                              <Text style={styles.reviewDate}>{formatDate(review.date, false)}</Text>
                            ) : null}
                          </View>
                          {review.rating > 0 ? <Rating value={review.rating} /> : null}
                        </View>
                        {review.comment.trim() ? (
                          <Text style={styles.reviewComment}>{review.comment}</Text>
                        ) : null}
                        {review.providerReply ? (
                          <View style={styles.reply}>
                            <Text style={styles.replyLabel}>Provider reply</Text>
                            <Text style={styles.reviewComment}>{review.providerReply}</Text>
                          </View>
                        ) : null}
                      </Card>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.sectionSub}>
                  Travelers have not left reviews for this provider yet.
                </Text>
              )}
            </View>
            </View>
          </ScrollView>

          {showStickyCta ? (
            <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaLabel}>
                  {trips.length} trip{trips.length === 1 ? '' : 's'}
                </Text>
                {fromPrice != null ? (
                  <Text style={styles.ctaPrice}>
                    From {formatCurrency(fromPrice, trips[0]?.currency || 'PKR')}
                  </Text>
                ) : (
                  <Text style={styles.ctaPrice}>Select a departure</Text>
                )}
              </View>
              <Button
                title="View available trips"
                fullWidth={false}
                style={styles.ctaButton}
                onPress={scrollToTrips}
              />
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  coverWrap: {
    height: 180,
    backgroundColor: Colors.primary,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  identity: {
    paddingHorizontal: Spacing.screen,
    marginTop: -36,
    gap: Spacing.sm,
  },
  logoWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    ...Shadows.card,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Spacing.sm,
  },
  name: {
    ...Typography.h1,
    fontSize: 26,
    lineHeight: 32,
    color: Colors.primary,
    flexShrink: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  location: {
    ...Typography.caption,
    color: Colors.muted,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionBtn: {
    minWidth: 120,
    minHeight: 48,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.screen,
    marginTop: Spacing.xl,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  statValue: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    color: Colors.primary,
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: Spacing.screen,
    marginTop: Spacing['2xl'],
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.section,
    color: Colors.primary,
  },
  sectionSub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trustChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  trustText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.dark,
  },
  serviceChip: {
    backgroundColor: Colors.actionSoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  serviceText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.actionDark,
  },
  routeList: { gap: Spacing.sm },
  routeRow: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  routeText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Colors.dark,
  },
  tripList: { gap: Spacing.md, marginTop: Spacing.sm },
  reviewSummary: { marginBottom: Spacing.xs },
  reviewList: { gap: Spacing.md, marginTop: Spacing.sm },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  reviewName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.dark,
  },
  reviewDate: {
    ...Typography.small,
    color: Colors.muted,
    marginTop: 2,
  },
  reviewComment: {
    ...Typography.body,
    color: Colors.muted,
    lineHeight: 22,
  },
  reply: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 4,
  },
  replyLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.primary,
  },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.md,
    ...Shadows.float,
  },
  ctaLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
  },
  ctaPrice: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.primary,
  },
  ctaButton: {
    minWidth: 168,
    maxWidth: 200,
  },
});
