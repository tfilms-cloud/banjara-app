import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapFallback } from '@/components/map/MapFallback';
import { InAppWebMap } from '@/components/map/InAppWebMap';
import { MapDetailPanel } from '@/components/map/MapDetailPanel';
import { MapPin } from '@/components/map/MapPin';
import {
  formatDistanceKm,
  distanceKmBetween,
  isValidCoord,
  regionForPoints,
  type MapLayer,
  type MapPerson,
  type MapVehicleInfo,
} from '@/components/map/mapHelpers';
import { fetchDrivingRoute } from '@/components/map/fetchDrivingRoute';
import { useNativeMaps } from '@/components/map/nativeMaps';
import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import type { Coordinates, PickupPoint } from '@/types/route';
import { formatTime } from '@/utils/formatTime';

type MapRef = {
  animateToRegion?: (region: object, duration?: number) => void;
  fitToCoordinates?: (
    coords: Coordinates[],
    options?: { edgePadding?: object; animated?: boolean }
  ) => void;
};

export type PickupMapProps = {
  pickups: PickupPoint[];
  selectedPickupId?: string;
  onSelectPickup?: (pickup: PickupPoint) => void;
  userLocation?: Coordinates | null;
  height?: number;
  /** Compact embed vs interactive experience */
  showControls?: boolean;
  showSelectedCard?: boolean;
  allowFullscreen?: boolean;
  /** Highlight mode for booked pickup only */
  focusPickupId?: string;
  title?: string;
  /** Logged-in traveler / passenger shown on map + detail card */
  traveler?: MapPerson | null;
  /** Agency + vehicle details for this trip */
  vehicle?: MapVehicleInfo | null;
  /** Legend noun — e.g. "pickup" (default) or "hotel" */
  pointNoun?: string;
};

export function PickupMap({
  pickups,
  selectedPickupId,
  onSelectPickup,
  userLocation,
  height = 300,
  showControls = true,
  showSelectedCard = true,
  allowFullscreen = true,
  focusPickupId,
  title = 'Pickup points',
  traveler,
  vehicle,
  pointNoun = 'pickup',
}: PickupMapProps) {
  const pointLabel = pointNoun === 'hotel' ? 'hotel' : 'pickup';
  const pointLabelPlural = pointNoun === 'hotel' ? 'hotels' : 'pickups';
  const { maps, ready } = useNativeMaps();
  const [layer, setLayer] = useState<MapLayer>('standard');
  const [fullscreen, setFullscreen] = useState(false);
  const [directionsMode, setDirectionsMode] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [showUser, setShowUser] = useState(Boolean(userLocation));
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const [roadRoute, setRoadRoute] = useState<Coordinates[] | null>(null);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const mapRef = useRef<MapRef | null>(null);
  const insets = useSafeAreaInsets();

  const openInAppMap = () => {
    setDirectionsMode(false);
    setDetailsOpen(false);
    setFullscreen(true);
  };

  const showInAppRoute = () => {
    setDirectionsMode(true);
    setShowUser(true);
    setDetailsOpen(false);
    setFullscreen(true);
  };

  const selected =
    pickups.find((p) => p.id === (selectedPickupId ?? focusPickupId)) ?? pickups[0];

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 600);
    return () => clearTimeout(timer);
  }, [selectedPickupId, focusPickupId, pickups.length]);

  useEffect(() => {
    if (!directionsMode || !isValidCoord(userLocation) || !selected || !isValidCoord(selected.coordinates)) {
      setRoadRoute(null);
      setRouteDistanceKm(null);
      setRouteLoading(false);
      return;
    }

    let alive = true;
    setRouteLoading(true);
    void fetchDrivingRoute(userLocation, selected.coordinates).then((result) => {
      if (!alive) return;
      if (result?.coordinates?.length) {
        setRoadRoute(result.coordinates);
        setRouteDistanceKm(result.distanceKm);
      } else {
        setRoadRoute([userLocation, selected.coordinates]);
        setRouteDistanceKm(
          distanceKmBetween(userLocation, selected.coordinates)
        );
      }
      setRouteLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [directionsMode, userLocation?.latitude, userLocation?.longitude, selected?.id, selected?.coordinates.latitude, selected?.coordinates.longitude]);

  const region = useMemo(() => {
    const coords = pickups.map((p) => p.coordinates);
    if (showUser && isValidCoord(userLocation)) coords.push(userLocation);
    if (roadRoute?.length) coords.push(...roadRoute);
    return regionForPoints(coords, selected?.coordinates);
  }, [pickups, selected?.coordinates, showUser, userLocation, roadRoute]);

  useEffect(() => {
    if (!fullscreen || !directionsMode) return;
    const coords =
      roadRoute && roadRoute.length > 1
        ? roadRoute
        : [
            ...(isValidCoord(userLocation) ? [userLocation] : []),
            ...(selected && isValidCoord(selected.coordinates) ? [selected.coordinates] : []),
          ];
    if (coords.length > 1) {
      mapRef.current?.fitToCoordinates?.(coords, {
        edgePadding: { top: 100, right: 50, bottom: 180, left: 50 },
        animated: true,
      });
      return;
    }
    if (selected && isValidCoord(selected.coordinates)) {
      mapRef.current?.animateToRegion?.(
        {
          ...selected.coordinates,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        },
        320
      );
    }
  }, [fullscreen, directionsMode, selected?.id, userLocation, roadRoute]);

  const fitAll = () => {
    const coords = pickups.map((p) => p.coordinates).filter(isValidCoord);
    if (showUser && isValidCoord(userLocation)) coords.push(userLocation);
    if (coords.length > 1) {
      mapRef.current?.fitToCoordinates?.(coords, {
        edgePadding: { top: 60, right: 40, bottom: 80, left: 40 },
        animated: true,
      });
      return;
    }
    mapRef.current?.animateToRegion?.(region, 320);
  };

  const cycleLayer = () => {
    setLayer((prev) =>
      prev === 'standard' ? 'satellite' : prev === 'satellite' ? 'hybrid' : 'standard'
    );
  };

  const webMarkers = useMemo(
    () =>
      pickups.filter((p) => isValidCoord(p.coordinates)).map((pickup, index) => ({
        id: pickup.id,
        title: pickup.name || `Pickup ${index + 1}`,
        subtitle: pickup.address || (pickup.time ? `Boards ${formatTime(pickup.time)}` : ''),
        coordinate: pickup.coordinates,
        selected: pickup.id === (selectedPickupId ?? focusPickupId ?? selected?.id),
      })),
    [pickups, selectedPickupId, focusPickupId, selected?.id]
  );

  const selectedIndex = Math.max(
    1,
    pickups.findIndex((p) => p.id === selected?.id) + 1
  );

  const selectedDistanceLabel = (() => {
    if (directionsMode && routeDistanceKm != null) {
      return formatDistanceKm(routeDistanceKm);
    }
    if (selected && isValidCoord(userLocation) && isValidCoord(selected.coordinates)) {
      return formatDistanceKm(
        selected.distanceKm > 0
          ? selected.distanceKm
          : distanceKmBetween(userLocation, selected.coordinates)
      );
    }
    if (selected && selected.distanceKm > 0) {
      return formatDistanceKm(selected.distanceKm);
    }
    return null;
  })();

  const renderDetail = (full: boolean, compact = false) => {
    if (!showSelectedCard || !selected) return null;

    // Fullscreen: keep map clear by default; slim peek bar when details hidden
    if (full && !detailsOpen) {
      return (
        <View style={[styles.peekBar, { bottom: insets.bottom + Spacing.md }]}>
          <Pressable
            style={styles.peekMain}
            onPress={() => setDetailsOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Show details"
          >
            <View style={styles.peekBadge}>
              <Text style={styles.peekBadgeText}>#{selectedIndex}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.peekTitle} numberOfLines={1}>
                {selected.name}
              </Text>
              <Text style={styles.peekSub} numberOfLines={1}>
                {[selectedDistanceLabel, traveler?.name, vehicle?.agencyName || vehicle?.name]
                  .filter(Boolean)
                  .join(' · ') || 'Tap for traveler & vehicle'}
              </Text>
            </View>
            <View style={styles.peekShow}>
              <Text style={styles.peekShowText}>Details</Text>
              <Ionicons name="chevron-up" size={16} color={Colors.action} />
            </View>
          </Pressable>
          <Pressable
            style={styles.peekRoute}
            onPress={showInAppRoute}
            accessibilityRole="button"
            accessibilityLabel="Show route"
          >
            <Ionicons name="navigate" size={18} color={Colors.white} />
          </Pressable>
        </View>
      );
    }

    // Compact embed under map: always show panel (does not cover map)
    if (!full && !detailsOpen) {
      return (
        <Pressable
          style={styles.embedPeek}
          onPress={() => setDetailsOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Show pickup details"
        >
          <Text style={styles.embedPeekText} numberOfLines={1}>
            #{selectedIndex} {selected.name}
            {selectedDistanceLabel ? ` · ${selectedDistanceLabel}` : ''}
          </Text>
          <Text style={styles.embedPeekAction}>Details</Text>
        </Pressable>
      );
    }

    return (
      <View
        style={[
          full && styles.detailCardAbs,
          full && { bottom: insets.bottom + Spacing.sm, maxHeight: '58%' },
          compact && { marginHorizontal: 0 },
        ]}
      >
        <MapDetailPanel
          pickup={selected}
          pickupIndex={selectedIndex}
          userLocation={userLocation}
          traveler={traveler}
          vehicle={vehicle}
          directionsMode={directionsMode && full}
          compact={compact || !full}
          distanceKmOverride={directionsMode ? routeDistanceKm : null}
          onHide={() => setDetailsOpen(false)}
          primaryActionLabel={
            directionsMode && full
              ? routeLoading
                ? 'Loading route…'
                : 'Route on'
              : 'Show route'
          }
          onPrimaryAction={showInAppRoute}
          secondaryActionLabel={full ? 'Back' : 'Open map'}
          onSecondaryAction={
            full
              ? () => {
                  setFullscreen(false);
                  setDirectionsMode(false);
                  setDetailsOpen(true);
                }
              : openInAppMap
          }
        />
      </View>
    );
  };

  if (!ready) {
    return (
      <View style={[styles.shell, styles.center, { height }]}>
        <ActivityIndicator color={Colors.action} />
      </View>
    );
  }

  if (!maps) {
    const webMap = (full: boolean) => (
      <View style={full ? styles.fullShell : undefined}>
        <InAppWebMap
          markers={webMarkers}
          userLocation={showUser || directionsMode ? userLocation : null}
          traveler={traveler}
          vehicle={vehicle}
          showRoute={directionsMode}
          roadRoute={directionsMode ? roadRoute : null}
          height={full ? undefined : height}
          fill={full}
          onSelectMarker={(id) => {
            const pickup = pickups.find((p) => p.id === id);
            if (pickup) onSelectPickup?.(pickup);
          }}
        />
        {renderDetail(full, !full)}
        {!full && allowFullscreen ? (
          <Pressable
            style={styles.fallbackFullBtn}
            onPress={openInAppMap}
            accessibilityRole="button"
            accessibilityLabel="Open full map in Banjara"
          >
            <Ionicons name="expand-outline" size={16} color={Colors.action} />
            <Text style={styles.fallbackFullText}>Open fullscreen</Text>
          </Pressable>
        ) : null}
      </View>
    );

    if (!webMarkers.length) {
      return (
        <>
          <MapFallback
            height={height}
            title={selected?.name ?? title}
            subtitle={`No map coordinates for these ${pointLabelPlural} yet`}
            latitude={selected?.coordinates.latitude}
            longitude={selected?.coordinates.longitude}
            pickups={pickups}
            selectedPickupId={selectedPickupId ?? focusPickupId ?? selected?.id}
            onSelectPickup={onSelectPickup}
            onOpenInAppMap={allowFullscreen ? openInAppMap : undefined}
            onShowInAppRoute={allowFullscreen ? showInAppRoute : undefined}
          />
        </>
      );
    }

    return (
      <>
        {webMap(false)}
        <Modal
          visible={fullscreen}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => {
            setFullscreen(false);
            setDirectionsMode(false);
          }}
        >
          <View style={[styles.fullRoot, { backgroundColor: Colors.primaryDark }]}>
            <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
              <View style={styles.topBarRow}>
                <Pressable
                  onPress={() => {
                    setFullscreen(false);
                    setDirectionsMode(false);
                    setDetailsOpen(true);
                  }}
                  style={styles.backBarBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Back to app"
                >
                  <Ionicons name="chevron-back" size={18} color={Colors.white} />
                  <Text style={styles.backBarText}>Back</Text>
                </Pressable>
                <Pressable
                  onPress={() => setDetailsOpen((v) => !v)}
                  style={styles.topToggle}
                  accessibilityRole="button"
                  accessibilityLabel={detailsOpen ? 'Hide details' : 'Show details'}
                >
                  <Ionicons
                    name={detailsOpen ? 'chevron-down' : 'chevron-up'}
                    size={16}
                    color={Colors.white}
                  />
                  <Text style={styles.topToggleText}>
                    {detailsOpen ? 'Hide' : 'Details'}
                  </Text>
                </Pressable>
              </View>
            </View>
            <View style={{ flex: 1, marginTop: insets.top + 44 }}>
              {webMap(true)}
            </View>
          </View>
        </Modal>
      </>
    );
  }

  const MapView = maps.default;
  const Marker = maps.Marker;
  const Callout = maps.Callout;
  const Circle = maps.Circle;
  const Polyline = maps.Polyline;

  const mapBody = (full: boolean) => (
    <View style={[styles.shell, full ? styles.fullShell : { height }]}>
      <MapView
        ref={mapRef as never}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? maps.PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        mapType={layer}
        showsUserLocation={(showUser || directionsMode) && Boolean(userLocation)}
        showsMyLocationButton={false}
        showsCompass
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        onMapReady={fitAll}
      >
        {(showUser || directionsMode) && isValidCoord(userLocation) && Circle ? (
          <Circle
            center={userLocation}
            radius={90}
            strokeColor="rgba(220,38,38,0.7)"
            fillColor="rgba(220,38,38,0.12)"
            strokeWidth={2}
          />
        ) : null}

        {directionsMode &&
        Polyline &&
        ((roadRoute && roadRoute.length > 1) ||
          (isValidCoord(userLocation) && selected && isValidCoord(selected.coordinates))) ? (
          <>
            <Polyline
              coordinates={
                roadRoute && roadRoute.length > 1
                  ? roadRoute
                  : [userLocation!, selected!.coordinates]
              }
              strokeColor="#0F9B98"
              strokeWidth={5}
            />
            {roadRoute && roadRoute.length > 2 ? (
              <Polyline
                coordinates={roadRoute.slice(
                  0,
                  Math.min(12, Math.max(2, Math.floor(roadRoute.length * 0.08)))
                )}
                strokeColor="#DC2626"
                strokeWidth={6}
              />
            ) : isValidCoord(userLocation) && selected && isValidCoord(selected.coordinates) ? (
              <Polyline
                coordinates={[userLocation, selected.coordinates]}
                strokeColor="#DC2626"
                strokeWidth={3}
                lineDashPattern={[8, 6]}
              />
            ) : null}
          </>
        ) : null}

        {pickups.map((pickup, index) => {
          if (!isValidCoord(pickup.coordinates)) return null;
          const active = pickup.id === (selectedPickupId ?? focusPickupId);
          return (
            <Marker
              key={pickup.id}
              coordinate={pickup.coordinates}
              onPress={() => onSelectPickup?.(pickup)}
              tracksViewChanges={tracksViewChanges}
              zIndex={active ? 20 : index + 1}
              anchor={{ x: 0.5, y: 1 }}
            >
              <MapPin
                label={index + 1}
                selected={active}
                tone={active ? 'copper' : 'pine'}
              />
              {Callout ? (
                <Callout tooltip={false}>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{pickup.name}</Text>
                    <Text style={styles.calloutMeta} numberOfLines={2}>
                      {pickup.address || 'Pickup point'}
                    </Text>
                    {pickup.time ? (
                      <Text style={styles.calloutTime}>Boards {formatTime(pickup.time)}</Text>
                    ) : null}
                  </View>
                </Callout>
              ) : null}
            </Marker>
          );
        })}
      </MapView>

      {full ? (
        <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
          <View style={styles.topBarRow}>
            <Pressable
              onPress={() => {
                setFullscreen(false);
                setDirectionsMode(false);
                setDetailsOpen(true);
              }}
              style={styles.backBarBtn}
              accessibilityRole="button"
              accessibilityLabel="Back to app"
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={18} color={Colors.white} />
              <Text style={styles.backBarText}>Back</Text>
            </Pressable>
            <Pressable
              onPress={() => setDetailsOpen((v) => !v)}
              style={styles.topToggle}
              accessibilityRole="button"
              accessibilityLabel={detailsOpen ? 'Hide details' : 'Show details'}
            >
              <Ionicons
                name={detailsOpen ? 'chevron-down' : 'chevron-up'}
                size={16}
                color={Colors.white}
              />
              <Text style={styles.topToggleText}>{detailsOpen ? 'Hide' : 'Details'}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {showControls ? (
        <View style={[styles.controls, full && { top: insets.top + 48 }]}>
          <ControlBtn
            icon="layers-outline"
            label={layer === 'standard' ? 'Map' : layer === 'satellite' ? 'Sat' : 'Hybrid'}
            onPress={cycleLayer}
          />
          <ControlBtn icon="scan-outline" label="Fit" onPress={fitAll} />
          {userLocation ? (
            <ControlBtn
              icon={showUser ? 'navigate' : 'navigate-outline'}
              label="Me"
              active={showUser}
              onPress={() => {
                setShowUser((v) => !v);
                if (!showUser && isValidCoord(userLocation)) {
                  mapRef.current?.animateToRegion?.(
                    {
                      ...userLocation,
                      latitudeDelta: 0.04,
                      longitudeDelta: 0.04,
                    },
                    320
                  );
                }
              }}
            />
          ) : null}
          {allowFullscreen && !full ? (
            <ControlBtn icon="expand-outline" label="Open map" onPress={openInAppMap} />
          ) : null}
        </View>
      ) : null}

      {!full ? (
        <View style={styles.legend}>
          <Text style={styles.legendText}>
            {pickups.length} {pickups.length === 1 ? pointLabel : pointLabelPlural}
            {selected ? ` · #${selectedIndex}` : ''}
            {selectedDistanceLabel ? ` · ${selectedDistanceLabel}` : ''}
          </Text>
        </View>
      ) : (
        <View style={[styles.legend, styles.legendFull, { top: insets.top + Spacing.md + 40 }]}>
          <Text style={styles.legendText}>
            {pickups.length} {pickups.length === 1 ? pointLabel : pointLabelPlural}
            {selected ? ` · #${selectedIndex}` : ''}
            {selectedDistanceLabel ? ` · ${selectedDistanceLabel}` : ''}
          </Text>
        </View>
      )}

      {renderDetail(full)}
    </View>
  );

  return (
    <>
      {mapBody(false)}
      <Modal
        visible={fullscreen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setFullscreen(false);
          setDirectionsMode(false);
        }}
      >
        <View style={styles.fullRoot}>{mapBody(true)}</View>
      </Modal>
    </>
  );
}

function ControlBtn({
  icon,
  label,
  onPress,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.controlBtn, active && styles.controlBtnActive]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={16} color={active ? Colors.white : Colors.dark} />
      <Text style={[styles.controlLabel, active && styles.controlLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    backgroundColor: Colors.primarySoft,
    ...Shadows.soft,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  fullRoot: { flex: 1, backgroundColor: Colors.dark },
  fullShell: { flex: 1, borderRadius: 0 },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: Spacing.md,
    paddingBottom: 6,
    backgroundColor: 'rgba(15,61,58,0.88)',
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  topToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  topToggleText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.white,
  },
  backBarBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.action,
    borderRadius: Radius.full,
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  backBarText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.white,
  },
  fallbackFullBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fallbackFullText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.action,
  },
  fallbackFullBody: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  detailCardAbs: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: Spacing.md,
    zIndex: 25,
  },
  peekBar: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  peekMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.float,
  },
  peekBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peekBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.white,
  },
  peekTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.dark,
  },
  peekSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    marginTop: 1,
  },
  peekShow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  peekShowText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.action,
  },
  peekRoute: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.action,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  embedPeek: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  embedPeekText: {
    flex: 1,
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.dark,
    marginRight: Spacing.sm,
  },
  embedPeekAction: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.action,
  },
  controls: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    gap: 8,
    zIndex: 20,
  },
  legendFull: {
    left: Spacing.md,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  controlBtnActive: {
    backgroundColor: Colors.action,
    borderColor: Colors.action,
  },
  controlLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.dark,
  },
  controlLabelActive: { color: Colors.white },
  legend: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  legendText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.primary,
  },
  callout: {
    minWidth: 160,
    maxWidth: 220,
    padding: 10,
  },
  calloutTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.dark,
  },
  calloutMeta: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  calloutTime: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.action,
    marginTop: 4,
  },
});
