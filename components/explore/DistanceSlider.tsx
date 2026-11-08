import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Fonts } from '@/constants/typography';

/**
 * A one-handle distance bar (km). Drag or tap the track; screen readers can swipe up/down
 * (accessibilityRole "adjustable") to change it 1 km at a time.
 */
export function DistanceSlider({
  value,
  min,
  max,
  onChange,
  color,
  track,
  mutedColor,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (km: number) => void;
  color: string;
  track: string;
  mutedColor: string;
}) {
  const [width, setWidth] = useState(0);
  const live = useRef({ width, onChange, min, max });
  useEffect(() => {
    live.current = { width, onChange, min, max };
  });

  const responder = useMemo(() => {
    const pick = (x: number) => {
      const { width: w, onChange: change, min: lo, max: hi } = live.current;
      if (!w) return;
      const ratio = Math.min(1, Math.max(0, x / w));
      change(Math.round(lo + ratio * (hi - lo)));
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => pick(event.nativeEvent.locationX),
      onPanResponderMove: (event) => pick(event.nativeEvent.locationX),
    });
  }, []);

  const ratio = (value - min) / (max - min);
  const step = (delta: number) => onChange(Math.min(max, Math.max(min, value + delta)));

  return (
    <View>
      <View style={s.row}>
        <Text style={[s.label, { color: mutedColor }]}>Search distance</Text>
        <Text style={[s.value, { color }]}>{value} km</Text>
      </View>
      <View
        style={s.touch}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Search distance"
        accessibilityValue={{ min, max, now: value, text: `${value} kilometres` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) =>
          step(event.nativeEvent.actionName === 'increment' ? 1 : -1)
        }
        {...responder.panHandlers}
      >
        <View style={[s.track, { backgroundColor: track }]} pointerEvents="none">
          <View style={[s.fill, { backgroundColor: color, width: `${ratio * 100}%` }]} />
        </View>
        <View
          pointerEvents="none"
          style={[
            s.thumb,
            { borderColor: color, left: Math.max(0, ratio * width - 14) },
          ]}
        />
      </View>
      <View style={s.row}>
        <Text style={[s.scale, { color: mutedColor }]}>{min} km</Text>
        <Text style={[s.scale, { color: mutedColor }]}>{Math.round((min + max) / 2)} km</Text>
        <Text style={[s.scale, { color: mutedColor }]}>{max} km</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  label: { fontFamily: Fonts.bodyMedium, fontSize: 13 },
  value: { fontFamily: Fonts.displayBold, fontSize: 22 },
  touch: { height: 44, justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6 },
  thumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  scale: { fontFamily: Fonts.body, fontSize: 12 },
});
