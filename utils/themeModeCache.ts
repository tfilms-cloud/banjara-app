import { useUserStore } from '@/store/userStore';

/** Cached dark-mode flag — avoid Zustand getState() on every Colors/style access. */
let darkModeCached = useUserStore.getState()?.settings?.darkMode ?? false;

useUserStore.subscribe((state) => {
  darkModeCached = state.settings?.darkMode ?? false;
});

export function getCachedDarkMode(): boolean {
  return darkModeCached;
}
