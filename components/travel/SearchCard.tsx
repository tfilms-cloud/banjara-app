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
import { Colors, useThemeColors } from '@/constants/colors';
import {
  PRODUCT_MODES,
  SERVICE_CATEGORIES,
  type CustomerProductMode,
  type HomeServiceCategory,
} from '@/constants/productModes';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';

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
      <ChevronRight size={15} color={colors.mutedLight} strokeWidth={2} />
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
            <ChevronRight size={15} color={colors.mutedLight} strokeWidth={2} />
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
            <ChevronRight size={15} color={colors.mutedLight} strokeWidth={2} />
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
            <ArrowLeftRight size={16} color={colors.primary} strokeWidth={2.2} />
          </AnimatedPressable>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaCell}>
          <SearchField
            compact
            icon={<Calendar size={15} color={colors.primary} strokeWidth={2} />}
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
              icon={<Calendar size={15} color={colors.action} strokeWidth={2} />}
              label="Return home"
              value={returnDateLabel || 'Pick return'}
              onPress={onReturnDate}
            />
          ) : (
            <SearchField
              compact
              icon={<Users size={15} color={colors.primary} strokeWidth={2} />}
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
          icon={<Users size={15} color={colors.primary} strokeWidth={2} />}
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
          icon={<Search size={16} color={colors.white} strokeWidth={2.4} />}
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
  return <Ionicons name={name} size={16} color={iconColor} />;
}

/** Five Banjara service categories on the traveler home heading. */
export function SearchModeTabs({ mode, onChange, compact = false }: ModeTabsProps) {
  const colors = useThemeColors();

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
                backgroundColor: active ? colors.primary : colors.inputBg,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${item.label}. ${item.shortHint}`}
          >
            <CategoryIcon icon={item.icon} active={active} colors={colors} />
            <Text
              style={[
                styles.modeChipText,
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
  const { width: windowWidth } = useWindowDimensions();
  const initialWidth = Math.max(280, windowWidth - Spacing.screen * 2);
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

const styles = StyleSheet.create({
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
  intentHint: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 0.1,
  },
  routeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  connectorCol: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  routeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  connectorLine: {
    width: 1.5,
    height: 22,
    marginVertical: 2,
  },
  routeFields: {
    flex: 1,
    paddingLeft: Spacing.xs,
  },
  fieldClean: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    paddingVertical: 4,
    paddingRight: Spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fieldCompact: {
    minHeight: 46,
    paddingVertical: 4,
  },
  fieldIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  fieldCopy: {
    flex: 1,
    minWidth: 0,
    marginRight: 4,
  },
  fieldLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    marginTop: 1,
  },
  divider: {
    height: 1,
  },
  swapBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  tripLengthText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
  },
  cta: {
    marginTop: Spacing.xs,
    minHeight: 50,
    borderRadius: Radius.full,
  },
  modes: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: Radius.full,
    padding: 3,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  modePill: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    borderRadius: Radius.full,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    minHeight: 46,
    zIndex: 1,
  },
  modeTabCompact: {
    paddingVertical: 9,
    minHeight: 44,
  },
  modeTabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  modeText: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
  modesScroll: {
    paddingHorizontal: Spacing.screen,
    gap: 8,
    paddingBottom: Spacing.sm,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: 8,
  },
  modeChipText: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
});
