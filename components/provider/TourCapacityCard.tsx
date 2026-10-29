import { InventoryCapacityCard } from '@/components/provider/InventoryCapacityCard';
import { Colors } from '@/constants/colors';
import type { TourItinerary } from '@/types/tourItinerary';
import { formatCurrency } from '@/utils/formatCurrency';

type Props = {
  packageItem: TourItinerary;
  bookingCount: number;
  pendingCount: number;
  travelersBooked: number;
  onPress?: () => void;
};

export function TourCapacityCard({
  packageItem,
  bookingCount,
  pendingCount,
  travelersBooked,
  onPress,
}: Props) {
  const capacity = Math.max(0, packageItem.maxParticipants);
  const taken = Math.min(capacity, Math.max(0, travelersBooked));
  const available = Math.max(0, capacity - taken);
  const fillPct = capacity > 0 ? Math.round((taken / capacity) * 100) : 0;

  const statusTone =
    packageItem.status === 'published'
      ? available === 0
        ? 'full'
        : pendingCount > 0
          ? 'warn'
          : 'ok'
      : packageItem.status === 'pending'
        ? 'warn'
        : 'muted';

  const statusLabel =
    packageItem.status === 'published'
      ? available === 0
        ? 'Full'
        : pendingCount > 0
          ? `${pendingCount} pending`
          : 'Published'
      : packageItem.status === 'pending'
        ? 'In review'
        : packageItem.status === 'rejected'
          ? 'Rejected'
          : 'Draft';

  return (
    <InventoryCapacityCard
      title={packageItem.title}
      subtitle={[
        packageItem.tourType,
        packageItem.destination,
        `${packageItem.durationDays}d`,
      ]
        .filter(Boolean)
        .join(' · ')}
      statusLabel={statusLabel}
      statusTone={statusTone}
      metrics={[
        { value: capacity, label: 'Capacity' },
        { value: bookingCount, label: 'Bookings', color: Colors.action },
        { value: pendingCount, label: 'Pending', color: '#B45309' },
        { value: available, label: 'Open spots', color: Colors.success },
      ]}
      fillPct={fillPct}
      fillCaption={`${taken} traveler${taken === 1 ? '' : 's'} booked · ${available} spot${
        available === 1 ? '' : 's'
      } left`}
      trailingCaption={formatCurrency(packageItem.pricePerPerson) + '/person'}
      onPress={onPress}
    />
  );
}
