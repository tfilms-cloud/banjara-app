import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImagePickerField } from '@/components/ui/ImagePickerField';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import * as uploads from '@/services/uploadService';
import { getApiErrorMessage } from '@/services/apiError';

const REASONS = [
  ['not_received', 'Payment not received'], ['incorrect_amount', 'Incorrect amount'],
  ['incorrect_account', 'Incorrect account'], ['invalid_receipt', 'Invalid receipt'],
  ['transaction_not_found', 'Transaction not found'], ['duplicate_payment', 'Duplicate payment'], ['other', 'Other'],
];

export function PaymentReviewSheet({ mode, busy, onClose, onSubmit }: {
  mode: 'issue' | 'refund' | null; busy: boolean; onClose: () => void;
  onSubmit: (input: { reason: string; note: string; referenceNumber: string; receiptUrls: string[] }) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState('not_received');
  const [note, setNote] = useState('');
  const [reference, setReference] = useState('');
  const [files, setFiles] = useState<Array<{ url: string; storageRef: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);
  const [error, setError] = useState('');
  const upload = async () => {
    if (busy || uploading || removingImage) return;
    setUploading(true); setError('');
    try {
      const picked = await uploads.pickImages(1);
      const uploaded = await uploads.uploadImages(picked, 'payments');
      if (uploaded.some(file => !file.storageRef)) throw new Error('Update the server for private receipts.');
      setFiles(current => [...current, ...uploaded.map(file => ({ url: file.url, storageRef: file.storageRef! }))].slice(0, 3));
    } catch (err) { setError(getApiErrorMessage(err)); }
    finally { setUploading(false); }
  };
  const submit = async () => {
    if (busy || uploading || removingImage) return;
    if (mode === 'refund' && (reference.trim().length < 3 || !files.length)) { setError('Add the refund transfer reference and receipt.'); return; }
    if (mode === 'issue' && reason === 'other' && !note.trim()) { setError('Describe the issue so the customer knows what to correct.'); return; }
    setError('');
    try { await onSubmit({ reason, note: note.trim(), referenceNumber: reference.trim(), receiptUrls: files.map(file => file.storageRef) }); }
    catch (err) { setError(getApiErrorMessage(err)); }
  };
  return <Modal visible={mode !== null} transparent animationType="slide" onRequestClose={() => { if (!busy && !uploading && !removingImage) onClose(); }}>
    <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.title}>{mode === 'refund' ? 'Record manual refund' : 'Report payment issue'}</Text>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14 }}>
          {mode === 'issue' ? <>
            <Text style={styles.body}>Choose a reason and tell the customer what needs checking.</Text>
            {REASONS.map(([id, label]) => <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: reason === id }} disabled={busy} onPress={() => setReason(id)} style={[styles.reason, reason === id && styles.selected]}><Text style={styles.body}>{reason === id ? '●  ' : '○  '}{label}</Text></Pressable>)}
            <Input label="Message for the customer" value={note} onChangeText={setNote} multiline maxLength={500} editable={!busy} />
          </> : <>
            <Text style={styles.body}>Return the funds through your bank or wallet first. This records your transfer evidence; BANJARA does not move money.</Text>
            <Input label="Refund transfer reference" value={reference} onChangeText={setReference} maxLength={80} editable={!busy} autoCorrect={false} />
            <ImagePickerField label="Refund receipt · private attachment" urls={files.map(file => file.url)} storageReferences={files.map(file => file.storageRef)} disabled={busy} onRemovingChange={setRemovingImage} max={3} uploading={uploading} onAdd={() => void upload()} onRemove={i => { if (!busy) setFiles(current => current.filter((_, index) => index !== i)); }} />
          </>}
          {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
          <Button title={mode === 'refund' ? 'Record refund evidence' : 'Send payment issue'} loading={busy} disabled={uploading || removingImage} onPress={() => void submit()} />
          <Button title="Cancel" variant="outline" disabled={busy || uploading || removingImage} onPress={onClose} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: Colors.card, padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', gap: 16 },
  title: { ...Typography.h3, color: Colors.dark }, body: { ...Typography.body, color: Colors.dark, lineHeight: 22 },
  reason: { minHeight: 48, padding: 12, borderWidth: 1, borderColor: Colors.border, borderRadius: 12 },
  selected: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  error: { ...Typography.caption, color: Colors.danger },
});
