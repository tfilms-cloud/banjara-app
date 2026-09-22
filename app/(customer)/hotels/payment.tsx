import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HotelPriceBreakdownCard } from '@/components/hotels/HotelPriceBreakdown';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import { useHotelStore } from '@/store/hotelStore';
import type { HotelPaymentMethod } from '@/types/hotel';
import { formatCurrency } from '@/utils/formatCurrency';

const methods: {
  id: HotelPaymentMethod;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  hint: string;
}[] = [
  { id: 'card', label: 'Credit / Debit Card', icon: 'card-outline', hint: 'Visa, Mastercard' },
  { id: 'wallet', label: 'Mobile Wallet', icon: 'phone-portrait-outline', hint: 'JazzCash, EasyPaisa · PKR 500 off' },
  { id: 'cash', label: 'Cash / Pay at Hotel', icon: 'cash-outline', hint: 'Pay during check-in' },
];

export default function HotelPaymentScreen() {
  const insets = useSafeAreaInsets();
  const {
    selectedHotel,
    paymentMethod,
    setPaymentMethod,
    priceBreakdown,
    confirmHotelBooking,
    isSubmitting,
  } = useHotelStore();

  const onPay = async () => {
    try {
      const booking = await confirmHotelBooking();
      router.replace({
        pathname: '/(customer)/hotels/success',
        params: { bookingId: booking.id },
      });
    } catch (error) {
      Alert.alert('Payment failed', getApiErrorMessage(error));
    }
  };

  if (!selectedHotel || !priceBreakdown) {
    return (
      <View style={styles.container}>
        <Header title="Payment" showBack />
        <Text style={styles.empty}>No hotel booking to pay for.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Hotel Payment" showBack />
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 120, gap: Spacing.lg }}
      >
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Amount due</Text>
          <Text style={styles.amount}>
            {formatCurrency(priceBreakdown.total, priceBreakdown.currency)}
          </Text>
          <Text style={styles.meta}>{selectedHotel.name}</Text>
        </View>

        <Text style={styles.section}>Payment method</Text>
        {methods.map((method) => {
          const active = paymentMethod === method.id;
          return (
            <Pressable
              key={method.id}
              style={[styles.method, active && styles.methodActive]}
              onPress={() => setPaymentMethod(method.id)}
            >
              <View style={styles.methodIcon}>
                <Ionicons name={method.icon} size={20} color={Colors.secondary} />
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
        <Button title="Pay Now" loading={isSubmitting} onPress={onPay} />
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
  methodActive: { borderColor: Colors.secondary, backgroundColor: '#F5F9FF' },
  methodIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.softBlue,
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
