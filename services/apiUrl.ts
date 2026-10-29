import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { parseApiHost, resolveApiBaseUrl } from '@/utils/resolveApiUrl';

function metroHost(): string | null {
  return (
    parseApiHost(Constants.expoConfig?.hostUri) ??
    parseApiHost(Constants.linkingUri) ??
    parseApiHost(
      (
        Constants as {
          manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
        }
      ).manifest2?.extra?.expoGo?.debuggerHost
    )
  );
}

export function getApiBaseUrl(): string {
  return resolveApiBaseUrl({
    envUrl: process.env.EXPO_PUBLIC_API_URL,
    metroHost: metroHost(),
    platform: Platform.OS,
    isDevice: Device.isDevice,
    development: __DEV__,
  });
}
