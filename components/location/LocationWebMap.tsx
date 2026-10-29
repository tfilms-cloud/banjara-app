import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { isValidCoord } from '@/components/map/mapHelpers';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { createLocationMapHtml } from '@/utils/locationMapHtml';

interface LocationWebMapProps {
  latitude: number;
  longitude: number;
  interactive: boolean;
  pinMode: 'center' | 'tap';
  topInset?: number;
  bottomInset?: number;
  onMoving: () => void;
  onSettled: (coordinate: { latitude: number; longitude: number }) => void;
}

export function LocationWebMap({ latitude, longitude, interactive, pinMode, onMoving, onSettled, topInset = 0, bottomInset = 0 }: LocationWebMapProps) {
  const web = useRef<WebView>(null);
  const initial = useRef({ latitude, longitude });
  const reported = useRef(initial.current);
  const latest = useRef({ latitude, longitude });
  latest.current = { latitude, longitude };
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tileError, setTileError] = useState(false);
  // Address updates must not reload the map or reset its zoom.
  const source = useMemo(() => ({ html: createLocationMapHtml(initial.current.latitude, initial.current.longitude, interactive, pinMode, topInset, bottomInset) }), [interactive, pinMode, topInset, bottomInset]);

  const moveTo = (latitude: number, longitude: number) => {
    web.current?.injectJavaScript(`window.setPickerCoordinate && window.setPickerCoordinate(${latitude},${longitude}); true;`);
  };

  useEffect(() => {
    if (!ready || !isValidCoord({ latitude, longitude })) return;
    if (Math.abs(reported.current.latitude - latitude) < 0.000001 && Math.abs(reported.current.longitude - longitude) < 0.000001) return;
    reported.current = { latitude, longitude };
    moveTo(latitude, longitude);
  }, [latitude, longitude, ready]);

  useEffect(() => {
    if (ready || failed) return;
    const timer = setTimeout(() => setFailed(true), 15_000);
    return () => clearTimeout(timer);
  }, [ready, failed]);

  return (
    <View style={styles.fill}>
      <WebView
        ref={web}
        source={source}
        style={styles.fill}
        scrollEnabled={false}
        nestedScrollEnabled
        bounces={false}
        javaScriptEnabled
        originWhitelist={['*']}
        mixedContentMode="never"
        onShouldStartLoadWithRequest={(request) => request.url === 'about:blank' || Boolean(request.isTopFrame === false)}
        onError={() => setFailed(true)}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'ready') {
              setFailed(false);
              setReady(true);
              reported.current = latest.current;
              moveTo(latest.current.latitude, latest.current.longitude);
            } else if (data.type === 'error') setFailed(true);
            else if (data.type === 'tileError') setTileError(true);
            else if (data.type === 'moving') { setTileError(false); onMoving(); }
            else if (data.type === 'settled') {
              const coordinate = { latitude: data.latitude, longitude: data.longitude };
              if (typeof coordinate.latitude === 'number' && typeof coordinate.longitude === 'number' && isValidCoord(coordinate)) {
                reported.current = coordinate;
                if (interactive) onSettled(coordinate);
              }
            }
          } catch { /* Ignore malformed bridge messages. */ }
        }}
      />
      {!ready || failed ? (
        <View style={styles.status}>
          {failed ? <>
            <Text style={styles.message}>Map could not load. Check your internet connection.</Text>
            <Pressable accessibilityRole="button" onPress={() => { setFailed(false); setReady(false); setTileError(false); web.current?.reload(); }} style={styles.retry}>
              <Text style={styles.retryText}>Retry map</Text>
            </Pressable>
          </> : <ActivityIndicator color={Colors.action} />}
        </View>
      ) : null}
      {tileError && !failed ? <View pointerEvents="none" style={styles.tileHint}><Text style={styles.message}>Some map tiles could not load. Check your connection.</Text></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: Colors.primarySoft },
  status: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: Colors.primarySoft },
  message: { ...Typography.caption, color: Colors.muted, textAlign: 'center' },
  retry: { padding: 12, minHeight: 44 },
  retryText: { ...Typography.bodyBold, color: Colors.action },
  tileHint: { position: 'absolute', left: 12, right: 12, bottom: 26, backgroundColor: Colors.card, borderRadius: 10, padding: 8 },
});
