import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as tourItineraryService from '@/services/tourItineraryService';
import { useTourBookingStore } from '@/store/tourBookingStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { paramId } from '@/utils/navigation';

export default function TourBookScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = paramId(params.id);
  const [loading, setLoading] = useState(true);

  const {
    itinerary,
    startDate,
    travelers,
    guest,
    priceBreakdown,
    setItinerary,
    setStartDate,
    setTravelers,
    setGuest,
  } = useTourBookingStore();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void tourItineraryService
      .getPublished(id)
      .then((item) => {
        if (!alive) return;
        setItinerary(item);
      })
      .catch((error) => {
        Alert.alert('Could not load package', getApiErrorMessage(error));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id, setItinerary]);

  const max = itinerary?.maxParticipants ?? 12;

  const onContinue = () => {
    if (!itinerary) return;
    if (!startDate.trim()) {
      Alert.alert('Start date required', 'Pick when you want to begin.');
      return;
    }
    if (!guest.name.trim() || guest.name.trim().length < 2) {
      Alert.alert('Name required', 'Enter the lead traveler name.');
      return;
    }
    if (!guest.email.trim() || !guest.email.includes('@')) {
      Alert.alert('Email required', 'Enter a valid email.');
      return;
    }
    if (!guest.phone.trim() || guest.phone.trim().length < 10) {
      Alert.alert('Phone required', 'Enter a valid phone number.');
      return;
    }
    router.push('/(customer)/tours/review');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="Book package" showBack fallbackHref={`/(customer)/tours/${id}`} />
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 100,
          gap: Spacing.md,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {loading || !itinerary ? (
          <Text style={styles.hint}>Loading package…</Text>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.packageTitle}>{itinerary.title}</Text>
              <Text style={styles.meta}>
                {[itinerary.tourType, itinerary.destination, `${itinerary.durationDays} days`]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              <Text style={styles.price}>
                {formatCurrency(itinerary.pricePerPerson)} / person
              </Text>
            </View>

            <Input
              label="Start date (YYYY-MM-DD)"
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2026-05-15"
              leftIcon="calendar-outline"
            />

            <Text style={styles.label}>Travelers (max {max})</Text>
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepBtn}
                onPress={() => setTravelers(travelers - 1)}
                disabled={travelers <= 1}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </Pressable>
              <Text style={styles.stepValue}>{travelers}</Text>
              <Pressable
                style={styles.stepBtn}
                onPress={() => setTravelers(travelers + 1)}
                disabled={travelers >= max}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </Pressable>
            </View>

            <Input
              label="Lead traveler name"
              value={guest.name}
              onChangeText={(name) => setGuest({ name })}
              leftIcon="person-outline"
            />
            <Input
              label="Email"
              value={guest.email}
              onChangeText={(email) => setGuest({ email })}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
            />
            <Input
              label="Phone"
              value={guest.phone}
              onChangeText={(phone) => setGuest({ phone })}
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />
            <Input
              label="Special requests (optional)"
              value={guest.specialRequests ?? ''}
              onChangeText={(specialRequests) => setGuest({ specialRequests })}
              multiline
            />

            {priceBreakdown ? (
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Estimated total</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(priceBreakdown.total, priceBreakdown.currency)}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button title="Review booking" onPress={onContinue} disabled={!itinerary || loading} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hint: { ...Typography.body, color: Colors.muted },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: 4,
  },
  packageTitle: { fontFamily: Fonts.display, fontSize: 18, color: Colors.dark },
  meta: { ...Typography.caption, color: Colors.muted, textTransform: 'capitalize' },
  price: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.primary, marginTop: 4 },
  label: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.dark },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignSelf: 'flex-start',
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontFamily: Fonts.display, fontSize: 20, color: Colors.primary },
  stepValue: { fontFamily: Fonts.display, fontSize: 20, color: Colors.dark, minWidth: 28, textAlign: 'center' },
  totalCard: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontFamily: Fonts.bodyMedium, color: Colors.primary },
  totalValue: { fontFamily: Fonts.display, fontSize: 20, color: Colors.primary },
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
