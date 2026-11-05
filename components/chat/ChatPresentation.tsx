import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { TravelIconAction, TravelSurface, type TravelIcon } from '@/components/ui/TravelPrimitives';
import { useHomeDesign } from '@/constants/homeDesign';
import { Fonts } from '@/constants/typography';
import { formatDate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';
import type { ChatBookingContext, InboxFilter } from '@/utils/chatPresentation';

export function ChatConnectionBadge({
  status,
}: {
  status: 'connected' | 'connecting' | 'disconnected' | 'signed_out';
}) {
  const theme = useHomeDesign();
  return (
    <View style={[s.connection, { backgroundColor: theme.field }]} accessibilityLiveRegion="polite">
      <View
        style={[s.dot, { backgroundColor: status === 'connected' ? theme.primary : theme.muted }]}
      />
      <Text
        style={[s.connectionText, { color: status === 'connected' ? theme.primary : theme.muted }]}
      >
        {status === 'connected'
          ? 'Connected'
          : status === 'connecting'
            ? 'Connecting…'
            : status === 'signed_out'
              ? 'Sign in required'
              : 'Reconnecting…'}
      </Text>
    </View>
  );
}

export function ChatInboxHeading({
  unread,
  status,
  onBack,
}: {
  unread: number;
  status: 'connected' | 'connecting' | 'disconnected' | 'signed_out';
  onBack?: () => void;
}) {
  const theme = useHomeDesign();
  return (
    <View style={s.heading}>
      <View style={s.headingRow}>
        {onBack ? <TravelIconAction icon="arrow-back" label="Go back" onPress={onBack} /> : null}
        <Text accessibilityRole="header" style={[s.headingTitle, { color: theme.text }]}>
          Messages
        </Text>
        {unread > 0 ? (
          <View style={[s.newBadge, { backgroundColor: theme.action }]}>
            <Text style={[s.newText, { color: theme.background }]}>
              {unread > 99 ? '99+' : unread} new
            </Text>
          </View>
        ) : null}
        <View style={s.flex} />
        <ChatConnectionBadge status={status} />
      </View>
      <Text style={[s.subtitle, { color: theme.muted }]}>Trip updates, hosts & conversations</Text>
    </View>
  );
}

export function ChatInboxFilters({
  value,
  onChange,
  total,
  unread,
}: {
  value: InboxFilter;
  onChange: (value: InboxFilter) => void;
  total: number;
  unread: number;
}) {
  const theme = useHomeDesign();
  const options: Array<{ id: InboxFilter; label: string }> = [
    { id: 'all', label: `All (${total})` },
    { id: 'unread', label: `Unread (${unread})` },
    { id: 'providers', label: 'Providers' },
    { id: 'guides', label: 'Guides' },
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
      {options.map((option) => (
        <Pressable
          key={option.id}
          onPress={() => onChange(option.id)}
          accessibilityRole="tab"
          accessibilityLabel={option.label}
          accessibilityState={{ selected: value === option.id }}
          style={[
            s.filter,
            {
              backgroundColor: value === option.id ? theme.primary : theme.surface,
              borderColor: value === option.id ? theme.primary : theme.border,
            },
          ]}
        >
          <Text
            style={[s.filterText, { color: value === option.id ? theme.background : theme.text }]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function ChatInboxFooter({ onHelp }: { onHelp: () => void }) {
  const theme = useHomeDesign();
  return (
    <View style={s.footer}>
      <TravelSurface style={[s.infoPanel, { backgroundColor: theme.field }]}>
        <Ionicons name="chatbubbles-outline" size={22} color={theme.primary} />
        <View style={s.flex}>
          <Text style={[s.infoTitle, { color: theme.text }]}>Keep your trip in one place</Text>
          <Text style={[s.infoText, { color: theme.muted }]}>
            Talk with providers about pickup points, stays and booking details.
          </Text>
        </View>
      </TravelSurface>
      <Pressable
        onPress={onHelp}
        accessibilityRole="button"
        accessibilityLabel="Help and support"
        style={[s.help, { backgroundColor: theme.coral }]}
      >
        <Ionicons name="headset-outline" size={16} color={theme.background} />
        <Text style={[s.helpText, { color: theme.background }]}>Help & support</Text>
      </Pressable>
    </View>
  );
}

export function ChatThreadHeader({
  title,
  avatar,
  online,
  subtitle,
  onBack,
  onInfo,
  onProfile,
  onCall,
}: {
  title: string;
  avatar?: string;
  online?: boolean;
  subtitle: string;
  onBack: () => void;
  onInfo: () => void;
  onProfile: () => void;
  onCall?: () => void;
}) {
  const theme = useHomeDesign();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        s.threadHeader,
        {
          paddingTop: insets.top + 4,
          backgroundColor: theme.surface,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <TravelIconAction icon="arrow-back" label="Go back" onPress={onBack} />
      <Pressable
        onPress={onInfo}
        accessibilityRole="button"
        accessibilityLabel={`${title} profile`}
        style={s.person}
      >
        <View>
          <Avatar uri={avatar} name={title} size={38} />
          {online ? (
            <View
              style={[s.presence, { backgroundColor: theme.action, borderColor: theme.surface }]}
            />
          ) : null}
        </View>
        <View style={s.flex}>
          <Text style={[s.personName, { color: theme.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[s.personStatus, { color: theme.muted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </Pressable>
      {onCall ? (
        <TravelIconAction icon="call-outline" label={`Call ${title}`} onPress={onCall} />
      ) : null}
      <TravelIconAction
        icon="information-circle-outline"
        label="Conversation information"
        onPress={onInfo}
      />
      <View style={{ borderRadius: 22, backgroundColor: theme.action }}>
        <TravelIconAction
          icon="person-outline"
          label="Your profile"
          color={theme.background}
          onPress={onProfile}
        />
      </View>
    </View>
  );
}

export function ChatBookingBanner({
  booking,
  onDetails,
  onTicket,
}: {
  booking: ChatBookingContext;
  onDetails: () => void;
  onTicket?: () => void;
}) {
  const theme = useHomeDesign();
  const icons: Record<ChatBookingContext['kind'], TravelIcon> = {
    transport: 'bus-outline',
    hotel: 'bed-outline',
    package: 'trail-sign-outline',
    guide: 'walk-outline',
  };
  const when = [
    booking.date ? formatDate(booking.date, false) : '',
    booking.time ? formatTime(booking.time) : '',
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <TravelSurface style={[s.bookingPanel, { borderColor: theme.border }]}>
      <View style={s.bookingRow}>
        <View style={[s.bookingIcon, { backgroundColor: theme.soft }]}>
          <Ionicons name={icons[booking.kind]} size={19} color={theme.primary} />
        </View>
        <Pressable
          onPress={onDetails}
          accessibilityRole="button"
          accessibilityLabel={`Booking details: ${booking.title}`}
          style={s.flex}
        >
          <Text style={[s.bookingTitle, { color: theme.text }]} numberOfLines={1}>
            {booking.title}
          </Text>
          {when ? (
            <Text style={[s.bookingWhen, { color: theme.muted }]} numberOfLines={1}>
              {when}
            </Text>
          ) : null}
        </Pressable>
        <Pressable
          onPress={onTicket ?? onDetails}
          accessibilityRole="button"
          accessibilityLabel={onTicket ? 'View ticket' : 'View booking'}
          style={[s.ticket, { backgroundColor: theme.soft }]}
        >
          <Ionicons
            name={onTicket ? 'qr-code-outline' : 'receipt-outline'}
            size={14}
            color={theme.primary}
          />
          <Text style={[s.ticketText, { color: theme.primary }]}>
            {onTicket ? 'Ticket' : 'Details'}
          </Text>
        </Pressable>
      </View>
      <View style={[s.bookingMeta, { backgroundColor: theme.field }]}>
        <Text style={[s.bookingCode, { color: theme.primary }]} numberOfLines={1}>
          #{booking.code}
        </Text>
        <Text style={[s.bookingState, { color: theme.muted }]} numberOfLines={1}>
          {booking.seats.length
            ? `Seats ${booking.seats.join(', ')}`
            : booking.status?.replace(/_/g, ' ') || 'Linked booking'}
        </Text>
      </View>
    </TravelSurface>
  );
}

export const CHAT_QUICK_REPLIES = [
  'Where is the pickup point?',
  'What time do we depart?',
  'Please share an update.',
];
export function ChatQuickReplies({
  onSelect,
  disabled = false,
}: {
  onSelect: (text: string) => void;
  disabled?: boolean;
}) {
  const theme = useHomeDesign();
  return (
    <ScrollView
      horizontal
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.replies}
    >
      {CHAT_QUICK_REPLIES.map((reply) => (
        <Pressable
          key={reply}
          onPress={() => onSelect(reply)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Draft reply: ${reply}`}
          accessibilityHint="Adds this text to your message draft."
          style={[
            s.reply,
            {
              borderColor: theme.border,
              backgroundColor: theme.surface,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          <Text style={[s.replyText, { color: theme.text }]}>{reply}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  heading: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, gap: 5 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  headingTitle: { fontFamily: Fonts.displayBold, fontSize: 20, lineHeight: 26 },
  newBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  newText: { fontFamily: Fonts.bodySemiBold, fontSize: 10 },
  subtitle: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 18 },
  connection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  connectionText: { fontFamily: Fonts.bodyMedium, fontSize: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  filters: { paddingHorizontal: 16, gap: 8, paddingTop: 12, paddingBottom: 16 },
  filter: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
  },
  filterText: { fontFamily: Fonts.bodyMedium, fontSize: 12 },
  footer: { marginTop: 24, gap: 8 },
  infoPanel: { padding: 14, borderRadius: 28, flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 12, lineHeight: 18 },
  infoText: { fontFamily: Fonts.body, fontSize: 11, lineHeight: 16 },
  help: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: 24,
    paddingHorizontal: 14,
  },
  helpText: { fontFamily: Fonts.bodySemiBold, fontSize: 12 },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  person: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
  personName: { fontFamily: Fonts.bodyBold, fontSize: 14, lineHeight: 20 },
  personStatus: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 15 },
  presence: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
  },
  bookingPanel: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 8,
    borderWidth: 1,
    borderRadius: 16,
    gap: 6,
  },
  bookingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bookingIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingTitle: { fontFamily: Fonts.bodyBold, fontSize: 13, lineHeight: 19 },
  bookingWhen: { fontFamily: Fonts.bodyMedium, fontSize: 10, lineHeight: 15 },
  ticket: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    minHeight: 44,
    borderRadius: 22,
  },
  ticketText: { fontFamily: Fonts.bodySemiBold, fontSize: 11 },
  bookingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 6,
  },
  bookingCode: { flex: 1, fontFamily: Fonts.bodySemiBold, fontSize: 10 },
  bookingState: { flexShrink: 1, fontFamily: Fonts.bodyMedium, fontSize: 10 },
  replies: { paddingHorizontal: 12, paddingTop: 8, gap: 6 },
  reply: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  replyText: { fontFamily: Fonts.body, fontSize: 11 },
});
