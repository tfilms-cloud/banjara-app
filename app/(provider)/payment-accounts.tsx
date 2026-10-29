import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PayoutChannelIcon } from '@/components/payments/PayoutChannelIcon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import { PAYOUT_CHANNEL_OPTIONS, type PayoutChannel } from '@/constants/payments';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import { invalidatePaymentAccountsCache } from '@/services/paymentAccountsCache';
import * as p2p from '@/services/p2pPaymentService';
import {
  firstPayoutError,
  normalizePayoutIdentifier,
  PAKISTAN_BANKS,
  validatePayoutAccountForm,
  type PayoutFieldErrors,
} from '@/utils/payoutAccountValidation';

const PROVIDER_CHANNELS = PAYOUT_CHANNEL_OPTIONS.filter((c) => c.id !== 'other');

export default function ProviderPaymentAccountsScreen() {
  const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<p2p.ProviderPaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [channel, setChannel] = useState<PayoutChannel>('easypaisa');
  const [label, setLabel] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [bankName, setBankName] = useState('');
  const [branch, setBranch] = useState('');
  const [instructions, setInstructions] = useState('');
  const [errors, setErrors] = useState<PayoutFieldErrors>({});

  const channelMeta =
    PROVIDER_CHANNELS.find((c) => c.id === channel) ?? PROVIDER_CHANNELS[0];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAccounts(await p2p.listMyPaymentAccounts());
    } catch (error) {
      Alert.alert('Could not load accounts', getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const resetForm = () => {
    setLabel('');
    setAccountTitle('');
    setIdentifier('');
    setBankName('');
    setBranch('');
    setInstructions('');
    setChannel('easypaisa');
    setErrors({});
    setShowForm(false);
  };

  const onChangeChannel = (next: PayoutChannel) => {
    setChannel(next);
    setIdentifier('');
    setBankName('');
    setBranch('');
    setErrors({});
  };

  const onIdentifierChange = (value: string) => {
    if (channel === 'easypaisa' || channel === 'jazzcash') {
      // Digits only, max 11 (03XXXXXXXXX)
      setIdentifier(value.replace(/\D/g, '').slice(0, 11));
      return;
    }
    if (channel === 'bank' || channel === 'raast') {
      // Uppercase alphanumerics / spaces for IBAN or digits for mobile/account
      setIdentifier(value.replace(/[^a-zA-Z0-9\s]/g, '').toUpperCase().slice(0, 34));
      return;
    }
    setIdentifier(value.slice(0, 64));
  };

  const onAccountTitleChange = (value: string) => {
    // Letters, spaces, and common name punctuation only (Hermes-safe)
    setAccountTitle(value.replace(/[^A-Za-z\u0600-\u06FF\s.'’-]/g, '').slice(0, 80));
  };

  const fieldErrors = useMemo(
    () =>
      validatePayoutAccountForm({
        channel,
        label,
        accountTitle,
        identifier,
        bankName,
        branch,
        instructions,
      }),
    [channel, label, accountTitle, identifier, bankName, branch, instructions]
  );

  const onSave = async () => {
    const nextErrors = validatePayoutAccountForm({
      channel,
      label,
      accountTitle,
      identifier,
      bankName,
      branch,
      instructions,
    });
    setErrors(nextErrors);
    const first = firstPayoutError(nextErrors);
    if (first) {
      Alert.alert('Check account details', first);
      return;
    }

    setSaving(true);
    try {
      await p2p.createPaymentAccount({
        channel,
        label: label.trim(),
        accountTitle: accountTitle.trim(),
        identifier: normalizePayoutIdentifier(channel, identifier),
        bankName: channel === 'bank' ? bankName.trim() : undefined,
        branch: channel === 'bank' ? branch.trim() || undefined : undefined,
        instructions: instructions.trim() || undefined,
        active: true,
      });
      invalidatePaymentAccountsCache();
      resetForm();
      await load();
      Alert.alert('Saved', 'Payment account added. Travelers can pay you using this method.');
    } catch (error) {
      Alert.alert('Could not save', getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (account: p2p.ProviderPaymentAccount) => {
    try {
      await p2p.updatePaymentAccount(account.id, { active: !account.active });
      invalidatePaymentAccountsCache();
      await load();
    } catch (error) {
      Alert.alert('Could not update', getApiErrorMessage(error));
    }
  };

  const onDelete = (account: p2p.ProviderPaymentAccount) => {
    Alert.alert('Remove account', `Remove “${account.label}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            try {
              await p2p.deletePaymentAccount(account.id);
              invalidatePaymentAccountsCache();
              await load();
            } catch (error) {
              Alert.alert('Could not remove', getApiErrorMessage(error));
            }
          })(),
      },
    ]);
  };

  if (loading && !accounts.length) {
    return (
      <View style={styles.container}>
        <Header title="Payment accounts" showBack fallbackHref="/(provider)/settings" />
        <LoadingState title="Loading accounts..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Payment accounts" showBack fallbackHref="/(provider)/settings" />
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 40,
          gap: Spacing.lg,
        }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>How travelers pay you</Text>
        <Text style={styles.sub}>
          Add your real Bank, Easypaisa, JazzCash, or Raast details. Only valid account formats are
          accepted — customers pay you directly, then upload proof for you to verify.
        </Text>

        {accounts.map((account) => (
          <View key={account.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.cardTitle}>{account.label}</Text>
                <Text style={styles.cardMeta}>
                  {PAYOUT_CHANNEL_OPTIONS.find((c) => c.id === account.channel)?.label ??
                    account.channel}
                  {account.bankName ? ` · ${account.bankName}` : ''}
                </Text>
                <Text style={styles.cardId}>
                  {account.accountTitle} · {account.displayIdentifier}
                </Text>
              </View>
              <Badge label={account.active ? 'Active' : 'Off'} tone={account.active ? 'green' : 'gray'} />
            </View>
            <View style={styles.cardActions}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Accept payments</Text>
                <Switch
                  value={account.active}
                  onValueChange={() => void toggleActive(account)}
                  trackColor={{ true: Colors.primary }}
                />
              </View>
              <Pressable onPress={() => onDelete(account)} hitSlop={8}>
                <Text style={styles.remove}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {!accounts.length && !showForm ? (
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={28} color={Colors.muted} />
            <Text style={styles.emptyTitle}>No payment accounts yet</Text>
            <Text style={styles.sub}>
              Add at least one active method so customers can complete bookings with you.
            </Text>
          </View>
        ) : null}

        {showForm ? (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Add payment account</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {PROVIDER_CHANNELS.map((opt) => (
                <Pressable
                  key={opt.id}
                  onPress={() => onChangeChannel(opt.id)}
                  style={[styles.chip, channel === opt.id && styles.chipOn]}
                >
                  {opt.id !== 'other' ? <PayoutChannelIcon channel={opt.id} size={22} /> : null}
                  <Text style={[styles.chipText, channel === opt.id && styles.chipTextOn]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Input
              label="Label"
              value={label}
              onChangeText={(v) => setLabel(v.slice(0, 40))}
              placeholder="e.g. Primary JazzCash"
              error={errors.label}
              maxLength={40}
            />
            <Input
              label="Account title / name"
              value={accountTitle}
              onChangeText={onAccountTitleChange}
              placeholder="Name printed on the account"
              error={errors.accountTitle}
              autoCapitalize="words"
              maxLength={80}
            />

            {channel === 'bank' ? (
              <>
                <Text style={styles.fieldLabel}>Bank name</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chips}
                >
                  {PAKISTAN_BANKS.map((bank) => (
                    <Pressable
                      key={bank}
                      onPress={() => {
                        setBankName(bank);
                        setErrors((e) => ({ ...e, bankName: undefined }));
                      }}
                      style={[styles.chip, bankName === bank && styles.chipOn]}
                    >
                      <Text style={[styles.chipText, bankName === bank && styles.chipTextOn]}>
                        {bank}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Input
                  label="Or type bank name"
                  value={bankName}
                  onChangeText={(v) => setBankName(v.slice(0, 80))}
                  placeholder="Select above or type bank name"
                  error={errors.bankName}
                  maxLength={80}
                />
                <Input
                  label="Branch (optional)"
                  value={branch}
                  onChangeText={(v) => setBranch(v.slice(0, 60))}
                  error={errors.branch}
                  maxLength={60}
                />
              </>
            ) : null}

            <Input
              label={channelMeta.identifierLabel}
              value={identifier}
              onChangeText={onIdentifierChange}
              placeholder={channelMeta.identifierPlaceholder}
              hint={channelMeta.helpText}
              error={errors.identifier ?? (identifier && fieldErrors.identifier ? fieldErrors.identifier : undefined)}
              autoCapitalize="characters"
              keyboardType={
                channel === 'easypaisa' || channel === 'jazzcash' ? 'number-pad' : 'default'
              }
              maxLength={channel === 'easypaisa' || channel === 'jazzcash' ? 11 : 34}
            />

            <Input
              label="Instructions for customers (optional)"
              value={instructions}
              onChangeText={(v) => setInstructions(v.slice(0, 300))}
              placeholder="e.g. Send as “Payment” and keep the receipt"
              multiline
              error={errors.instructions}
              maxLength={300}
            />

            <Button title="Save account" loading={saving} onPress={() => void onSave()} />
            <Button title="Cancel" variant="ghost" onPress={resetForm} />
          </View>
        ) : (
          <Button title="Add payment account" onPress={() => setShowForm(true)} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heading: { ...Typography.h2, color: Colors.dark },
  sub: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  fieldLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.dark,
    marginBottom: -4,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  cardTop: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  cardTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.dark },
  cardMeta: { ...Typography.caption, color: Colors.muted, marginTop: 2 },
  cardId: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.dark, marginTop: 4 },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { fontFamily: Fonts.body, fontSize: 13, color: Colors.dark },
  remove: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.danger },
  empty: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  emptyTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.dark },
  form: { gap: Spacing.md },
  formTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.dark },
  chips: { gap: 8, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
  },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.dark },
  chipTextOn: { color: Colors.white },
});
