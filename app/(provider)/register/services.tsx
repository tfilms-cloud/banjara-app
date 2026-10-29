import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { LoadingState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import {
  SERVICE_OPTIONS,
  editServiceHref,
  normalizeServiceKey,
  serviceLabel,
} from '@/constants/providerOptions';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import * as serviceCatalogService from '@/services/serviceCatalogService';
import type { CatalogService } from '@/services/serviceCatalogService';
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

  const [catalog, setCatalog] = useState<CatalogService[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const inOnboarding = needsProviderOnboarding(user) || (provider?.services.includes('transport') && !provider.onboardingProgress?.completed);
  const lockedType = provider?.services?.[0]
    ? normalizeServiceKey(provider.services[0])
    : !inOnboarding && selected[0]
      ? normalizeServiceKey(selected[0])
      : undefined;
  const locked = Boolean(lockedType);
  const canLeave = !inOnboarding && (locked || Boolean(user?.providerId));

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      setCatalog(await serviceCatalogService.listActiveServices());
    } catch {
      setCatalog([]);
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

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

  const lockedEmoji =
    catalog.find((item) => item.key === lockedType)?.emoji ??
    SERVICE_OPTIONS.find((item) => item.type === lockedType)?.emoji ??
    '✓';
  const lockedLabel = lockedType
    ? catalog.find((item) => item.key === lockedType)?.label ?? serviceLabel(lockedType)
    : '';
  const lockedDesc =
    catalog.find((item) => item.key === lockedType)?.description ??
    SERVICE_OPTIONS.find((item) => item.type === lockedType)?.description ??
    '';

  if (loadingCatalog && catalog.length === 0) {
    return <LoadingState title="Loading services..." />;
  }

  const options = catalog.length
    ? catalog
    : SERVICE_OPTIONS.map((item, index) => ({
        id: item.type,
        key: item.type,
        label: item.label,
        emoji: item.emoji,
        description: item.description,
        active: true,
        sortOrder: index + 1,
      }));

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
            ? 'You can edit this service. BANJARA accounts offer one service only.'
            : 'Choose one — Transportation, Lodging, Tour Operators, Guides, or Restaurants.'}
        </Text>

        {locked && lockedType ? (
          <View style={[styles.card, styles.cardActive]}>
            <Text style={styles.emoji}>{lockedEmoji}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.title}>{lockedLabel}</Text>
              {lockedDesc ? <Text style={styles.desc}>{lockedDesc}</Text> : null}
              <Text style={styles.check}>✓ Your service</Text>
            </View>
          </View>
        ) : (
          <View style={styles.list}>
            {options.map((option) => {
              const key = normalizeServiceKey(option.key);
              const active = normalizeServiceKey(selected[0] ?? '') === key;
              return (
                <Pressable
                  key={option.key}
                  style={[styles.card, active && styles.cardActive]}
                  onPress={() => toggleService(key)}
                  accessibilityState={{ selected: active }}
                >
                  <Text style={styles.emoji}>{option.emoji}</Text>
                  <View style={styles.cardBody}>
                    <Text style={styles.title}>{option.label}</Text>
                    <Text style={styles.desc} numberOfLines={2}>
                      {option.description}
                    </Text>
                    {active ? <Text style={styles.check}>✓ Selected</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
        {locked && lockedType && !inOnboarding ? (
          <Button
            title={`Edit ${lockedLabel || serviceLabel(lockedType)}`}
            onPress={() => pushPath(editServiceHref(lockedType))}
          />
        ) : (
          <Button
            title="Continue"
            disabled={!selected[0] && !lockedType}
            onPress={() => {
              const type = normalizeServiceKey(lockedType ?? selected[0] ?? '');
              if (!type) return;
              if (type === 'transport') {
                router.push('/(provider)/register/business');
                return;
              }
              // Create the provider profile at the location step first.
              // Guide APIs (/guides/me/profile) require a providerId — skipping
              // location caused CastError → "Invalid identifier".
              router.push({
                pathname: '/(provider)/location',
                params: { mode: 'onboarding' },
              } as never);
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.md },
  heading: { ...Typography.h2, color: Colors.dark },
  sub: { ...Typography.body, color: Colors.muted, lineHeight: 20 },
  list: { gap: Spacing.sm, marginTop: Spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  cardActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  emoji: { fontSize: 26, lineHeight: 32, marginTop: 2 },
  cardBody: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.dark },
  desc: { ...Typography.caption, color: Colors.muted, lineHeight: 17 },
  check: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.primary, marginTop: 4 },
  cta: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
});
