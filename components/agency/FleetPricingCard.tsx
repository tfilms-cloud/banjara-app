import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import type { ProviderTransportSetup } from '@/types/provider';
import type { TripWithDetails } from '@/types/trip';
import { formatCurrency } from '@/utils/formatCurrency';
import { fleetDetails, tripFareGroups } from '@/utils/providerDetails';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

export function FleetPricingCard({
  transport,
  trips,
  onSeeTrips,
}: {
  transport?: ProviderTransportSetup;
  trips: TripWithDetails[];
  onSeeTrips: () => void;
}) {
  const colors = useThemeColors();
  const fleet = fleetDetails(transport, trips);
  const photo = normalizeMediaUrl(
    transport?.vehicleImageFront ||
      (!fleet.hasPrimary ? trips[0]?.vehicleImages?.[0] : undefined),
  );
  const [failedPhoto, setFailedPhoto] = useState<string>();
  const fares = tripFareGroups(trips);
  const method = transport?.pricingMethod;
  const amount = transport?.priceAmount;
  const hasRate =
    typeof amount === 'number' && Number.isFinite(amount) && amount > 0;
  const unit = method === 'per_vehicle' ? 'vehicle' : 'seat';
  const hasVehicle = Boolean(fleet.kind || fleet.facts.length);
  const hasPricing = Boolean(method || fares.length);
  const insurance = transport?.hasInsurance;
  if (
    !hasVehicle &&
    !fleet.fleetCount &&
    !fleet.types.length &&
    !hasPricing &&
    !insurance
  )
    return null;
  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: colors.dark }]}>
        Our fleet & pricing
      </Text>
      <Text style={[styles.description, { color: colors.muted }]}>
        Get to know the vehicles and how your fare is charged.
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.vehicleSection}>
          <View style={styles.hero}>
            {photo && failedPhoto !== photo ? (
              <Image
                source={{ uri: photo }}
                style={styles.vehiclePhoto}
                contentFit="cover"
                accessibilityLabel="Provider vehicle"
                onError={() => setFailedPhoto(photo)}
              />
            ) : (
              <View
                style={[
                  styles.heroIcon,
                  { backgroundColor: colors.primarySoft },
                ]}
              >
                <Ionicons
                  name="car-sport-outline"
                  size={28}
                  color={colors.primary}
                />
              </View>
            )}
            <View style={styles.flex}>
              <Text style={[styles.eyebrow, { color: colors.muted }]}>
                {fleet.hasPrimary
                  ? 'PRIMARY VEHICLE'
                  : hasVehicle
                    ? 'VEHICLE ON LISTED TRIP'
                    : 'PROVIDER FLEET'}
              </Text>
              <Text style={[styles.vehicleTitle, { color: colors.dark }]}>
                {fleet.kind || fleet.types.join(' · ') || 'Vehicle information'}
              </Text>
              {fleet.fleetCount ? (
                <Text style={[styles.caption, { color: colors.muted }]}>
                  {fleet.fleetCount}{' '}
                  {fleet.fleetCount === 1 ? 'vehicle' : 'vehicles'} reported by
                  the provider
                </Text>
              ) : null}
            </View>
          </View>
          {fleet.facts.length ? (
            <View style={styles.facts}>
              {fleet.facts.map((fact) => (
                <View
                  key={fact.label}
                  style={[
                    styles.fact,
                    { backgroundColor: colors.surfaceSecondary },
                  ]}
                >
                  <Text style={[styles.factLabel, { color: colors.muted }]}>
                    {fact.label}
                  </Text>
                  <Text
                    selectable
                    style={[styles.factValue, { color: colors.dark }]}
                  >
                    {fact.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          {fleet.types.length ? (
            <View style={styles.types}>
              <Text style={[styles.factLabel, { color: colors.muted }]}>
                Vehicle types offered
              </Text>
              <View style={styles.chips}>
                {fleet.types.map((type) => (
                  <View
                    key={type}
                    style={[styles.chip, { borderColor: colors.border }]}
                  >
                    <Text style={[styles.chipText, { color: colors.dark }]}>
                      {type}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
          {insurance ? (
            <View style={[styles.insurance, { borderColor: colors.border }]}>
              <Ionicons
                name="shield-outline"
                size={20}
                color={colors.primary}
              />
              <View style={styles.flex}>
                <Text style={[styles.insuranceTitle, { color: colors.dark }]}>
                  {insurance === 'yes'
                    ? 'Insurance reported'
                    : 'No insurance reported'}
                </Text>
                <Text style={[styles.caption, { color: colors.muted }]}>
                  {insurance === 'yes'
                    ? (transport?.insuranceCompany?.trim() ||
                        'Declared by the provider') +
                      '. Ask the provider about coverage.'
                    : 'Confirm coverage with the provider before travelling.'}
                </Text>
              </View>
            </View>
          ) : null}
          {hasVehicle ? (
            <Text style={[styles.caption, { color: colors.muted }]}>
              Check the vehicle shown on your selected trip. Seating and
              amenities can vary.
            </Text>
          ) : null}
        </View>
        {hasPricing ? (
          <View
            style={[
              styles.pricing,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.pricingHeading}>
              <Ionicons
                name="pricetag-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={[styles.pricingTitle, { color: colors.dark }]}>
                Understand your fare
              </Text>
            </View>
            {method ? (
              <View style={styles.rate}>
                <Text style={[styles.factLabel, { color: colors.muted }]}>
                  Provider’s listed pricing
                </Text>
                <View style={styles.priceLine}>
                  <Text style={[styles.price, { color: colors.action }]}>
                    {method === 'negotiable'
                      ? 'Price on request'
                      : hasRate
                        ? formatCurrency(amount!)
                        : 'Fare varies by trip'}
                  </Text>
                  {hasRate && method !== 'negotiable' ? (
                    <Text style={[styles.priceUnit, { color: colors.muted }]}>
                      / {unit}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.explanation, { color: colors.muted }]}>
                  {method === 'negotiable'
                    ? 'Discuss your route and requirements with the provider to agree on a fare.'
                    : method === 'per_vehicle'
                      ? 'The listed rate is for hiring the whole vehicle, rather than paying separately for each seat.'
                      : 'The listed rate is for one passenger seat. Your fare depends on the trip and the number of seats you book.'}
                </Text>
              </View>
            ) : null}
            {fares.length ? (
              <View style={[styles.tripFares, { borderColor: colors.border }]}>
                <Text style={[styles.factLabel, { color: colors.muted }]}>
                  Fares on listed trips
                </Text>
                {fares.map((fare) => (
                  <Text
                    key={fare.currency + fare.unit}
                    style={[styles.tripFare, { color: colors.action }]}
                  >
                    From {formatCurrency(fare.amount, fare.currency)}{' '}
                    <Text style={styles.fareUnit}>/ {fare.unit}</Text>
                  </Text>
                ))}
              </View>
            ) : null}
            <View style={styles.note}>
              <Ionicons
                name="information-circle-outline"
                size={17}
                color={colors.muted}
              />
              <Text style={[styles.noteText, { color: colors.muted }]}>
                Confirm the trip fare when choosing your journey. The payment
                screen shows fees and the total before you pay.
              </Text>
            </View>
            {trips.length ? (
              <TouchableOpacity
                onPress={onSeeTrips}
                accessibilityRole="button"
                activeOpacity={0.7}
                style={[
                  styles.cta,
                  {
                    backgroundColor: colors.primarySoft,
                  },
                ]}
              >
                <Text style={[styles.ctaText, { color: colors.primary }]}>
                  See trips & fares
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={17}
                  color={colors.primary}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: Spacing.xl, gap: Spacing.sm },
  title: {
    fontFamily: Fonts.display,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.xl,
    ...Shadows.premium,
  },
  vehicleSection: { padding: Spacing.xl, gap: Spacing.lg },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehiclePhoto: {
    width: 96,
    height: 88,
    borderRadius: Radius.lg,
    flexShrink: 0,
  },
  flex: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    letterSpacing: 0.7,
    lineHeight: 16,
  },
  vehicleTitle: { fontFamily: Fonts.display, fontSize: 22, lineHeight: 30 },
  caption: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 20 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  fact: {
    flexBasis: '45%',
    flexGrow: 1,
    minWidth: 110,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  factLabel: { fontFamily: Fonts.bodyMedium, fontSize: 11, lineHeight: 18 },
  factValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 23,
    writingDirection: 'auto',
  },
  types: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: {
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 9,
    maxWidth: '100%',
  },
  chipText: { fontFamily: Fonts.bodyMedium, fontSize: 11, flexShrink: 1 },
  insurance: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  insuranceTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 2,
  },
  pricing: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  pricingHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pricingTitle: { fontFamily: Fonts.bodyBold, fontSize: 14, lineHeight: 22 },
  rate: { gap: 5 },
  priceLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: 7,
  },
  price: {
    fontFamily: Fonts.displayBold,
    fontSize: 30,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  priceUnit: { fontFamily: Fonts.bodyMedium, fontSize: 13 },
  explanation: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 20 },
  tripFares: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    gap: 5,
  },
  tripFare: { fontFamily: Fonts.bodySemiBold, fontSize: 16, lineHeight: 26 },
  fareUnit: { fontFamily: Fonts.body, fontSize: 12 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  noteText: { flex: 1, fontFamily: Fonts.body, fontSize: 11, lineHeight: 18 },
  cta: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  ctaText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, flexShrink: 1 },
});
