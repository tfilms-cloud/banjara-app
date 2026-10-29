import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiErrorMessage, normalizeApiError } from '@/services/apiError';
import {
  getMemoryAccessToken,
  getMemoryRefreshToken,
  setMemoryAuthTokens,
} from '@/services/authToken';
import { getApiBaseUrl } from '@/services/apiUrl';

const API_URL = getApiBaseUrl();
const AUTH_STORAGE_KEY = 'banjara-auth';

type AuthPersisted = {
  state?: {
    token?: string | null;
    refreshToken?: string | null;
    isAuthenticated?: boolean;
  };
};

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  paramsSerializer: {
    serialize(params) {
      const search = new URLSearchParams();
      Object.entries(params ?? {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        search.append(key, String(value));
      });
      return search.toString();
    },
  },
});

async function readAuthState(): Promise<AuthPersisted['state']> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as AuthPersisted;
    return parsed.state;
  } catch {
    return undefined;
  }
}

async function writeAuthTokens(accessToken: string | null, refreshToken: string | null) {
  setMemoryAuthTokens(accessToken, refreshToken);
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as AuthPersisted) : { state: {} };
    parsed.state = {
      ...(parsed.state ?? {}),
      token: accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken && accessToken !== 'guest-token'),
    };
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore persistence errors
  }
}

export async function clearAuthSession() {
  await writeAuthTokens(null, null);
  // Update the live store as well as disk; otherwise expired sessions remain in
  // protected provider/customer screens until the app is restarted.
  const { useAuthStore } = await import('@/store/authStore');
  useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false });
  try {
    const { useChatStore } = await import('@/store/chatStore');
    useChatStore.getState().disconnect();
    const { useProviderStore } = await import('@/store/providerStore');
    useProviderStore.getState().clearSession();
  } catch { /* Session is already cleared even if optional store cleanup fails. */ }
}

export { writeAuthTokens };

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  let token = getMemoryAccessToken();
  if (!token) {
    const state = await readAuthState();
    token = state?.token ?? null;
    if (token) setMemoryAuthTokens(token, state?.refreshToken ?? null);
  }
  if (token && token !== 'guest-token' && token !== 'mock-token') {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const memoryRefresh = getMemoryRefreshToken();
    const state = await readAuthState();
    const refreshToken = memoryRefresh || state?.refreshToken;
    if (!refreshToken) {
      await clearAuthSession();
      return null;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      const data = response.data?.data;
      const accessToken = data?.tokens?.accessToken as string | undefined;
      const nextRefresh = (data?.tokens?.refreshToken as string | undefined) ?? refreshToken;
      if (!accessToken) return null;
      await writeAuthTokens(accessToken, nextRefresh);
      return accessToken;
    } catch (error) {
      if (axios.isAxiosError(error) && [400, 401, 403].includes(error.response?.status ?? 0)) {
        await clearAuthSession();
        return null;
      }
      // A network outage should not discard a valid refresh token.
      throw normalizeApiError(error);
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (status === 401 && original && !original._retry) {
      original._retry = true;
      const accessToken = await refreshAccessToken();
      if (accessToken) {
        original.headers = {
          ...(original.headers ?? {}),
          Authorization: `Bearer ${accessToken}`,
        };
        return api.request(original);
      }
    }

    return Promise.reject(normalizeApiError(error));
  }
);

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await api.request<ApiSuccess<T>>(config);
    return response.data.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export function get<T>(url: string, config?: AxiosRequestConfig) {
  return apiRequest<T>({ ...config, method: 'GET', url });
}

export function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return apiRequest<T>({ ...config, method: 'POST', url, data });
}

export function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return apiRequest<T>({ ...config, method: 'PUT', url, data });
}

export function patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return apiRequest<T>({ ...config, method: 'PATCH', url, data });
}

export function del<T>(url: string, config?: AxiosRequestConfig) {
  return apiRequest<T>({ ...config, method: 'DELETE', url });
}

export { getApiErrorMessage };
export default api;
