import type { Href } from 'expo-router';
import type { User } from '@/types/user';

/** Provider account exists, but they have not submitted a service profile yet. */
export function needsProviderOnboarding(user: User | null | undefined): boolean {
  return user?.role === 'provider' && !user.providerId;
}

/** Role-based home route for post-auth navigation. */
export function getHomeHref(user: User | null | undefined): Href {
  if (!user) return '/(auth)/login';
  if (user.role === 'provider') {
    if (needsProviderOnboarding(user)) {
      return '/(provider)/resume' as Href;
    }
    if (user.providerStatus === 'rejected' || user.providerStatus === 'suspended') {
      return '/(provider)/status' as Href;
    }
    return '/(provider)/resume' as Href;
  }
  if (user.role === 'admin') {
    return '/(customer)/(tabs)';
  }
  return '/(customer)/(tabs)';
}

export function isProviderUser(user: User | null | undefined): boolean {
  return user?.role === 'provider';
}
