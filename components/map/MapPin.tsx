import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/typography';

type MapPinProps = {
  label?: string | number;
  selected?: boolean;
  tone?: 'copper' | 'pine' | 'gold' | 'user';
  size?: 'sm' | 'md';
};

const tones = {
  copper: Colors.action,
  pine: Colors.primary,
  gold: Colors.accent,
  user: Colors.info,
};

export function MapPin({
  label,
  selected = false,
  tone = 'copper',
  size = 'md',
}: MapPinProps) {
  const dim = size === 'sm' ? 32 : 40;
  const color = tones[tone];

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.bubble,
          {
            width: dim,
            height: dim,
            borderRadius: dim / 2,
            backgroundColor: selected ? color : Colors.white,
            borderColor: color,
          },
          selected && styles.bubbleSelected,
        ]}
      >
        {label != null ? (
          <Text style={[styles.label, { color: selected ? Colors.white : color }]}>
            {label}
          </Text>
        ) : (
          <View
            style={[
              styles.dot,
              { backgroundColor: selected ? Colors.white : color },
            ]}
          />
        )}
      </View>
      <View style={[styles.stem, { backgroundColor: color }]} />
      <View style={[styles.shadow, selected && styles.shadowStrong]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  bubble: {
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#111827',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  bubbleSelected: {
    transform: [{ scale: 1.08 }],
  },
  label: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stem: {
    width: 3,
    height: 10,
    marginTop: -1,
    borderRadius: 2,
  },
  shadow: {
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(28,25,23,0.22)',
    marginTop: 1,
  },
  shadowStrong: {
    width: 16,
    backgroundColor: 'rgba(28,25,23,0.32)',
  },
});
