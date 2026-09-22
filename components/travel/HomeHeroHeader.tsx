import { Bell, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchModeTabs } from '@/components/travel/SearchCard';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { useThemeColors } from '@/constants/colors';
import { HERO_IMAGE, destinationImageFor } from '@/constants/destinations';
import type { CustomerProductMode } from '@/constants/productModes';
import { Radius, Spacing } from '@/constants/spacing';
import { Brand, Fonts } from '@/constants/typography';

function greetingFor(name?: string) {
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const first = name?.trim().split(/\s+/)[0];
  return first ? `${hello}, ${first}` : hello;
}

type HomeHeroHeaderProps = {
  mode: CustomerProductMode;
  onChangeMode: (mode: CustomerProductMode) => void;
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

  const cover =
    mode === 'hotels'
      ? destinationImageFor(hotelDestination || to)
      : destinationImageFor(to) || HERO_IMAGE;
  const routeTitle =
    mode === 'hotels'
      ? hotelDestination
        ? `Stay in ${hotelDestination}`
        : 'Find your next stay'
      : `${from || 'Islamabad'} to ${to || 'Hunza'}`;
  const metaBits = [
    durationLabel,
    liveCount && liveCount > 0
      ? mode === 'hotels'
        ? `${liveCount} ${liveCount === 1 ? 'stay' : 'stays'}`
        : `${liveCount} live ${liveCount === 1 ? 'trip' : 'trips'}`
      : null,
  ].filter(Boolean);

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + Spacing.sm, backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={[styles.mark, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.markLetter, { color: colors.primary }]}>B</Text>
          </View>
          <Text style={[styles.brand, { color: colors.dark }]}>{Brand.name}</Text>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        </View>
        <View style={styles.topActions}>
          <IconButton onPress={onOpenSearch} accessibilityLabel="Search">
            <Search size={17} color={colors.muted} strokeWidth={1.8} />
          </IconButton>
          <IconButton
            onPress={onNotifications}
            accessibilityLabel="Notifications"
            badge={hasUnread}
          >
            <Bell size={17} color={colors.muted} strokeWidth={1.8} />
          </IconButton>
          <Pressable
            onPress={onProfile}
            style={styles.avatarHit}
            accessibilityRole="button"
            accessibilityLabel="Profile"
          >
            <View style={[styles.avatarRing, { borderColor: colors.border }]}>
              <Avatar uri={userAvatar} name={userName ?? 'Traveler'} size={34} />
            </View>
          </Pressable>
        </View>
      </View>

      <SearchModeTabs mode={mode} onChange={onChangeMode} compact />

      <View style={styles.heroCard}>
        <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={['rgba(8,17,31,0.06)', 'rgba(8,17,31,0.38)', 'rgba(8,17,31,0.82)']}
          locations={[0, 0.48, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroCopy}>
          <View style={styles.eyebrowRow}>
            <Text style={styles.eyebrow}>{greetingFor(userName)}</Text>
          </View>
          <Text style={styles.routeTitle}>{routeTitle}</Text>
          {metaBits.length ? <Text style={styles.meta}>{metaBits.join('  ·  ')}</Text> : null}
        </View>
      </View>
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
    gap: 8,
  },
  mark: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLetter: {
    fontFamily: Fonts.display,
    fontSize: 12,
  },
  brand: {
    fontFamily: Fonts.display,
    fontSize: 18,
    letterSpacing: 1.1,
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroCard: {
    height: 188,
    borderRadius: Radius.hero,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroCopy: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.md,
    gap: 6,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#20C978',
  },
  eyebrow: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 0.1,
    color: 'rgba(255,255,255,0.86)',
  },
  routeTitle: {
    fontFamily: Fonts.display,
    fontSize: 24,
    lineHeight: 30,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.74)',
  },
  cta: {
    marginTop: 6,
    borderRadius: Radius.full,
    minHeight: 36,
    paddingHorizontal: 14,
  },
});
