import { useCallback, type EffectCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useBackendStatus } from '@/hooks/useBackendData';

export function useBackendFocusEffect(effect: EffectCallback) {
  const status = useBackendStatus();
  useFocusEffect(useCallback(() => effect(), [effect, status]));
}
