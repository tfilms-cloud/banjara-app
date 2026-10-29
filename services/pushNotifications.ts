import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import { del, get, patch, post } from '@/services/api';

type NotificationsModule = typeof import('expo-notifications');

/**
 * Remote push needs our own native build. Importing the module in Expo Go
 * throws on Android and warns on iOS, so skip it in both Expo Go runtimes.
 */
export function isPushRuntimeSupported(): boolean {
  return Platform.OS !== 'web' && !isRunningInExpoGo();
}

let notificationsPromise: Promise<NotificationsModule | null> | null = null;
let handlerConfigured = false;

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (!isPushRuntimeSupported()) return null;
  if (!notificationsPromise) {
    notificationsPromise = import('expo-notifications')
      .then((Notifications) => {
        if (!handlerConfigured) {
          handlerConfigured = true;
          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowBanner: true,
              shouldShowList: true,
              shouldPlaySound: true,
              shouldSetBadge: true,
            }),
          });
        }
        return Notifications;
      })
      .catch(() => null);
  }
  return notificationsPromise;
}

export type NotificationPreferences = {
  pushEnabled: boolean;
  bookings: boolean;
  payments: boolean;
  messages: boolean;
  trips: boolean;
  offers: boolean;
  reviews: boolean;
  system: boolean;
};

export const DEFAULT_PREFS: NotificationPreferences = {
  pushEnabled: true,
  bookings: true,
  payments: true,
  messages: true,
  trips: true,
  offers: false,
  reviews: true,
  system: true,
};

function projectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined
  );
}

/** Ensure Android has a default high-importance channel for Expo pushes. */
export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  await Notifications.setNotificationChannelAsync('banjara-default', {
    name: 'Banjara',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#0F766E',
    sound: 'default',
  });
}

export async function requestPushPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const Notifications = await loadNotifications();
  if (!Notifications) return false;

  await ensureAndroidChannel();

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }
  return status === 'granted';
}

export async function getExpoPushToken(): Promise<string | null> {
  const Notifications = await loadNotifications();
  if (!Notifications) return null;

  const granted = await requestPushPermission();
  if (!granted) return null;

  const id = projectId();
  const token = await Notifications.getExpoPushTokenAsync(id ? { projectId: id } : undefined);
  return token.data ?? null;
}

export async function registerPushToken(appRole: 'customer' | 'provider') {
  const token = await getExpoPushToken();
  if (!token) return null;

  await post('/notifications/device-token', {
    token,
    platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'web' ? 'web' : 'android',
    appRole,
  });
  return token;
}

export async function unregisterPushToken(token?: string | null) {
  try {
    await del('/notifications/device-token', { data: token ? { token } : {} });
  } catch {
    // best-effort on logout
  }
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const data = await get<Partial<NotificationPreferences>>('/notifications/preferences');
  return { ...DEFAULT_PREFS, ...data };
}

export async function updateNotificationPreferences(
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const data = await patch<Partial<NotificationPreferences>>('/notifications/preferences', updates);
  return { ...DEFAULT_PREFS, ...data };
}

export type PushData = {
  type?: string;
  notificationId?: string;
  bookingId?: string;
  conversationId?: string;
  screen?: string;
  [key: string]: unknown;
};

export function parseNotificationData(raw: unknown): PushData {
  if (!raw || typeof raw !== 'object') return {};
  return raw as PushData;
}

export type NotificationSubscription = { remove: () => void };

/** Attach foreground + tap listeners when the native module is available. */
export async function attachPushListeners(handlers: {
  onReceived: () => void;
  onResponse: (data: PushData) => void;
}): Promise<{
  receiveSub: NotificationSubscription | null;
  responseSub: NotificationSubscription | null;
  lastResponseData: PushData | null;
}> {
  const Notifications = await loadNotifications();
  if (!Notifications) {
    return { receiveSub: null, responseSub: null, lastResponseData: null };
  }

  const receiveSub = Notifications.addNotificationReceivedListener(() => {
    handlers.onReceived();
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = parseNotificationData(response.notification.request.content.data);
    handlers.onResponse(data);
  });

  const last = await Notifications.getLastNotificationResponseAsync();
  const lastResponseData = last
    ? parseNotificationData(last.notification.request.content.data)
    : null;

  return { receiveSub, responseSub, lastResponseData };
}
