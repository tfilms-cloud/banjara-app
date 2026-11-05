import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PriceCard } from '@/components/booking/PriceCard';
import { HowPaymentWorksNote } from '@/components/payments/HowPaymentWorksNote';
import { PaymentMethodIcon } from '@/components/payments/PayoutChannelIcon';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/EmptyState';
import { BookingFlowHeader as Header, BookingFlowFooter, useBookingColors, withBookingFlow, BookingJourneyCard, BookingFlowNotice } from '@/components/booking/BookingFlowPresentation';
import {
  toStorePaymentMethod,
  type CustomerPaymentMethodId,
} from '@/constants/payments';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useProviderPaymentMethods } from '@/hooks/useProviderPaymentMethods';
import { getApiErrorMessage } from '@/services/apiError';
import { useBookingStore } from '@/store/bookingStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { navigateAfterBookingPayment } from '@/utils/p2pPaymentNav';

function PaymentScreen() {
  const Colors = useBookingColors();
  const styles = makeStyles(Colors);
  const insets = useSafeAreaInsets();
  const {
    selectedTrip,
    selectedPickup,
    selectedSeats,
    setPaymentMethod,
    priceBreakdown,
    confirmBooking,
    isSubmitting,
  } = useBookingStore();
  const providerId = selectedTrip?.agencyId;
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
      const booking = await confirmBooking();
      navigateAfterBookingPayment({
        method: selected,
        paymentId: booking.paymentId,
        bookingId: booking.id,
        successPath: '/(customer)/booking/success',
      });
    } catch (err) {
      Alert.alert('Payment failed', getApiErrorMessage(err));
    }
  };

  if (!selectedTrip || !priceBreakdown) {
    return (
      <View style={styles.container}>
        <Header step={4} title="Choose payment method" showBack fallbackHref="/(customer)/(tabs)/bookings" />
        <View style={{ padding: 20 }}><BookingFlowNotice title="Your booking selection is unavailable" message="Return to your trip and try again when live data is available." /></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header step={4}
        title="Choose payment method"
        showBack
        fallbackHref="/(customer)/booking/review"
        onBack={() => {
          // Keep seat hold if booking already created — user can resume pay.
          router.back();
        }}
      />
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 120,
          gap: Spacing.lg,
        }}
      >
        <BookingJourneyCard trip={selectedTrip} pickup={selectedPickup} seats={selectedSeats} compact />
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Amount due</Text>
          <Text style={styles.amount}>
            {formatCurrency(priceBreakdown.total, priceBreakdown.currency)}
          </Text>
          <Text style={styles.meta}>
            {selectedTrip.from} → {selectedTrip.to}
          </Text>
        </View>


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
              This provider has not added any Bank, Easypaisa, JazzCash, or Raast account yet.
              Ask them to add a receiving account in Payment accounts before you can pay.
            </Text>
          </View>
        ) : null}

        {!loading &&
          methods.map((method) => {
            const active = selected === method.id;
            return (
              <Pressable
                key={method.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={`${method.label}. ${method.hint}`}
                style={[styles.method, active && styles.methodActive]}
                onPress={() => {
                  setSelected(method.id);
                  setPaymentMethod(toStorePaymentMethod(method.id));
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

        <PriceCard breakdown={priceBreakdown} />
        <HowPaymentWorksNote compact />
      </ScrollView>

      <BookingFlowFooter>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><Text style={{ ...Typography.caption, color: Colors.muted }}>Amount due</Text><Text style={{ ...Typography.bodyBold, color: Colors.primary }}>{formatCurrency(priceBreakdown.total, priceBreakdown.currency)}</Text></View>
        <Button
          title="Continue to pay"
          loading={isSubmitting}
          disabled={!selected || loading || Boolean(error)}
          onPress={() => void onPay()}
        />
      </BookingFlowFooter>
    </View>
  );
}

function makeStyles(Colors: ReturnType<typeof useBookingColors>) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  empty: { ...Typography.body, color: Colors.muted, padding: Spacing.lg },
  summary: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing['2xl'],
  },
  summaryLabel: { ...Typography.caption, color: Colors.muted },
  amount: { ...Typography.h1, color: Colors.primary, marginTop: 4 },
  meta: { ...Typography.caption, color: Colors.muted, marginTop: 8 },
  section: { ...Typography.h3, color: Colors.dark },
  warn: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 24,
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
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodLabel: { ...Typography.bodyBold, color: Colors.dark },
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
}); }

export default withBookingFlow(PaymentScreen);
