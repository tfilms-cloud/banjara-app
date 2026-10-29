import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useEffect, useState } from 'react';
import { ArrowLeftRight, Route, Search, X } from 'lucide-react-native';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { useThemeColors, type ColorTokens } from '@/constants/colors';
import { Radius, Shadows, Spacing, Size } from '@/constants/spacing';
import { Fonts, TypeSize } from '@/constants/typography';

export type HomeSearchKind = 'route' | 'name';

type HomeSearchKindTabsProps = {
  value: HomeSearchKind;
  onChange: (value: HomeSearchKind) => void;
};

const TAB_INSET = Spacing.tight;

export function HomeSearchKindTabs({ value, onChange }: HomeSearchKindTabsProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const { width: windowWidth } = useWindowDimensions();
  const initialWidth = Math.max(Size.minimumContent, windowWidth - Spacing.screen * 2);
  const [trackW, setTrackW] = useState(initialWidth);
  const pillW = (trackW - TAB_INSET * 2) / 2;
  const translateX = useSharedValue(value === 'route' ? 0 : pillW);

  useEffect(() => {
    const target = value === 'route' ? 0 : pillW;
    translateX.value = withSpring(target, {
      damping: 22,
      stiffness: 240,
      mass: 0.8,
    });
  }, [value, pillW, translateX]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - trackW) > 1) {
          setTrackW(w);
        }
      }}
      style={[
        styles.tabs,
        {
          backgroundColor: colors.inputBg,
          borderColor: colors.border,
        },
      ]}
    >
      {pillW > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tabPill,
            { width: pillW, backgroundColor: colors.primary },
            pillStyle,
          ]}
        />
      ) : null}
      <Pressable
        onPress={() => onChange('route')}
        style={styles.tab}
        accessibilityRole="button"
        accessibilityState={{ selected: value === 'route' }}
        accessibilityLabel="Search by route"
      >
        <View style={styles.tabContent}>
          <Route
            size={Size.iconDetail}
            color={value === 'route' ? colors.white : colors.muted}
            strokeWidth={2.2}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: value === 'route' ? colors.white : colors.muted,
                fontFamily: value === 'route' ? Fonts.bodySemiBold : Fonts.bodyMedium,
              },
            ]}
          >
            Route
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={() => onChange('name')}
        style={styles.tab}
        accessibilityRole="button"
        accessibilityState={{ selected: value === 'name' }}
        accessibilityLabel="Search by name"
      >
        <View style={styles.tabContent}>
          <Search
            size={Size.iconDetail}
            color={value === 'name' ? colors.white : colors.muted}
            strokeWidth={2.2}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: value === 'name' ? colors.white : colors.muted,
                fontFamily: value === 'name' ? Fonts.bodySemiBold : Fonts.bodyMedium,
              },
            ]}
          >
            Name
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

type NameSearchCardProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  placeholder?: string;
  ctaLabel?: string;
};

export function NameSearchCard({
  value,
  onChangeText,
  onSearch,
  placeholder = 'Agency, city, hotel, vehicle…',
  ctaLabel = 'Search',
}: NameSearchCardProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const [focused, setFocused] = useState(false);

  const submit = () => {
    Keyboard.dismiss();
    onSearch();
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.hintRow}>
        <View style={[styles.hintDot, { backgroundColor: colors.primary }]} />
        <Text style={[styles.hint, { color: colors.muted }]}>
          Search across providers, destinations, hotels, or vehicles.
        </Text>
      </View>

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.inputBg,
            borderColor: focused ? colors.primary : colors.border,
          },
        ]}
      >
        <Search size={Size.iconMd} color={focused ? colors.primary : colors.muted} strokeWidth={2.2} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedLight}
          style={[styles.input, { color: colors.dark }]}
          returnKeyType="search"
          blurOnSubmit
          autoCorrect={false}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={submit}
          accessibilityLabel="Search by name"
        />
        {value.length > 0 ? (
          <Pressable
            onPress={() => onChangeText('')}
            hitSlop={8}
            style={[styles.clearBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            accessibilityLabel="Clear text"
          >
            <X size={Size.iconSmall} color={colors.muted} strokeWidth={2.4} />
          </Pressable>
        ) : null}
      </View>

      <Button
        title={ctaLabel}
        onPress={submit}
        icon={<Search size={Size.iconSm} color={colors.white} strokeWidth={2.4} />}
        style={styles.cta}
      />
    </View>
  );
}

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    padding: TAB_INSET,
    borderWidth: Spacing.hairline,
    position: 'relative',
    overflow: 'hidden',
  },
  tabPill: {
    position: 'absolute',
    top: TAB_INSET,
    bottom: TAB_INSET,
    left: TAB_INSET,
    borderRadius: Radius.full,
    ...Shadows.soft,
  },
  tab: {
    flex: 1,
    minHeight: Size.touch,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    zIndex: 1,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.micro,
  },
  tabText: {
    fontSize: TypeSize.label,
    letterSpacing: -0.1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: Radius.xl,
    borderWidth: Spacing.hairline,
    borderColor: colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.card,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.micro,
  },
  hintDot: {
    width: Size.badgeDot,
    height: Size.badgeDot,
    borderRadius: Radius.full,
  },
  hint: {
    fontFamily: Fonts.bodyMedium,
    fontSize: TypeSize.caption,
    letterSpacing: 0.1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: Size.button,
    borderRadius: Radius.lg,
    borderWidth: Size.borderStrong,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: TypeSize.medium,
    paddingVertical: Spacing.sm,
  },
  clearBtn: {
    width: Spacing['2xl'],
    height: Spacing['2xl'],
    borderRadius: Radius.lg,
    borderWidth: Spacing.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    marginTop: Spacing.xs,
    minHeight: Size.button,
    borderRadius: Radius.full,
  },
});
