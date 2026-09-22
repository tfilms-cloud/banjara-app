import { ArrowLeft, Bell, Menu, Search } from 'lucide-react-native';
import type { Href } from 'expo-router';
import { router, useNavigation } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Brand, Fonts } from '@/constants/typography';
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
          backgroundColor: transparent ? 'transparent' : colors.background,
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
            <ArrowLeft size={22} color={iconColor} strokeWidth={2} />
          </Pressable>
        ) : showMenu ? (
          <Pressable
            onPress={onMenuPress}
            style={[styles.iconBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            accessibilityLabel="Menu"
          >
            <Menu size={22} color={iconColor} strokeWidth={2} />
          </Pressable>
        ) : (
          <View style={styles.sideSlot} />
        )}

        <View style={styles.center}>
          {showBrand ? (
            <Text style={[styles.brand, { color: titleColor }]}>{Brand.name}</Text>
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
              <Search size={20} color={iconColor} strokeWidth={2} />
            </Pressable>
          ) : null}
          {showNotifications ? (
            <Pressable
              onPress={onNotificationsPress}
              style={[styles.iconBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
              accessibilityLabel="Notifications"
            >
              <Bell size={20} color={iconColor} strokeWidth={2} />
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
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideSlot: {
    width: 44,
    height: 44,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  brand: {
    fontFamily: Fonts.displayBold,
    fontSize: 22,
    letterSpacing: 1.6,
  },
  title: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 18,
    lineHeight: 22,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    marginTop: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    justifyContent: 'flex-end',
  },
});
