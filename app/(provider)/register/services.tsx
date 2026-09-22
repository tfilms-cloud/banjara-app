import { router, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import {
  SERVICE_OPTIONS,
  editServiceHref,
  serviceLabel,
} from '@/constants/providerOptions';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { useProviderStore } from '@/store/providerStore';
import { leaveProviderEditor, pushPath } from '@/utils/navigation';
import { needsProviderOnboarding } from '@/utils/routing';

export default function ProviderSelectServicesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const selected = useProviderStore((state) => state.draft.selectedServices);
  const toggleService = useProviderStore((state) => state.toggleService);
  const provider = useProviderStore((state) => state.provider);
  const loadProvider = useProviderStore((state) => state.loadProvider);
  const loadProviderByUser = useProviderStore((state) => state.loadProviderByUser);

  const inOnboarding = needsProviderOnboarding(user);
  const lockedType = provider?.services?.[0] ?? (!inOnboarding ? selected[0] : undefined);
  const locked = Boolean(lockedType);
  const canLeave = locked || Boolean(user?.providerId);

  useEffect(() => {
    if (user?.providerId) {
      void loadProvider(user.providerId);
    } else if (user?.id) {
      void loadProviderByUser(user.id);
    }
  }, [user?.id, user?.providerId, loadProvider, loadProviderByUser]);

  useEffect(() => {
    if (canLeave) return;

    navigation.setOptions?.({ gestureEnabled: false });
    const unsub = navigation.addListener(
      'beforeRemove',
      (event: { data: { action: { type: string } }; preventDefault: () => void }) => {
        const type = event.data.action.type;
        if (type === 'GO_BACK' || type === 'POP') {
          event.preventDefault();
        }
      }
    );
    const hardware = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => {
      unsub();
      hardware.remove();
    };
  }, [canLeave, navigation]);

  return (
    <View style={styles.container}>
      <Header
        title={locked ? 'Your service' : 'Select service'}
        showBack={canLeave}
        fallbackHref={'/(provider)/(tabs)/services'}
        onBack={canLeave ? () => leaveProviderEditor(user) : undefined}
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        <Text style={styles.heading}>
          {locked ? 'This is the service you offer' : 'What service do you provide?'}
        </Text>
        <Text style={styles.sub}>
          {locked
            ? 'You can edit this service. BANJARA accounts offer one service only, so another cannot be added.'
            : 'Choose one service. After you add it you can edit that service, but you cannot add a second one.'}
        </Text>

        {locked && lockedType ? (
          <View style={[styles.card, styles.cardActive]}>
            <Text style={styles.emoji}>
              {SERVICE_OPTIONS.find((item) => item.type === lockedType)?.emoji ?? '✓'}
            </Text>
            <Text style={styles.title}>{serviceLabel(lockedType)}</Text>
            <Text style={styles.desc}>This is the only service on your account.</Text>
            <Text style={styles.check}>✓ Your service</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {SERVICE_OPTIONS.map((option) => {
              const active = selected[0] === option.type;
              return (
                <Pressable
                  key={option.type}
                  style={[styles.card, active && styles.cardActive]}
                  onPress={() => toggleService(option.type)}
                  accessibilityState={{ selected: active }}
                >
                  <Text style={styles.emoji}>{option.emoji}</Text>
                  <Text style={styles.title}>{option.label}</Text>
                  <Text style={styles.desc}>{option.description}</Text>
                  {active ? <Text style={styles.check}>✓ Selected</Text> : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
        {locked && lockedType ? (
          <Button
            title={`Edit ${serviceLabel(lockedType)}`}
            onPress={() => pushPath(editServiceHref(lockedType))}
          />
        ) : (
          <Button
            title="Continue"
            disabled={selected.length !== 1}
            onPress={() => router.push('/(provider)/register/business')}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.md },
  heading: { ...Typography.h1, color: Colors.dark },
  sub: { ...Typography.body, color: Colors.muted, marginBottom: Spacing.sm },
  grid: { gap: Spacing.md },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 4,
  },
  cardActive: { borderColor: Colors.secondary, backgroundColor: Colors.softGreen },
  emoji: { fontSize: 28 },
  title: { ...Typography.h3, color: Colors.dark },
  desc: { ...Typography.caption, color: Colors.muted },
  check: { ...Typography.caption, color: Colors.secondary, fontWeight: '700', marginTop: 4 },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
