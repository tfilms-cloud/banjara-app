import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TravelDesignProvider } from '@/components/ui/TravelDesignProvider';
import { TravelIconAction } from '@/components/ui/TravelPrimitives';
import { useHotelDesign } from '@/constants/hotelDesign';
import { Fonts } from '@/constants/typography';
import { useUserStore } from '@/store/userStore';

export function HotelBookingFrame({
  title,
  property,
  onBack,
  onProfile,
  children,
}: {
  title: string;
  property?: string;
  onBack: () => void;
  onProfile: () => void;
  children: ReactNode;
}) {
  const theme = useHotelDesign();
  const insets = useSafeAreaInsets();
  const dark = useUserStore((state) => state.settings.darkMode);
  return (
    <TravelDesignProvider>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <View style={[s.header, { paddingTop: insets.top + 8, borderBottomColor: theme.border }]}>
          <TravelIconAction icon="arrow-back" label="Go back" onPress={onBack} />
          <View style={s.headerCopy}>
            <Text accessibilityRole="header" style={[s.title, { color: theme.text }]}>
              {title}
            </Text>
            {property ? <Text style={[s.subtitle, { color: theme.muted }]}>{property}</Text> : null}
          </View>
          <View style={{ borderRadius: 22, backgroundColor: theme.action }}>
            <TravelIconAction
              icon="person-outline"
              label="Your profile"
              onPress={onProfile}
              color={theme.background}
            />
          </View>
        </View>
        {children}
      </View>
    </TravelDesignProvider>
  );
}

/** Informational steps: later stages unlock through their existing validation flow. */
export function HotelBookingProgress({ step = 1 }: { step?: 1 | 2 | 3 }) {
  const theme = useHotelDesign();
  return (
    <View
      accessibilityLabel={`Booking step ${step} of 3`}
      style={[s.steps, { backgroundColor: theme.neutral }]}
    >
      {['Select\nRoom', 'Guest\nInfo', 'Payment'].map((label, index) => (
        <View key={label} style={s.step}>
          <View
            style={[s.number, { backgroundColor: index + 1 <= step ? theme.primary : theme.field }]}
          >
            <Text
              style={[s.numberText, { color: index + 1 <= step ? theme.background : theme.muted }]}
            >
              {index + 1}
            </Text>
          </View>
          <Text style={[s.stepText, { color: index + 1 === step ? theme.primary : theme.muted }]}>
            {label}
          </Text>
          {index < 2 ? <Ionicons name="chevron-forward" size={13} color={theme.muted} /> : null}
        </View>
      ))}
    </View>
  );
}
const s = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
  },
  headerCopy: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontFamily: Fonts.bodyBold, fontSize: 15, lineHeight: 21 },
  subtitle: { fontFamily: Fonts.bodyMedium, fontSize: 11, lineHeight: 17 },
  steps: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 13, borderRadius: 16 },
  step: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 5 },
  number: {
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { fontFamily: Fonts.bodyMedium, fontSize: 11 },
  stepText: { flex: 1, minWidth: 0, fontFamily: Fonts.bodyMedium, fontSize: 12, lineHeight: 18 },
});
