import { PaymentReviewSheet } from '@/components/payments/PaymentReviewSheet';
import { ReceiptViewer } from '@/components/payments/ReceiptViewer';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PaymentChat } from '@/components/payments/PaymentChat';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { LoadingState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import { PAYMENT_STATUS_LABELS } from '@/constants/payments';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as p2p from '@/services/p2pPaymentService';
import { formatCurrency } from '@/utils/formatCurrency';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

export default function ProviderPaymentVerifyScreen() {
  const insets = useSafeAreaInsets();
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  const id = String(paymentId ?? '');
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const [payment, setPayment] = useState<p2p.PaymentTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sheet, setSheet] = useState<'issue' | 'refund' | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardOpen(true)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardOpen(false)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const scrollChatIntoView = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!id || loadingRef.current) return;
    loadingRef.current = true;
    if (!silent) setLoading(true);
    try {
      setPayment(await p2p.getPayment(id));
      setError('');
    } catch (error) {
      if (!silent) setError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
      const interval = setInterval(() => void load(true), 8000);
      return () => clearInterval(interval);
    }, [load])
  );

  const onConfirm = () => {
    Alert.alert(
      'Confirm payment',
      'Have you received this payment in your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, I received it',
          onPress: async () => {
            setBusy(true);
            try {
              const updated = await p2p.confirmPayment(id);
              setPayment(updated);
              Alert.alert('Confirmed', 'Payment confirmed. Booking is now confirmed.');
            } catch (error) {
              Alert.alert('Could not confirm', getApiErrorMessage(error));
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const submitReview = async (input: { reason: string; note: string; referenceNumber: string; receiptUrls: string[] }) => {
    setBusy(true);
    try {
      const updated = sheet === 'refund' ? await p2p.completeRefund(id, input) : await p2p.reportPaymentIssue(id, input);
      setPayment(current => ({ ...current, ...updated }));
      setSheet(null);
    } finally { setBusy(false); }
  };

  const startRefund = () => Alert.alert('Start manual refund', 'This marks a refund as pending. Return the money through your bank or wallet, then record the refund receipt.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Start refund', onPress: async () => {
      setBusy(true);
      try { const updated = await p2p.requestRefund(id); setPayment(current => ({ ...current, ...updated })); } catch (err) { setError(getApiErrorMessage(err)); } finally { setBusy(false); }
    } },
  ]);

  if (!payment) {
    return (
      <View style={styles.container}>
        <Header title="Verify payment" showBack />
        {loading ? <LoadingState title="Loading payment…" /> : <View style={{ padding: 24, gap: 16 }}><Text style={styles.rowValue}>{error || 'Payment could not be loaded.'}</Text><Button title="Retry" onPress={() => void load()} /></View>}
      </View>
    );
  }

  const mismatch = Boolean(payment.proof && Math.round(payment.proof.paidAmount * 100) !== Math.round(payment.amount * 100));
  const awaiting = ['proof_submitted', 'under_review'].includes(payment.status);
  const statusLabel = PAYMENT_STATUS_LABELS[payment.status] ?? payment.status;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <Header title="Verify payment" showBack />
      <ReceiptViewer uri={receipt} onClose={() => setReceipt(null)} />
      {sheet ? <PaymentReviewSheet mode={sheet} busy={busy} onClose={() => setSheet(null)} onSubmit={submitReview} /> : null}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + (keyboardOpen ? 24 : 140),
          gap: Spacing.lg,
        }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        {error ? <View style={styles.warn}><Text style={styles.warnText} accessibilityRole="alert">{error}</Text></View> : null}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Amount</Text>
          <Text style={styles.heroAmount}>
            {formatCurrency(payment.amount, payment.currency)}
          </Text>
          <Text style={styles.heroMeta}>{statusLabel}</Text>
          {payment.summary ? <Text style={styles.heroMeta}>{payment.summary.providerName} · {payment.summary.title}</Text> : null}
        </View>

        <View style={styles.card}>
          <Row label="Transaction" value={payment.transactionId || payment.id} />
          <Row label="Booking" value={payment.summary?.bookingNumber || payment.bookingId} />
          <Row label="Method" value={payment.method} />
          {payment.receivingAccount ? (
            <Row
              label="Your account"
              value={`${payment.receivingAccount.accountTitle} · ${payment.receivingAccount.displayIdentifier}`}
            />
          ) : null}
        </View>

        {mismatch ? <View style={styles.warn}><Text style={styles.warnText}>Amount mismatch. Resolve the difference before confirming. A screenshot alone does not prove funds arrived.</Text></View> : null}
        {awaiting && !mismatch ? <Text style={styles.hint}>Check the reference and exact amount in your own bank or wallet history before confirming.</Text> : null}
        {payment.status === 'refund_pending' ? <View style={styles.warn}><Text style={styles.warnText}>Refund pending. Return the funds through your bank or wallet, then record the transfer evidence below.</Text></View> : null}
        {payment.proof ? (
          <View style={styles.card}>
            <Text style={styles.section}>Payment proof</Text>
            <Row label="Reference" value={payment.proof.referenceNumber} />
            <Row
              label="Paid amount"
              value={formatCurrency(payment.proof.paidAmount, payment.currency)}
            />
            <Row
              label="Submitted"
              value={new Date(payment.proof.submittedAt).toLocaleString()}
            />
            {payment.proof.note ? <Row label="Note" value={payment.proof.note} /> : null}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {payment.proof.receiptUrls.map((url) => (
                <Pressable key={url} onPress={() => setReceipt(normalizeMediaUrl(url) ?? url)} accessibilityRole="button" accessibilityLabel="Open complete receipt"><Image
                  source={{ uri: normalizeMediaUrl(url) ?? url }}
                  style={styles.receipt}
                  contentFit="contain"
                /></Pressable>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.warn}>
            <Ionicons name="hourglass-outline" size={20} color={Colors.warning} />
            <Text style={styles.warnText}>Customer has not submitted payment proof yet.</Text>
          </View>
        )}

        <PaymentChat
          paymentId={id}
          myRole="provider"
          onComposerFocus={scrollChatIntoView}
        />
      </ScrollView>

      {awaiting && !keyboardOpen ? (
        <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
          <Button title="Confirm payment received" loading={busy} disabled={mismatch} onPress={onConfirm} />
          <Pressable style={styles.issueBtn} onPress={() => setSheet('issue')} disabled={busy}>
            <Text style={styles.issueText}>Report payment issue</Text>
          </Pressable>
        </View>
      ) : payment.status === 'refund_pending' ? <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}><Button title="Record refund evidence" loading={busy} onPress={() => setSheet('refund')} /></View> : payment.status === 'confirmed' || payment.status === 'paid'
        ? !keyboardOpen && (
            <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
              <Button title="Start manual refund" variant="outline" loading={busy} onPress={startRefund} /><Button title="Done" onPress={() => router.back()} />
            </View>
          )
        : null}
    </KeyboardAvoidingView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing['2xl'],
  },
  heroLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  heroAmount: { ...Typography.h1, color: Colors.white, marginTop: 4 },
  heroMeta: { ...Typography.caption, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  hint: { ...Typography.caption, color: Colors.muted, lineHeight: 19 },
  section: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.primary },
  row: { gap: 2, paddingVertical: 4 },
  rowLabel: { ...Typography.caption, color: Colors.muted },
  rowValue: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.primary },
  receipt: {
    width: 160,
    height: 210,
    borderRadius: Radius.md,
    marginRight: Spacing.sm,
    backgroundColor: Colors.inputBg,
  },
  warn: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: '#FFF7ED',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  warnText: { ...Typography.caption, color: Colors.primary, flex: 1 },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  issueBtn: { alignItems: 'center', paddingVertical: 10 },
  issueText: { fontFamily: Fonts.bodySemiBold, color: Colors.danger, fontSize: 14 },
});
