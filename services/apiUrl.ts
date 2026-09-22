import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 5000;
const API_PATH = '/api';

function parseHost(value?: string | null): string | null {
  if (!value) return null;
  try {
    const withProtocol = value.includes('://') ? value : `http://${value}`;
    return new URL(withProtocol).hostname || null;
  } catch {
    const host = value.split('/')[0]?.split(':')[0];
    return host || null;
  }
}

function metroHost(): string | null {
  return (
    parseHost(Constants.expoConfig?.hostUri) ??
    parseHost(Constants.linkingUri) ??
    parseHost(
      (
        Constants as {
          manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
        }
      ).manifest2?.extra?.expoGo?.debuggerHost
    )
  );
}

function isLoopback(host: string) {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function isPrivateLan(host: string) {
  return /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(host);
}

export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const host = metroHost();

  // Physical device: use Metro's current LAN IP so a stale .env address cannot break the app.
  if (host && !isLoopback(host) && Platform.OS !== 'web') {
    const envHost = envUrl ? parseHost(envUrl) : null;
    if (!envHost || isLoopback(envHost) || isPrivateLan(envHost)) {
      return `http://${host}:${API_PORT}${API_PATH}`;
    }
  }

  if (envUrl) return envUrl.replace(/\/$/, '');

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}${API_PATH}`;
  }

  return `http://localhost:${API_PORT}${API_PATH}`;
}
