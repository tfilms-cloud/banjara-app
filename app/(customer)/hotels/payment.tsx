import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HotelPriceBreakdownCard } from '@/components/hotels/HotelPriceBreakdown';
import { HowPaymentWorksNote } from '@/components/payments/HowPaymentWorksNote';
import { PaymentMethodIcon } from '@/components/payments/PayoutChannelIcon';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { LoadingState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import {
  toStorePaymentMethod,
  type CustomerPaymentMethodId,
} from '@/constants/payments';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useProviderPaymentMethods } from '@/hooks/useProviderPaymentMethods';
import { getApiErrorMessage } from '@/services/apiError';
import { useHotelStore } from '@/store/hotelStore';
import type { HotelPaymentMethod } from '@/types/hotel';
import { formatCurrency } from '@/utils/formatCurrency';
import { navigateAfterBookingPayment } from '@/utils/p2pPaymentNav';

export default function HotelPaymentScreen() {
  const insets = useSafeAreaInsets();
  const {
    selectedHotel,
    setPaymentMethod,
    priceBreakdown,
    confirmHotelBooking,
    isSubmitting,
  } = useHotelStore();
  const providerId = selectedHotel?.providerId;
  const { methods, defaultMethodId, loading, hasAccounts, error, reload } =
    useProviderPaymentMethods(providerId);
  const [selected, setSelected] = useState<CustomerPaymentMethodId | null>(null);

  useEffect(() => {
    if (defaultMethodId) {
      setSelected(defaultMethodId);
      setPaymentMethod(toStorePaymentMethod(defaultMethodId) as HotelPaymentMethod);
    } else {
      setSelected(null);
    }
  }, [defaultMethodId, setPaymentMethod]);

  const onPay = async () => {
    if (!selected) {
      Alert.alert(
        'No payment method',
        'This provider has not added any receiving accounts yet.'
      );
      return;
    }
    try {
      setPaymentMethod(toStorePaymentMethod(selected) as HotelPaymentMethod);
      const booking = await confirmHotelBooking();
      navigateAfterBookingPayment({
        method: selected,
        paymentId: booking.paymentId,
        bookingId: booking.id,
        successPath: '/(customer)/hotels/success',
      });
    } catch (err) {
      Alert.alert('Payment failed', getApiErrorMessage(err));
    }
  };

  if (!selectedHotel || !priceBreakdown) {
    return (
      <View style={styles.container}>
        <Header title="Choose payment method" showBack fallbackHref="/(customer)/hotels/review" />
        <Text style={styles.empty}>No hotel booking to pay for.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Choose payment method" showBack fallbackHref="/(customer)/hotels/review" />
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 120,
          gap: Spacing.lg,
        }}
      >
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Amount due</Text>
          <Text style={styles.amount}>
            {formatCurrency(priceBreakdown.total, priceBreakdown.currency)}
          </Text>
          <Text style={styles.meta}>{selectedHotel.name}</Text>
        </View>

        <HowPaymentWorksNote compact />

        <Text style={styles.section}>
          Provider payment methods
          {methods.length ? ` · ${methods.length} available` : ''}
        </Text>

        {loading ? <LoadingState title="Loading payment methods…" /> : null}

        {!loading && error ? (
          <View style={styles.warn}>
            <Text style={styles.warnText}>{error}</Text>
            <Button title="Retry" variant="outline" onPress={() => void reload()} />
          </View>
        ) : null}

        {!loading && !error && !hasAccounts ? (
          <View style={styles.warn}>
            <Text style={styles.warnText}>
              This hotel has not added any Bank, Easypaisa, JazzCash, or Raast account yet.
              They need to add a receiving account before you can pay.
            </Text>
          </View>
        ) : null}

        {!loading &&
          methods.map((method) => {
            const active = selected === method.id;
            return (
              <Pressable
                key={method.id}
                style={[styles.method, active && styles.methodActive]}
                onPress={() => {
                  setSelected(method.id);
                  setPaymentMethod(toStorePaymentMethod(method.id) as HotelPaymentMethod);
                }}
              >
                <View style={styles.methodIcon}>
                  <PaymentMethodIcon methodId={method.id} size={36} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodLabel}>{method.label}</Text>
                  <Text style={styles.methodHint}>{method.hint}</Text>
                </View>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>
            );
          })}

        <HotelPriceBreakdownCard breakdown={priceBreakdown} />
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button
          title="Continue to pay"
          loading={isSubmitting}
          disabled={!selected || loading}
          onPress={() => void onPay()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  empty: { ...Typography.body, color: Colors.muted, padding: Spacing.lg },
  summary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing['2xl'],
  },
  summaryLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  amount: { ...Typography.h1, color: Colors.white, marginTop: 4 },
  meta: { ...Typography.caption, color: 'rgba(255,255,255,0.75)', marginTop: 8 },
  section: { ...Typography.h3, color: Colors.primary },
  warn: {
    backgroundColor: '#FFF7ED',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  warnText: { ...Typography.caption, color: Colors.primary, lineHeight: 18 },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  methodActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  methodIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodLabel: { ...Typography.bodyBold, color: Colors.primary },
  methodHint: { ...Typography.caption, color: Colors.muted, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.secondary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.secondary },
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
