import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapFallback } from '@/components/map/MapFallback';
import { LocationWebMap } from '@/components/location/LocationWebMap';
import { isValidCoord } from '@/components/map/mapHelpers';
import { useNativeMaps } from '@/components/map/nativeMaps';
import { MapPinIcon } from '@/components/location/MapPinIcon';
import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';

interface LocationMapProps {
  latitude: number;
  longitude: number;
  onRegionSettled: (latitude: number, longitude: number) => void;
  height?: number;
  /** When false, map is preview-only (no reverse-geocode callbacks). */
  interactive?: boolean;
  allowFullscreen?: boolean;
  pinLabel?: string;
  /**
   * `center` (default) = drag the map under a fixed teardrop pin (smoothest).
   * `tap` = tap / drag a marker to drop the pin.
   */
  pinMode?: 'tap' | 'center';
  /** Remove rounded corners — use for full-screen map sheets. */
  edgeToEdge?: boolean;
  /** Move the map freely, and apply its coordinates only when Pin location is pressed. */
  requirePinConfirmation?: boolean;
  /** Keep the on-map status in sync when search or GPS invalidates a pin. */
  pinConfirmed?: boolean;
  onPinStatusChange?: (pinned: boolean) => void;
  pinning?: boolean;
}

const REGION_DELTA = 0.01;
/** Ignore tiny parent updates so reverse-geocode round-trips don't re-animate. */
const EXTERNAL_MOVE_EPS = 0.00008;

export function LocationMap({
  latitude,
  longitude,
  onRegionSettled,
  height = 320,
  interactive = true,
  allowFullscreen = true,
  pinLabel = 'Location pin',
  pinMode = 'center',
  edgeToEdge = false,
  requirePinConfirmation = true,
  pinConfirmed,
  onPinStatusChange,
  pinning = false,
}: LocationMapProps) {
  const { maps, ready } = useNativeMaps();
  const insets = useSafeAreaInsets();
  const [moving, setMoving] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const isPinned = pinConfirmed ?? pinned;
  const [candidate, setCandidate] = useState({ latitude, longitude });
  const candidateRef = useRef(candidate);
  const parentCoordinate = useRef({ latitude, longitude });
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef<{ animateToRegion?: (region: object, duration?: number) => void } | null>(
    null
  );
  const fullMapRef = useRef<typeof mapRef.current>(null);
  const inlineCoordinate = useRef({ latitude, longitude });
  /** Last coordinate we reported to the parent (or received from search/GPS). */
  const lastKnown = useRef({ latitude, longitude });
  /** Skip the next region-complete caused by our own animateToRegion. */
  const ignoreNextComplete = useRef(false);
  /** True while the user is actively panning — don't fight with animateToRegion. */
  const userDragging = useRef(false);

  const dropPin = pinMode === 'tap';

  // Only animate when parent changes coords from outside (search / GPS / tap),
  // not when we just reported the map center back up.
  useEffect(() => {
    const changed =
      Math.abs(parentCoordinate.current.latitude - latitude) > EXTERNAL_MOVE_EPS ||
      Math.abs(parentCoordinate.current.longitude - longitude) > EXTERNAL_MOVE_EPS;
    if (!changed) return;
    parentCoordinate.current = { latitude, longitude };
    if (Math.abs(candidateRef.current.latitude - latitude) < EXTERNAL_MOVE_EPS &&
        Math.abs(candidateRef.current.longitude - longitude) < EXTERNAL_MOVE_EPS) return;
    if (settleTimer.current) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
    lastKnown.current = { latitude, longitude };
    candidateRef.current = { latitude, longitude };
    setCandidate({ latitude, longitude });
    setPinned(false);
    onPinStatusChange?.(false);
    if (userDragging.current) return;

    const activeMap = fullscreen ? fullMapRef.current : mapRef.current;
    ignoreNextComplete.current = Boolean(activeMap);
    activeMap?.animateToRegion?.(
      {
        latitude,
        longitude,
        latitudeDelta: REGION_DELTA,
        longitudeDelta: REGION_DELTA,
      },
      280
    );
  }, [latitude, longitude, fullscreen]);

  useEffect(() => {
    if (fullscreen) return;
    const next = candidateRef.current;
    const needsMove = Math.abs(inlineCoordinate.current.latitude - next.latitude) > EXTERNAL_MOVE_EPS ||
      Math.abs(inlineCoordinate.current.longitude - next.longitude) > EXTERNAL_MOVE_EPS;
    if (mapRef.current && needsMove) {
      ignoreNextComplete.current = true;
      mapRef.current.animateToRegion?.({ ...next, latitudeDelta: REGION_DELTA, longitudeDelta: REGION_DELTA }, 0);
    }
    // Synchronize the inline map after moving the pin in the full map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen]);

  const reportSettled = useCallback(
    (next: { latitude: number; longitude: number }) => {
      lastKnown.current = next;
      candidateRef.current = next;
      setCandidate(next);
      if (!requirePinConfirmation) onRegionSettled(next.latitude, next.longitude);
    },
    [onRegionSettled, requirePinConfirmation]
  );

  const markUnpinned = useCallback(() => {
    setPinned(false);
    onPinStatusChange?.(false);
  }, [onPinStatusChange]);

  const pinLocation = () => {
    Keyboard.dismiss();
    if (settleTimer.current) clearTimeout(settleTimer.current);
    const coordinate = candidateRef.current;
    if (!isValidCoord(coordinate) || moving || pinning) return;
    setPinned(true);
    onPinStatusChange?.(true);
    onRegionSettled(coordinate.latitude, coordinate.longitude);
  };

  const handleTap = useCallback(
    (next: { latitude: number; longitude: number }) => {
      Keyboard.dismiss();
      if (!interactive) return;
      markUnpinned();
      reportSettled(next);
    },
    [interactive, reportSettled, markUnpinned]
  );

  const handleRegionChange = useCallback((next?: { latitude: number; longitude: number }) => {
    if (!interactive || dropPin) return;
    userDragging.current = true;
    setMoving(true);
    const changed = next && (
      Math.abs(candidateRef.current.latitude - next.latitude) > 0.000001 ||
      Math.abs(candidateRef.current.longitude - next.longitude) > 0.000001
    );
    // Native maps emit region events on mount and zoom. Only moving the actual
    // coordinate invalidates a pin; opening the full map must preserve it.
    if (!ignoreNextComplete.current && changed) markUnpinned();
    if (settleTimer.current) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
  }, [interactive, dropPin, markUnpinned]);

  const handleRegionChangeComplete = useCallback(
    (next: { latitude: number; longitude: number }) => {
      setMoving(false);
      userDragging.current = false;

      if (!interactive || dropPin) return;

      if (ignoreNextComplete.current) {
        ignoreNextComplete.current = false;
        return;
      }

      if (requirePinConfirmation) {
        if (Math.abs(candidateRef.current.latitude - next.latitude) > 0.000001 ||
            Math.abs(candidateRef.current.longitude - next.longitude) > 0.000001) markUnpinned();
        reportSettled(next);
        return;
      }

      // Same spot we already know — skip (avoids reverse-geocode spam)
      if (
        Math.abs(lastKnown.current.latitude - next.latitude) < EXTERNAL_MOVE_EPS &&
        Math.abs(lastKnown.current.longitude - next.longitude) < EXTERNAL_MOVE_EPS
      ) {
        return;
      }

      if (settleTimer.current) clearTimeout(settleTimer.current);
      // Short debounce so address updates after the finger lifts, without lag
      settleTimer.current = setTimeout(() => {
        reportSettled(next);
      }, 180);
    },
    [interactive, dropPin, reportSettled, requirePinConfirmation, markUnpinned]
  );

  useEffect(() => {
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, []);

  if (!ready) {
    return (
      <View style={[styles.wrap, styles.center, height ? { height } : styles.flexFill]}>
        <ActivityIndicator color={Colors.action} />
      </View>
    );
  }

  const renderMapControls = (full: boolean) => (
    <>
      {full || allowFullscreen ? (
        <Pressable
          style={[styles.mapTopButton, full && { top: insets.top + Spacing.sm }]}
          onPress={() => { Keyboard.dismiss(); setFullscreen(!full); }}
          accessibilityRole="button"
          accessibilityLabel={full ? 'Back to location form' : 'Open full screen map'}
        >
          <Ionicons name={full ? 'arrow-back' : 'expand-outline'} size={18} color={Colors.dark} />
          <Text style={styles.mapTopButtonText}>{full ? 'Back' : 'Full screen'}</Text>
        </Pressable>
      ) : null}
      {interactive && requirePinConfirmation ? (
        <View pointerEvents="box-none" style={[styles.pinActionWrap, { bottom: full ? insets.bottom + 32 : 30 }]}>
          <Pressable
            onPress={pinLocation}
            disabled={moving || pinning}
            accessibilityRole="button"
            accessibilityLabel={isPinned ? 'Location pinned' : 'Pin location'}
            accessibilityState={{ disabled: moving || pinning, busy: pinning }}
            style={[styles.pinAction, (moving || pinning) && styles.pinActionDisabled]}
          >
            {pinning ? <ActivityIndicator size="small" color={Colors.white} /> : <Ionicons name={isPinned ? 'checkmark-circle' : 'location'} size={19} color={Colors.white} />}
            <Text style={styles.pinActionText}>{pinning ? 'Pinning…' : isPinned ? 'Location pinned' : 'Pin location'}</Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );

  const renderMap = (full: boolean) => {
    const shellStyle = [
      styles.wrap,
      (full || edgeToEdge) && styles.fullWrap,
      !full && !edgeToEdge && height ? { height } : styles.flexFill,
    ];

    if (!maps) {
      const coord = candidate;
      if (!isValidCoord(coord)) {
        return (
          <MapFallback
            height={full || edgeToEdge ? undefined : height}
            title={pinLabel}
            subtitle="Set a location via search or current location first."
            latitude={candidate.latitude}
            longitude={candidate.longitude}
          />
        );
      }
      return (
        <View style={shellStyle}>
          <LocationWebMap
            latitude={candidate.latitude}
            longitude={candidate.longitude}
            topInset={full ? insets.top : 0}
            bottomInset={full ? insets.bottom : 0}
            interactive={interactive}
            pinMode={pinMode}
            onMoving={() => { Keyboard.dismiss(); setMoving(true); markUnpinned(); }}
            onSettled={(next) => {
              setMoving(false);
              if (dropPin) handleTap(next);
              else reportSettled(next);
            }}
          />
          {!dropPin ? (
            <View pointerEvents="none" style={styles.pinWrap}>
              <MapPinIcon lifted={moving} centered />
            </View>
          ) : null}
          {renderMapControls(full)}
        </View>
      );
    }

    const MapView = maps.default;
    const Marker = maps.Marker;
    return (
      <View style={shellStyle}>
        <MapView
          ref={(full ? fullMapRef : mapRef) as never}
          style={StyleSheet.absoluteFill}
          provider={Platform.OS === 'android' ? maps.PROVIDER_GOOGLE : undefined}
          initialRegion={{
            ...candidate,
            latitudeDelta: REGION_DELTA,
            longitudeDelta: REGION_DELTA,
          }}
          onPress={(event: { nativeEvent?: { coordinate?: { latitude: number; longitude: number } } }) => {
            const coordinate = event.nativeEvent?.coordinate;
            if (coordinate && dropPin) handleTap(coordinate);
          }}
          onRegionChange={handleRegionChange}
          onRegionChangeComplete={(region: { latitude: number; longitude: number }) => {
            if (!full) inlineCoordinate.current = { latitude: region.latitude, longitude: region.longitude };
            handleRegionChangeComplete({
              latitude: region.latitude,
              longitude: region.longitude,
            });
          }}
          scrollEnabled={interactive}
          zoomEnabled={interactive}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          moveOnMarkerPress={false}
        >
          {dropPin && isValidCoord({ latitude, longitude }) ? (
            <Marker
              coordinate={candidate}
              title={pinLabel}
              draggable={interactive}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 1 }}
              onDragStart={() => { setMoving(true); markUnpinned(); }}
              onDragEnd={(event: {
                nativeEvent?: { coordinate?: { latitude: number; longitude: number } };
              }) => {
                setMoving(false);
                const coordinate = event.nativeEvent?.coordinate;
                if (coordinate) handleTap(coordinate);
              }}
            >
              <MapPinIcon size="md" lifted={moving} />
            </Marker>
          ) : null}
        </MapView>
        {!dropPin ? (
          <View pointerEvents="none" style={styles.pinWrap}>
            <MapPinIcon lifted={moving} centered />
          </View>
        ) : null}
        {renderMapControls(full)}
      </View>
    );
  };

  return (
    <>
      <View style={height && !edgeToEdge ? undefined : styles.flexFill}>
        {renderMap(false)}
        {allowFullscreen && interactive ? <Text style={styles.mapHint}>{requirePinConfirmation ? 'Move the map, then tap Pin location.' : dropPin ? 'Tap to place your pin' : 'Drag map to adjust pin'}</Text> : null}
      </View>

      <Modal
        visible={fullscreen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setFullscreen(false)}
      >
        <View style={styles.fullRoot}>
          <View style={styles.fullBody}>{renderMap(true)}</View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    backgroundColor: Colors.primarySoft,
  },
  flexFill: {
    flex: 1,
  },
  fullWrap: {
    flex: 1,
    borderRadius: 0,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  pinWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapTopButton: {
    position: 'absolute', top: 12, left: 12, minHeight: 44,
    paddingHorizontal: 14, borderRadius: Radius.full,
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    ...Shadows.soft,
  },
  mapTopButtonText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.dark },
  pinActionWrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  pinAction: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    minHeight: 48, paddingHorizontal: 22, borderRadius: Radius.full,
    backgroundColor: Colors.action, borderWidth: 2, borderColor: Colors.white,
    ...Shadows.soft,
  },
  pinActionDisabled: { opacity: 0.65 },
  pinActionText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.white },
  mapHint: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted, paddingTop: 10 },
  fullRoot: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  fullBody: {
    flex: 1,
  },
});
