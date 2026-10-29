import { ArrowLeft, Bell, Menu, Search } from 'lucide-react-native';
import type { Href } from 'expo-router';
import { router, useNavigation } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from '@/components/brand/BrandMark';
import { useThemeColors } from '@/constants/colors';
import { Radius, Size, Spacing } from '@/constants/spacing';
import { Brand, Fonts, TypeSize, Leading } from '@/constants/typography';
import { shouldSkipHistoryBack } from '@/utils/navigation';

type ScreenHeaderProps = {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  fallbackHref?: Href;
  onBack?: () => void;
  showBrand?: boolean;
  showMenu?: boolean;
  onMenuPress?: () => void;
  showSearch?: boolean;
  onSearchPress?: () => void;
  showNotifications?: boolean;
  onNotificationsPress?: () => void;
  right?: ReactNode;
  transparent?: boolean;
  light?: boolean;
};

export function ScreenHeader({
  title,
  subtitle,
  showBack,
  fallbackHref = '/(customer)/(tabs)',
  onBack,
  showBrand,
  showMenu,
  onMenuPress,
  showSearch,
  onSearchPress,
  showNotifications,
  onNotificationsPress,
  right,
  transparent,
  light,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const iconColor = light ? colors.white : colors.dark;
  const titleColor = light ? colors.white : colors.dark;

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (shouldSkipHistoryBack(navigation)) {
      router.replace(fallbackHref);
      return;
    }
    router.back();
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.sm,
          backgroundColor: transparent ? colors.transparent : colors.background,
        },
      ]}
    >
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={handleBack}
            style={[styles.iconBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={Size.iconLg} color={iconColor} strokeWidth={2} />
          </Pressable>
        ) : showMenu ? (
          <Pressable
            onPress={onMenuPress}
            style={[styles.iconBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            accessibilityLabel="Menu"
          >
            <Menu size={Size.iconLg} color={iconColor} strokeWidth={2} />
          </Pressable>
        ) : (
          <View style={styles.sideSlot} />
        )}

        <View style={styles.center}>
          {showBrand ? (
            <View style={styles.brandRow}>
              <BrandMark size={Size.iconHero} />
              <Text style={[styles.brand, { color: titleColor }]}>{Brand.name}</Text>
            </View>
          ) : title ? (
            <>
              <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </>
          ) : null}
        </View>

        <View style={styles.right}>
          {showSearch ? (
            <Pressable
              onPress={onSearchPress}
              style={[styles.iconBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
              accessibilityLabel="Search"
            >
              <Search size={Size.icon} color={iconColor} strokeWidth={2} />
            </Pressable>
          ) : null}
          {showNotifications ? (
            <Pressable
              onPress={onNotificationsPress}
              style={[styles.iconBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
              accessibilityLabel="Notifications"
            >
              <Bell size={Size.icon} color={iconColor} strokeWidth={2} />
            </Pressable>
          ) : null}
          {right}
          {!showSearch && !showNotifications && !right ? <View style={styles.sideSlot} /> : null}
        </View>
      </View>
    </View>
  );
}

/** Back-compat alias used across the app */
export { ScreenHeader as Header };

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.md,
  },
  row: {
    minHeight: Size.touch,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: Size.touch,
    height: Size.touch,
    borderRadius: Radius.full,
    borderWidth: Size.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideSlot: {
    width: Size.sideSlot,
    height: Size.touch,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brand: {
    fontFamily: Fonts.displayBold,
    fontSize: TypeSize.heading,
    letterSpacing: 1.6,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: TypeSize.subtitle,
    lineHeight: Leading.title,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: TypeSize.label,
    marginTop: Spacing.hairline,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: Size.compactControl,
    justifyContent: 'flex-end',
  },
});
