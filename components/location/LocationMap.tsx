import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { isValidCoord } from '@/components/map/mapHelpers';
import { useNativeMaps } from '@/components/map/nativeMaps';
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
  /** `tap` = user drops a marker by tapping. `center` = drag the map under a fixed pin. */
  pinMode?: 'tap' | 'center';
}

export function LocationMap({
  latitude,
  longitude,
  onRegionSettled,
  height = 320,
  interactive = true,
  allowFullscreen = true,
  pinLabel = 'Location pin',
  pinMode = 'center',
}: LocationMapProps) {
  const { maps, ready } = useNativeMaps();
  const insets = useSafeAreaInsets();
  const [moving, setMoving] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef<{ animateToRegion?: (region: object, duration?: number) => void } | null>(
    null
  );
  const lastExternal = useRef({ latitude, longitude });
  const programmaticMove = useRef(false);

  useEffect(() => {
    const changed =
      Math.abs(lastExternal.current.latitude - latitude) > 0.00001 ||
      Math.abs(lastExternal.current.longitude - longitude) > 0.00001;
    if (!changed) return;
    lastExternal.current = { latitude, longitude };
    programmaticMove.current = true;
    mapRef.current?.animateToRegion?.(
      {
        latitude,
        longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      350
    );
  }, [latitude, longitude]);

  const dropPin = pinMode === 'tap';

  const handleTap = useCallback(
    (next: { latitude: number; longitude: number }) => {
      if (!interactive) return;
      lastExternal.current = next;
      onRegionSettled(next.latitude, next.longitude);
    },
    [interactive, onRegionSettled]
  );

  const handleRegionChangeComplete = useCallback(
    (next: { latitude: number; longitude: number }) => {
      setMoving(false);
      if (!interactive || dropPin) return;
      if (programmaticMove.current) {
        programmaticMove.current = false;
        return;
      }
      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(() => {
        onRegionSettled(next.latitude, next.longitude);
      }, 450);
    },
    [interactive, dropPin, onRegionSettled]
  );

  if (!ready) {
    return (
      <View style={[styles.wrap, styles.center, height ? { height } : styles.flexFill]}>
        <ActivityIndicator color={Colors.action} />
      </View>
    );
  }

  const renderMap = (full: boolean) => {
    if (!maps) {
      const coord = { latitude, longitude };
      if (!isValidCoord(coord)) {
        return (
          <MapFallback
            height={full ? undefined : height}
            title={pinLabel}
            subtitle="Set a location via search or current location first."
            latitude={latitude}
            longitude={longitude}
          />
        );
      }
      return (
        <InAppWebMap
          markers={[{ id: 'pin', title: pinLabel, coordinate: coord, selected: true }]}
          height={full ? undefined : height}
          fill={full || !height}
          onPressMap={interactive && dropPin ? handleTap : undefined}
        />
      );
    }

    const MapView = maps.default;
    const Marker = maps.Marker;
    return (
      <View style={[styles.wrap, full ? styles.fullWrap : height ? { height } : styles.flexFill]}>
        <MapView
          ref={mapRef as never}
          style={StyleSheet.absoluteFill}
          provider={Platform.OS === 'android' ? maps.PROVIDER_GOOGLE : undefined}
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
          }}
          onPress={(event: { nativeEvent?: { coordinate?: { latitude: number; longitude: number } } }) => {
            const coordinate = event.nativeEvent?.coordinate;
            if (coordinate && dropPin) handleTap(coordinate);
          }}
          onRegionChange={() => {
            if (interactive && !dropPin) setMoving(true);
          }}
          onRegionChangeComplete={handleRegionChangeComplete}
          scrollEnabled={interactive}
          zoomEnabled={interactive}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          {dropPin && isValidCoord({ latitude, longitude }) ? (
            <Marker
              coordinate={{ latitude, longitude }}
              title={pinLabel}
              draggable={interactive}
              onDragEnd={(event: {
                nativeEvent?: { coordinate?: { latitude: number; longitude: number } };
              }) => {
                const coordinate = event.nativeEvent?.coordinate;
                if (coordinate) handleTap(coordinate);
              }}
            />
          ) : null}
        </MapView>
        {!dropPin ? (
          <View pointerEvents="none" style={styles.pinWrap}>
            <View style={[styles.pin, moving && styles.pinLifted]} />
            <View style={styles.pinShadow} />
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <>
      <View style={height ? undefined : styles.flexFill}>
        {renderMap(false)}
        {allowFullscreen ? (
          <Pressable
            style={styles.openFull}
            onPress={() => setFullscreen(true)}
            accessibilityRole="button"
            accessibilityLabel="Open full map"
          >
            <Ionicons name="expand-outline" size={16} color={Colors.action} />
            <Text style={styles.openFullText}>Open full map</Text>
          </Pressable>
        ) : null}
      </View>

      <Modal
        visible={fullscreen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setFullscreen(false)}
      >
        <View style={[styles.fullRoot, { paddingTop: insets.top }]}>
          <View style={styles.topBar}>
            <Pressable
              onPress={() => setFullscreen(false)}
              style={styles.backBarBtn}
              accessibilityRole="button"
              accessibilityLabel="Back to form"
            >
              <Ionicons name="chevron-back" size={22} color={Colors.white} />
              <Text style={styles.backBarText}>Back to form</Text>
            </Pressable>
          </View>
          <View style={styles.fullBody}>{renderMap(true)}</View>
          <View style={[styles.hintBar, { paddingBottom: insets.bottom + Spacing.md }]}>
            <Text style={styles.hintText}>
              {dropPin
                ? 'Tap the map to drop your pin, then tap Back to form.'
                : 'Drag the map to drop your pin, then tap Back to form.'}
            </Text>
            <Pressable style={styles.hintBack} onPress={() => setFullscreen(false)}>
              <Text style={styles.hintBackText}>Back to form</Text>
            </Pressable>
          </View>
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
  pin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.accent,
    borderWidth: 3,
    borderColor: Colors.white,
    marginBottom: 18,
  },
  pinLifted: {
    transform: [{ translateY: -8 }],
    opacity: 0.9,
  },
  pinShadow: {
    width: 10,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(11,31,51,0.25)',
    marginTop: -14,
  },
  openFull: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  openFullText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.action,
  },
  fullRoot: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  topBar: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backBarBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.action,
    borderRadius: Radius.full,
    paddingLeft: 10,
    paddingRight: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  backBarText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.white,
  },
  fullBody: {
    flex: 1,
  },
  hintBar: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.float,
  },
  hintText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 18,
  },
  hintBack: {
    backgroundColor: Colors.action,
    borderRadius: Radius.lg,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintBackText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.white,
  },
});
