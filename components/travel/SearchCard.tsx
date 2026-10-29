import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useEffect, useState } from 'react';
import { ArrowLeftRight, Calendar, ChevronRight, MapPin, Search, Users } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { QuickDateChips } from '@/components/travel/QuickDateChips';
import { Button } from '@/components/ui/Button';
import { useThemeColors, type ColorTokens } from '@/constants/colors';
import {
  PRODUCT_MODES,
  SERVICE_CATEGORIES,
  type CustomerProductMode,
  type HomeServiceCategory,
} from '@/constants/productModes';
import { Radius, Shadows, Size, Spacing } from '@/constants/spacing';
import { Fonts, TypeSize, Leading } from '@/constants/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SearchFieldProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress: () => void;
  compact?: boolean;
};

function SearchField({ icon, label, value, onPress, compact }: SearchFieldProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.985, { damping: 18, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, stiffness: 300 });
      }}
      style={[
        styles.field,
        compact && styles.fieldCompact,
        { backgroundColor: colors.inputBg },
        animStyle,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value || 'Select'}`}
    >
      <View style={[styles.fieldIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {icon}
      </View>
      <View style={styles.fieldCopy}>
        <Text style={[styles.fieldLabel, { color: colors.mutedLight }]}>{label}</Text>
        <Text style={[styles.fieldValue, { color: colors.dark }]} numberOfLines={1}>
          {value || 'Select'}
        </Text>
      </View>
      <ChevronRight size={Size.iconDetail} color={colors.mutedLight} strokeWidth={2} />
    </AnimatedPressable>
  );
}

type TransportSearchCardProps = {
  from: string;
  to: string;
  dateLabel: string;
  passengersLabel: string;
  onFrom: () => void;
  onTo: () => void;
  onDate: () => void;
  onPassengers: () => void;
  onSearch: () => void;
  onSwap?: () => void;
  intent?: 'transport' | 'trips';
  returnDateLabel?: string;
  onReturnDate?: () => void;
  hint?: string;
  selectedDate?: string;
  onSelectDate?: (isoDate: string) => void;
  tripLengthLabel?: string;
  showCta?: boolean;
};

export function TransportSearchCard({
  from,
  to,
  dateLabel,
  passengersLabel,
  onFrom,
  onTo,
  onDate,
  onPassengers,
  onSearch,
  onSwap,
  intent = 'transport',
  returnDateLabel,
  onReturnDate,
  hint,
  selectedDate,
  onSelectDate,
  tripLengthLabel,
  showCta = true,
}: TransportSearchCardProps) {
  const meta = PRODUCT_MODES.find((m) => m.id === intent) ?? PRODUCT_MODES[0];
  const isTrip = intent === 'trips';
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const swapScale = useSharedValue(1);

  const swapAnim = useAnimatedStyle(() => ({
    transform: [{ scale: swapScale.value }],
  }));

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {hint || meta.shortHint ? (
        <View style={styles.hintRow}>
          <View style={[styles.hintDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.intentHint, { color: colors.muted }]}>{hint ?? meta.shortHint}</Text>
        </View>
      ) : null}

      <View style={[styles.routeBlock, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <View style={styles.connectorCol}>
          <View style={[styles.routeDot, { borderColor: colors.primary }]}>
            <View style={[styles.routeDotInner, { backgroundColor: colors.primary }]} />
          </View>
          <View style={[styles.connectorLine, { backgroundColor: colors.border }]} />
          <View style={[styles.routeDot, { borderColor: colors.action }]}>
            <View style={[styles.routeDotInner, { backgroundColor: colors.action }]} />
          </View>
        </View>

        <View style={styles.routeFields}>
          <Pressable
            onPress={onFrom}
            style={styles.fieldClean}
            accessibilityRole="button"
            accessibilityLabel={`From: ${from || 'Select departure'}`}
          >
            <View style={styles.fieldCopy}>
              <Text style={[styles.fieldLabel, { color: colors.mutedLight }]}>From</Text>
              <Text style={[styles.fieldValue, { color: colors.dark }]} numberOfLines={1}>
                {from || 'Select departure'}
              </Text>
            </View>
            <ChevronRight size={Size.iconDetail} color={colors.mutedLight} strokeWidth={2} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Pressable
            onPress={onTo}
            style={styles.fieldClean}
            accessibilityRole="button"
            accessibilityLabel={`To: ${to || 'Select destination'}`}
          >
            <View style={styles.fieldCopy}>
              <Text style={[styles.fieldLabel, { color: colors.mutedLight }]}>To</Text>
              <Text style={[styles.fieldValue, { color: colors.dark }]} numberOfLines={1}>
                {to || 'Select destination'}
              </Text>
            </View>
            <ChevronRight size={Size.iconDetail} color={colors.mutedLight} strokeWidth={2} />
          </Pressable>
        </View>

        {onSwap ? (
          <AnimatedPressable
            onPress={onSwap}
            onPressIn={() => {
              swapScale.value = withSpring(0.9, { damping: 14, stiffness: 350 });
            }}
            onPressOut={() => {
              swapScale.value = withSpring(1, { damping: 14, stiffness: 350 });
            }}
            style={[
              styles.swapBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
              swapAnim,
            ]}
            accessibilityLabel="Swap locations"
            accessibilityRole="button"
          >
            <ArrowLeftRight size={Size.iconSm} color={colors.primary} strokeWidth={2.2} />
          </AnimatedPressable>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaCell}>
          <SearchField
            compact
            icon={<Calendar size={Size.iconDetail} color={colors.primary} strokeWidth={2} />}
            label={isTrip ? 'Going' : 'Date'}
            value={dateLabel}
            onPress={onDate}
          />
        </View>
        <View style={styles.metaGap} />
        <View style={styles.metaCell}>
          {isTrip && onReturnDate ? (
            <SearchField
              compact
              icon={<Calendar size={Size.iconDetail} color={colors.action} strokeWidth={2} />}
              label="Return home"
              value={returnDateLabel || 'Pick return'}
              onPress={onReturnDate}
            />
          ) : (
            <SearchField
              compact
              icon={<Users size={Size.iconDetail} color={colors.primary} strokeWidth={2} />}
              label="Passengers"
              value={passengersLabel}
              onPress={onPassengers}
            />
          )}
        </View>
      </View>

      {isTrip ? (
        <SearchField
          compact
          icon={<Users size={Size.iconDetail} color={colors.primary} strokeWidth={2} />}
          label="Passengers"
          value={passengersLabel}
          onPress={onPassengers}
        />
      ) : null}

      {tripLengthLabel ? (
        <View style={[styles.tripLengthBadge, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.tripLengthText, { color: colors.primary }]}>{tripLengthLabel}</Text>
        </View>
      ) : null}

      {selectedDate && onSelectDate ? (
        <QuickDateChips selectedDate={selectedDate} onSelect={onSelectDate} />
      ) : null}

      {showCta ? (
        <Button
          title={meta.cta}
          onPress={onSearch}
          icon={<Search size={Size.iconSm} color={colors.white} strokeWidth={2.4} />}
          style={styles.cta}
        />
      ) : null}
    </View>
  );
}

type ModeTabsProps = {
  mode: HomeServiceCategory;
  onChange: (mode: HomeServiceCategory) => void;
  compact?: boolean;
};

function CategoryIcon({
  icon,
  active,
  colors,
}: {
  icon: (typeof SERVICE_CATEGORIES)[number]['icon'];
  active: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const iconColor = active ? colors.white : colors.primary;
  const name =
    icon === 'bus'
      ? 'bus'
      : icon === 'bed'
        ? 'bed'
        : icon === 'map'
          ? 'map'
          : icon === 'person'
            ? 'person'
            : 'restaurant';
  return <Ionicons name={name} size={Size.iconSm} color={iconColor} />;
}

/** Five Banjara service categories on the traveler home heading. */
export function SearchModeTabs({ mode, onChange, compact = false }: ModeTabsProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.modesScroll, compact && { paddingBottom: 0 }]}
    >
      {SERVICE_CATEGORIES.map((item) => {
        const active = mode === item.id;
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            style={[
              styles.modeChip,
              {
                backgroundColor: colors.transparent,
                borderColor: colors.transparent,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${item.label}. ${item.shortHint}`}
          >
            <View style={[styles.categoryIcon, { backgroundColor: active ? colors.primarySoft : colors.card, borderColor: active ? colors.primary : colors.border }]}><CategoryIcon icon={item.icon} active={false} colors={colors} /></View>
            <Text
              style={[
                styles.modeChipText,
                {
                  color: active ? colors.primaryText : colors.muted,
                  fontFamily: active ? Fonts.bodySemiBold : Fonts.bodyMedium,
                },
              ]}
              numberOfLines={2}
            >
              {item.label}
            </Text>
            <View style={[styles.categoryIndicator, { backgroundColor: active ? colors.primary : colors.transparent }]} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Legacy three-mode pill (transport / trips / hotels) — kept for results flows. */
export function ProductModeTabs({
  mode,
  onChange,
}: {
  mode: CustomerProductMode;
  onChange: (mode: CustomerProductMode) => void;
}) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const { width: windowWidth } = useWindowDimensions();
  const initialWidth = Math.max(Size.minimumContent, windowWidth - Spacing.screen * 2);
  const index = Math.max(0, PRODUCT_MODES.findIndex((item) => item.id === mode));
  const [trackW, setTrackW] = useState(initialWidth);
  const MODE_INSET = 3;
  const pillW = (trackW - MODE_INSET * 2) / PRODUCT_MODES.length;
  const translateX = useSharedValue(index * pillW);

  useEffect(() => {
    translateX.value = withSpring(index * pillW, {
      damping: 22,
      stiffness: 240,
      mass: 0.8,
    });
  }, [index, pillW, translateX]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      onLayout={(event) => {
        const w = event.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - trackW) > 1) {
          setTrackW(w);
        }
      }}
      style={[
        styles.modes,
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
            styles.modePill,
            {
              width: pillW,
              backgroundColor: colors.primary,
            },
            pillStyle,
          ]}
        />
      ) : null}
      {PRODUCT_MODES.map((item) => {
        const active = mode === item.id;
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            style={styles.modeTab}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${item.label}. ${item.shortHint}`}
          >
            <Text
              style={[
                styles.modeText,
                {
                  color: active ? colors.white : colors.dark,
                  fontFamily: active ? Fonts.bodySemiBold : Fonts.bodyMedium,
                },
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: Radius.xl,
    borderWidth: Size.border,
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
  intentHint: {
    fontFamily: Fonts.bodyMedium,
    fontSize: TypeSize.caption,
    letterSpacing: 0.1,
  },
  routeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: Size.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  connectorCol: {
    width: Size.icon,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  routeDot: {
    width: Size.iconSmall,
    height: Size.iconSmall,
    borderRadius: Radius.full,
    borderWidth: Size.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeDotInner: {
    width: Size.badgeDot,
    height: Size.badgeDot,
    borderRadius: Radius.full,
  },
  connectorLine: {
    width: Size.borderStrong,
    height: Size.iconLg,
    marginVertical: Spacing.xxs,
  },
  routeFields: {
    flex: 1,
    paddingLeft: Spacing.xs,
  },
  fieldClean: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Size.field,
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Size.button,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: Size.border,
    borderColor: colors.transparent,
  },
  fieldCompact: {
    minHeight: Size.field,
    paddingVertical: Spacing.xs,
  },
  fieldIcon: {
    width: Size.iconHero,
    height: Size.iconHero,
    borderRadius: Radius.sm,
    borderWidth: Size.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  fieldCopy: {
    flex: 1,
    minWidth: 0,
    marginRight: Spacing.xs,
  },
  fieldLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: TypeSize.overline,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: TypeSize.body,
    marginTop: Spacing.hairline,
  },
  divider: {
    height: Size.border,
  },
  swapBtn: {
    width: Size.compactControl,
    height: Size.compactControl,
    borderRadius: Radius.xl,
    borderWidth: Size.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
    ...Shadows.soft,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  metaCell: {
    flex: 1,
    minWidth: 0,
  },
  metaGap: {
    width: Spacing.sm,
  },
  tripLengthBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.control,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  tripLengthText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: TypeSize.micro,
  },
  cta: {
    marginTop: Spacing.xs,
    minHeight: Size.button,
    borderRadius: Radius.full,
  },
  modes: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: Radius.full,
    padding: Spacing.tight,
    marginBottom: Spacing.sm,
    borderWidth: Size.border,
    position: 'relative',
    overflow: 'hidden',
  },
  modePill: {
    position: 'absolute',
    top: Spacing.tight,
    bottom: Spacing.tight,
    left: Spacing.tight,
    borderRadius: Radius.full,
    ...Shadows.soft,
  },
  modeTab: {
    flex: 1,
    paddingVertical: Spacing.control,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
    minHeight: Size.field,
    zIndex: 1,
  },
  modeText: {
    fontSize: TypeSize.label,
    letterSpacing: -0.2,
  },
  modesScroll: {
    paddingHorizontal: Spacing.screen,
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  categoryIcon: { width: Size.touch, height: Size.touch, borderRadius: Radius.full, borderWidth: Size.border, alignItems: 'center', justifyContent: 'center' },
  categoryIndicator: { height: Size.borderActive, width: Spacing.xl, borderRadius: Radius.full },
  modeChip: { width: Size.category, minHeight: Size.category, alignItems: 'center', justifyContent: 'flex-start', gap: Spacing.xs },
  modeChipText: { fontSize: TypeSize.micro, lineHeight: Leading.compact, textAlign: 'center', minHeight: Spacing['3xl'] },
});
