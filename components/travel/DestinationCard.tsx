import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { useTravelPresentation } from '@/components/ui/TravelDesignProvider';
import { useHomeDesign } from '@/constants/homeDesign';

type DestinationCardProps = {
  name: string;
  image: string;
  subtitle?: string;
  priceLabel?: string;
  tag?: string;
  onPress?: () => void;
  featured?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DestinationCard({
  name,
  image,
  subtitle,
  priceLabel,
  tag,
  onPress,
  featured,
}: DestinationCardProps) {
  const travel = useTravelPresentation();
  const theme = useHomeDesign();
  const { width } = useWindowDimensions();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 16, stiffness: 280 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 280 });
      }}
      accessibilityRole="button"
      accessibilityLabel={`${name}${subtitle ? `, ${subtitle}` : ''}`}
      style={[styles.wrap, travel && { marginRight: 12 }, animatedStyle]}
    >
      <View
        style={[
          styles.card,
          featured && styles.cardFeatured,
          travel && { width: Math.min(230, (width - 44) / 2), height: 224, borderRadius: 28 },
        ]}
      >
        <Image source={{ uri: image }} style={styles.image} contentFit="cover" transition={250} />
        <LinearGradient
          colors={['rgba(8,17,31,0.02)', 'rgba(8,17,31,0.32)', 'rgba(8,17,31,0.88)']}
          locations={[0, 0.44, 1]}
          style={styles.overlay}
        >
          {tag ? (
            <View style={[styles.tag, travel && { backgroundColor: theme.soft, borderWidth: 0 }]}>
              <Text style={[styles.tagText, travel && { color: theme.primary }]}>{tag}</Text>
            </View>
          ) : (
            <View />
          )}
          <View style={styles.contentWrap}>
            <Text
              style={[
                styles.name,
                featured && styles.nameFeatured,
                travel && { fontSize: 17, color: 'rgb(255, 255, 255)' },
              ]}
              numberOfLines={2}
            >
              {name}
            </Text>
            {subtitle ? (
              <Text
                style={[styles.subtitle, travel && { color: 'rgb(255, 255, 255)' }]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            ) : null}
            {priceLabel ? (
              <View style={styles.pricePill}>
                <Text style={styles.price}>{priceLabel}</Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginRight: Spacing.md,
  },
  card: {
    width: 172,
    height: 218,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.border,
    ...Shadows.card,
  },
  cardFeatured: {
    width: 230,
    height: 218,
    borderRadius: Radius.hero,
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(8,17,31,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    minHeight: 26,
    borderRadius: Radius.full,
    justifyContent: 'center',
  },
  tagText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  contentWrap: {
    gap: 3,
  },
  name: {
    fontFamily: Fonts.display,
    fontSize: 18,
    lineHeight: 22,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  nameFeatured: {
    fontSize: 21,
    lineHeight: 25,
  },
  subtitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  pricePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  price: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
});
