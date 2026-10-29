import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { Fonts, Typography } from '@/constants/typography';
import { useProviderPaymentMethods } from '@/hooks/useProviderPaymentMethods';
import { getApiErrorMessage } from '@/services/apiError';
import { useTourBookingStore } from '@/store/tourBookingStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { navigateAfterBookingPayment } from '@/utils/p2pPaymentNav';

export default function TourPaymentScreen() {
  const insets = useSafeAreaInsets();
  const {
    itinerary,
    priceBreakdown,
    setPaymentMethod,
    confirmPackageBooking,
    isSubmitting,
  } = useTourBookingStore();
  const providerId = itinerary?.providerId;
  const { methods, defaultMethodId, loading, hasAccounts, error, reload } =
    useProviderPaymentMethods(providerId);
  const [selected, setSelected] = useState<CustomerPaymentMethodId | null>(null);

  useEffect(() => {
    if (defaultMethodId) {
      setSelected(defaultMethodId);
      setPaymentMethod(toStorePaymentMethod(defaultMethodId));
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
      setPaymentMethod(toStorePaymentMethod(selected));
      const booking = await confirmPackageBooking();
      navigateAfterBookingPayment({
        method: selected,
        paymentId: booking.paymentId,
        bookingId: booking.id,
        successPath: '/(customer)/tours/success',
      });
    } catch (err) {
      Alert.alert('Payment failed', getApiErrorMessage(err));
    }
  };

  if (!itinerary || !priceBreakdown) {
    return (
      <View style={styles.container}>
        <Header title="Choose payment method" showBack fallbackHref="/(customer)/tours/review" />
        <Text style={styles.empty}>No package booking to pay for.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Choose payment method" showBack fallbackHref="/(customer)/tours/review" />
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
          <Text style={styles.meta}>{itinerary.title}</Text>
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
              This tour provider has not added any Bank, Easypaisa, JazzCash, or Raast account yet.
            </Text>
          </View>
        ) : null}

        {!loading &&
          methods.map((method) => {
            const active = selected === method.id;
            return (
              <Pressable
                key={method.id}
                onPress={() => {
                  setSelected(method.id);
                  setPaymentMethod(toStorePaymentMethod(method.id));
                }}
                style={[
                  styles.method,
                  {
                    borderColor: active ? Colors.primary : Colors.border,
                    backgroundColor: active ? Colors.primarySoft : Colors.card,
                  },
                ]}
              >
                <PaymentMethodIcon methodId={method.id} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.methodTitle, { color: Colors.dark }]}>{method.label}</Text>
                  <Text style={styles.methodHint}>{method.hint}</Text>
                </View>
                <Ionicons
                  name={active ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={active ? Colors.primary : Colors.muted}
                />
              </Pressable>
            );
          })}
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button
          title={isSubmitting ? 'Confirming…' : 'Continue to pay'}
          onPress={() => void onPay()}
          loading={isSubmitting}
          disabled={!selected || loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  empty: { ...Typography.body, color: Colors.muted, padding: Spacing.lg },
  summary: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: 4,
  },
  summaryLabel: { fontFamily: Fonts.bodyMedium, color: Colors.primary, fontSize: 13 },
  amount: { fontFamily: Fonts.display, fontSize: 32, color: Colors.primary },
  meta: { ...Typography.caption, color: Colors.primary },
  section: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.dark },
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
    borderWidth: 1.5,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  methodTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 15 },
  methodHint: { ...Typography.caption, color: Colors.muted, marginTop: 2 },
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
