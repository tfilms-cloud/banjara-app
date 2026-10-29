import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as providerService from '@/services/providerService';
import { useGuideBookingStore } from '@/store/guideBookingStore';
import type { GuideOfferedService } from '@/types/guide';
import { formatCurrency } from '@/utils/formatCurrency';
import { paramId } from '@/utils/navigation';

export default function GuideBookScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = paramId(params.id);
  const [loading, setLoading] = useState(true);

  const {
    providerName,
    service,
    date,
    startTime,
    endTime,
    guests,
    meetingPoint,
    availableLocation,
    specialRequest,
    guest,
    priceBreakdown,
    initProvider,
    setService,
    setDate,
    setStartTime,
    setEndTime,
    setGuests,
    setMeetingPoint,
    setAvailableLocation,
    setSpecialRequest,
    setGuest,
  } = useGuideBookingStore();

  const [serviceOptions, setServiceOptions] = useState<GuideOfferedService[]>([]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void providerService
      .getPublicProviderById(id)
      .then((provider) => {
        if (!alive || !provider) return;
        const guide = provider.guideDetails;
        const legacy = provider.tour;
        const list = (guide?.services ?? []).filter((s) => s.active !== false);
        let options = list;
        if (!options.length) {
          const rate = guide?.dailyHireRate ?? legacy?.dailyHireRate ?? legacy?.price ?? 0;
          if (rate > 0) {
            options = [
              {
                id: '',
                name: 'Daily guide hire',
                category: 'local',
                description: '',
                durationLabel: 'Full day',
                durationHours: 8,
                price: rate,
                pricingType: 'per_day',
                currency: 'PKR',
                minGuests: 1,
                maxGuests: 20,
                included: [],
                excluded: [],
                availableLocations: guide?.areasCovered ?? legacy?.operatingAreas ?? [],
                active: true,
              },
            ];
          }
        }
        setServiceOptions(options);
        initProvider({
          providerId: id,
          providerName:
            guide?.fullName || provider.ownerName || provider.businessName || 'Guide',
          providerUserId: provider.userId,
          guide: guide ?? undefined,
          services: options,
        });
      })
      .catch((error) => {
        Alert.alert('Could not load guide', getApiErrorMessage(error));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id, initProvider]);

  const activeService = service ?? serviceOptions[0] ?? null;
  const max = activeService?.maxGuests ?? 20;
  const min = activeService?.minGuests ?? 1;

  const onContinue = () => {
    if (!id || !activeService) {
      Alert.alert('Unavailable', 'This guide has not set hire rates yet.');
      return;
    }
    if (!date.trim()) {
      Alert.alert('Date required', 'Pick your guide date.');
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(startTime)) {
      Alert.alert('Start time', 'Use HH:MM format (e.g. 09:00).');
      return;
    }
    if (!guest.name.trim() || guest.name.trim().length < 2) {
      Alert.alert('Name required', 'Enter the lead guest name.');
      return;
    }
    if (!guest.email.trim() || !guest.email.includes('@')) {
      Alert.alert('Email required', 'Enter a valid email.');
      return;
    }
    if (!guest.phone.trim() || guest.phone.trim().length < 10) {
      Alert.alert('Phone required', 'Enter a valid phone number.');
      return;
    }
    router.push('/(customer)/guides/review');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="Book guide" showBack />
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 100,
          gap: Spacing.md,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <Text style={styles.hint}>Loading…</Text>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.title}>{providerName || 'Guide'}</Text>
              {activeService ? (
                <Text style={styles.meta}>
                  {activeService.name} · {formatCurrency(activeService.price, activeService.currency)}
                </Text>
              ) : null}
            </View>

            {serviceOptions.length > 1 ? (
              <>
                <Text style={styles.label}>Service</Text>
                {serviceOptions.map((svc) => {
                  const active = (service?.id || service?.name) === (svc.id || svc.name);
                  return (
                    <Pressable
                      key={svc.id || svc.name}
                      style={[styles.servicePick, active && styles.servicePickActive]}
                      onPress={() => setService(svc)}
                    >
                      <Text style={styles.servicePickTitle}>{svc.name}</Text>
                      <Text style={styles.meta}>
                        {formatCurrency(svc.price, svc.currency)} · {svc.pricingType.replace(/_/g, ' ')}
                      </Text>
                    </Pressable>
                  );
                })}
              </>
            ) : null}

            <Input
              label="Date (YYYY-MM-DD)"
              value={date}
              onChangeText={setDate}
              leftIcon="calendar-outline"
            />
            <Input
              label="Start time (HH:MM)"
              value={startTime}
              onChangeText={setStartTime}
              placeholder="09:00"
            />
            <Input
              label="End time (HH:MM, optional)"
              value={endTime}
              onChangeText={setEndTime}
              placeholder="17:00"
            />

            <Text style={styles.label}>
              Guests ({min}–{max})
            </Text>
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepBtn}
                onPress={() => setGuests(guests - 1)}
                disabled={guests <= min}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </Pressable>
              <Text style={styles.stepValue}>{guests}</Text>
              <Pressable
                style={styles.stepBtn}
                onPress={() => setGuests(guests + 1)}
                disabled={guests >= max}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </Pressable>
            </View>

            <Input
              label="Meeting point"
              value={meetingPoint}
              onChangeText={setMeetingPoint}
              placeholder="Hotel lobby, bus stand…"
              leftIcon="location-outline"
            />
            <Input
              label="Your location (optional)"
              value={availableLocation}
              onChangeText={setAvailableLocation}
              placeholder="Where you'll be"
            />
            <Input
              label="Special request (optional)"
              value={specialRequest}
              onChangeText={setSpecialRequest}
              multiline
            />

            <Input
              label="Your name"
              value={guest.name}
              onChangeText={(name) => setGuest({ name })}
              leftIcon="person-outline"
            />
            <Input
              label="Email"
              value={guest.email}
              onChangeText={(email) => setGuest({ email })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Phone"
              value={guest.phone}
              onChangeText={(phone) => setGuest({ phone })}
              keyboardType="phone-pad"
            />

            {priceBreakdown ? (
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Estimated total</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(priceBreakdown.total, priceBreakdown.currency)}
                </Text>
                <Text style={styles.meta}>
                  Subtotal {formatCurrency(priceBreakdown.subtotal)} + tax & fee
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button title="Review booking" onPress={onContinue} disabled={loading || !activeService} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hint: { ...Typography.body, color: Colors.muted },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: 4,
  },
  title: { fontFamily: Fonts.display, fontSize: 18, color: Colors.dark },
  meta: { ...Typography.caption, color: Colors.muted },
  label: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.dark },
  servicePick: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.card,
  },
  servicePickActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  servicePickTitle: { fontFamily: Fonts.bodySemiBold, color: Colors.dark },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignSelf: 'flex-start',
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontFamily: Fonts.display, fontSize: 20, color: Colors.primary },
  stepValue: { fontFamily: Fonts.display, fontSize: 20, color: Colors.dark, minWidth: 28, textAlign: 'center' },
  totalCard: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: 4,
  },
  totalLabel: { fontFamily: Fonts.bodyMedium, color: Colors.primary },
  totalValue: { fontFamily: Fonts.display, fontSize: 22, color: Colors.primary },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.lg,
  },
});
