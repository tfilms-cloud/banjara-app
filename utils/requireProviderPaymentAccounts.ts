import { Alert } from 'react-native';
import { router } from 'expo-router';
import * as p2p from '@/services/p2pPaymentService';

/**
 * Returns true if the provider has at least one active receiving account.
 * Otherwise shows an alert and offers to open Payment accounts.
 */
export async function requireProviderPaymentAccounts(
  actionLabel = 'offer services'
): Promise<boolean> {
  try {
    const accounts = await p2p.listMyPaymentAccounts();
    if (accounts.some((a) => a.active !== false)) return true;
  } catch {
    return true;
  }

  Alert.alert(
    'Complete payment account details',
    `Add at least one Bank, Easypaisa, JazzCash, or Raast account before you can ${actionLabel}.`,
    [
      { text: 'Later', style: 'cancel' },
      {
        text: 'Add account',
        onPress: () => router.push('/(provider)/payment-accounts'),
      },
    ]
  );
  return false;
}
