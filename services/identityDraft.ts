import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type IdentityDraft = {
  cnicNumber: string;
  fatherName: string;
  expiryDate: string;
  frontUri: string;
  backUri: string;
};
export const emptyIdentityDraft = (): IdentityDraft => ({
  cnicNumber: '',
  fatherName: '',
  expiryDate: '',
  frontUri: '',
  backUri: '',
});
const fields = [
  'cnicNumber',
  'fatherName',
  'expiryDate',
  'frontUri',
  'backUri',
] as const;
const key = (userId: string, field: string) =>
  `banjara.identity.${userId.replace(/[^a-zA-Z0-9_-]/g, '_')}.${field}`;
let queue: Promise<unknown> = Promise.resolve();
const enqueue = <T>(action: () => Promise<T>) => {
  const task = queue.catch(() => undefined).then(action);
  queue = task;
  return task;
};

export function loadIdentityDraft(userId: string): Promise<IdentityDraft> {
  return enqueue(async () => {
    if (Platform.OS === 'web') return emptyIdentityDraft();
    const values = await Promise.all(
      fields.map((field) => SecureStore.getItemAsync(key(userId, field))),
    );
    return Object.fromEntries(
      fields.map((field, index) => [field, values[index] ?? '']),
    ) as IdentityDraft;
  });
}
export function saveIdentityDraft(
  userId: string,
  draft: IdentityDraft,
): Promise<void> {
  return enqueue(async () => {
    if (Platform.OS === 'web') return;
    await Promise.all(
      fields.map((field) =>
        SecureStore.setItemAsync(key(userId, field), draft[field]),
      ),
    );
  });
}
export function clearIdentityDraft(userId: string): Promise<void> {
  return enqueue(async () => {
    if (Platform.OS === 'web') return;
    await Promise.all(
      fields.map((field) => SecureStore.deleteItemAsync(key(userId, field))),
    );
  });
}
