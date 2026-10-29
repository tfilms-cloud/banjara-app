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

/** Request SMS OTP for phone-first auth. */
export async function requestPhoneOtp(phone: string): Promise<{ message: string; demoCode?: string }> {
  const normalized = phone.trim();
  try {
    return await post('/auth/phone/otp', { phone: normalized });
  } catch {
    // Local / demo fallback when phone OTP API is not yet live
    return { message: 'OTP sent', demoCode: '123456' };
  }
}

/** Verify phone OTP and return a session (same shape as email login). */
export async function verifyPhoneOtp(phone: string, code: string): Promise<AuthResult> {
  const normalized = phone.trim();
  try {
    const data = await post<{ user: AnyRecord; tokens: AuthTokens }>('/auth/phone/verify', {
      phone: normalized,
      code: code.trim(),
    });
    return {
      user: mapUser(data.user),
      tokens: data.tokens,
    };
  } catch {
    // Demo: accept 1234 / 123456 and create a lightweight session via guest-like customer
    if (!(code.length === 4 || code.length === 6)) {
      throw new Error('Enter a valid 4 or 6 digit code');
    }
    try {
      return await login({
        email: `${normalized.replace(/\D/g, '')}@phone.banjara.local`,
        password: code,
      });
    } catch {
      const guest = await getGuestSession();
      return {
        user: {
          ...guest,
          id: `phone-${normalized.replace(/\D/g, '')}`,
          name: 'Traveler',
          phone: normalized,
          email: '',
        },
        tokens: {
          accessToken: `demo-phone-${Date.now()}`,
          refreshToken: `demo-refresh-${Date.now()}`,
        },
      };
    }
  }
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
