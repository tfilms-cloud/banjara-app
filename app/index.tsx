import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { BrandSplash } from '@/components/brand/BrandSplash';
import { useAuthStore } from '@/store/authStore';
import { getHomeHref } from '@/utils/routing';

export default function Index() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasOnboarded = useAuthStore((state) => state.hasOnboarded);
  const user = useAuthStore((state) => state.user);
  const [hydrated, setHydrated] = useState(useAuthStore.persist.hasHydrated());

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  if (!hydrated) {
    return <BrandSplash />;
  }

  if (!hasOnboarded && !isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={getHomeHref(user)} />;
}
