import { StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/colors';

const PIN_COLOR = Colors.action;
const PIN_EDGE = Colors.white;

type MapPinIconProps = {
  /** Lift slightly while the map is being dragged */
  lifted?: boolean;
  size?: 'md' | 'lg';
  centered?: boolean;
};

/**
 * Teardrop map pin with a white center, used as the
 * fixed center marker while the user pans the map.
 */
export function MapPinIcon({ lifted = false, size = 'lg', centered = false }: MapPinIconProps) {
  const large = size === 'lg';
  const head = large ? 36 : 28;
  const tipH = large ? 14 : 10;
  const height = head + tipH - 2;

  return (
    <View style={[styles.wrap, { width: head, height, transform: [{ translateY: (centered ? -height / 2 : 0) - (lifted ? 8 : 0) }] }]} pointerEvents="none">
      <View
        style={[
          styles.head,
          {
            width: head,
            height: head,
            borderRadius: head / 2,
          },
        ]}
      >
        <View style={[styles.dot, large ? styles.dotLg : styles.dotMd]} />
      </View>
      <View
        style={[
          styles.tip,
          {
            borderLeftWidth: head / 2.4,
            borderRightWidth: head / 2.4,
            borderTopWidth: tipH,
          },
        ]}
      />
      <View style={[styles.shadow, lifted && styles.shadowLifted]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    // The pin body ends at height; the shadow does not affect its anchor.
  },
  head: {
    backgroundColor: PIN_COLOR,
    borderWidth: 2.5,
    borderColor: PIN_EDGE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#0B1F33',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  dot: {
    backgroundColor: Colors.white,
    borderRadius: 99,
  },
  dotLg: { width: 12, height: 12 },
  dotMd: { width: 9, height: 9 },
  tip: {
    marginTop: -2,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: PIN_COLOR,
    zIndex: 1,
  },
  shadow: {
    position: 'absolute',
    bottom: -4,
    width: 14,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(11,31,51,0.28)',
  },
  shadowLifted: {
    width: 18,
    height: 4,
    opacity: 0.45,
  },
});
