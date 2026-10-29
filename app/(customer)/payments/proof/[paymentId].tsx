import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PaymentFlowSteps } from '@/components/payments/PaymentFlowSteps';
import { ImagePickerField } from '@/components/ui/ImagePickerField';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as p2p from '@/services/p2pPaymentService';
import * as uploads from '@/services/uploadService';
import { useAuthStore } from '@/store/authStore';
import { usePaymentProofDraftStore, type PaymentProofDraft } from '@/store/paymentProofDraftStore';
import { formatCurrency } from '@/utils/formatCurrency';

export default function SubmitPaymentProofScreen() {
  const insets = useSafeAreaInsets();
  const { paymentId, bookingId } = useLocalSearchParams<{ paymentId: string; bookingId?: string }>();
  const id = String(paymentId ?? '');
  const userId = useAuthStore(state => state.user?.id);
  const key = `${userId}:${id}`;
  const [draft, setDraft] = useState<PaymentProofDraft>(() => usePaymentProofDraftStore.getState().drafts[key] ?? { receipts: [], reference: '', amount: '', note: '' });
  const [payment, setPayment] = useState<p2p.PaymentTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const update = (patch: Partial<PaymentProofDraft>) => setDraft(value => ({ ...value, ...patch }));

  useEffect(() => { usePaymentProofDraftStore.getState().save(key, draft); }, [key, draft]);
  const load = async () => {
    setLoading(true); setError('');
    try {
      const txn = await p2p.getPayment(id);
      setPayment(txn);
      setDraft(value => ({ ...value, amount: value.amount || String(txn.amount) }));
      const saved = usePaymentProofDraftStore.getState().drafts[key];
      if (saved?.receipts.length) {
        const receipts = await p2p.previewDraftFiles(id, saved.receipts.map(file => file.storageRef));
        setDraft(value => ({ ...value, receipts }));
      }
    } catch (err) { setError(getApiErrorMessage(err)); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [id]);

  const onAddReceipt = async () => {
    if (uploading || submitting || removingImage) return;
    setUploading(true); setProgress(0); setError('');
    try {
      const picked = await uploads.pickImages(Math.min(3, 6 - draft.receipts.length));
      const files = await uploads.uploadImages(picked, 'payments', setProgress);
      if (files.some(file => !file.storageRef)) throw new Error('Private uploads require an updated server.');
      setDraft(value => ({ ...value, receipts: [...value.receipts, ...files.map(file => ({ url: file.url, storageRef: file.storageRef! }))].slice(0, 6) }));
    } catch (err) { setError(getApiErrorMessage(err)); }
    finally { setUploading(false); }
  };
  const amount = Number(draft.amount);
  const amountError = !Number.isFinite(amount) || amount <= 0 ? 'Enter a valid paid amount.' : '';
  const referenceError = draft.reference.trim().length < 3 ? 'Enter the transaction reference from your receipt.' : '';
  const mismatch = payment && !amountError && Math.round(amount * 100) !== Math.round(payment.amount * 100);
  const expired = Boolean(payment?.expiresAt && new Date(payment.expiresAt).getTime() <= Date.now());
  const canSubmit = Boolean(payment && ['payment_initiated', 'rejected'].includes(payment.status) && !expired);
  const onSubmit = async () => {
    if (inFlight.current || uploading || removingImage || !canSubmit) return;
    setAttempted(true);
    if (amountError || referenceError || !draft.receipts.length) return;
    inFlight.current = true; setSubmitting(true); setError('');
    try {
      await p2p.submitPaymentProof(id, { receiptUrls: draft.receipts.map(file => file.storageRef), referenceNumber: draft.reference.trim(), paidAmount: amount, note: draft.note.trim() || undefined });
      usePaymentProofDraftStore.getState().remove(key);
      router.replace({ pathname: '/(customer)/payments/[paymentId]', params: { paymentId: id, ...(bookingId ? { bookingId } : {}) } });
    } catch (err) { setError(getApiErrorMessage(err)); }
    finally { inFlight.current = false; setSubmitting(false); }
  };

  return <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Header title="Upload payment proof" showBack fallbackHref={`/(customer)/payments/${id}` as never} />
    <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 32, gap: Spacing.lg }}>
      <PaymentFlowSteps activeStep={2} />
      <View style={styles.summary}>
        <Text style={styles.caption}>{payment?.summary?.providerName || 'Payment proof'}</Text>
        <Text style={styles.total}>{payment ? formatCurrency(payment.amount, payment.currency) : 'Loading payment…'}</Text>
        <Text style={styles.body}>{payment?.summary?.title}</Text>
        <Text style={styles.caption}>{payment?.summary?.bookingNumber}</Text>
      </View>
      <Text style={styles.body}>Upload the complete receipt. Your booking is confirmed after the provider checks that the money arrived.</Text>
      {error ? <View style={styles.warning}><Text style={styles.body} accessibilityRole="alert">{error}</Text>{!payment ? <Button title="Retry loading" variant="outline" onPress={() => void load()} /> : null}</View> : null}
      {payment && !canSubmit ? <View style={styles.warning}><Text style={styles.body}>This payment is no longer accepting proof. If you already paid, open payment chat for help. Do not send the payment again.</Text><Button title="Open payment and get help" variant="outline" onPress={() => router.replace({ pathname: '/(customer)/payments/[paymentId]', params: { paymentId: id } })} /></View> : null}
      <ImagePickerField label="Receipt / screenshot · private attachment" urls={draft.receipts.map(file => file.url)} storageReferences={draft.receipts.map(file => file.storageRef)} disabled={submitting || loading} onRemovingChange={setRemovingImage} uploading={uploading} max={6} onAdd={() => void onAddReceipt()} onRemove={index => { if (!submitting) update({ receipts: draft.receipts.filter((_, i) => i !== index) }); }} />
      {uploading ? <Text style={styles.caption} accessibilityLiveRegion="polite">Uploading {progress}%</Text> : null}
      {attempted && !draft.receipts.length ? <Text style={styles.error}>Upload at least one receipt.</Text> : null}
      <Input label="Transaction / reference number" value={draft.reference} onChangeText={reference => update({ reference })} maxLength={80} autoCapitalize="characters" autoCorrect={false} editable={!submitting} placeholder="Reference shown on your receipt" error={attempted ? referenceError : undefined} />
      <Input label={`Amount you paid (${payment?.currency || 'PKR'})`} value={draft.amount} onChangeText={amount => update({ amount })} keyboardType="decimal-pad" editable={!submitting} error={attempted ? amountError : undefined} />
      {mismatch ? <View style={styles.warning}><Text style={styles.body}>This differs from the booking total. Submit the amount actually transferred so the provider can resolve it. Do not send extra money until the issue is checked.</Text></View> : null}
      <Input label="Note (optional)" value={draft.note} onChangeText={note => update({ note })} maxLength={500} multiline editable={!submitting} placeholder="Anything the provider needs to check" />
      <Text style={styles.caption}>Your draft is kept during this signed-in session. Never share your PIN, password or OTP.</Text>
      <Button title="Submit payment proof" loading={submitting} disabled={uploading || removingImage || loading || !canSubmit} onPress={() => void onSubmit()} />
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  summary: { padding: Spacing.xl, borderRadius: Radius.xl, backgroundColor: Colors.primarySoft, gap: 8 },
  total: { ...Typography.h1, color: Colors.dark },
  body: { ...Typography.body, color: Colors.dark, lineHeight: 23 },
  caption: { ...Typography.caption, color: Colors.muted, lineHeight: 19 },
  warning: { padding: Spacing.lg, borderRadius: Radius.lg, backgroundColor: Colors.primarySoft, gap: 12 },
  error: { ...Typography.caption, color: Colors.danger },
});
