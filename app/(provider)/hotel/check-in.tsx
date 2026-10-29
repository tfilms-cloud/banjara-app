import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import * as providerService from '@/services/providerService';
import { useHotelCheckInStore } from '@/store/hotelCheckInStore';
import { useProviderStore } from '@/store/providerStore';
import { paramId } from '@/utils/navigation';

export default function HotelCheckInScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const bookingId = paramId(params.id);
  const bookings = useProviderStore((s) => s.bookings);
  const refreshBookings = useProviderStore((s) => s.refreshBookings);
  const saveCheckIn = useHotelCheckInStore((s) => s.saveCheckIn);
  const existing = useHotelCheckInStore((s) => (bookingId ? s.byBookingId[bookingId] : undefined));

  const booking = useMemo(
    () => bookings.find((item) => item.id === bookingId),
    [bookings, bookingId]
  );

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    guestName: existing?.guestName ?? booking?.customerName ?? '',
    cnic: existing?.cnic ?? '',
    phone: existing?.phone ?? booking?.customerPhone ?? '',
    roomsAvailed: existing ? String(existing.roomsAvailed) : '1',
    days: existing ? String(existing.days) : '1',
    guests: existing ? String(existing.guests) : '2',
  });

  const onCheckedIn = async () => {
    if (!bookingId || !booking) {
      Alert.alert('Missing booking', 'Open check-in from a pending booking.');
      return;
    }
    if (!form.guestName.trim()) {
      Alert.alert('Required', 'Enter the guest name.');
      return;
    }
    if (!form.cnic.trim() || form.cnic.replace(/\D/g, '').length < 13) {
      Alert.alert('CNIC', 'Enter a valid 13-digit CNIC.');
      return;
    }
    if (!form.phone.trim()) {
      Alert.alert('Required', 'Enter the registered phone number.');
      return;
    }
    const roomsAvailed = Math.max(1, Number(form.roomsAvailed) || 1);
    const days = Math.max(1, Number(form.days) || 1);
    const guests = Math.max(1, Number(form.guests) || 1);

    setLoading(true);
    try {
      const checkedInAt = new Date().toISOString();
      saveCheckIn({
        bookingId,
        bookingCode: booking.bookingCode,
        roomLabel: booking.detailLabel || booking.seatsOrRoom || booking.serviceLabel,
        guestName: form.guestName.trim(),
        cnic: form.cnic.trim(),
        phone: form.phone.trim(),
        roomsAvailed,
        days,
        guests,
        checkedInAt,
        customerVisible: true,
      });
      try {
        await providerService.updateBookingStatus(bookingId, 'confirmed');
      } catch {
        // Local check-in still saved if API status update fails
      }
      await refreshBookings();
      Alert.alert(
        'Checked in',
        'Guest is checked in. This booking moves to Active bookings. The customer will see a verified check-in message in the app.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Check in" showBack fallbackHref={'/(provider)/(tabs)/bookings' as never} />
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 40,
          gap: Spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Guest check-in</Text>
        <Text style={styles.sub}>
          Enter details for {booking?.customerName ?? 'the guest'}. After you confirm, this stay
          becomes an active booking and the customer gets a verifiable check-in notice.
        </Text>

        {booking ? (
          <View style={styles.metaCard}>
            <Text style={styles.metaTitle}>{booking.detailLabel || booking.serviceLabel}</Text>
            <Text style={styles.metaLine}>
              {booking.bookingCode} · {booking.date}
              {booking.time ? ` · ${booking.time}` : ''}
            </Text>
            <Text style={styles.metaLine}>{booking.seatsOrRoom}</Text>
          </View>
        ) : null}

        <Input
          label="Name *"
          value={form.guestName}
          onChangeText={(guestName) => setForm({ ...form, guestName })}
          leftIcon="person-outline"
        />
        <Input
          label="CNIC *"
          value={form.cnic}
          onChangeText={(cnic) => setForm({ ...form, cnic: cnic.replace(/[^\d-]/g, '') })}
          keyboardType="number-pad"
          placeholder="xxxxx-xxxxxxx-x"
          leftIcon="card-outline"
        />
        <Input
          label="Registered phone number *"
          value={form.phone}
          onChangeText={(phone) => setForm({ ...form, phone })}
          keyboardType="phone-pad"
          leftIcon="call-outline"
        />
        <Input
          label="Number of rooms availed *"
          value={form.roomsAvailed}
          onChangeText={(roomsAvailed) => setForm({ ...form, roomsAvailed: roomsAvailed.replace(/\D/g, '') })}
          keyboardType="number-pad"
          leftIcon="bed-outline"
        />
        <Input
          label="Number of days rooms availed for *"
          value={form.days}
          onChangeText={(days) => setForm({ ...form, days: days.replace(/\D/g, '') })}
          keyboardType="number-pad"
          leftIcon="calendar-outline"
        />
        <Input
          label="Number of guests *"
          value={form.guests}
          onChangeText={(guests) => setForm({ ...form, guests: guests.replace(/\D/g, '') })}
          keyboardType="number-pad"
          leftIcon="people-outline"
        />

        <Button title="Checked In" loading={loading} onPress={() => void onCheckedIn()} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heading: { ...Typography.h2, color: Colors.primary },
  sub: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  metaCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 4,
  },
  metaTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.dark },
  metaLine: { fontFamily: Fonts.body, fontSize: 13, color: Colors.muted },
});
