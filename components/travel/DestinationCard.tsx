import { useThemedStyles } from '@/hooks/useThemedStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useThemeColors, type ColorTokens } from '@/constants/colors';
import { Radius, Shadows, Spacing, Size } from '@/constants/spacing';
import { Fonts, TypeSize, Leading } from '@/constants/typography';

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
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
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
        <Image source={{ uri: image }} style={styles.image} contentFit="cover" transition={250} />
        <LinearGradient
          colors={[colors.mediaScrimSoft, colors.mediaScrim]}
          style={styles.overlay}
        >
          {tag ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ) : (
            <View />
          )}
          <View style={styles.contentWrap}>
            <Text style={[styles.name, featured && styles.nameFeatured]} numberOfLines={2}>
              {name}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
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

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  wrap: {
    marginRight: Spacing.md,
  },
  card: {
    width: Size.destination,
    height: Size.destinationHeight,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.border,
    ...Shadows.card,
  },
  cardFeatured: {
    width: Size.destinationFeatured,
    height: Size.destinationHeight,
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
    backgroundColor: colors.mediaScrim,
    borderWidth: Spacing.hairline,
    borderColor: colors.border,
    paddingHorizontal: Spacing.control,
    paddingVertical: Spacing.badge,
    minHeight: Size.badge,
    borderRadius: Radius.full,
    justifyContent: 'center',
  },
  tagText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: TypeSize.overline,
    color: colors.white,
    letterSpacing: 0.3,
  },
  contentWrap: {
    gap: Spacing.tight,
  },
  name: {
    fontFamily: Fonts.display,
    fontSize: TypeSize.subtitle,
    lineHeight: Leading.card,
    color: colors.white,
    letterSpacing: -0.2,
  },
  nameFeatured: {
    fontSize: TypeSize.heading,
    lineHeight: Leading.section,
  },
  subtitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: TypeSize.caption,
    color: colors.white,
  },
  pricePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.tight,
    borderRadius: Radius.full,
    marginTop: Spacing.xs,
  },
  price: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: TypeSize.micro,
    color: colors.white,
  },
});
