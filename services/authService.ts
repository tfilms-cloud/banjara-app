import { get, post } from '@/services/api';
import { mapUser, type AnyRecord } from '@/services/mappers';
import type { AuthCredentials, RegisterPayload, User } from '@/types/user';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResult = {
  user: User;
  tokens: AuthTokens;
};

export async function login(credentials: AuthCredentials): Promise<AuthResult> {
  const data = await post<{ user: AnyRecord; tokens: AuthTokens }>('/auth/login', {
    email: credentials.email.trim().toLowerCase(),
    password: credentials.password,
  });
  return {
    user: mapUser(data.user),
    tokens: data.tokens,
  };
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
  const data = await post<{ user: AnyRecord; tokens: AuthTokens }>('/auth/register', {
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone.trim(),
    password: payload.password,
    role: payload.role ?? 'customer',
  });
  return {
    user: mapUser(data.user),
    tokens: data.tokens,
  };
}

export async function logout(): Promise<void> {
  try {
    await post('/auth/logout');
  } catch {
    // Local logout should still succeed if the network call fails.
  }
}

export async function getCurrentUser(): Promise<User> {
  const data = await get<AnyRecord>('/auth/me');
  return mapUser(data);
}

export async function requestPasswordReset(email: string): Promise<{ message: string; demoCode?: string }> {
  return post('/auth/forgot-password', { email: email.trim().toLowerCase() });
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<{ message: string }> {
  return post('/auth/reset-password', {
    email: email.trim().toLowerCase(),
    code,
    newPassword,
  });
}

export async function verifyCode(code: string): Promise<boolean> {
  return code.length === 4 || code.length === 6;
}

/** Guest browsing only — no API auth token. */
export async function getGuestSession(): Promise<User> {
  return {
    id: 'guest',
    name: 'Guest Traveler',
    email: '',
    phone: '',
    role: 'customer',
    savedTripIds: [],
    createdAt: new Date().toISOString(),
  };
}
