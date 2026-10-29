import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { LoadingState, EmptyState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import { CUSTOMER_PAYMENT_METHODS, PAYMENT_STATUS_LABELS } from '@/constants/payments';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as p2p from '@/services/p2pPaymentService';
import { formatCurrency } from '@/utils/formatCurrency';

function methodLabel(method: string) {
  return (
    CUSTOMER_PAYMENT_METHODS.find(
      (m) => m.id === method || (method === 'bankTransfer' && m.id === 'bankTransfer')
    )?.label ?? method
  );
}

export default function CustomerPaymentsCenterScreen() {
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<p2p.PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await p2p.listMyPayments();
      const priority = new Set([
        'unpaid',
        'pending',
        'payment_initiated',
        'rejected',
        'proof_submitted',
        'under_review',
        'disputed',
      ]);
      setRows(
        [...list].sort((a, b) => {
          const ap = priority.has(a.status) ? 0 : 1;
          const bp = priority.has(b.status) ? 0 : 1;
          if (ap !== bp) return ap - bp;
          return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
        })
      );
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

  return (
    <View style={styles.container}>
      <Header title="Payments" showBack fallbackHref="/(customer)/(tabs)/profile" />
      {loading && !rows.length ? (
        <LoadingState title="Loading transactions…" />
      ) : (
        <FlatList
          data={rows}
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
              title="No payments yet"
              message="When you book a service and pay the provider, your transactions will appear here. You can reopen any unfinished payment anytime to see account details and submit proof."
            />
          }
          renderItem={({ item }) => {
            const status = PAYMENT_STATUS_LABELS[item.status] ?? item.status;
            const needsAction = [
              'unpaid',
              'pending',
              'payment_initiated',
              'rejected',
            ].includes(item.status);
            return (
              <Pressable
                style={[styles.card, needsAction && styles.cardAction]}
                onPress={() =>
                  router.push({
                    pathname: '/(customer)/payments/[paymentId]',
                    params: {
                      paymentId: item.id,
                      bookingId: item.bookingId,
                      method: item.method,
                    },
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
                  {methodLabel(item.method)} · Booking {item.bookingId.slice(-6)}
                </Text>
                <View style={styles.statusRow}>
                  <Ionicons
                    name={
                      item.status === 'confirmed' || item.status === 'paid'
                        ? 'checkmark-circle'
                        : item.status === 'rejected' || item.status === 'disputed'
                          ? 'alert-circle'
                          : 'time-outline'
                    }
                    size={16}
                    color={
                      item.status === 'confirmed' || item.status === 'paid'
                        ? Colors.success
                        : item.status === 'rejected' || item.status === 'disputed'
                          ? Colors.danger
                          : Colors.warning
                    }
                  />
                  <Text style={styles.status}>{status}</Text>
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
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  cardAction: {
    borderColor: '#FDBA74',
    backgroundColor: '#FFFBEB',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.primary },
  amount: { fontFamily: Fonts.display, fontSize: 18, color: Colors.primary },
  meta: { ...Typography.caption, color: Colors.muted },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  status: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.primary },
});
