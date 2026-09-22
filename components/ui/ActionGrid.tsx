import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { AuthFonts } from '@/constants/authFonts';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';

export type ActionTone = 'blue' | 'amber' | 'green' | 'navy';

export type ActionItem = {
  key: string;
  label: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  tone?: ActionTone;
};

const toneStyles: Record<ActionTone, { bg: string; icon: string }> = {
  blue: { bg: Colors.softBlue, icon: Colors.secondary },
  amber: { bg: Colors.softAmber, icon: Colors.accent },
  green: { bg: Colors.softGreen, icon: Colors.success },
  navy: { bg: Colors.primarySoft, icon: Colors.primary },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ActionTile({ item }: { item: ActionItem }) {
  const scale = useSharedValue(1);
  const tone = toneStyles[item.tone ?? 'blue'];
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={item.onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      style={animatedStyle}
    >
      <View style={styles.tile}>
        <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
          <Ionicons name={item.icon} size={22} color={tone.icon} />
        </View>
        <Text style={styles.label} numberOfLines={2}>
          {item.label}
        </Text>
        {item.subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

type ActionGridProps = {
  items: ActionItem[];
  columns?: 2 | 3;
  style?: ViewStyle;
};

export function ActionGrid({ items, columns = 2, style }: ActionGridProps) {
  return (
    <View style={[styles.grid, style]}>
      {items.map((item) => (
        <View
          key={item.key}
          style={[styles.cell, columns === 3 ? styles.cell3 : styles.cell2]}
        >
          <ActionTile item={item} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cell2: {
    width: '48%',
    marginBottom: Spacing.md,
  },
  cell3: {
    width: '31%',
    marginBottom: Spacing.md,
  },
  cell: {},
  tile: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 112,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontFamily: AuthFonts.bodySemiBold,
    fontSize: 15,
    color: Colors.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: AuthFonts.body,
    fontSize: 12,
    color: Colors.muted,
  },
});
