import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExpandableText } from '@/components/agency/ExpandableText';
import { HotelImageGallery } from '@/components/hotels/HotelImageGallery';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Rating } from '@/components/ui/Rating';
import { AgencyProfileSkeleton } from '@/components/ui/Skeleton';
import { Colors, useThemeColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { isGuideService } from '@/constants/providerOptions';
import { getApiErrorMessage } from '@/services/apiError';
import * as guideBookingService from '@/services/guideBookingService';
import * as providerService from '@/services/providerService';
import { getProviderReviews } from '@/services/review.service';
import type { GuideAvailabilityPublic, GuideOfferedService } from '@/types/guide';
import type { Provider } from '@/types/provider';
import type { Review } from '@/types/trip';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { normalizeMediaUrl } from '@/utils/mediaUrl';
import { paramId, pushPath, safeBack } from '@/utils/navigation';

function guideName(provider: Provider | null) {
  if (!provider) return 'Guide';
  return (
    provider.guideDetails?.fullName ||
    provider.ownerName ||
    provider.businessName ||
    'Guide'
  );
}

function collectPhotos(provider: Provider | null): string[] {
  const urls: string[] = [];
  const push = (u?: string | null) => {
    const n = normalizeMediaUrl(String(u ?? '').trim()) ?? String(u ?? '').trim();
    if (n) urls.push(n);
  };
  push(provider?.guideDetails?.profilePhoto);
  push(provider?.logo);
  provider?.guideDetails?.photos?.forEach((p) => push(p.url));
  provider?.galleryImages?.forEach(push);
  provider?.tour?.images?.forEach(push);
  return [...new Set(urls)];
}

function availabilitySummary(av: GuideAvailabilityPublic | null) {
  if (!av) return 'Contact guide for availability';
  const days = av.weekly.filter((d) => d.enabled).map((d) => d.day.slice(0, 3));
  const blocked = av.blockedDates.length;
  const parts = [];
  if (days.length) parts.push(`Available ${days.join(', ')}`);
  if (av.availableFrom) parts.push(`From ${formatDate(av.availableFrom, false)}`);
  if (blocked) parts.push(`${blocked} blocked date${blocked === 1 ? '' : 's'}`);
  return parts.join(' · ') || 'Flexible schedule';
}

export default function GuideProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = paramId(params.id);

  const [provider, setProvider] = useState<Provider | null>(null);
  const [availability, setAvailability] = useState<GuideAvailabilityPublic | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) {
      setError('Guide not found');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [pub, av, reviewList] = await Promise.all([
        providerService.getPublicProviderById(id),
        guideBookingService.getGuideAvailability(id).catch(() => null),
        getProviderReviews(id).catch(() => [] as Review[]),
      ]);
      if (!pub || !(pub.services ?? []).some(isGuideService)) {
        setError('This provider is not listed as a guide');
      }
      setProvider(pub);
      setAvailability(av);
      setReviews(reviewList);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const guide = provider?.guideDetails;
  const legacy = provider?.tour;
  const services: GuideOfferedService[] = useMemo(() => {
    const fromGuide = (guide?.services ?? []).filter((s) => s.active !== false);
    if (fromGuide.length) return fromGuide;
    if (guide?.dailyHireRate || legacy?.dailyHireRate || legacy?.price) {
      const rate = guide?.dailyHireRate ?? legacy?.dailyHireRate ?? legacy?.price ?? 0;
      return [
        {
          id: '',
          name: 'Daily guide hire',
          category: 'local',
          description: legacy?.description ?? provider?.description ?? '',
          durationLabel: 'Full day',
          durationHours: 8,
          price: rate,
          pricingType: 'per_day',
          currency: 'PKR',
          minGuests: 1,
          maxGuests: 20,
          included: [],
          excluded: [],
          availableLocations: guide?.areasCovered ?? legacy?.operatingAreas ?? [],
          active: true,
        },
      ];
    }
    return [];
  }, [guide, legacy, provider?.description]);

  const photos = useMemo(() => collectPhotos(provider), [provider]);
  const about =
    guide?.detailedDescription ||
    guide?.shortBio ||
    legacy?.experienceHistory ||
    legacy?.description ||
    provider?.description ||
    '';

  const languages = guide?.languages?.length
    ? guide.languages.map((l) => `${l.language} (${l.proficiency})`)
    : [
        ...(legacy?.regionalLanguages ?? []).map((l) => `${l} (regional)`),
        ...(legacy?.internationalLanguages ?? []).map((l) => `${l} (intl)`),
      ];

  const areas = guide?.areasCovered?.length
    ? guide.areasCovered
    : legacy?.operatingAreas ?? [];
  const skills = guide?.specialSkills?.length ? guide.specialSkills : legacy?.specialties ?? [];
  const certs = guide?.certifications ?? legacy?.certifications ?? [];
  const types = guide?.guideTypes ?? [];
  const verified = provider?.verificationStatus === 'approved';

  const onBook = () => pushPath(`/(customer)/guides/book/${id}`);
  const onChat = () => {
    if (provider?.userId) {
      pushPath(`/(customer)/messages/${provider.userId}`);
    }
  };
  const onShare = async () => {
    try {
      await Share.share({
        message: `Hire ${guideName(provider)} on Banjara — local guide in ${provider?.city ?? 'Pakistan'}.`,
      });
    } catch {
      /* user dismissed */
    }
  };

  const bottomPad = insets.bottom + 108;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={guideName(provider)} showBack onBack={() => safeBack('/(customer)/(tabs)')} />

      {loading && !provider ? (
        <AgencyProfileSkeleton />
      ) : error && !provider ? (
        <ErrorState title="Couldn't load guide" message={error} onRetry={() => void refresh()} />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ paddingBottom: bottomPad }}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} />}
          >
            {photos.length ? (
              <HotelImageGallery images={photos} height={280} />
            ) : (
              <View style={[styles.bannerFallback, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="walk-outline" size={48} color={colors.primary} />
              </View>
            )}

            <View style={styles.content}>
              <View style={styles.topRow}>
                <Avatar uri={photos[0]} name={guideName(provider)} size={72} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.name, { color: colors.dark }]}>{guideName(provider)}</Text>
                  {provider && provider.rating > 0 ? (
                    <Rating value={provider.rating} count={provider.reviewCount || undefined} />
                  ) : (
                    <Text style={{ color: colors.muted, fontFamily: Fonts.body, fontSize: 13 }}>
                      New on Banjara
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.badgeRow}>
                {verified ? <Badge label="Verified" tone="green" /> : null}
                {guide?.gender || legacy?.gender ? (
                  <Badge
                    label={guide?.gender === 'female' || legacy?.gender === 'female' ? 'Female' : 'Male'}
                    tone="blue"
                  />
                ) : null}
                {(guide?.yearsExperience ?? legacy?.yearsExperience ?? provider?.yearsExperience) ? (
                  <Badge
                    label={`${guide?.yearsExperience ?? legacy?.yearsExperience ?? provider?.yearsExperience}y exp`}
                    tone="amber"
                  />
                ) : null}
              </View>

              <View style={[styles.stats, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Stat label="Experience" value={`${guide?.yearsExperience ?? legacy?.yearsExperience ?? '—'}y`} />
                <Stat label="Languages" value={String(languages.length || '—')} />
                <Stat
                  label="From"
                  value={
                    services[0]?.price
                      ? formatCurrency(services[0].price)
                      : guide?.dailyHireRate
                        ? formatCurrency(guide.dailyHireRate)
                        : '—'
                  }
                />
              </View>

              <Text style={[styles.section, { color: colors.dark }]}>Availability</Text>
              <Text style={[styles.body, { color: colors.muted }]}>
                {availabilitySummary(availability)}
              </Text>

              {types.length ? (
                <>
                  <Text style={[styles.section, { color: colors.dark }]}>Guide types</Text>
                  <View style={styles.chips}>
                    {types.map((t) => (
                      <View key={t} style={[styles.chip, { backgroundColor: colors.primarySoft }]}>
                        <Text style={[styles.chipText, { color: colors.primary }]}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}

              {languages.length ? (
                <>
                  <Text style={[styles.section, { color: colors.dark }]}>Languages</Text>
                  <Text style={[styles.body, { color: colors.muted }]}>{languages.join(' · ')}</Text>
                </>
              ) : null}

              {areas.length ? (
                <>
                  <Text style={[styles.section, { color: colors.dark }]}>Areas covered</Text>
                  <Text style={[styles.body, { color: colors.muted }]}>{areas.join(' · ')}</Text>
                </>
              ) : null}

              {skills.length ? (
                <>
                  <Text style={[styles.section, { color: colors.dark }]}>Skills</Text>
                  {skills.map((s) => (
                    <Text key={s} style={[styles.body, { color: colors.muted }]}>
                      · {s}
                    </Text>
                  ))}
                </>
              ) : null}

              {certs.length ? (
                <>
                  <Text style={[styles.section, { color: colors.dark }]}>Certifications</Text>
                  {certs.map((c) => (
                    <Text key={c} style={[styles.body, { color: colors.muted }]}>
                      · {c}
                    </Text>
                  ))}
                </>
              ) : null}

              {about ? (
                <>
                  <Text style={[styles.section, { color: colors.dark }]}>About</Text>
                  <Card elevated={false}>
                    <ExpandableText text={about} />
                  </Card>
                </>
              ) : null}

              <Text style={[styles.section, { color: colors.dark }]}>Services & pricing</Text>
              {services.length ? (
                services.map((svc) => (
                  <View
                    key={svc.id || svc.name}
                    style={[styles.serviceCard, { borderColor: colors.border, backgroundColor: colors.card }]}
                  >
                    <Text style={[styles.serviceTitle, { color: colors.dark }]}>{svc.name}</Text>
                    <Text style={[styles.body, { color: colors.muted }]}>
                      {svc.durationLabel || `${svc.durationHours ?? 8}h`} · {svc.category}
                    </Text>
                    {svc.description ? (
                      <Text style={[styles.body, { color: colors.muted }]} numberOfLines={3}>
                        {svc.description}
                      </Text>
                    ) : null}
                    <Text style={[styles.price, { color: colors.primary }]}>
                      {formatCurrency(svc.price, svc.currency)} · {svc.pricingType.replace(/_/g, ' ')}
                    </Text>
                  </View>
                ))
              ) : (
                <EmptyState title="No services listed" message="Daily hire may still be available." icon="pricetag-outline" />
              )}

              {guide?.photos?.length ? (
                <>
                  <Text style={[styles.section, { color: colors.dark }]}>Photos</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {guide.photos.map((p) => (
                      <Image
                        key={p.id || p.url}
                        source={{ uri: normalizeMediaUrl(p.url) ?? p.url }}
                        style={styles.photoTile}
                        contentFit="cover"
                      />
                    ))}
                  </ScrollView>
                </>
              ) : null}

              <Text style={[styles.section, { color: colors.dark }]}>Reviews</Text>
              {reviews.length ? (
                reviews.slice(0, 5).map((review) => (
                  <Card key={review.id} elevated={false}>
                    <Rating value={review.rating} />
                    {review.comment.trim() ? (
                      <Text style={[styles.body, { color: colors.muted }]}>{review.comment}</Text>
                    ) : null}
                  </Card>
                ))
              ) : (
                <Text style={[styles.body, { color: colors.muted }]}>No reviews yet.</Text>
              )}
            </View>
          </ScrollView>

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
            <Button title="Book guide" onPress={onBook} style={{ flex: 1 }} />
            <Button title="Chat" variant="outline" onPress={onChat} style={{ flex: 1 }} disabled={!provider?.userId} />
            <Button title="Share" variant="ghost" onPress={() => void onShare()} />
          </View>
        </>
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bannerFallback: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: Spacing.screen, gap: Spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  name: { fontFamily: Fonts.displayBold, fontSize: 24 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stats: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: Spacing.lg },
  statValue: { fontFamily: Fonts.displayBold, fontSize: 18 },
  statLabel: { fontFamily: Fonts.body, fontSize: 11, marginTop: 2 },
  section: { fontFamily: Fonts.display, fontSize: 18, marginTop: Spacing.sm },
  body: { fontFamily: Fonts.body, fontSize: 14, lineHeight: 21 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontFamily: Fonts.bodySemiBold, fontSize: 12, textTransform: 'capitalize' },
  serviceCard: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: 4,
  },
  serviceTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 16 },
  price: { fontFamily: Fonts.bodySemiBold, fontSize: 15, marginTop: 4 },
  photoTile: { width: 120, height: 90, borderRadius: Radius.lg },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.md,
  },
});
