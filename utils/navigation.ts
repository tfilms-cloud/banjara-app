import { Href, router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import type { User } from '@/types/user';

const DEAD_END_SCREENS = new Set(['register/success', 'success', 'welcome', 'login']);

function previousRouteName(navigation: {
  getState?: () => unknown;
  getParent?: () => unknown;
}): string | undefined {
  let current: { getState?: () => unknown; getParent?: () => unknown } | undefined = navigation;
  while (current) {
    const state = current.getState?.() as
      | { index?: number; routes?: { name?: string }[] }
      | undefined;
    if (state && typeof state.index === 'number' && state.index > 0) {
      return String(state.routes?.[state.index - 1]?.name ?? '');
    }
    current = current.getParent?.() as typeof current;
  }
  return undefined;
}

export function isDeadEndRoute(name?: string | null) {
  if (!name) return false;
  return (
    DEAD_END_SCREENS.has(name) ||
    name.endsWith('/success') ||
    name.endsWith('/welcome') ||
    name.endsWith('/login')
  );
}

export function shouldSkipHistoryBack(navigation: {
  getState?: () => unknown;
  getParent?: () => unknown;
}) {
  if (!router.canGoBack()) return true;
  return isDeadEndRoute(previousRouteName(navigation));
}

/** Safe back navigation that never throws GO_BACK warnings. */
export function safeBack(fallback: Href = '/(customer)/(tabs)') {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}

export const PROVIDER_SERVICE_TAB = '/(provider)/(tabs)/services' as Href;
export const ONBOARDING_LOCATION = {
  pathname: '/(provider)/location',
  params: { mode: 'onboarding' },
} as const;

/** Leave a provider editor. Prefer the previous screen; never dump onto signup or success. */
export function leaveProviderEditor(_user?: User | null) {
  router.replace(PROVIDER_SERVICE_TAB);
}

/** Always go to a known previous onboarding step, ignoring a polluted stack. */
export function wizardBack(href: Href) {
  router.replace(href);
}

/** Header + Android/iOS back both go to `go`, instead of whatever is under this screen. */
export function useWizardBack(go: () => void) {
  const navigation = useNavigation();
  const goRef = useRef(go);
  goRef.current = go;
  const run = useCallback(() => goRef.current(), []);

  useEffect(() => {
    const unsub = navigation.addListener(
      'beforeRemove',
      (event: { data: { action: { type: string } }; preventDefault: () => void }) => {
        const type = event.data.action.type;
        if (type === 'GO_BACK' || type === 'POP') {
          event.preventDefault();
          run();
        }
      }
    );
    return unsub;
  }, [navigation, run]);

  return run;
}

/** Push helper for dynamic hotel/transport/provider paths with typed routes. */
export function pushPath(path: string) {
  router.push(path as Href);
}

export function pushEditor(path: string) {
  router.push({ pathname: path, params: { from: 'edit' } } as never);
}

export function replacePath(path: string) {
  router.replace(path as Href);
}

/** Normalize Expo Router search params to a stable string id. */
export function paramId(value: string | string[] | undefined | null): string {
  if (Array.isArray(value)) return String(value[0] ?? '');
  return value ? String(value) : '';
}

export { previousRouteName };
