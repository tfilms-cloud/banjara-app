import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useThemeColors } from '@/constants/colors';
import { TRUST_POINTS } from '@/constants/destinations';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';

const ICON_TONES = ['#16B364', '#0F9B98', '#7C6CFF', '#F5B83D'] as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TrustCard({
  point,
  index,
}: {
  point: (typeof TRUST_POINTS)[number];
  index: number;
}) {
  const colors = useThemeColors();
  const tone = ICON_TONES[index % ICON_TONES.length];
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 16, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 300 });
      }}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        animStyle,
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`${point.label}. ${point.caption}`}
    >
      <View style={[styles.icon, { backgroundColor: `${tone}1A` }]}>
        <Ionicons name={point.icon} size={19} color={tone} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.label, { color: colors.dark }]}>{point.label}</Text>
        <Text style={[styles.caption, { color: colors.mutedLight }]}>{point.caption}</Text>
      </View>
    </AnimatedPressable>
  );
}

export function TrustGrid() {
  return (
    <View style={styles.grid}>
      {TRUST_POINTS.map((point, index) => (
        <TrustCard key={point.id} point={point} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    marginHorizontal: Spacing.screen,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    minHeight: 100,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
    justifyContent: 'center',
    ...Shadows.soft,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    minWidth: 0,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: Fonts.body,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
});
