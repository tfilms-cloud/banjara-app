import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { InAppWebMap } from '@/components/map/InAppWebMap';
import { isValidCoord } from '@/components/map/mapHelpers';
import type { TripWithDetails } from '@/types/trip';
import {
  groupServiceArea,
  uniqueAreaNames,
  type ServiceAreaRoute,
} from '@/utils/serviceArea';

function JourneyStop({
  city,
  places,
  dropoff = false,
  connected = false,
}: {
  city?: string;
  places: string[];
  dropoff?: boolean;
  connected?: boolean;
}) {
  const colors = useThemeColors();
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? places : places.slice(0, 3);
  const role = dropoff ? 'Drop-off' : 'Pickup';
  return (
    <View style={styles.journeyRow}>
      <View style={styles.rail}>
        <View
          style={[
            styles.marker,
            {
              backgroundColor: dropoff ? colors.softAmber : colors.primarySoft,
            },
          ]}
        >
          <Ionicons
            name={dropoff ? 'flag' : 'location'}
            size={17}
            color={dropoff ? colors.dark : colors.primary}
          />
        </View>
        {connected ? (
          <View style={[styles.connector, { borderColor: colors.border }]} />
        ) : null}
      </View>
      <View style={[styles.stopContent, connected && styles.connectedContent]}>
        <Text style={[styles.eyebrow, { color: colors.muted }]}>
          {role.toUpperCase()} · {dropoff ? 'GET OFF HERE' : 'BOARD HERE'}
        </Text>
        {city ? (
          <Text style={[styles.city, { color: colors.dark }]}>{city}</Text>
        ) : null}
        {places.length ? (
          <View
            style={[
              styles.places,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            {visible.map((place, index) => (
              <View
                key={place}
                style={[
                  styles.placeRow,
                  index > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderColor: colors.border,
                    paddingTop: 10,
                  },
                ]}
              >
                <Text style={[styles.stopNumber, { color: colors.muted }]}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
                <Text style={[styles.placeName, { color: colors.dark }]}>
                  {place}
                </Text>
              </View>
            ))}
            {places.length > 3 ? (
              <Pressable
                onPress={() => setShowAll(!showAll)}
                accessibilityRole="button"
                accessibilityState={{ expanded: showAll }}
                style={styles.moreButton}
              >
                <Text style={[styles.moreText, { color: colors.primary }]}>
                  {showAll
                    ? 'Show fewer points'
                    : 'Show ' +
                      (places.length - 3) +
                      ' more ' +
                      role.toLowerCase() +
                      (places.length - 3 === 1 ? ' point' : ' points')}
                </Text>
                <Ionicons
                  name={showAll ? 'chevron-up' : 'chevron-down'}
                  size={15}
                  color={colors.primary}
                />
              </Pressable>
            ) : null}
          </View>
        ) : (
          <Text style={[styles.missing, { color: colors.muted }]}>
            {role} location not provided. Confirm with the provider.
          </Text>
        )}
      </View>
    </View>
  );
}

function RouteCard({
  route,
  index,
}: {
  route: ServiceAreaRoute;
  index: number;
}) {
  const colors = useThemeColors();
  const hasStops = Boolean(route.pickups.length || route.dropoffs.length);
  const hasRoute = Boolean(route.from && route.to);
  const total = route.pickups.length + route.dropoffs.length;
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.cardHeading, { borderColor: colors.border }]}>
        <View style={styles.routeLabel}>
          <Ionicons
            name={hasRoute ? 'bus-outline' : 'location-outline'}
            size={18}
            color={colors.primary}
          />
          <Text style={[styles.routeNumber, { color: colors.muted }]}>
            {hasRoute
              ? 'ROUTE ' + String(index + 1).padStart(2, '0')
              : 'OTHER STOPS'}
          </Text>
        </View>
        {hasStops ? (
          <Text style={[styles.stopCount, { color: colors.primary }]}>
            {total} {total === 1 ? 'point' : 'points'} listed
          </Text>
        ) : null}
      </View>
      <View style={styles.cardBody}>
        {hasStops ? (
          <>
            {!hasRoute ? (
              <Text style={[styles.unassigned, { color: colors.muted }]}>
                The provider has not linked these points to a route.
              </Text>
            ) : null}
            {hasRoute || route.pickups.length ? (
              <JourneyStop
                city={route.from}
                places={route.pickups}
                connected={hasRoute || Boolean(route.dropoffs.length)}
              />
            ) : null}
            {hasRoute || route.dropoffs.length ? (
              <JourneyStop city={route.to} places={route.dropoffs} dropoff />
            ) : null}
          </>
        ) : (
          <>
            <View style={styles.compactRoute}>
              <View style={styles.flex}>
                <Text style={[styles.eyebrow, { color: colors.muted }]}>
                  FROM
                </Text>
                <Text style={[styles.city, { color: colors.dark }]}>
                  {route.from}
                </Text>
              </View>
              <View
                style={[styles.arrow, { backgroundColor: colors.primarySoft }]}
              >
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.eyebrow, { color: colors.muted }]}>
                  TO
                </Text>
                <Text style={[styles.city, { color: colors.dark }]}>
                  {route.to}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.pending,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={colors.muted}
              />
              <View style={styles.flex}>
                <Text style={[styles.pendingTitle, { color: colors.dark }]}>
                  Exact stops not listed yet
                </Text>
                <Text style={[styles.caption, { color: colors.muted }]}>
                  Confirm your boarding and drop-off locations with the provider
                  before booking.
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

export function ServiceArea({
  cities,
  routes,
  pickups,
  dropoffs,
  previewTrip,
}: {
  cities: string[];
  routes: string[];
  pickups: string[];
  dropoffs: string[];
  previewTrip?: TripWithDetails;
}) {
  const colors = useThemeColors();
  const groups = useMemo(
    () => groupServiceArea(routes, pickups, dropoffs),
    [routes, pickups, dropoffs],
  );
  const servedCities = useMemo(() => uniqueAreaNames(cities), [cities]);
  const markers = useMemo(() => {
    if (
      !isValidCoord(previewTrip?.originCoordinates) ||
      !isValidCoord(previewTrip?.destinationCoordinates)
    )
      return [];
    return [
      {
        id: 'origin',
        title: previewTrip.from,
        coordinate: previewTrip.originCoordinates,
      },
      {
        id: 'destination',
        title: previewTrip.to,
        coordinate: previewTrip.destinationCoordinates,
      },
    ];
  }, [previewTrip]);
  const routeCount = groups.filter((route) => route.from && route.to).length;
  if (!servedCities.length && !groups.length) return null;
  return (
    <View style={styles.section}>
      <View style={styles.intro}>
        <Text style={[styles.title, { color: colors.dark }]}>
          Service areas
        </Text>
        <Text style={[styles.description, { color: colors.muted }]}>
          Find your route and see where you can board and get off.
        </Text>
      </View>
      <View style={styles.coverageRow}>
        {servedCities.length ? (
          <View style={styles.coverage}>
            <Text style={[styles.coverageTitle, { color: colors.muted }]}>
            Operating in
          </Text>
            <View style={styles.chips}>
              {servedCities.map((city) => (
                <View
                  key={city}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons name="ellipse" size={6} color={colors.action} />
                  <Text style={[styles.chipLabel, { color: colors.dark }]}>
                  {city}
                </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        {markers.length === 2 ? (
          <View style={styles.mapPreview}>
            <View
              pointerEvents="none"
              accessible
              accessibilityLabel={`Trip endpoints: ${previewTrip?.from} to ${previewTrip?.to}`}
            >
              <InAppWebMap markers={markers} height={144} showRoute={false} />
            </View>
            <Text style={[styles.mapCaption, { color: colors.muted }]}>
              Trip endpoints
            </Text>
          </View>
        ) : null}
      </View>
      {routeCount ? (
        <Text style={[styles.listLabel, { color: colors.muted }]}>
          {routeCount} {routeCount === 1 ? 'route' : 'routes'} listed by this
          provider
        </Text>
      ) : null}
      {groups.map((route, index) => (
        <RouteCard key={route.key} route={route} index={index} />
      ))}
      {groups.length ? (
        <View style={[styles.note, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
          <View style={styles.flex}>
            <Text style={[styles.noteTitle, { color: colors.dark }]}>
              Before you travel
            </Text>
            <Text style={[styles.caption, { color: colors.muted }]}>
              Check your selected trip for the pickup time and confirm your
              exact meeting point with the provider.
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.md, marginTop: Spacing.xl },
  intro: { gap: 6 },
  title: {
    fontFamily: Fonts.display,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  description: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 22 },
  coverage: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  coverageRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  mapPreview: { flex: 1, minWidth: 0, gap: Spacing.xs },
  mapCaption: {
    fontFamily: Fonts.body,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
  },
  coverageTitle: { fontFamily: Fonts.bodyMedium, fontSize: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    maxWidth: '100%',
  },
  chipLabel: { fontFamily: Fonts.bodyMedium, fontSize: 12, flexShrink: 1 },
  listLabel: { fontFamily: Fonts.bodyMedium, fontSize: 12, marginTop: 4 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.xl,
    ...Shadows.premium,
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  routeLabel: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  routeNumber: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  stopCount: { fontFamily: Fonts.bodySemiBold, fontSize: 11 },
  cardBody: { padding: Spacing.xl },
  journeyRow: { flexDirection: 'row', gap: 12 },
  rail: { width: 32, alignItems: 'center' },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    flex: 1,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    minHeight: 20,
    marginVertical: 5,
  },
  stopContent: { flex: 1, minWidth: 0, paddingTop: 1 },
  connectedContent: { paddingBottom: 22 },
  eyebrow: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    letterSpacing: 0.6,
    lineHeight: 16,
  },
  city: {
    fontFamily: Fonts.display,
    fontSize: 21,
    lineHeight: 30,
    writingDirection: 'auto',
    marginTop: Spacing.xs,
  },
  places: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  placeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  stopNumber: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    lineHeight: 22,
    minWidth: 17,
  },
  placeName: {
    flex: 1,
    minWidth: 0,
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 24,
    writingDirection: 'auto',
  },
  missing: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 44,
  },
  moreText: { fontFamily: Fonts.bodySemiBold, fontSize: 12, flexShrink: 1 },
  unassigned: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 16,
  },
  compactRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, minWidth: 0 },
  pending: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  pendingTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 3,
  },
  caption: { fontFamily: Fonts.body, fontSize: 11, lineHeight: 18 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  noteTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 3,
  },
});
