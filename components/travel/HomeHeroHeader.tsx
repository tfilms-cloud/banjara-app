import { Bell, ChevronRight, Search, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchModeTabs } from '@/components/travel/SearchCard';
import { BrandMark } from '@/components/brand/BrandMark';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { useThemeColors } from '@/constants/colors';
import { HERO_IMAGE, destinationImageFor } from '@/constants/destinations';
import type { HomeServiceCategory } from '@/constants/productModes';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Brand, Fonts } from '@/constants/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function greetingFor(name?: string) {
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const first = name?.trim().split(/\s+/)[0];
  return first ? `${hello}, ${first}` : hello;
}

type HomeHeroHeaderProps = {
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
  const insets = useSafeAreaInsets();
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
    <View style={[styles.wrap, { paddingTop: insets.top + Spacing.sm, backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <BrandMark size={30} />
          <Text style={[styles.brand, { color: colors.dark }]}>{Brand.name}</Text>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        </View>
        <View style={styles.topActions}>
          <IconButton onPress={onOpenSearch} accessibilityLabel="Search">
            <Search size={18} color={colors.dark} strokeWidth={2} />
          </IconButton>
          <IconButton
            onPress={onNotifications}
            accessibilityLabel="Notifications"
            badge={hasUnread}
          >
            <Bell size={18} color={colors.dark} strokeWidth={2} />
          </IconButton>
          <Pressable
            onPress={onProfile}
            style={styles.avatarHit}
            accessibilityRole="button"
            accessibilityLabel="Profile"
          >
            <View style={[styles.avatarRing, { borderColor: colors.primary, backgroundColor: colors.card }]}>
              <Avatar uri={userAvatar} name={userName ?? 'Traveler'} size={34} />
            </View>
          </Pressable>
        </View>
      </View>

      <SearchModeTabs mode={mode} onChange={onChangeMode} compact />

      <AnimatedPressable
        onPress={onOpenSearch}
        onPressIn={() => {
          heroScale.value = withSpring(0.985, { damping: 18, stiffness: 300 });
        }}
        onPressOut={() => {
          heroScale.value = withSpring(1, { damping: 18, stiffness: 300 });
        }}
        style={[styles.heroCard, heroAnim]}
        accessibilityRole="button"
        accessibilityLabel={`${greetingFor(userName)}, ${routeTitle}`}
      >
        <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        <LinearGradient
          colors={['rgba(8,17,31,0.08)', 'rgba(8,17,31,0.4)', 'rgba(8,17,31,0.88)']}
          locations={[0, 0.44, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.heroTopTag}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.livePillText}>{liveBadgeLabel}</Text>
          </View>
        </View>

        <View style={styles.heroCopy}>
          <View style={styles.eyebrowRow}>
            <Text style={styles.eyebrow}>{greetingFor(userName)}</Text>
          </View>
          <View style={styles.titleRow}>
            <Text
              style={styles.routeTitle}
              numberOfLines={mode === 'hotels' ? 2 : 1}
            >
              {routeTitle}
            </Text>
            <ChevronRight size={20} color="rgba(255,255,255,0.85)" strokeWidth={2.4} />
          </View>
          {mode === 'hotels' ? (
            <Text style={styles.heroSubtitle} numberOfLines={2}>
              {hotelsSubtitle}
            </Text>
          ) : durationLabel ? (
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metaText}>{durationLabel}</Text>
              </View>
              <View style={styles.metaChip}>
                <Sparkles size={11} color="rgba(255,255,255,0.9)" />
                <Text style={styles.metaText}>Direct corridor</Text>
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
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brand: {
    fontFamily: Fonts.display,
    fontSize: 19,
    letterSpacing: 1.2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarHit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Shadows.soft,
  },
  heroCard: {
    height: 195,
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
    gap: 6,
    backgroundColor: 'rgba(8,17,31,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#20C978',
  },
  livePillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  heroCopy: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: 4,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrow: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 0.1,
    color: 'rgba(255,255,255,0.85)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeTitle: {
    flex: 1,
    fontFamily: Fonts.display,
    fontSize: 24,
    lineHeight: 30,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginRight: Spacing.xs,
  },
  heroSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.84)',
    marginTop: 2,
    paddingRight: Spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 4,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  metaText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.92)',
  },
});
