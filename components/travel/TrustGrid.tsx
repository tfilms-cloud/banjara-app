import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useThemeColors } from '@/constants/colors';
import { TRUST_POINTS } from '@/constants/destinations';
import { Radius, Shadows, Spacing, Size } from '@/constants/spacing';
import { Fonts, TypeSize, Leading } from '@/constants/typography';

const ICON_TONES = ['action', 'primary', 'coral', 'warning'] as const;
const ICON_BACKGROUNDS = ['actionSoft', 'primarySoft', 'coralSoft', 'softAmber'] as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TrustCard({
  point,
  index,
}: {
  point: (typeof TRUST_POINTS)[number];
  index: number;
}) {
  const colors = useThemeColors();
  const tone = colors[ICON_TONES[index % ICON_TONES.length]];
  const softTone = colors[ICON_BACKGROUNDS[index % ICON_BACKGROUNDS.length]];
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
      <View style={[styles.icon, { backgroundColor: softTone }]}>
        <Ionicons name={point.icon} size={Size.icon} color={tone} />
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
    minHeight: Size.benefit,
    borderRadius: Radius.lg,
    borderWidth: Spacing.hairline,
    padding: Spacing.md,
    gap: Spacing.sm,
    justifyContent: 'center',
    ...Shadows.soft,
  },
  icon: {
    width: Size.compactControl,
    height: Size.compactControl,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    minWidth: 0,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: TypeSize.label,
    lineHeight: Leading.caption,
  },
  caption: {
    fontFamily: Fonts.body,
    fontSize: TypeSize.micro,
    lineHeight: Leading.compact,
    marginTop: Spacing.xxs,
  },
});
