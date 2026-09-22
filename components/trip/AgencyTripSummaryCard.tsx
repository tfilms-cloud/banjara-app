import { Bus, CheckCircle2, ChevronRight, Star } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import type { AgencyTripGroup } from '@/utils/groupTripsByAgency';
import { formatCurrency } from '@/utils/formatCurrency';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

type AgencyTripSummaryCardProps = {
  group: AgencyTripGroup;
  onPress: () => void;
};

function agencyInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'A';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function AgencyTripSummaryCard({ group, onPress }: AgencyTripSummaryCardProps) {
  const { agency, tripCount, fromPrice, currency, routes, oneWayCount, roundTripCount } = group;
  const logoUri = useMemo(
    () => normalizeMediaUrl(agency.logo) ?? (agency.logo || undefined),
    [agency.logo]
  );
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUri]);

  const showLogo = Boolean(logoUri) && !logoFailed;
  const routePreview = routes.slice(0, 2).join(' · ');
  const moreRoutes = routes.length > 2 ? ` +${routes.length - 2}` : '';

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${agency.name} trips`}>
      <View style={styles.card}>
        <View style={styles.top}>
          {showLogo ? (
            <Image
              source={{ uri: logoUri }}
              style={styles.logo}
              contentFit="cover"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <View style={[styles.logo, styles.logoFallback]}>
              <Text style={styles.logoInitials}>{agencyInitials(agency.name)}</Text>
            </View>
          )}
          <View style={styles.copy}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {agency.name}
              </Text>
              {agency.verified ? (
                <CheckCircle2 size={14} color={Colors.success} strokeWidth={2} />
              ) : null}
            </View>
            <View style={styles.ratingRow}>
              <Star size={12} color={Colors.accent} fill={Colors.accent} strokeWidth={0} />
              <Text style={styles.rating}>{agency.rating?.toFixed?.(1) ?? '0.0'}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.tripCount}>
                {tripCount} trip{tripCount === 1 ? '' : 's'}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.muted} strokeWidth={2} />
        </View>

        <View style={styles.routeRow}>
          <Bus size={14} color={Colors.action} strokeWidth={2} />
          <Text style={styles.routes} numberOfLines={2}>
            {routePreview}
            {moreRoutes}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.badges}>
            {oneWayCount > 0 ? (
              <View style={[styles.badge, styles.badgeOne]}>
                <Text style={styles.badgeText}>{oneWayCount} one way</Text>
              </View>
            ) : null}
            {roundTripCount > 0 ? (
              <View style={[styles.badge, styles.badgeRound]}>
                <Text style={styles.badgeText}>{roundTripCount} round trip</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.priceCol}>
            <Text style={styles.fromLabel}>From</Text>
            <Text style={styles.price}>{formatCurrency(fromPrice, currency)}</Text>
          </View>
        </View>

        <Text style={styles.cta}>View all trips</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.border,
  },
  logoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySoft,
  },
  logoInitials: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.primary,
  },
  copy: { flex: 1, minWidth: 0 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.primary,
    flexShrink: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  rating: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.dark,
  },
  metaDot: { color: Colors.muted, fontSize: 12 },
  tripCount: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  routes: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.dark,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginTop: 2,
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeOne: { backgroundColor: Colors.primarySoft },
  badgeRound: { backgroundColor: Colors.actionSoft },
  badgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.dark,
  },
  priceCol: { alignItems: 'flex-end' },
  fromLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
  },
  price: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.dark,
  },
  cta: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.action,
    marginTop: 2,
  },
});
