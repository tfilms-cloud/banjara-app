import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/EmptyState';
import { Colors, useThemeColors } from '@/constants/colors';
import { GUIDE_PRICING_TYPE_OPTIONS } from '@/constants/guideOptions';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as guideService from '@/services/guideService';
import { useProviderStore } from '@/store/providerStore';
import type { GuideOfferedService } from '@/types/guide';
import { formatCurrency } from '@/utils/formatCurrency';
import { pushEditor, pushPath } from '@/utils/navigation';

function pricingLabel(type: GuideOfferedService['pricingType']) {
  return GUIDE_PRICING_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export function GuideServicesTab() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const provider = useProviderStore((s) => s.provider);
  const loading = useProviderStore((s) => s.loading);
  const setProvider = useProviderStore((s) => s.setProvider);
  const [services, setServices] = useState<GuideOfferedService[]>(
    provider?.guideDetails?.services ?? []
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  /** Focus reload updates local list only. Syncing provider here caused an infinite loop. */
  const reload = useCallback(async (syncProvider = false) => {
    try {
      const mine = await guideService.getMyProfile();
      setServices(mine.guideDetails.services ?? []);
      if (syncProvider) {
        const refreshed = await guideService.refreshProviderAfterGuide();
        if (refreshed) setProvider(refreshed);
      }
    } catch {
      const current = useProviderStore.getState().provider;
      setServices(current?.guideDetails?.services ?? []);
    }
  }, [setProvider]);

  useFocusEffect(
    useCallback(() => {
      // Parent ProviderServicesScreen already calls refreshDashboard on focus.
      void reload(false);
    }, [reload])
  );

  const toggleActive = async (svc: GuideOfferedService) => {
    setBusyId(svc.id);
    try {
      await guideService.updateService(svc.id, { active: !svc.active });
      await reload(true);
    } catch (error) {
      Alert.alert('Could not update', getApiErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = (svc: GuideOfferedService) => {
    Alert.alert('Remove service', `Remove "${svc.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            setBusyId(svc.id);
            try {
              await guideService.deleteService(svc.id);
              await reload(true);
            } catch (error) {
              Alert.alert('Could not remove', getApiErrorMessage(error));
            } finally {
              setBusyId(null);
            }
          })(),
      },
    ]);
  };

  if (loading && !provider) return <LoadingState title="Loading services..." />;

  const guide = provider?.guideDetails;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.lg,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.lg,
      }}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => void reload(true)}
          tintColor={colors.primary}
        />
      }
    >
      <View>
        <Text style={styles.title}>My services</Text>
        <Text style={styles.sub}>
          Hireable guide offerings — no trips or itineraries. Add what travelers can book.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{guide?.fullName ?? provider?.businessName ?? 'Guide profile'}</Text>
        <Text style={styles.sectionSub}>
          {guide?.city ?? provider?.city ?? '—'} · {(guide?.areasCovered ?? []).slice(0, 3).join(' · ') || 'Areas not set'}
        </Text>
        <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' }}>
          <Button title="Edit profile" variant="outline" compact onPress={() => pushEditor('/(provider)/register/guide')} />
          <Button
            title="Availability"
            variant="outline"
            compact
            onPress={() =>
              router.push({
                pathname: '/(provider)/register/guide',
                params: { from: 'edit', step: '7' },
              } as never)
            }
          />
          <Button title="Bookings" variant="outline" compact onPress={() => pushPath('/(provider)/(tabs)/bookings')} />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Offered services</Text>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(provider)/register/guide',
                params: { from: 'edit', step: '6' },
              } as never)
            }
          >
            <Text style={styles.link}>Add</Text>
          </Pressable>
        </View>
        {services.length === 0 ? (
          <Text style={styles.sectionSub}>No services yet. Add at least one offering travelers can hire.</Text>
        ) : (
          services.map((svc) => (
            <View key={svc.id} style={styles.serviceRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.serviceTitle}>{svc.name}</Text>
                <Text style={styles.sectionSub}>
                  {svc.durationLabel} · {formatCurrency(svc.price)} · {pricingLabel(svc.pricingType)}
                </Text>
                <Text style={styles.sectionSub}>{svc.active ? 'Active' : 'Disabled'}</Text>
              </View>
              <View style={{ gap: Spacing.xs }}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/(provider)/register/guide',
                      params: { from: 'edit', step: '6' },
                    } as never)
                  }
                >
                  <Text style={styles.link}>Edit</Text>
                </Pressable>
                <Pressable disabled={busyId === svc.id} onPress={() => void toggleActive(svc)}>
                  <Text style={styles.link}>{svc.active ? 'Disable' : 'Enable'}</Text>
                </Pressable>
                <Pressable disabled={busyId === svc.id} onPress={() => onDelete(svc)}>
                  <Text style={[styles.link, { color: Colors.danger }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Profile status</Text>
          <Ionicons name="ribbon-outline" size={18} color={Colors.primary} />
        </View>
        <Text style={styles.sectionSub}>
          {guide?.profileStatus ?? 'draft'} · {(guide?.languages ?? []).length} languages ·{' '}
          {guide?.yearsExperience ?? provider?.yearsExperience ?? 0} yrs experience
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { ...Typography.h2, color: Colors.dark },
  sub: { ...Typography.caption, color: Colors.muted, marginTop: Spacing.xs },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: Fonts.display, fontSize: 18, color: Colors.dark },
  sectionSub: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  link: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.primary },
  serviceRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  serviceTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.dark },
});
