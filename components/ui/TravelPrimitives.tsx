import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Fonts } from '@/constants/typography';
import { useHomeDesign } from '@/constants/homeDesign';

export type TravelIcon = ComponentProps<typeof Ionicons>['name'];

export function TravelSurface({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useHomeDesign();
  return <View style={[s.surface, { backgroundColor: theme.surface }, style]}>{children}</View>;
}

export function TravelIconAction({
  icon,
  label,
  onPress,
  badge,
  color,
  filled = false,
}: {
  icon: TravelIcon;
  label: string;
  onPress: () => void;
  badge?: boolean;
  color?: string;
  filled?: boolean;
}) {
  const theme = useHomeDesign();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={[s.iconAction, filled && { backgroundColor: theme.field }]}
    >
      <Ionicons name={icon} size={21} color={color ?? theme.text} />
      {badge ? <View style={[s.badge, { backgroundColor: theme.coral }]} /> : null}
    </Pressable>
  );
}

export function TravelSegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
}) {
  const theme = useHomeDesign();
  return (
    <View style={[s.track, { backgroundColor: theme.field }]}>
      {options.map((option) => (
        <Pressable
          key={option.id}
          onPress={() => onChange(option.id)}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === option.id }}
          style={[s.segment, value === option.id && { backgroundColor: theme.action }]}
        >
          <Text
            style={[s.segmentText, { color: value === option.id ? theme.background : theme.muted }]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function TravelSection({
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
  compact = false,
  accessory,
  contained = false,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
  compact?: boolean;
  accessory?: ReactNode;
  contained?: boolean;
}) {
  const theme = useHomeDesign();
  return (
    <View style={[s.section, compact && s.compactSection]}>
      <View style={[s.heading, contained && s.containedHeading]}>
        <View style={s.headingCopy}>
          <Text accessibilityRole="header" style={[s.title, { color: theme.text }]}>
            {title}
          </Text>
          {subtitle ? <Text style={[s.subtitle, { color: theme.muted }]}>{subtitle}</Text> : null}
        </View>
        {accessory}
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${actionLabel}: ${title}`}
            onPress={onAction}
            style={s.action}
          >
            <Text style={[s.actionText, { color: theme.primary }]}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  surface: { borderRadius: 28, overflow: 'hidden' },
  iconAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: { width: 7, height: 7, borderRadius: 4, position: 'absolute', top: 8, right: 10 },
  track: { flexDirection: 'row', borderRadius: 28, padding: 4 },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: { fontFamily: Fonts.bodySemiBold, fontSize: 12, textAlign: 'center' },
  section: { marginTop: 32, gap: 14 },
  compactSection: { marginTop: 24, gap: 12 },
  heading: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  containedHeading: { paddingHorizontal: 0 },
  headingCopy: { flex: 1 },
  title: { fontFamily: Fonts.display, fontSize: 19, lineHeight: 25, letterSpacing: -0.4 },
  subtitle: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 18, marginTop: 3 },
  action: { minHeight: 44, justifyContent: 'center', paddingLeft: 8 },
  actionText: { fontFamily: Fonts.bodyMedium, fontSize: 12 },
});
