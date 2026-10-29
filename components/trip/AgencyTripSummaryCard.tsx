import { ArrowRight, CheckCircle2, ChevronRight, Star } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors, useThemeColors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import type { AgencyTripGroup } from '@/utils/groupTripsByAgency';
import { formatCurrency } from '@/utils/formatCurrency';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  const colors = useThemeColors();
  const { agency, tripCount, fromPrice, currency, routes, oneWayCount, roundTripCount } = group;
  const logoUri = useMemo(
    () => normalizeMediaUrl(agency.logo) ?? (agency.logo || undefined),
    [agency.logo]
  );
  const [logoFailed, setLogoFailed] = useState(false);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUri]);

  const showLogo = Boolean(logoUri) && !logoFailed;
  const routePreview = routes.slice(0, 2).join(' · ');
  const moreRoutes = routes.length > 2 ? ` +${routes.length - 2}` : '';

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.985, { damping: 16, stiffness: 280 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 280 });
      }}
      accessibilityRole="button"
      accessibilityLabel={`${agency.name} trips`}
      style={animStyle}
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.top}>
          {showLogo ? (
            <Image
              source={{ uri: logoUri }}
              style={[styles.logo, { borderColor: colors.border }]}
              contentFit="cover"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <View
              style={[
                styles.logo,
                styles.logoFallback,
                { backgroundColor: colors.primarySoft, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.logoInitials, { color: colors.primary }]}>
                {agencyInitials(agency.name)}
              </Text>
            </View>
          )}
          <View style={styles.copy}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.dark }]} numberOfLines={1}>
                {agency.name}
              </Text>
              {agency.verified ? (
                <CheckCircle2 size={15} color={colors.action} strokeWidth={2.4} />
              ) : null}
            </View>
            <View style={styles.ratingRow}>
              <Star size={11} color={colors.warning} fill={colors.warning} strokeWidth={0} />
              <Text style={[styles.rating, { color: colors.dark }]}>
                {agency.rating?.toFixed?.(1) ?? '0.0'}
              </Text>
              <Text style={[styles.metaDot, { color: colors.mutedLight }]}>·</Text>
              <Text style={[styles.tripCount, { color: colors.muted }]}>
                {tripCount} trip{tripCount === 1 ? '' : 's'}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.mutedLight} strokeWidth={2} />
        </View>

        {routes.length > 0 ? (
          <View style={[styles.routeRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Ionicons name="bus" size={14} color={colors.primary} />
            <Text style={[styles.routes, { color: colors.muted }]} numberOfLines={2}>
              {routePreview}
              {moreRoutes}
            </Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.badges}>
            {oneWayCount > 0 ? (
              <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>{oneWayCount} one way</Text>
              </View>
            ) : null}
            {roundTripCount > 0 ? (
              <View style={[styles.badge, { backgroundColor: colors.softGreen }]}>
                <Text style={[styles.badgeText, { color: colors.action }]}>{roundTripCount} round trip</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.priceCol}>
            <Text style={[styles.fromLabel, { color: colors.mutedLight }]}>FROM</Text>
            <Text style={[styles.price, { color: colors.dark }]}>
              {formatCurrency(fromPrice, currency)}
            </Text>
          </View>
        </View>

        <View style={[styles.ctaRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.cta, { color: colors.primary }]}>View all trips</Text>
          <ArrowRight size={13} color={colors.primary} strokeWidth={2.2} />
        </View>
      </View>
    </AnimatedPressable>
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
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.border,
    borderWidth: 1,
  },
  logoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitials: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  copy: { flex: 1, minWidth: 0 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
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
  },
  metaDot: { fontSize: 12 },
  tripCount: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  routes: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginTop: 2,
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
  },
  priceCol: { alignItems: 'flex-end' },
  fromLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  price: {
    fontFamily: Fonts.display,
    fontSize: 17,
    letterSpacing: -0.2,
    marginTop: 1,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.xs,
    marginTop: 2,
  },
  cta: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
  },
});