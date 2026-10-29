import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/Header';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import { PAYMENT_STATUS_LABELS } from '@/constants/payments';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as p2p from '@/services/p2pPaymentService';
import { formatCurrency } from '@/utils/formatCurrency';

type Filter = 'all' | 'awaiting' | 'confirmed' | 'issues';

export default function ProviderPaymentsCenterScreen() {
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<p2p.PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await p2p.listMyPayments());
    } catch (error) {
      Alert.alert('Payments', getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const filtered = useMemo(() => {
    if (filter === 'awaiting') {
      return rows.filter((r) =>
        ['proof_submitted', 'under_review', 'payment_initiated', 'unpaid'].includes(r.status)
      );
    }
    if (filter === 'confirmed') {
      return rows.filter((r) => r.status === 'confirmed' || r.status === 'paid');
    }
    if (filter === 'issues') {
      return rows.filter((r) =>
        ['rejected', 'disputed', 'expired', 'refunded'].includes(r.status)
      );
    }
    return rows;
  }, [rows, filter]);

  return (
    <View style={styles.container}>
      <Header title="Payments / Earnings" showBack />
      <View style={styles.filters}>
        {(
          [
            ['all', 'All'],
            ['awaiting', 'To verify'],
            ['confirmed', 'Confirmed'],
            ['issues', 'Issues'],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            style={[styles.chip, filter === key && styles.chipActive]}
            onPress={() => setFilter(key)}
          >
            <Text style={[styles.chipText, filter === key && styles.chipTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {loading && !rows.length ? (
        <LoadingState title="Loading payments…" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
            gap: Spacing.md,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => void load()} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No payments"
              message="Customer transfer payments for your bookings will appear here for verification."
            />
          }
          renderItem={({ item }) => {
            const needsAction = ['proof_submitted', 'under_review'].includes(item.status);
            return (
              <Pressable
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: '/(provider)/payments/verify/[paymentId]',
                    params: { paymentId: item.id },
                  })
                }
              >
                <View style={styles.row}>
                  <Text style={styles.code}>{item.transactionId || item.id.slice(-8)}</Text>
                  <Text style={styles.amount}>
                    {formatCurrency(item.amount, item.currency)}
                  </Text>
                </View>
                <Text style={styles.meta}>
                  {item.method} · Booking {item.bookingId.slice(-6)}
                </Text>
                <View style={styles.statusRow}>
                  <Ionicons
                    name={needsAction ? 'alert-circle' : 'checkmark-circle'}
                    size={16}
                    color={needsAction ? Colors.warning : Colors.success}
                  />
                  <Text style={styles.status}>
                    {PAYMENT_STATUS_LABELS[item.status] ?? item.status}
                  </Text>
                  {needsAction ? <Text style={styles.action}>Verify →</Text> : null}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  chipText: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.muted },
  chipTextActive: { color: Colors.primary },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.primary },
  amount: { fontFamily: Fonts.display, fontSize: 18, color: Colors.primary },
  meta: { ...Typography.caption, color: Colors.muted },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  status: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.primary, flex: 1 },
  action: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.secondary },
});
