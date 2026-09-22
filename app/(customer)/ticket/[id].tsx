import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DigitalTicket } from '@/components/ticket/DigitalTicket';
import { ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useBooking } from '@/hooks/useBooking';
import * as bookingService from '@/services/bookingService';
import {
  getOfflineTicket,
  saveOfflineTicket,
} from '@/services/ticketCache';
import * as tripService from '@/services/tripService';
import { useBookingStore } from '@/store/bookingStore';
import type { PickupPoint } from '@/types/route';
import type { TripWithDetails } from '@/types/trip';
import { formatDate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';

export default function TicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { booking, loading, error } = useBooking(id);
  const lastBooking = useBookingStore((state) => state.lastBooking);
  const selectedTrip = useBookingStore((state) => state.selectedTrip);
  const selectedPickup = useBookingStore((state) => state.selectedPickup);
  const [trip, setTrip] = useState<TripWithDetails | null>(selectedTrip);
  const [pickup, setPickup] = useState<PickupPoint | null>(selectedPickup);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [offlineLoading, setOfflineLoading] = useState(false);

  const activeBooking = booking ?? (lastBooking?.id === id ? lastBooking : null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      const cached = await getOfflineTicket(id);
      if (!mounted || !cached) return;
      if (!activeBooking) {
        setTrip(cached.trip);
        setPickup(cached.pickup);
      }
      if (cached.qrCode) setQrCode(cached.qrCode);
      setOfflineSaved(true);
    })();
    return () => {
      mounted = false;
    };
  }, [id, activeBooking]);

  useEffect(() => {
    if (!activeBooking) return;
    let mounted = true;
    (async () => {
      try {
        const loaded = await tripService.getTripById(activeBooking.tripId);
        if (!mounted) return;
        setTrip(loaded);
        const points = loaded?.pickupLocations ?? [];
        setPickup(
          selectedPickup ??
            points.find((point) => point.id === activeBooking.pickupPointId) ??
            points[0] ??
            null
        );
      } catch {
        // keep offline trip if present
      }

      try {
        const ticket = await bookingService.getTicket(activeBooking.id);
        if (!mounted) return;
        const code = String(ticket.qrCode ?? ticket.ticketQr ?? '');
        if (code) setQrCode(code);
      } catch {
        // optional — booking.qrPayload still works
      }
    })();
    return () => {
      mounted = false;
    };
  }, [activeBooking, selectedPickup]);

  if ((loading || offlineLoading) && !activeBooking && !trip) {
    return <LoadingState title="Loading ticket..." />;
  }
  if ((error || !activeBooking || !trip) && !offlineSaved) {
    return <ErrorState message={error ?? 'Ticket not found'} />;
  }
  if (!activeBooking || !trip) {
    return <ErrorState message="Ticket not found" />;
  }

  const onSaveOffline = async () => {
    setOfflineLoading(true);
    try {
      await saveOfflineTicket({
        booking: activeBooking,
        trip,
        pickup,
        qrCode: qrCode ?? activeBooking.qrPayload,
      });
      setOfflineSaved(true);
      Alert.alert('Saved', 'Ticket stored on this device for weak network areas.');
    } catch {
      Alert.alert('Could not save', 'Try again in a moment.');
    } finally {
      setOfflineLoading(false);
    }
  };

  const onShare = async () => {
    await Share.share({
      message: `Banjara ticket ${activeBooking.bookingCode}\n${trip.from} → ${trip.to}\n${formatDate(activeBooking.date)} · ${formatTime(trip.departureTime)}\nSeats: ${activeBooking.seats.join(', ')}\nPickup: ${pickup?.name ?? 'See app'}`,
    });
  };

  return (
    <View style={styles.container}>
      <Header title="Digital Ticket" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 24 }}>
        <DigitalTicket
          booking={activeBooking}
          trip={trip}
          pickup={pickup}
          qrCode={qrCode}
          offlineSaved={offlineSaved}
          onDownload={() => void onSaveOffline()}
          onShare={() => void onShare()}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
});
