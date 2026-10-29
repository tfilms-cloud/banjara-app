import { useEffect, useRef, useState } from 'react';
import {
  clearIdentityDraft,
  emptyIdentityDraft,
  loadIdentityDraft,
  saveIdentityDraft,
  type IdentityDraft,
} from '@/services/identityDraft';

export function useIdentityDraft(userId?: string) {
  const [draft, setDraft] = useState(emptyIdentityDraft);
  const latest = useRef(draft);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setReady(false);
    if (!userId) {
      setReady(true);
      return;
    }
    void loadIdentityDraft(userId)
      .then((saved) => {
        if (!alive) return;
        latest.current = saved;
        setDraft(saved);
      })
      .catch(() => {
        if (alive)
          setError(
            'Could not restore the identity draft. Please select the photos again.',
          );
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [userId]);
  const patch = (change: Partial<IdentityDraft>) => {
    const next = { ...latest.current, ...change };
    latest.current = next;
    setDraft(next);
    if (userId)
      void saveIdentityDraft(userId, next).catch(() =>
        setError(
          'Could not save your identity draft on this device. Keep this screen open until verification finishes.',
        ),
      );
  };
  return {
    draft,
    patch,
    ready,
    error,
    clear: () => (userId ? clearIdentityDraft(userId) : Promise.resolve()),
  };
}
