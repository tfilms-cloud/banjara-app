import { Colors } from '@/constants/colors';

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function delay(ms = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function vehicleTypeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function bookingStatusColor(status: string): string {
  switch (status) {
    case 'upcoming':
    case 'confirmed':
      return Colors.secondary;
    case 'completed':
      return Colors.success;
    case 'cancelled':
      return Colors.danger;
    default:
      return Colors.muted;
  }
}
