import { useProviderStore } from '@/store/providerStore';

export function useProvider() {
  const provider = useProviderStore((s) => s.provider);
  const stats = useProviderStore((s) => s.stats);
  const earnings = useProviderStore((s) => s.earnings);
  const bookings = useProviderStore((s) => s.bookings);
  const loading = useProviderStore((s) => s.loading);
  const error = useProviderStore((s) => s.error);
  const refreshDashboard = useProviderStore((s) => s.refreshDashboard);
  const refreshBookings = useProviderStore((s) => s.refreshBookings);
  const loadProviderByUser = useProviderStore((s) => s.loadProviderByUser);

  return {
    provider,
    stats,
    earnings,
    bookings,
    loading,
    error,
    refreshDashboard,
    refreshBookings,
    loadProviderByUser,
  };
}
