import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionGrid, type ActionItem } from '@/components/ui/ActionGrid';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import * as providerService from '@/services/providerService';
import type { ProviderBooking } from '@/types/provider';
import { useProviderStore } from '@/store/providerStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { pushPath } from '@/utils/navigation';

export default function ProviderBookingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const refreshBookings = useProviderStore((s) => s.refreshBookings);
  const [booking, setBooking] = useState<ProviderBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const result = await providerService.getProviderBookingById(id);
      if (mounted) {
        setBooking(result);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <LoadingState title="Loading booking..." />;
  if (!booking) return <ErrorState message="Booking not found" />;

  const updateStatus = async (status: ProviderBooking['status']) => {
    const updated = await providerService.updateBookingStatus(booking.id, status);
    setBooking(updated);
    await refreshBookings();
    Alert.alert('Updated', `Booking marked as ${status}.`);
  };

  const contactActions: ActionItem[] = [
    {
      key: 'call',
      label: 'Call',
      subtitle: 'Phone customer',
      icon: 'call-outline',
      tone: 'green',
      onPress: () => Linking.openURL(`tel:${booking.customerPhone.replace(/\s/g, '')}`),
    },
    ...(booking.customerId
      ? [
          {
            key: 'message',
            label: 'Message',
            subtitle: 'Open chat',
            icon: 'chatbubble-outline' as const,
            tone: 'blue' as const,
            onPress: () =>
              pushPath(`/(provider)/messages/${booking.customerId}?bookingId=${booking.id}`),
          },
        ]
      : []),
    ...(booking.kind === 'transport'
      ? [
          {
            key: 'passengers',
            label: 'Passengers',
            subtitle: 'Seat list',
            icon: 'people-outline' as const,
            tone: 'navy' as const,
            onPress: () => pushPath('/(provider)/passengers'),
          },
        ]
      : []),
  ];

  return (
    <View style={styles.container}>
      <Header title="Booking Details" showBack fallbackHref="/(provider)/(tabs)/bookings" />
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 40,
          gap: Spacing.lg,
        }}
      >
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.code}>{booking.bookingCode}</Text>
            <Badge label={booking.status} tone="blue" />
          </View>
          <Text style={styles.title}>{booking.customerName}</Text>
          <Text style={styles.meta}>{booking.customerPhone}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Service</Text>
          <Text style={styles.meta}>
            {booking.serviceLabel} · {booking.detailLabel}
          </Text>
          <Text style={styles.meta}>
            {booking.date}
            {booking.time ? ` · ${booking.time}` : ''}
          </Text>
          <Text style={styles.meta}>{booking.seatsOrRoom}</Text>
          {booking.pickup ? <Text style={styles.meta}>Pickup: {booking.pickup}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Payment</Text>
          <Text style={styles.meta}>
            {booking.paymentStatus} · {formatCurrency(booking.amount)}
          </Text>
        </View>

        <Text style={styles.section}>Update status</Text>
        <View style={styles.statusRow}>
          <Button
            title="Accept"
            onPress={() => updateStatus('confirmed')}
            style={{ flex: 1 }}
            fullWidth={false}
          />
          <Button
            title="Reject"
            variant="outline"
            onPress={() => updateStatus('rejected')}
            style={{ flex: 1 }}
            fullWidth={false}
          />
        </View>
        <Button title="Cancel booking" variant="ghost" onPress={() => updateStatus('cancelled')} />

        {contactActions.length ? (
          <>
            <Text style={styles.section}>Customer</Text>
            <ActionGrid items={contactActions} />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { ...Typography.caption, color: Colors.muted, fontWeight: '700' },
  title: { ...Typography.h3, color: Colors.primary },
  section: { ...Typography.h3, color: Colors.primary },
  meta: { ...Typography.caption, color: Colors.muted },
  statusRow: { flexDirection: 'row', gap: Spacing.md },
});
