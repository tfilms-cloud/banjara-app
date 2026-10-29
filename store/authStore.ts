import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as authService from '@/services/authService';
import { clearAuthSession, writeAuthTokens } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiError';
import { setMemoryAuthTokens } from '@/services/authToken';
import type { AuthCredentials, ProviderAccountStatus, RegisterPayload, User } from '@/types/user';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasOnboarded: boolean;
  error: string | null;
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  setOnboarded: () => void;
  clearError: () => void;
  updateProviderLink: (providerId: string, providerStatus: ProviderAccountStatus) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      hasOnboarded: false,
      error: null,
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.login(credentials);
          await writeAuthTokens(result.tokens.accessToken, result.tokens.refreshToken);
          set({
            user: result.user,
            token: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            hasOnboarded: true,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: getApiErrorMessage(error),
          });
          throw error;
        }
      },
      register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.register(payload);
          await writeAuthTokens(result.tokens.accessToken, result.tokens.refreshToken);
          set({
            user: result.user,
            token: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            hasOnboarded: true,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: getApiErrorMessage(error),
          });
          throw error;
        }
      },
      continueAsGuest: async () => {
        set({ isLoading: true });
        const user = await authService.getGuestSession();
        setMemoryAuthTokens('guest-token', null);
        set({
          user,
          token: 'guest-token',
          refreshToken: null,
          isAuthenticated: true,
          isLoading: false,
          hasOnboarded: true,
        });
      },
      logout: async () => {
        const departingUserId = get().user?.id;
        if (departingUserId) {
          const { clearIdentityDraft } = await import('@/services/identityDraft');
          await clearIdentityDraft(departingUserId).catch(() => undefined);
        }
        const token = get().token;
        if (token && token !== 'guest-token') {
          try {
            const { unregisterPushToken } = await import('@/services/pushNotifications');
            await unregisterPushToken();
          } catch {
            // ignore push cleanup failures
          }
          await authService.logout();
        }
        await clearAuthSession();
        try {
          const { useChatStore } = await import('@/store/chatStore');
          useChatStore.getState().disconnect();
        } catch {
          // ignore
        }
        try {
          const { useProviderStore } = await import('@/store/providerStore');
          useProviderStore.getState().clearSession();
        } catch {
          // ignore
        }
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },
      setOnboarded: () => set({ hasOnboarded: true }),
      clearError: () => set({ error: null }),
      updateProviderLink: (providerId, providerStatus) =>
        set((state) => {
          if (!state.user || (state.user.role === 'provider' &&
              state.user.providerId === providerId && state.user.providerStatus === providerStatus)) return state;
          return {
          user: state.user
            ? {
                ...state.user,
                role: 'provider',
                providerId,
                providerStatus,
              }
            : state.user,
          };
        }),
      refreshUser: async () => {
        const token = get().token;
        if (!token || token === 'guest-token') return;
        try {
          const user = await authService.getCurrentUser();
          set({ user, isAuthenticated: true });
        } catch {
          // keep cached user on transient failure
        }
      },
    }),
    {
      name: 'banjara-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        hasOnboarded: state.hasOnboarded,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setMemoryAuthTokens(state.token, state.refreshToken ?? null);
        }
      },
    }
  )
);
