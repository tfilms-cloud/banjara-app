import { useEffect, useRef } from 'react';
import {
  attachPushListeners,
  isPushRuntimeSupported,
  registerPushToken,
  unregisterPushToken,
  type NotificationSubscription,
} from '@/services/pushNotifications';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { openFromNotificationData } from '@/utils/notificationRouting';

/**
 * Registers the Expo push token after login and routes notification taps.
 * Guest sessions, web and Expo Go are skipped; the in-app inbox stays available.
 */
export function usePushNotifications() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loadNotifications = useUserStore((s) => s.loadNotifications);
  const registeredToken = useRef<string | null>(null);
  const responseSub = useRef<NotificationSubscription | null>(null);
  const receiveSub = useRef<NotificationSubscription | null>(null);

  useEffect(() => {
    if (!isPushRuntimeSupported()) return;

    const guest = !token || token === 'guest-token' || !isAuthenticated || !user;
    if (guest) {
      if (registeredToken.current) {
        void unregisterPushToken(registeredToken.current);
        registeredToken.current = null;
      }
      return;
    }

    const appRole = user.role === 'provider' ? 'provider' : 'customer';
    let cancelled = false;

    void (async () => {
      try {
        const expoToken = await registerPushToken(appRole);
        if (!cancelled && expoToken) registeredToken.current = expoToken;
      } catch {
        // Permission denied or Expo Go limitations — inbox still works
      }

      if (cancelled) return;

      const attached = await attachPushListeners({
        onReceived: () => {
          void loadNotifications();
        },
        onResponse: (data) => {
          openFromNotificationData(data, user.role);
          void loadNotifications();
        },
      });

      if (cancelled) {
        attached.receiveSub?.remove();
        attached.responseSub?.remove();
        return;
      }

      receiveSub.current = attached.receiveSub;
      responseSub.current = attached.responseSub;

      if (attached.lastResponseData) {
        openFromNotificationData(attached.lastResponseData, user.role);
      }
    })();

    return () => {
      cancelled = true;
      receiveSub.current?.remove();
      responseSub.current?.remove();
      receiveSub.current = null;
      responseSub.current = null;
    };
  }, [token, user, isAuthenticated, loadNotifications]);
}
