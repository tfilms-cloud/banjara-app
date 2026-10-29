import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PayoutChannelIcon } from '@/components/payments/PayoutChannelIcon';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { useProviderStore } from '@/store/providerStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { getTransporterCashState, TRANSPORTER_CASH_LIMIT } from '@/utils/transporterCash';

const PRESETS = [5000, 10000, 25000, 50000];

export default function TopUpBanjaraScreen() {
  const insets = useSafeAreaInsets();
  const earnings = useProviderStore((s) => s.earnings);
  const refreshDashboard = useProviderStore((s) => s.refreshDashboard);
  const cash = getTransporterCashState(earnings?.pendingPayout ?? 0);
  const suggested = Math.max(cash.owed, 5000);
  const [amount, setAmount] = useState(String(suggested));
  const [method, setMethod] = useState<'bank' | 'jazzcash' | 'easypaisa'>('bank');
  const [loading, setLoading] = useState(false);

  const parsed = useMemo(() => Math.max(0, Number(amount.replace(/,/g, '')) || 0), [amount]);

  const onPay = async () => {
    if (parsed < 100) {
      Alert.alert('Amount', 'Enter at least PKR 100 to top-up BANJARA.');
      return;
    }
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      await refreshDashboard();
      Alert.alert(
        'Payment submitted',
        `${formatCurrency(parsed)} top-up to BANJARA is recorded. Once confirmed, your cash remit balance updates and trip generation unlocks if you were over the limit.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Top-up BANJARA" showBack fallbackHref={'/(provider)/(tabs)/earnings' as never} />
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 40,
          gap: Spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Pay BANJARA</Text>
          <Text style={styles.heroSub}>
            Remit cash collected from customers to your BANJARA account. Limit{' '}
            {formatCurrency(TRANSPORTER_CASH_LIMIT)}.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Cash to remit</Text>
          <Text style={styles.owed}>{cash.owedLabel}</Text>
          <Text style={styles.hint}>
            {cash.blocked
              ? 'You are over the limit — top-up to generate trips again.'
              : `${cash.remainingLabel} headroom before the limit.`}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Amount (PKR)</Text>
          <View style={styles.presets}>
            {PRESETS.map((value) => (
              <Pressable
                key={value}
                style={[styles.preset, parsed === value && styles.presetOn]}
                onPress={() => setAmount(String(value))}
              >
                <Text style={[styles.presetText, parsed === value && styles.presetTextOn]}>
                  {formatCurrency(value)}
                </Text>
              </Pressable>
            ))}
          </View>
          <Input
            label="Custom amount"
            keyboardType="number-pad"
            value={amount}
            onChangeText={setAmount}
            leftIcon="cash-outline"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Payment method</Text>
          {(
            [
              { key: 'bank' as const, label: 'Bank transfer' },
              { key: 'jazzcash' as const, label: 'JazzCash' },
              { key: 'easypaisa' as const, label: 'Easypaisa' },
            ] as const
          ).map((item) => {
            const on = method === item.key;
            return (
              <Pressable
                key={item.key}
                style={[styles.method, on && styles.methodOn]}
                onPress={() => setMethod(item.key)}
              >
                <PayoutChannelIcon channel={item.key} size={28} />
                <Text style={[styles.methodText, on && styles.methodTextOn]}>{item.label}</Text>
                <Ionicons
                  name={on ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={on ? Colors.primary : Colors.muted}
                />
              </Pressable>
            );
          })}
        </View>

        <Button
          title={loading ? 'Processing…' : `Pay ${formatCurrency(parsed)} to BANJARA`}
          loading={loading}
          onPress={() => void onPay()}
          disabled={parsed < 100}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: { gap: 6 },
  heroTitle: { ...Typography.h2, color: Colors.dark },
  heroSub: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  label: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted },
  owed: { fontFamily: Fonts.display, fontSize: 28, color: Colors.primary },
  hint: { ...Typography.caption, color: Colors.muted, lineHeight: 17 },
  section: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.dark },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  preset: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSecondary,
  },
  presetOn: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  presetText: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.muted },
  presetTextOn: { color: Colors.primary },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  methodOn: {},
  methodText: { flex: 1, fontFamily: Fonts.body, fontSize: 15, color: Colors.dark },
  methodTextOn: { fontFamily: Fonts.bodySemiBold, color: Colors.primary },
});
