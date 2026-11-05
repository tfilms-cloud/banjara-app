import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ComponentType, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/Header';
import { TravelFormCard } from '@/components/ui/TravelForm';
import { TravelDesignProvider } from '@/components/ui/TravelDesignProvider';
import { TravelIconAction, type TravelIcon } from '@/components/ui/TravelPrimitives';
import { useThemeColors } from '@/constants/colors';
import { useHomeDesign } from '@/constants/homeDesign';
import { Fonts } from '@/constants/typography';
import type { PickupPoint } from '@/types/route';
import type { TripWithDetails } from '@/types/trip';
import { formatDate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';
import { safeBack } from '@/utils/navigation';
export function withBookingFlow(Screen: ComponentType) {
    return function BookingFlowScreen() {
        return <TravelDesignProvider><Screen /></TravelDesignProvider>;
    };
}
/** The existing travel palette, including readable seat states in both appearances. */
export function useBookingColors() {
    const colors = useThemeColors();
    const theme = useHomeDesign();
    return {
        ...colors, primary: theme.primary, action: theme.primary, actionDark: theme.primary,
        primarySoft: theme.soft, actionSoft: theme.soft, background: theme.background,
        card: theme.surface, elevated: theme.surface, inputBg: theme.field,
        surfaceSecondary: theme.field, dark: theme.text, secondaryDark: theme.text,
        muted: theme.muted, border: theme.border, secondary: theme.primary,
        seatAvailable: theme.surface, seatSelected: theme.primary, seatOccupied: theme.field,
        onPrimary: theme.background,
    };
}
export function BookingFlowHeader({ title, subtitle, onBack, fallbackHref, right, step }: ComponentProps<typeof Header> & {
    step?: 1 | 2 | 3 | 4;
}) {
    const theme = useHomeDesign();
    const insets = useSafeAreaInsets();
    return <View style={{ backgroundColor: theme.background, paddingTop: insets.top + 6, borderBottomWidth: 1, borderBottomColor: theme.border }}>
    <View style={s.header}>
      <TravelIconAction icon="arrow-back" label="Go back" filled onPress={onBack ?? (() => safeBack(fallbackHref ?? '/(customer)/(tabs)'))}/>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[s.eyebrow, { color: theme.primary }]}>YOUR JOURNEY, YOUR WAY</Text>
        <Text accessibilityRole="header" style={[s.headerTitle, { color: theme.text }]}>{title}</Text>
      </View>
      {right}
    </View>
    {subtitle ? <Text style={[s.subtitle, { color: theme.muted }]}>{subtitle}</Text> : null}
    {step ? <BookingFlowSteps step={step}/> : <View style={{ height: 10 }}/>}
  </View>;
}
export function BookingFlowSteps({ step }: {
    step: 1 | 2 | 3 | 4;
}) {
    const theme = useHomeDesign();
    return <View style={s.steps} accessibilityLabel={`Booking step ${step} of 4`}>
    {['Pickup', 'Seats', 'Review', 'Payment'].map((label, index) => <View key={label} style={{ flex: 1, gap: 7 }}>
      <View style={{ height: 3, borderRadius: 2, backgroundColor: index < step ? theme.primary : theme.border }}/>
      <Text style={[s.stepLabel, { color: index === step - 1 ? theme.primary : theme.muted }]} accessibilityLabel={`${label}${index === step - 1 ? ', current step' : index < step ? ', completed' : ''}`}>{index < step - 1 ? '✓ ' : ''}{label}</Text>
    </View>)}
  </View>;
}
export function BookingJourneyCard({ trip, pickup, seats, onEdit, compact = false }: {
    trip: TripWithDetails;
    pickup?: PickupPoint | null;
    seats?: string[];
    onEdit?: () => void;
    compact?: boolean;
}) {
    const theme = useHomeDesign();
    return <TravelFormCard style={{ padding: compact ? 16 : 18, gap: compact ? 10 : 14 }}>
    {!compact ? <View style={s.row}>
      <View style={[s.pill, { backgroundColor: theme.soft }]}><Ionicons name="bus-outline" size={14} color={theme.primary}/><Text style={[s.pillText, { color: theme.primary }]}>YOUR DEPARTURE</Text></View>
      {onEdit ? <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel="Edit trip selection" style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' }}><Text style={[s.edit, { color: theme.primary }]}>Edit</Text></Pressable> : null}
    </View> : null}
    <View style={[s.row, { gap: 10, alignItems: 'flex-start' }]}>
      <Text style={[s.city, { color: theme.text }]}>{trip.from}</Text>
      <Ionicons name="arrow-forward" size={20} color={theme.primary} style={{ marginTop: 4 }}/>
      <Text style={[s.city, { color: theme.text, textAlign: 'right' }]}>{trip.to}</Text>
    </View>
    <Text style={[s.meta, { color: theme.muted }]}>{[trip.date ? formatDate(trip.date, false) : '', trip.departureTime ? formatTime(trip.departureTime) : ''].filter(Boolean).join(' · ')}</Text>
    <View style={[s.details, { borderTopColor: theme.border }, compact && { paddingTop: 0, borderTopWidth: 0, gap: 6 }]}>
      {!compact ? <>
      <JourneyLine icon="business-outline" value={trip.agency.name}/>
      <JourneyLine icon="bus-outline" value={trip.vehicleName}/>
      <JourneyLine icon={trip.journeyType === 'round_trip' ? 'swap-horizontal-outline' : 'arrow-forward-outline'} value={trip.journeyType === 'round_trip' ? `Return · ${trip.returnDate ? formatDate(trip.returnDate, false) : 'Date to be confirmed'}${trip.returnTime ? ` · ${formatTime(trip.returnTime)}` : ''}` : 'One-way journey'}/>
      </> : null}
      {pickup ? <JourneyLine icon="location-outline" value={`${pickup.name}${pickup.time ? ` · ${formatTime(pickup.time)}` : ''}`}/> : null}
      {seats?.length ? <JourneyLine icon="grid-outline" value={`Seats ${seats.join(' · ')}`}/> : null}
    </View>
  </TravelFormCard>;
}
function JourneyLine({ icon, value }: {
    icon: TravelIcon;
    value?: string;
}) {
    const theme = useHomeDesign();
    if (!value)
        return null;
    return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><Ionicons name={icon} size={16} color={theme.primary}/><Text style={[s.meta, { color: theme.muted, flex: 1 }]}>{value}</Text></View>;
}
export function BookingFlowSection({ title, description, icon, children }: {
    title: string;
    description?: string;
    icon?: TravelIcon;
    children: ReactNode;
}) {
    const theme = useHomeDesign();
    return <TravelFormCard style={{ padding: 18, gap: 16 }}>
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      {icon ? <View style={[s.sectionIcon, { backgroundColor: theme.soft }]}><Ionicons name={icon} size={19} color={theme.primary}/></View> : null}
      <View style={{ flex: 1, gap: 4 }}><Text accessibilityRole="header" style={[s.sectionTitle, { color: theme.text }]}>{title}</Text>{description ? <Text style={[s.meta, { color: theme.muted }]}>{description}</Text> : null}</View>
    </View>
    {children}
  </TravelFormCard>;
}
export function BookingFlowFooter({ children }: {
    children: ReactNode;
}) {
    const theme = useHomeDesign();
    const insets = useSafeAreaInsets();
    return <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 12) + 6, gap: 12, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border }}>{children}</View>;
}
export function BookingFlowNotice({ title, message, icon = 'information-circle-outline' }: {
    title: string;
    message: string;
    icon?: TravelIcon;
}) {
    const theme = useHomeDesign();
    return <View style={{ padding: 16, borderRadius: 20, backgroundColor: theme.soft, flexDirection: 'row', gap: 10 }}>
    <Ionicons name={icon} size={20} color={theme.primary}/>
    <View style={{ flex: 1, gap: 4 }}><Text style={[s.noticeTitle, { color: theme.text }]}>{title}</Text><Text style={[s.meta, { color: theme.muted }]}>{message}</Text></View>
  </View>;
}
const s = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
    eyebrow: { fontFamily: Fonts.bodySemiBold, fontSize: 9, letterSpacing: 1.2 },
    headerTitle: { fontFamily: Fonts.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.5 },
    subtitle: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 18, paddingHorizontal: 20, paddingBottom: 6 },
    steps: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
    stepLabel: { fontFamily: Fonts.bodyMedium, fontSize: 11, lineHeight: 17 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    city: { flex: 1, fontFamily: Fonts.display, fontSize: 23, lineHeight: 29, letterSpacing: -0.5 },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    pillText: { fontFamily: Fonts.bodySemiBold, fontSize: 9, letterSpacing: 0.8 },
    edit: { fontFamily: Fonts.bodySemiBold, fontSize: 12 },
    meta: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 19 },
    details: { borderTopWidth: 1, paddingTop: 12, gap: 9 },
    sectionIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    sectionTitle: { fontFamily: Fonts.display, fontSize: 18, lineHeight: 24 },
    noticeTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 13, lineHeight: 19 },
});
