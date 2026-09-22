import { useEffect, useState } from 'react';
import { ArrowLeftRight, Calendar, ChevronRight, MapPin, Users } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { QuickDateChips } from '@/components/travel/QuickDateChips';
import { Button } from '@/components/ui/Button';
import { Colors, useThemeColors } from '@/constants/colors';
import { PRODUCT_MODES, type CustomerProductMode } from '@/constants/productModes';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';

type SearchFieldProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress: () => void;
  compact?: boolean;
};

function SearchField({ icon, label, value, onPress, compact }: SearchFieldProps) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.field,
        compact && styles.fieldCompact,
        { backgroundColor: colors.inputBg },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value || 'Select'}`}
    >
      <View style={[styles.fieldIcon, { backgroundColor: colors.elevated }]}>{icon}</View>
      <View style={styles.fieldCopy}>
        <Text style={[styles.fieldLabel, { color: colors.mutedLight }]}>{label}</Text>
        <Text style={[styles.fieldValue, { color: colors.dark }]} numberOfLines={1}>
          {value || 'Select'}
        </Text>
      </View>
      <ChevronRight size={16} color={colors.mutedLight} strokeWidth={2} />
    </Pressable>
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

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {hint || meta.shortHint ? (
        <Text style={[styles.intentHint, { color: colors.muted }]}>{hint ?? meta.shortHint}</Text>
      ) : null}

      <View style={[styles.routeBlock, { backgroundColor: colors.inputBg }]}>
        <View style={{ flex: 1 }}>
          <SearchField
            icon={<MapPin size={16} color={colors.primary} strokeWidth={2} />}
            label="From"
            value={from}
            onPress={onFrom}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SearchField
            icon={<MapPin size={16} color={colors.action} strokeWidth={2} />}
            label="To"
            value={to}
            onPress={onTo}
          />
        </View>
        {onSwap ? (
          <Pressable
            onPress={onSwap}
            style={[styles.swapBtn, { backgroundColor: colors.elevated, borderColor: colors.border }]}
            accessibilityLabel="Swap locations"
            accessibilityRole="button"
          >
            <ArrowLeftRight size={16} color={colors.primary} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaCell}>
          <SearchField
            compact
            icon={<Calendar size={16} color={colors.primary} strokeWidth={2} />}
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
              icon={<Calendar size={16} color={colors.action} strokeWidth={2} />}
              label="Return home"
              value={returnDateLabel || 'Pick return'}
              onPress={onReturnDate}
            />
          ) : (
            <SearchField
              compact
              icon={<Users size={16} color={colors.primary} strokeWidth={2} />}
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
          icon={<Users size={16} color={colors.primary} strokeWidth={2} />}
          label="Passengers"
          value={passengersLabel}
          onPress={onPassengers}
        />
      ) : null}

      {tripLengthLabel ? (
        <Text style={[styles.intentHint, { color: colors.primary }]}>{tripLengthLabel}</Text>
      ) : null}

      {selectedDate && onSelectDate ? (
        <QuickDateChips selectedDate={selectedDate} onSelect={onSelectDate} />
      ) : null}

      {showCta ? <Button title={meta.cta} onPress={onSearch} style={styles.cta} /> : null}
    </View>
  );
}

type ModeTabsProps = {
  mode: CustomerProductMode;
  onChange: (mode: CustomerProductMode) => void;
  compact?: boolean;
};

const MODE_INSET = 4;

export function SearchModeTabs({ mode, onChange, compact = false }: ModeTabsProps) {
  const colors = useThemeColors();
  const index = Math.max(0, PRODUCT_MODES.findIndex((item) => item.id === mode));
  const [trackW, setTrackW] = useState(0);
  const pillW = trackW > 0 ? (trackW - MODE_INSET * 2) / PRODUCT_MODES.length : 0;
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withTiming(index * pillW, { duration: 220 });
  }, [index, pillW, translateX]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      onLayout={(event) => setTrackW(event.nativeEvent.layout.width)}
      style={[
        styles.modes,
        { backgroundColor: colors.inputBg },
        compact && { marginBottom: 0 },
      ]}
    >
      {pillW > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.modePill,
            { width: pillW, backgroundColor: colors.primary },
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
            style={[styles.modeTab, compact && styles.modeTabCompact]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${item.label}. ${item.shortHint}`}
          >
            <Text
              style={[
                styles.modeText,
                { color: active ? colors.white : colors.muted },
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
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  intentHint: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    marginBottom: 2,
  },
  routeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  fieldCompact: {
    minHeight: 44,
    paddingVertical: 4,
  },
  fieldIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
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
    fontFamily: Fonts.body,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  fieldValue: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    marginTop: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 40,
  },
  swapBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
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
  cta: {
    marginTop: Spacing.xs,
    minHeight: 48,
    borderRadius: Radius.lg,
  },
  modes: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    padding: MODE_INSET,
    marginBottom: Spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  modePill: {
    position: 'absolute',
    top: MODE_INSET,
    bottom: MODE_INSET,
    left: MODE_INSET,
    borderRadius: Radius.full,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    minHeight: 44,
    zIndex: 1,
  },
  modeTabCompact: {
    paddingVertical: 8,
    minHeight: 44,
  },
  modeText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
  },
});
