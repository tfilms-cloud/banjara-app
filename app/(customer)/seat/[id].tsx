import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SeatMap } from '@/components/seat/SeatMap';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { SeatSelectionSkeleton } from '@/components/ui/Skeleton';
import { Colors } from '@/constants/colors';
import { Shadows, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as tripService from '@/services/tripService';
import { useBookingStore } from '@/store/bookingStore';
import type { Seat, SeatLayout } from '@/types/seat';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';
import { vehicleTypeLabel } from '@/utils/helpers';
import { paramId, pushPath, safeBack } from '@/utils/navigation';

export default function SeatSelectionScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = paramId(params.id);
  const insets = useSafeAreaInsets();
  const selectedTrip = useBookingStore((state) => state.selectedTrip);
  const selectedPickup = useBookingStore((state) => state.selectedPickup);
  const selectedSeats = useBookingStore((state) => state.selectedSeats);
  const toggleSeat = useBookingStore((state) => state.toggleSeat);
  const priceBreakdown = useBookingStore((state) => state.priceBreakdown);
  const [layout, setLayout] = useState<SeatLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSeats = useCallback(
    async (bustCache = false) => {
      if (!id) {
        setLoading(false);
        setError('Trip not found');
        setLayout(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        if (bustCache) tripService.invalidateTripCache(id);
        const data = await tripService.getVehicleSeats(id);
        setLayout(data);
      } catch (err) {
        setLayout(null);
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    void loadSeats();
  }, [loadSeats]);

  const onToggle = (seat: Seat) => {
    toggleSeat(seat.label, selectedTrip?.price ?? seat.price);
  };

  const availableCount = useMemo(
    () => layout?.seats.filter((seat) => seat.status === 'available').length ?? 0,
    [layout]
  );
  const tripUnavailable = ['cancelled', 'completed', 'departed'].includes(
    String(selectedTrip?.status ?? '').toLowerCase()
  );
  const soldOut = Boolean(layout && availableCount === 0);
  const canContinue =
    selectedSeats.length > 0 &&
    Boolean(selectedTrip) &&
    Boolean(selectedPickup) &&
    !tripUnavailable &&
    !soldOut;

  const routeLabel =
    selectedTrip?.from && selectedTrip?.to
      ? `${selectedTrip.from} → ${selectedTrip.to}`
      : 'Select your seats';
  const whenLabel = selectedTrip
    ? [
        selectedTrip.date ? formatDate(selectedTrip.date, false) : '',
        selectedTrip.departureTime ? formatTime(selectedTrip.departureTime) : '',
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  const vehicleBits = [
    selectedTrip?.vehicleType ? vehicleTypeLabel(selectedTrip.vehicleType) : '',
    selectedTrip?.vehicleName ?? '',
    [selectedTrip?.vehicleBrand, selectedTrip?.vehicleModel].filter(Boolean).join(' '),
  ].filter((value, index, list) => value.length > 0 && list.indexOf(value) === index);

  const capacityLabel =
    selectedTrip?.vehicleCapacity || selectedTrip?.totalSeats
      ? `${selectedTrip.vehicleCapacity ?? selectedTrip.totalSeats} seats`
      : '';

  return (
    <View style={styles.container}>
      <Header
        title="Select your seats"
        subtitle={routeLabel}
        showBack
        onBack={() => safeBack(`/(customer)/pickup/${id}`)}
      />

      {loading && !layout ? (
        <SeatSelectionSkeleton />
      ) : error && !layout ? (
        <ErrorState
          title="Couldn't load seats"
          message={error}
          onRetry={() => void loadSeats(true)}
        />
      ) : !layout ? (
        <EmptyState
          title="Seat map unavailable"
          message="Seat selection isn't available for this trip."
          icon="grid-outline"
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{
              padding: Spacing.screen,
              paddingBottom: insets.bottom + 150,
              gap: Spacing.md,
            }}
            showsVerticalScrollIndicator={false}
          >
            {selectedTrip ? (
              <View style={styles.context}>
                {whenLabel ? <Text style={styles.when}>{whenLabel}</Text> : null}
                <View style={styles.chipRow}>
                  {vehicleBits.map((bit) => (
                    <Badge key={bit} label={bit} tone="gray" />
                  ))}
                  {capacityLabel ? <Badge label={capacityLabel} tone="blue" /> : null}
                  {selectedTrip.agency.name ? (
                    <Badge label={selectedTrip.agency.name} tone="navy" />
                  ) : null}
                </View>
              </View>
            ) : null}

            {soldOut || tripUnavailable ? (
              <EmptyState
                title={tripUnavailable ? 'Trip unavailable' : 'No seats available'}
                message={
                  tripUnavailable
                    ? 'This trip can no longer be booked.'
                    : 'Every seat on this departure is already taken.'
                }
                icon="close-circle-outline"
              />
            ) : (
              <SeatMap layout={layout} selectedSeats={selectedSeats} onToggleSeat={onToggle} />
            )}
          </ScrollView>

          <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
            <View style={styles.summaryRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Selected seats</Text>
                <Text style={styles.value} numberOfLines={2}>
                  {selectedSeats.length ? selectedSeats.join(' · ') : 'None yet'}
                </Text>
              </View>
              <View style={styles.priceCol}>
                <Text style={styles.label}>
                  {selectedSeats.length
                    ? `${selectedSeats.length} seat${selectedSeats.length === 1 ? '' : 's'}`
                    : 'Total'}
                </Text>
                <Text style={styles.price}>
                  {formatCurrency(
                    priceBreakdown?.total ?? 0,
                    priceBreakdown?.currency ?? selectedTrip?.currency ?? 'PKR'
                  )}
                </Text>
              </View>
            </View>
            <Button
              title="Continue"
              disabled={!canContinue}
              onPress={() => pushPath('/(customer)/booking/review')}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  context: { gap: Spacing.sm },
  when: {
    ...Typography.caption,
    color: Colors.muted,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    ...Shadows.float,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
  },
  priceCol: { alignItems: 'flex-end' },
  label: { ...Typography.caption, color: Colors.muted },
  value: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.primary,
    marginTop: 2,
  },
  price: {
    ...Typography.h3,
    color: Colors.primary,
    marginTop: 2,
  },
});
