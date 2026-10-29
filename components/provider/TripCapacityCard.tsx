import { InventoryCapacityCard } from '@/components/provider/InventoryCapacityCard';
import { Colors } from '@/constants/colors';
import type { ProviderTrip } from '@/types/provider';
import { formatCurrency } from '@/utils/formatCurrency';

type Props = {
  trip: ProviderTrip;
  bookingCount: number;
  pendingCount?: number;
  vehicleName?: string;
  onPress?: () => void;
};

export function TripCapacityCard({
  trip,
  bookingCount,
  pendingCount = 0,
  vehicleName,
  onPress,
}: Props) {
  const total = Math.max(0, trip.totalSeats);
  const booked = Math.min(total, Math.max(0, trip.bookedSeats));
  const available = Math.max(0, total - booked);
  const fillPct = total > 0 ? Math.round((booked / total) * 100) : 0;

  const statusTone =
    trip.status === 'cancelled' || trip.status === 'completed'
      ? 'muted'
      : available === 0
        ? 'full'
        : pendingCount > 0
          ? 'warn'
          : 'ok';

  const statusLabel =
    trip.status === 'cancelled'
      ? 'Cancelled'
      : trip.status === 'completed'
        ? 'Completed'
        : available === 0
          ? 'Full'
          : pendingCount > 0
            ? `${pendingCount} pending`
            : trip.status === 'active'
              ? 'Active'
              : 'Open';

  return (
    <InventoryCapacityCard
      title={`${trip.origin} → ${trip.destination}`}
      subtitle={[trip.departureDate, trip.departureTime, vehicleName].filter(Boolean).join(' · ')}
      statusLabel={statusLabel}
      statusTone={statusTone}
      metrics={[
        { value: total, label: 'Capacity' },
        { value: bookingCount, label: 'Bookings', color: Colors.action },
        { value: pendingCount, label: 'Pending', color: '#B45309' },
        { value: available, label: 'Available', color: Colors.success },
      ]}
      fillPct={fillPct}
      fillCaption={`${booked} booked · ${available} seat${available === 1 ? '' : 's'} left`}
      trailingCaption={formatCurrency(trip.price) + '/seat'}
      onPress={onPress}
    />
  );
}
