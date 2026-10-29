import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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
import { normalizeMediaUrl } from '@/utils/mediaUrl';
import { pushEditor, pushPath } from '@/utils/navigation';

function statusTone(status?: string): 'green' | 'amber' | 'red' | 'gray' {
  if (status === 'approved') return 'green';
  if (status === 'rejected' || status === 'suspended') return 'red';
  if (status === 'pending') return 'amber';
  return 'gray';
}

function statusLabel(status?: string) {
  switch (status) {
    case 'approved':
      return '✓ Restaurant approved';
    case 'rejected':
      return 'Rejected — needs changes';
    case 'suspended':
      return 'Suspended';
    case 'pending':
    default:
      return 'Pending approval';
  }
}

function statusHint(status?: string) {
  switch (status) {
    case 'approved':
      return 'Your restaurant is live for travelers searching by destination.';
    case 'rejected':
      return 'Update your listing and resubmit for review.';
    case 'suspended':
      return 'Contact BANJARA support to restore your listing.';
    case 'pending':
    default:
      return 'BANJARA is reviewing your restaurant. Tap for details.';
  }
}

/** Restaurant partner dashboard with clear approval status. */
export function RestaurantDashboard({
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
  const earnings = useProviderStore((s) => s.earnings);
  const reviews = useProviderStore((s) => s.reviews);

  const restaurant = provider.restaurant;
  const status = provider.verificationStatus ?? 'pending';
  const displayName =
    restaurant?.restaurantName || provider.businessName || 'Restaurant';
  const cover = restaurant?.images?.[0] || provider.logo;
  const offers = (restaurant?.offers ?? []).filter((o) => o.active !== false);
  const recentReviews = useMemo(() => reviews.slice(0, 4), [reviews]);

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
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.greeting}>
            {greeting}, {provider.ownerName?.split(' ')[0] ?? userName?.split(' ')[0] ?? 'Partner'}
          </Text>
          <Text style={styles.business} numberOfLines={1}>
            {displayName}
          </Text>
        </View>
        <MessagesHeaderActions
          messagesHref="/(provider)/messages"
          notificationsHref="/(provider)/notifications"
        />
      </View>

      <Pressable
        onPress={() => router.push('/(provider)/status')}
        accessibilityRole="button"
        accessibilityLabel={`Restaurant status: ${status}`}
        style={[
          styles.statusCard,
          status === 'approved'
            ? styles.statusApproved
            : status === 'rejected' || status === 'suspended'
              ? styles.statusDanger
              : styles.statusPending,
        ]}
      >
        <View style={styles.statusTop}>
          <Badge label={statusLabel(status)} tone={statusTone(status)} />
          <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
        </View>
        <Text style={styles.statusHint}>{statusHint(status)}</Text>
        <Text style={styles.statusCta}>
          {status === 'approved' ? 'View verification details' : 'Check application status'}
        </Text>
      </Pressable>

      {cover ? (
        <Image
          source={{ uri: normalizeMediaUrl(cover) ?? cover }}
          style={styles.cover}
          contentFit="cover"
        />
      ) : null}

      <View style={styles.quickLinks}>
        <Button
          title="Edit restaurant"
          variant="outline"
          compact
          onPress={() => pushEditor('/(provider)/register/restaurant')}
        />
        <Button
          title="Update offers"
          variant="outline"
          compact
          onPress={() => pushEditor('/(provider)/register/restaurant')}
        />
        <Button
          title="Services"
          variant="outline"
          compact
          onPress={() => pushPath('/(provider)/(tabs)/services')}
        />
      </View>

      <View style={styles.stats}>
        <ProviderStatCard
          label="Active offers"
          value={String(offers.length)}
          tone="amber"
        />
        <ProviderStatCard
          label="Rating"
          value={(provider.rating || 0).toFixed(1)}
          tone="navy"
        />
        <ProviderStatCard
          label="Reviews"
          value={String(provider.reviewCount ?? reviews.length)}
          tone="blue"
        />
      </View>

      <ProviderEarningsFeeCard
        totalRevenue={earnings?.totalRevenue ?? 0}
        platformFees={earnings?.platformFees ?? 0}
        platformFeePercent={earnings?.platformFeePercent}
        netEarnings={earnings?.netEarnings}
      />

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Listing snapshot</Text>
        <Text style={styles.sectionSub}>
          Travelers find you by destination. Keep offers and photos fresh.
        </Text>
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>City</Text>
            <Text style={styles.metaValue}>{restaurant?.city || provider.city || '—'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Cuisine</Text>
            <Text style={styles.metaValue}>
              {(restaurant?.cuisineTypes ?? []).slice(0, 3).join(' · ') || '—'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Hours</Text>
            <Text style={styles.metaValue}>{restaurant?.hours || '—'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Menu variety</Text>
            <Text style={styles.metaValue}>
              {(restaurant?.menuVariety ?? []).length
                ? `${restaurant?.menuVariety?.length} types`
                : '—'}
            </Text>
          </View>
        </View>
      </View>

      {offers.length ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sales, offers & discounts</Text>
          {offers.slice(0, 4).map((offer) => (
            <View key={offer.id} style={styles.offerRow}>
              <Badge
                label={
                  offer.discountPercent != null
                    ? `${offer.discountPercent}% off`
                    : offer.type
                }
                tone="amber"
              />
              <Text style={styles.offerTitle} numberOfLines={2}>
                {offer.title}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sales, offers & discounts</Text>
          <Text style={styles.sectionSub}>
            No active deals yet. Add sales and discounts so you appear first in destination search.
          </Text>
          <Button
            title="Add offers"
            variant="outline"
            compact
            onPress={() => pushEditor('/(provider)/register/restaurant')}
          />
        </View>
      )}

      {recentReviews.length ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent reviews</Text>
          {recentReviews.map((review) => (
            <View key={review.id} style={styles.reviewRow}>
              <Text style={styles.reviewStars}>{'★'.repeat(Math.round(review.rating))}</Text>
              <Text style={styles.reviewText} numberOfLines={2}>
                {review.comment || 'No comment'}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {status !== 'approved' ? (
        <Button
          title={status === 'rejected' ? 'Edit & resubmit' : 'View application status'}
          onPress={() =>
            status === 'rejected'
              ? pushEditor('/(provider)/register/restaurant')
              : router.push('/(provider)/status')
          }
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  greeting: { ...Typography.caption, color: Colors.muted },
  business: { fontFamily: Fonts.display, fontSize: 22, color: Colors.dark, marginTop: 2 },
  statusCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 6,
  },
  statusApproved: {
    backgroundColor: Colors.actionSoft,
    borderColor: '#B7E4C7',
  },
  statusPending: {
    backgroundColor: Colors.softAmber,
    borderColor: '#F5D8A8',
  },
  statusDanger: {
    backgroundColor: Colors.softDanger,
    borderColor: '#F5C2C7',
  },
  statusTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusHint: { ...Typography.caption, color: Colors.dark, lineHeight: 18 },
  statusCta: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
  },
  cover: {
    width: '100%',
    height: 140,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceSecondary,
  },
  quickLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.dark },
  sectionSub: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginTop: 4 },
  metaItem: { width: '45%', gap: 2 },
  metaLabel: { fontFamily: Fonts.body, fontSize: 11, color: Colors.muted },
  metaValue: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.dark },
  offerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  offerTitle: { flex: 1, fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.dark },
  reviewRow: { gap: 2 },
  reviewStars: { color: '#F5B83D', fontSize: 12 },
  reviewText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.dark },
});
