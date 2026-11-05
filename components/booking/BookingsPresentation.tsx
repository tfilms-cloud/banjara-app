import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { HomeTopBar } from '@/components/home/HomeDiscovery';
import { TravelTextField } from '@/components/ui/TravelForm';
import { TravelFilterChips } from '@/components/ui/TravelCatalog';
import {
  TravelSegmentedControl,
  TravelSurface,
  type TravelIcon,
} from '@/components/ui/TravelPrimitives';
import { useHomeDesign } from '@/constants/homeDesign';
import { Fonts } from '@/constants/typography';
import {
  bookingStatusLabel,
  type BookingCategory,
  type BookingStatusTab,
} from '@/utils/bookingPresentation';

export function TravelBookingsLayout({
  children,
  status,
  onStatus,
  category,
  onCategory,
  count,
  activeCount,
  query,
  onQuery,
  searchVisible,
  onSearch,
  userName,
  userAvatar,
  unread,
  onNotifications,
  onProfile,
}: {
  children: ReactNode;
  status: BookingStatusTab;
  onStatus: (value: BookingStatusTab) => void;
  category: BookingCategory;
  onCategory: (value: BookingCategory) => void;
  count: number;
  activeCount: number;
  query: string;
  onQuery: (value: string) => void;
  searchVisible: boolean;
  onSearch: () => void;
  userName?: string;
  userAvatar?: string;
  unread: boolean;
  onNotifications: () => void;
  onProfile: () => void;
}) {
  const theme = useHomeDesign();
  const input = useRef<TextInput>(null);
  useEffect(() => {
    if (searchVisible) input.current?.focus();
  }, [searchVisible]);
  return (
    <View style={[s.root, { backgroundColor: theme.background }]}>
      <HomeTopBar
        name={userName}
        avatar={userAvatar}
        unread={unread}
        onSearch={onSearch}
        onNotifications={onNotifications}
        onProfile={onProfile}
      />
      <View style={s.heading}>
        <View style={s.row}>
          <View style={s.flex}>
            <Text accessibilityRole="header" style={[s.headingTitle, { color: theme.text }]}>
              Bookings
            </Text>
            <Text style={[s.subtitle, { color: theme.muted }]}>
              {count} {status === 'upcoming' ? 'active & upcoming' : status}{' '}
              {count === 1 ? 'journey' : 'journeys'}
            </Text>
          </View>
          <View style={[s.count, { backgroundColor: theme.soft }]}>
            <Text style={[s.countText, { color: theme.primary }]}>{activeCount} Active</Text>
          </View>
        </View>
        {searchVisible ? (
          <TravelTextField
            compact
            inputRef={input}
            label="Search bookings"
            placeholder="Search providers, places, or booking codes…"
            value={query}
            onChangeText={onQuery}
          />
        ) : null}
        <TravelSegmentedControl
          options={[
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ]}
          value={status}
          onChange={onStatus}
        />
      </View>
      <View style={s.categories}>
        <TravelFilterChips
          options={[
            { id: 'all', label: 'All' },
            { id: 'transport', label: 'Transport' },
            { id: 'hotels', label: 'Hotels' },
            { id: 'tours', label: 'Tours' },
            { id: 'guides', label: 'Guides' },
          ]}
          value={category}
          onChange={onCategory}
        />
      </View>
      {children}
    </View>
  );
}

export function BookingSurface({
  children,
  padding = true,
}: {
  children: ReactNode;
  padding?: boolean;
}) {
  const theme = useHomeDesign();
  return (
    <TravelSurface style={[s.surface, padding && s.padding, { borderColor: theme.border }]}>
      {children}
    </TravelSurface>
  );
}

export function BookingStatusChip({ status, label }: { status: string; label?: string }) {
  const theme = useHomeDesign();
  const attention = status === 'pending' || status === 'cancelled';
  return (
    <View style={[s.status, { backgroundColor: attention ? theme.coralSoft : theme.soft }]}>
      <View style={[s.dot, { backgroundColor: attention ? theme.coral : theme.primary }]} />
      <Text style={[s.statusText, { color: attention ? theme.coral : theme.primary }]}>
        {label ?? bookingStatusLabel(status)}
      </Text>
    </View>
  );
}

export function BookingAction({
  label,
  onPress,
  icon,
  soft = false,
}: {
  label: string;
  onPress?: () => void;
  icon?: TravelIcon;
  soft?: boolean;
}) {
  const theme = useHomeDesign();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !onPress }}
      style={[
        s.action,
        { backgroundColor: soft ? theme.soft : theme.primary, opacity: onPress ? 1 : 0.5 },
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={15} color={soft ? theme.primary : theme.background} />
      ) : null}
      <Text style={[s.actionText, { color: soft ? theme.primary : theme.background }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function BookingNotice({
  text,
  action,
  onAction,
}: {
  text: string;
  action?: string;
  onAction?: () => void;
}) {
  const theme = useHomeDesign();
  return (
    <View style={[s.notice, { backgroundColor: theme.coralSoft }]}>
      <Ionicons name="time-outline" size={15} color={theme.coral} />
      <Text style={[s.noticeText, { color: theme.coral }]}>{text}</Text>
      {action && onAction ? <BookingAction label={action} onPress={onAction} /> : null}
    </View>
  );
}

export function BookingHelp({ onPress }: { onPress: () => void }) {
  const theme = useHomeDesign();
  return (
    <View style={s.helpRow}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Help and support"
        style={[s.help, { backgroundColor: theme.coral }]}
      >
        <Ionicons name="headset-outline" size={17} color={theme.background} />
        <Text style={[s.helpText, { color: theme.background }]}>Help & support</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heading: { paddingHorizontal: 16, paddingTop: 14, gap: 14 },
  categories: { paddingTop: 8, paddingBottom: 12 },
  headingTitle: { fontFamily: Fonts.displayBold, fontSize: 24, lineHeight: 30 },
  subtitle: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 18, marginTop: 2 },
  count: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 14 },
  countText: { fontFamily: Fonts.bodySemiBold, fontSize: 10 },
  surface: { borderWidth: 1, borderRadius: 20 },
  padding: { padding: 16, gap: 12 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: { fontFamily: Fonts.bodySemiBold, fontSize: 10 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  action: {
    minHeight: 44,
    borderRadius: 24,
    paddingHorizontal: 13,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    flexShrink: 1,
  },
  actionText: { fontFamily: Fonts.bodySemiBold, fontSize: 11, flexShrink: 1, textAlign: 'center' },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    borderRadius: 24,
    padding: 8,
  },
  noticeText: { flex: 1, minWidth: 90, fontFamily: Fonts.bodyMedium, fontSize: 11, lineHeight: 17 },
  helpRow: { alignItems: 'flex-end', paddingTop: 8 },
  help: {
    minHeight: 44,
    borderRadius: 24,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  helpText: { fontFamily: Fonts.bodySemiBold, fontSize: 12 },
});
