import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessagesHeaderActions } from '@/components/chat/MessagesHeaderActions';
import { ProviderEarningsFeeCard } from '@/components/provider/ProviderEarningsFeeCard';
import { ProviderStatCard } from '@/components/provider/ProviderStatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { useProviderStore } from '@/store/providerStore';
import type { Provider } from '@/types/provider';
import { formatCurrency } from '@/utils/formatCurrency';
import { pushEditor, pushPath } from '@/utils/navigation';

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

function isGuideBookingKind(kind: string) {
  return kind === 'guide' || kind === 'tour';
}

/** Hireable guide dashboard — no trips or tour packages. */
export function GuideDashboard({
  greeting,
  provider,
  userName,
}: {
  greeting: string;
  provider: Provider;
  userName?: string;
}) {
  const insets = useSafeAreaInsets();
  const stats = useProviderStore((s) => s.stats);
  const loading = useProviderStore((s) => s.loading);
  const bookings = useProviderStore((s) => s.bookings);
  const earnings = useProviderStore((s) => s.earnings);
  const reviews = useProviderStore((s) => s.reviews);
  // Parent dashboard tab already refreshes on focus — do not add another useFocusEffect here.

  const hireRequests = useMemo(
    () =>
      bookings
        .filter(
          (b) =>
            isGuideBookingKind(b.kind) &&
            (b.status === 'pending' ||
              b.status === 'upcoming' ||
              b.status === 'confirmed' ||
              b.paymentStatus === 'pending')
        )
        .slice(0, 6),
    [bookings]
  );

  const todayIso = new Date().toISOString().slice(0, 10);
  const todaysHires = useMemo(
    () =>
      bookings.filter(
        (b) => isGuideBookingKind(b.kind) && b.date.slice(0, 10) === todayIso && b.status !== 'cancelled'
      ).length,
    [bookings, todayIso]
  );

  const recentReviews = useMemo(() => reviews.slice(0, 5), [reviews]);
  const guide = provider.guideDetails;
  const displayName = guide?.fullName || provider.ownerName || provider.businessName || 'Guide';
  const years = guide?.yearsExperience ?? provider.yearsExperience ?? 0;
  const langCount = guide?.languages?.length ?? 0;
  const rate = guide?.dailyHireRate ?? guide?.services?.find((s) => s.active)?.price ?? 0;
  const areas = guide?.areasCovered?.length
    ? guide.areasCovered.join(' · ')
    : guide?.city || provider.city || '—';

  return (
    <ScrollView
      style={styles.container}
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
        />
      }
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>
            {greeting}, {provider.ownerName?.split(' ')[0] ?? userName?.split(' ')[0] ?? 'Guide'}
          </Text>
          <Text style={styles.business}>{displayName}</Text>
        </View>
        <MessagesHeaderActions
          messagesHref="/(provider)/messages"
          notificationsHref="/(provider)/notifications"
        />
      </View>

      {provider.verificationStatus === 'approved' && guide?.profileStatus === 'approved' ? (
        <Badge label="✓ Verified guide · hire only" tone="green" />
      ) : (
        <Badge
          label={`${guide?.profileStatus ?? provider.verificationStatus ?? 'pending'} verification`}
          tone="amber"
        />
      )}

      <View style={styles.quickLinks}>
        <Button title="Edit profile" variant="outline" compact onPress={() => pushEditor('/(provider)/register/guide')} />
        <Button title="My services" variant="outline" compact onPress={() => pushPath('/(provider)/(tabs)/services')} />
        <Button
          title="Availability"
          variant="outline"
          compact
          onPress={() =>
            router.push({
              pathname: '/(provider)/register/guide',
              params: { from: 'edit', step: '7' },
            } as never)
          }
        />
        <Button title="Bookings" variant="outline" compact onPress={() => pushPath('/(provider)/(tabs)/bookings')} />
      </View>

      <View style={styles.stats}>
        <ProviderStatCard label="Hire requests" value={String(stats?.pendingBookings ?? hireRequests.length)} tone="amber" />
        <ProviderStatCard label="Today" value={String(stats?.todaysBookings ?? todaysHires)} tone="blue" />
        <ProviderStatCard label="Rating" value={(provider.rating || 0).toFixed(1)} tone="navy" />
        <ProviderStatCard label="Experience" value={years ? `${years}y` : '—'} tone="green" />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Your guide profile</Text>
        <Text style={styles.sectionSub}>
          Travelers hire you as a tour guide. You cannot create trips or tour packages on BANJARA.
        </Text>
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Gender</Text>
            <Text style={styles.metaValue}>
              {guide?.gender === 'female' ? 'Female' : guide?.gender === 'male' ? 'Male' : guide?.gender === 'other' ? 'Other' : '—'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Languages</Text>
            <Text style={styles.metaValue}>{langCount || '—'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Daily rate</Text>
            <Text style={styles.metaValue}>{rate ? formatCurrency(rate) : '—'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Areas</Text>
            <Text style={styles.metaValue} numberOfLines={2}>
              {areas}
            </Text>
          </View>
        </View>
        {guide?.specialSkills?.length ? (
          <Text style={styles.sectionSub}>Skills: {guide.specialSkills.join(' · ')}</Text>
        ) : null}
        {guide?.shortBio || guide?.detailedDescription ? (
          <Text style={styles.history} numberOfLines={5}>
            {guide.shortBio || guide.detailedDescription}
          </Text>
        ) : (
          <Text style={styles.sectionSub}>Complete your multi-step guide profile so travelers can hire you.</Text>
        )}
        <Button
          title="Edit guide profile"
          variant="outline"
          onPress={() => pushEditor('/(provider)/register/guide')}
        />
      </View>

      <ProviderEarningsFeeCard
        totalRevenue={earnings?.totalRevenue ?? 0}
        platformFees={earnings?.platformFees ?? 0}
        platformFeePercent={earnings?.platformFeePercent}
        netEarnings={earnings?.netEarnings}
      />

      <View style={styles.sectionCard}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Hire requests</Text>
          <Pressable onPress={() => pushPath('/(provider)/(tabs)/bookings')}>
            <Text style={styles.link}>All</Text>
          </Pressable>
        </View>
        {hireRequests.length === 0 ? (
          <Text style={styles.sectionSub}>
            No pending hire requests. When travelers book you as a guide, requests appear here.
          </Text>
        ) : (
          hireRequests.map((item) => (
            <Pressable
              key={item.id}
              style={styles.requestRow}
              onPress={() => pushPath(`/(provider)/booking/${item.id}`)}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.requestTitle} numberOfLines={1}>
                  {item.customerName || 'Traveler'}
                </Text>
                <Text style={styles.requestMeta} numberOfLines={1}>
                  {item.detailLabel || item.serviceLabel} · {item.date}
                  {item.time ? ` · ${item.time}` : ''}
                </Text>
              </View>
              <Text style={styles.requestAmount}>{formatCurrency(item.amount)}</Text>
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Recent reviews</Text>
        {recentReviews.length === 0 ? (
          <Text style={styles.sectionSub}>No reviews yet.</Text>
        ) : (
          recentReviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHead}>
                <Text style={styles.requestTitle}>{review.customerName || 'Traveler'}</Text>
                <Stars rating={review.rating} />
              </View>
              {review.comment ? <Text style={styles.reviewBody}>{review.comment}</Text> : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  greeting: { ...Typography.h2, color: Colors.dark },
  business: { ...Typography.caption, color: Colors.muted },
  quickLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
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
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  metaItem: { flexGrow: 1, flexBasis: '40%', minWidth: 120, gap: 2 },
  metaLabel: { fontFamily: Fonts.body, fontSize: 11, color: Colors.muted },
  metaValue: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.dark },
  history: { fontFamily: Fonts.body, fontSize: 13, color: Colors.dark, lineHeight: 19 },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  requestTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.dark },
  requestMeta: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted, marginTop: 2 },
  requestAmount: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.primary },
  reviewCard: {
    padding: Spacing.md,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceSecondary,
    gap: 6,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  reviewBody: { fontFamily: Fonts.body, fontSize: 13, color: Colors.dark, lineHeight: 18 },
});
