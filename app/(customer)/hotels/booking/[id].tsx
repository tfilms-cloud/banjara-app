import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { HotelPriceBreakdownCard } from '@/components/hotels/HotelPriceBreakdown';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useHotelStore } from '@/store/hotelStore';
import { formatDate } from '@/utils/formatDate';

const schema = z.object({
  name: z.string().min(2, 'Enter guest name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter a valid phone'),
  specialRequests: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function HotelBookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const {
    selectedHotel,
    selectedRoom,
    checkIn,
    checkOut,
    adults,
    children,
    roomQuantity,
    guest,
    setGuest,
    priceBreakdown,
  } = useHotelStore();

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      specialRequests: guest.specialRequests ?? '',
    },
  });

  if (!selectedHotel || !selectedRoom || !priceBreakdown) {
    return (
      <View style={styles.container}>
        <Header title="Guest Details" showBack fallbackHref={`/(customer)/hotels/rooms/${id}` as never} />
        <Text style={styles.empty}>Please select a hotel room first.</Text>
      </View>
    );
  }

  const onContinue = handleSubmit((values) => {
    setGuest(values);
    router.push('/(customer)/hotels/review');
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="Guest Details" showBack fallbackHref={`/(customer)/hotels/rooms/${id}` as never} />
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 100, gap: Spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.hotel}>{selectedHotel.name}</Text>
          <Text style={styles.meta}>{selectedRoom.name}</Text>
          <Text style={styles.meta}>
            {formatDate(checkIn, false)} → {formatDate(checkOut, false)}
          </Text>
          <Text style={styles.meta}>
            {adults + children} guests · {roomQuantity} room{roomQuantity > 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.card}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Guest name"
                value={value}
                onChangeText={onChange}
                leftIcon="person-outline"
                error={formState.errors.name?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Email"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
                keyboardType="email-address"
                leftIcon="mail-outline"
                error={formState.errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Phone"
                value={value}
                onChangeText={onChange}
                keyboardType="phone-pad"
                leftIcon="call-outline"
                error={formState.errors.phone?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="specialRequests"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Special requests"
                value={value}
                onChangeText={onChange}
                placeholder="Late check-in, extra pillows..."
              />
            )}
          />
        </View>

        <HotelPriceBreakdownCard breakdown={priceBreakdown} />
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button title="Review Booking" onPress={onContinue} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  empty: { ...Typography.body, color: Colors.muted, padding: Spacing.lg },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hotel: { ...Typography.h3, color: Colors.primary },
  meta: { ...Typography.body, color: Colors.muted },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.lg,
  },
});
