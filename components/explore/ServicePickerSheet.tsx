import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { ExploreServiceTab } from '@/constants/exploreCatalog';
import { useExploreDesign } from '@/constants/exploreDesign';
import { Fonts } from '@/constants/typography';
import { NEAR_DEFAULT_KM, locateVisitor, type LocateResult } from '@/utils/nearMe';
import { pushPath } from '@/utils/navigation';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
const OTHERS: { id: Exclude<ExploreServiceTab, 'transport'>; label: string; hint: string; icon: IconName }[] = [
  { id: 'hotels', label: 'Stay', hint: 'Hotels & guest houses', icon: 'office-building-outline' },
  { id: 'tours', label: 'Tours', hint: 'Treks & expeditions', icon: 'image-filter-hdr' },
  { id: 'guides', label: 'Guides', hint: 'Local experts', icon: 'sign-direction' },
  { id: 'restaurants', label: 'Restaurants', hint: 'Food & offers', icon: 'silverware-fork-knife' },
];

type Step = 'choose' | 'locating' | Extract<LocateResult, { ok: false }>['reason'];

const FAILURE_COPY: Record<Exclude<Step, 'choose' | 'locating'>, { title: string; body: string }> = {
  denied: {
    title: 'Location access is off',
    body: 'Allow location so we can show rides with pickups near you.',
  },
  blocked: {
    title: 'Location is blocked for BANJARA',
    body: 'Turn on location for BANJARA in your phone settings, then come back and try again.',
  },
  'services-off': {
    title: 'Your location is turned off',
    body: 'Switch on location (GPS) on your phone, then try again.',
  },
  unavailable: {
    title: 'We couldn’t find your location',
    body: 'Please check your signal and try again, or browse every ride.',
  },
};

/**
 * "What are you looking for?" — shown when the visitor opens Explore. Ride asks for location
 * and opens the nearby-rides map; the other services open their tab.
 */
export function ServicePickerSheet({
  visible,
  startWith = 'choose',
  onPick,
  onClose,
}: {
  visible: boolean;
  /** 'locating' skips the question (the "Rides near me" button). */
  startWith?: 'choose' | 'locating';
  onPick: (service: ExploreServiceTab) => void;
  onClose: () => void;
}) {
  const theme = useExploreDesign();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(startWith);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const findRides = async () => {
    setStep('locating');
    const result = await locateVisitor();
    if (!alive.current) return;
    if (!result.ok) {
      setStep(result.reason);
      return;
    }
    onClose();
    pushPath(
      `/(customer)/explore/nearby?lat=${result.latitude.toFixed(5)}&lng=${result.longitude.toFixed(5)}`,
    );
  };

  // Reset to the requested first step each time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    setStep(startWith);
    if (startWith === 'locating') void findRides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, startWith]);

  const failure = step !== 'choose' && step !== 'locating' ? FAILURE_COPY[step] : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View
          style={[
            s.sheet,
            { backgroundColor: theme.surface, paddingBottom: insets.bottom + 16 },
          ]}
          accessibilityViewIsModal
        >
          <View style={[s.handle, { backgroundColor: theme.border }]} />
          <Pressable
            onPress={onClose}
            style={[s.close, { backgroundColor: theme.field }]}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
          >
            <Ionicons name="close" size={20} color={theme.muted} />
          </Pressable>

          {step === 'choose' ? (
            <>
              <Text style={[s.eyebrow, { color: theme.primary }]}>WELCOME TO EXPLORE</Text>
              <Text style={[s.title, { color: theme.text }]} accessibilityRole="header">
                What are you looking for?
              </Text>
              <Text style={[s.lead, { color: theme.muted }]}>
                Pick a service and we’ll take you straight there.
              </Text>

              <Pressable
                onPress={() => void findRides()}
                accessibilityRole="button"
                accessibilityLabel={`Ride. Find rides with pickups within ${NEAR_DEFAULT_KM} kilometres of you. Uses your location.`}
                style={({ pressed }) => [
                  s.ride,
                  { borderColor: theme.primary, backgroundColor: theme.soft, opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <LinearGradient
                  colors={['#1FC77A', '#0F9B98']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.rideIcon}
                >
                  <MaterialCommunityIcons name="car" size={28} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[s.rideTitle, { color: theme.text }]}>Ride</Text>
                  <Text style={[s.rideHint, { color: theme.muted }]}>Find rides with pickups near you</Text>
                  <View style={s.rideTag}>
                    <Ionicons name="locate" size={13} color={theme.primary} />
                    <Text style={[s.rideTagText, { color: theme.primary }]}>
                      Uses your location · within {NEAR_DEFAULT_KM} km
                    </Text>
                  </View>
                </View>
                <Ionicons name="arrow-forward" size={20} color={theme.primary} />
              </Pressable>

              <View style={s.grid}>
                {OTHERS.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() => onPick(option.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${option.label}. ${option.hint}`}
                    style={({ pressed }) => [
                      s.option,
                      { borderColor: theme.border, backgroundColor: theme.surface, opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <View style={[s.optionIcon, { backgroundColor: theme.field }]}>
                      <MaterialCommunityIcons name={option.icon} size={22} color={theme.primary} />
                    </View>
                    <Text style={[s.optionTitle, { color: theme.text }]}>{option.label}</Text>
                    <Text style={[s.optionHint, { color: theme.muted }]} numberOfLines={1}>
                      {option.hint}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable onPress={onClose} style={s.skip} accessibilityRole="button">
                <Text style={[s.skipText, { color: theme.primary }]}>Just browse everything</Text>
              </Pressable>
            </>
          ) : step === 'locating' ? (
            <View style={s.state} accessibilityLiveRegion="polite">
              <LinearGradient colors={['#1FC77A', '#0F9B98']} style={s.stateIcon}>
                <ActivityIndicator color="#fff" size="large" />
              </LinearGradient>
              <Text style={[s.title, s.center, { color: theme.text }]}>Finding rides near you…</Text>
              <Text style={[s.lead, s.center, { color: theme.muted }]}>
                Allow location when asked. We only use it to show pickups within {NEAR_DEFAULT_KM} km,
                and we don’t store it.
              </Text>
              <Pressable onPress={() => onPick('transport')} style={s.skip} accessibilityRole="button">
                <Text style={[s.skipText, { color: theme.primary }]}>Skip and browse all rides</Text>
              </Pressable>
            </View>
          ) : failure ? (
            <View style={s.state} accessibilityLiveRegion="assertive">
              <View style={[s.stateIcon, { backgroundColor: '#FFF1D6' }]}>
                <MaterialCommunityIcons name="map-marker-off-outline" size={30} color="#9A5B00" />
              </View>
              <Text style={[s.title, s.center, { color: theme.text }]}>{failure.title}</Text>
              <Text style={[s.lead, s.center, { color: theme.muted }]}>{failure.body}</Text>
              {step === 'blocked' ? (
                <Pressable
                  onPress={() => void Linking.openSettings()}
                  style={[s.primary, { backgroundColor: theme.action }]}
                  accessibilityRole="button"
                >
                  <Ionicons name="settings-outline" size={18} color="#fff" />
                  <Text style={s.primaryText}>Open settings</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => void findRides()}
                style={[
                  s.primary,
                  step === 'blocked'
                    ? { backgroundColor: theme.field }
                    : { backgroundColor: theme.action },
                ]}
                accessibilityRole="button"
              >
                <Ionicons name="locate" size={18} color={step === 'blocked' ? theme.text : '#fff'} />
                <Text style={[s.primaryText, step === 'blocked' ? { color: theme.text } : null]}>
                  Try again
                </Text>
              </Pressable>
              <Pressable
                onPress={() => onPick('transport')}
                style={[s.secondary, { borderColor: theme.border }]}
                accessibilityRole="button"
              >
                <Text style={[s.secondaryText, { color: theme.text }]}>Browse all rides</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,30,28,0.55)' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: 14 },
  close: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  eyebrow: { fontFamily: Fonts.bodyBold, fontSize: 12, letterSpacing: 0.8 },
  title: { fontFamily: Fonts.displayBold, fontSize: 23, marginTop: 4, paddingRight: 44 },
  lead: { fontFamily: Fonts.body, fontSize: 14, lineHeight: 20, marginTop: 6 },
  center: { textAlign: 'center', paddingRight: 0 },
  ride: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 18,
    padding: 14,
    borderWidth: 1.5,
    borderRadius: 20,
  },
  rideIcon: { width: 56, height: 56, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  rideTitle: { fontFamily: Fonts.displayBold, fontSize: 18 },
  rideHint: { fontFamily: Fonts.body, fontSize: 13, marginTop: 1 },
  rideTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  rideTagText: { fontFamily: Fonts.bodySemiBold, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  option: { width: '48%', flexGrow: 1, padding: 12, borderWidth: 1, borderRadius: 18 },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  optionTitle: { fontFamily: Fonts.display, fontSize: 16 },
  optionHint: { fontFamily: Fonts.body, fontSize: 12, marginTop: 1 },
  skip: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, marginTop: 8 },
  skipText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, textDecorationLine: 'underline' },
  state: { alignItems: 'center', paddingTop: 12 },
  stateIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  primary: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: 999,
    marginTop: 12,
  },
  primaryText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: '#fff' },
  secondary: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 8,
  },
  secondaryText: { fontFamily: Fonts.bodySemiBold, fontSize: 15 },
});
