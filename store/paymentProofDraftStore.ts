import { create } from 'zustand';
import { useAuthStore } from './authStore';

export type PaymentProofDraft = {
  receipts: Array<{ url: string; storageRef: string }>;
  reference: string;
  amount: string;
  note: string;
};

/** Session-only drafts: banking details and signed URLs never enter device storage. */
export const usePaymentProofDraftStore = create<{
  drafts: Record<string, PaymentProofDraft>;
  save: (key: string, draft: PaymentProofDraft) => void;
  remove: (key: string) => void;
  clear: () => void;
}>((set) => ({
  drafts: {},
  save: (key, draft) => set(state => ({ drafts: { ...state.drafts, [key]: draft } })),
  remove: (key) => set(state => { const next = { ...state.drafts }; delete next[key]; return { drafts: next }; }),
  clear: () => set({ drafts: {} }),
}));

useAuthStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id) usePaymentProofDraftStore.getState().clear();
});
