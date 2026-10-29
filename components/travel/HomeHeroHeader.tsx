import { ChevronRight, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { ReactNode } from 'react';
import { CustomerHeader } from '@/components/travel/CustomerHeader';
import { SearchModeTabs } from '@/components/travel/SearchCard';
import { useThemeColors } from '@/constants/colors';
import { HERO_IMAGE, destinationImageFor } from '@/constants/destinations';
import type { HomeServiceCategory } from '@/constants/productModes';
import { Radius, Shadows, Size, Spacing } from '@/constants/spacing';
import { CustomerType, Fonts, TypeSize, Leading } from '@/constants/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function greetingFor(name?: string) {
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const first = name?.trim().split(/\s+/)[0];
  return first ? `${hello}, ${first}` : hello;
}

type HomeHeroHeaderProps = {
  stories?: ReactNode;
  roadStatus?: ReactNode;
  mode: HomeServiceCategory;
  onChangeMode: (mode: HomeServiceCategory) => void;
  from: string;
  to: string;
  hotelDestination?: string;
  userName?: string;
  userAvatar?: string;
  durationLabel?: string;
  liveCount?: number;
  hasUnread?: boolean;
  onOpenSearch: () => void;
  onNotifications: () => void;
  onProfile: () => void;
};

export function HomeHeroHeader({
  stories,
  roadStatus,
  mode,
  onChangeMode,
  from,
  to,
  hotelDestination,
  userName,
  userAvatar,
  durationLabel,
  liveCount,
  hasUnread,
  onOpenSearch,
  onNotifications,
  onProfile,
}: HomeHeroHeaderProps) {
  const colors = useThemeColors();
  const heroScale = useSharedValue(1);

  const heroAnim = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
  }));

  const cover =
    mode === 'hotels'
      ? destinationImageFor(hotelDestination || to)
      : destinationImageFor(to) || HERO_IMAGE;
  const routeTitle =
    mode === 'hotels'
      ? 'Looking for a place to stay'
      : mode === 'tours'
        ? 'Discover tour packages'
        : mode === 'guides'
          ? 'Find a local guide'
          : mode === 'restaurants'
            ? 'Taste the north'
            : `${from || 'Islamabad'} to ${to || 'Hunza'}`;

  const hotelsSubtitle =
    'Choose among the best hotels, lodges and guest houses available at your destination.';

  const liveBadgeLabel =
    liveCount && liveCount > 0
      ? mode === 'hotels'
        ? `${liveCount} stay${liveCount === 1 ? '' : 's'} available`
        : mode === 'transport'
          ? `${liveCount} live trip${liveCount === 1 ? '' : 's'}`
          : 'Coming to BANJARA'
      : mode === 'transport' || mode === 'hotels'
        ? mode === 'hotels'
          ? 'Stays on BANJARA'
          : 'Popular route'
        : 'New on BANJARA';

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <CustomerHeader userName={userName} userAvatar={userAvatar} hasUnread={hasUnread} onOpenSearch={onOpenSearch} onNotifications={onNotifications} onProfile={onProfile} />
      {stories}
      <SearchModeTabs mode={mode} onChange={onChangeMode} compact />

      <AnimatedPressable
        onPress={onOpenSearch}
        onPressIn={() => {
          heroScale.value = withSpring(0.985, { damping: 18, stiffness: 300 });
        }}
        onPressOut={() => {
          heroScale.value = withSpring(1, { damping: 18, stiffness: 300 });
        }}
        style={[styles.heroCard, heroAnim, { marginHorizontal: Spacing.screen }]}
        accessibilityRole="button"
        accessibilityLabel={`${greetingFor(userName)}, ${routeTitle}`}
      >
        <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        <LinearGradient
          colors={[colors.mediaScrimSoft, colors.mediaScrim]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.heroTopTag}>
          <View style={[styles.livePill, { backgroundColor: colors.mediaScrim, borderColor: colors.border }]}>
            <View style={[styles.liveDot, { backgroundColor: colors.action }]} />
            <Text style={[styles.livePillText, { color: colors.white }]}>{liveBadgeLabel}</Text>
          </View>
        </View>

        <View style={styles.heroCopy}>
          {roadStatus}
          <View style={styles.eyebrowRow}>
            <Text style={[styles.eyebrow, { color: colors.white }]}>{greetingFor(userName)}</Text>
          </View>
          <View style={styles.titleRow}>
            <Text
              style={[styles.routeTitle, { color: colors.white }]}
              numberOfLines={mode === 'hotels' ? 2 : 1}
            >
              {routeTitle}
            </Text>
            <ChevronRight size={Size.icon} color={colors.white} strokeWidth={2.4} />
          </View>
          {mode === 'hotels' ? (
            <Text style={[styles.heroSubtitle, { color: colors.white }]} numberOfLines={2}>
              {hotelsSubtitle}
            </Text>
          ) : durationLabel ? (
            <View style={styles.metaRow}>
              <View style={[styles.metaChip, { backgroundColor: colors.mediaScrimSoft }]}>
                <Text style={[styles.metaText, { color: colors.white }]}>{durationLabel}</Text>
              </View>
              <View style={[styles.metaChip, { backgroundColor: colors.mediaScrimSoft }]}>
                <Sparkles size={Size.iconXs} color={colors.white} />
                <Text style={[styles.metaText, { color: colors.white }]}>Direct corridor</Text>
              </View>
            </View>
          ) : null}
        </View>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 0,
    gap: Spacing.md,
  },
  heroCard: {
    minHeight: Size.hero,
    borderRadius: Radius.hero,
    overflow: 'hidden',
    justifyContent: 'space-between',
    ...Shadows.card,
  },
  heroTopTag: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.micro,
    borderWidth: Size.border,
    paddingHorizontal: Spacing.control,
    paddingVertical: Spacing.badge,
    borderRadius: Radius.full,
  },
  liveDot: {
    width: Size.photoDot,
    height: Size.photoDot,
    borderRadius: Radius.full,
  },
  livePillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: TypeSize.micro,
    letterSpacing: 0.2,
  },
  heroCopy: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.overlap + Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.xs,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.micro,
  },
  eyebrow: {
    fontFamily: Fonts.bodyMedium,
    fontSize: TypeSize.label,
    letterSpacing: 0.1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeTitle: {
    flex: 1,
    ...CustomerType.hero,
    letterSpacing: -0.3,
    marginRight: Spacing.xs,
  },
  heroSubtitle: {
    fontFamily: Fonts.body,
    fontSize: TypeSize.label,
    lineHeight: Leading.caption,
    marginTop: Spacing.xxs,
    paddingRight: Spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.tight,
    borderRadius: Radius.full,
  },
  metaText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: TypeSize.micro,
  },
});
