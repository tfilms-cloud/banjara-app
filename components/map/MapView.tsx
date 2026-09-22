import { PickupMap } from '@/components/map/PickupMap';
import type { Coordinates, PickupPoint } from '@/types/route';

interface AppMapViewProps {
  center: Coordinates;
  pickups?: PickupPoint[];
  selectedPickupId?: string;
  onSelectPickup?: (pickup: PickupPoint) => void;
  height?: number;
  userLocation?: Coordinates | null;
  showControls?: boolean;
  allowFullscreen?: boolean;
  focusPickupId?: string;
}

/** Backward-compatible map wrapper used across pickup & booking screens. */
export function AppMapView({
  center,
  pickups = [],
  selectedPickupId,
  onSelectPickup,
  height = 280,
  userLocation,
  showControls = true,
  allowFullscreen = true,
  focusPickupId,
}: AppMapViewProps) {
  const points =
    pickups.length > 0
      ? pickups
      : [
          {
            id: 'center',
            name: 'Location',
            address: '',
            time: '',
            distanceKm: 0,
            coordinates: center,
          } satisfies PickupPoint,
        ];

  return (
    <PickupMap
      pickups={points}
      selectedPickupId={selectedPickupId}
      onSelectPickup={onSelectPickup}
      userLocation={userLocation}
      height={height}
      showControls={showControls}
      allowFullscreen={allowFullscreen}
      focusPickupId={focusPickupId}
      showSelectedCard={points.length > 0 && points[0].id !== 'center'}
    />
  );
}
