import { router } from 'expo-router';
import type { PushData } from '@/services/pushNotifications';
import { pushPath } from '@/utils/navigation';

/** Map push / inbox payload → the right screen for the signed-in role. */
export function openFromNotificationData(
  data: PushData,
  role: 'customer' | 'provider' | 'admin' | string | undefined
) {
  const bookingId = data.bookingId ? String(data.bookingId) : '';
  const conversationId = data.conversationId ? String(data.conversationId) : '';
  const otherUserId = data.otherUserId
    ? String(data.otherUserId)
    : data.senderId
      ? String(data.senderId)
      : '';
  const type = String(data.type ?? '');
  const isMessage = type === 'newMessage' || type === 'new_message' || Boolean(conversationId);

  if (role === 'provider') {
    // Open the chat thread before booking screens when this is a message tap.
    if (isMessage && otherUserId) {
      pushPath(`/(provider)/messages/${otherUserId}`);
      return;
    }
    if (isMessage) {
      pushPath('/(provider)/messages');
      return;
    }
    if (bookingId) {
      pushPath(`/(provider)/booking/${bookingId}`);
      return;
    }
    if (type === 'cnicVerified' || type === 'cnicFailed') {
      pushPath('/(provider)/register/verification');
      return;
    }
    if (type === 'newReview') {
      pushPath('/(provider)/reviews');
      return;
    }
    pushPath('/(provider)/notifications');
    return;
  }

  // Customer (default)
  if (isMessage && otherUserId) {
    pushPath(`/(customer)/messages/${otherUserId}`);
    return;
  }
  if (isMessage) {
    pushPath('/(customer)/(tabs)/inbox');
    return;
  }
  if (bookingId) {
    pushPath(`/(customer)/booking-details/${bookingId}`);
    return;
  }
  if (type === 'new_offer' || type === 'newOffer') {
    router.push('/(customer)/(tabs)/search');
    return;
  }
  pushPath('/(customer)/(tabs)/notifications');
}
