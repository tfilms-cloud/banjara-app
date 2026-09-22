import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';

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
      style={[styles.wrap, animatedStyle]}
    >
      <View style={[styles.card, featured && styles.cardFeatured]}>
        <Image source={{ uri: image }} style={styles.image} contentFit="cover" transition={200} />
        <LinearGradient
          colors={['rgba(8,17,31,0.04)', 'rgba(8,17,31,0.35)', 'rgba(8,17,31,0.9)']}
          locations={[0, 0.48, 1]}
          style={styles.overlay}
        >
          {tag ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ) : (
            <View />
          )}
          <View>
            <Text style={[styles.name, featured && styles.nameFeatured]} numberOfLines={2}>
              {name}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
            {priceLabel ? <Text style={styles.price}>{priceLabel}</Text> : null}
          </View>
        </LinearGradient>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginRight: Spacing.sm,
  },
  card: {
    width: 168,
    height: 210,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.border,
  },
  cardFeatured: {
    width: 220,
    height: 210,
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
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 28,
    borderRadius: Radius.full,
    justifyContent: 'center',
  },
  tagText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.white,
  },
  name: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.white,
    letterSpacing: -0.2,
  },
  nameFeatured: {
    fontSize: 20,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 4,
  },
  price: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.white,
    marginTop: 6,
  },
});
