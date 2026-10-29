import { useEffect, useState } from 'react';
import { ArrowLeftRight, Route, Search, X } from 'lucide-react-native';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { Colors, useThemeColors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';

export type HomeSearchKind = 'route' | 'name';

type HomeSearchKindTabsProps = {
  value: HomeSearchKind;
  onChange: (value: HomeSearchKind) => void;
};

const TAB_INSET = 3;

export function HomeSearchKindTabs({ value, onChange }: HomeSearchKindTabsProps) {
  const colors = useThemeColors();
  const { width: windowWidth } = useWindowDimensions();
  const initialWidth = Math.max(280, windowWidth - Spacing.screen * 2);
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
            size={15}
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
            size={15}
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
        <Search size={18} color={focused ? colors.primary : colors.muted} strokeWidth={2.2} />
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
            <X size={13} color={colors.muted} strokeWidth={2.4} />
          </Pressable>
        ) : null}
      </View>

      <Button
        title={ctaLabel}
        onPress={submit}
        icon={<Search size={16} color={colors.white} strokeWidth={2.4} />}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    padding: TAB_INSET,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  tabPill: {
    position: 'absolute',
    top: TAB_INSET,
    bottom: TAB_INSET,
    left: TAB_INSET,
    borderRadius: Radius.full,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tab: {
    flex: 1,
    minHeight: 42,
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
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.card,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  hint: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 0.1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 50,
    borderRadius: Radius.lg,
    borderWidth: 1.2,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    paddingVertical: Spacing.sm,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    marginTop: Spacing.xs,
    minHeight: 50,
    borderRadius: Radius.full,
  },
});
