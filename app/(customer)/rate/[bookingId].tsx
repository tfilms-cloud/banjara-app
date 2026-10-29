import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StarRatingRow } from '@/components/booking/StarRatingRow';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { useBooking } from '@/hooks/useBooking';
import { getApiErrorMessage } from '@/services/apiError';
import * as reviewService from '@/services/review.service';
import * as tripService from '@/services/tripService';
import type { TripWithDetails } from '@/types/trip';

function overallFrom(payment: number, service: number) {
  return Math.round(((payment + service) / 2) * 10) / 10;
}

export default function RateBookingScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const insets = useSafeAreaInsets();
  const { booking, loading, error } = useBooking(bookingId);
  const [trip, setTrip] = useState<TripWithDetails | null>(null);
  const [existing, setExisting] = useState<reviewService.BookingReview | null | undefined>(
    undefined
  );
  const [paymentRating, setPaymentRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [paymentComment, setPaymentComment] = useState('');
  const [serviceComment, setServiceComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadExisting = useCallback(async () => {
    if (!bookingId) return;
    try {
      const review = await reviewService.getReviewForBooking(bookingId);
      setExisting(review);
      if (review) {
        setPaymentRating(review.paymentRating ?? Math.round(review.rating) ?? 0);
        setServiceRating(review.serviceRating ?? Math.round(review.rating) ?? 0);
        setPaymentComment(review.paymentComment ?? '');
        setServiceComment(review.serviceComment ?? '');
      }
    } catch {
      setExisting(null);
    }
  }, [bookingId]);

  useEffect(() => {
    void loadExisting();
  }, [loadExisting]);

  useEffect(() => {
    if (!booking?.tripId) return;
    void tripService.getTripById(booking.tripId).then(setTrip).catch(() => setTrip(null));
  }, [booking?.tripId]);

  const providerName = trip?.agency.name ?? 'your provider';
  const alreadyRated = Boolean(existing?.id);
  const canSubmit = paymentRating >= 1 && serviceRating >= 1 && !alreadyRated;
  const previewOverall = useMemo(
    () => (canSubmit ? overallFrom(paymentRating, serviceRating) : null),
    [canSubmit, paymentRating, serviceRating]
  );

  const onSubmit = async () => {
    if (!bookingId || !canSubmit) return;
    setSubmitting(true);
    try {
      await reviewService.createReview({
        bookingId,
        paymentRating,
        serviceRating,
        paymentComment: paymentComment.trim() || undefined,
        serviceComment: serviceComment.trim() || undefined,
        comment: [paymentComment.trim(), serviceComment.trim()].filter(Boolean).join('\n\n') || undefined,
      });
      Alert.alert(
        'Thanks for rating',
        'Your payment and service feedback helps other travelers choose with confidence.',
        [
          {
            text: 'Done',
            onPress: () => router.replace(`/(customer)/booking-details/${bookingId}`),
          },
        ]
      );
      await loadExisting();
    } catch (err) {
      Alert.alert('Could not submit', getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || existing === undefined) {
    return <LoadingState title="Loading rating..." />;
  }
  if (error || !booking) {
    return <ErrorState message={error ?? 'Booking not found'} />;
  }

  const paid =
    booking.paymentStatus === 'paid' || booking.paymentStatus === 'confirmed';
  const eligible =
    booking.status === 'completed' ||
    (paid && booking.status !== 'cancelled');

  if (!eligible && !alreadyRated) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Header title="Rate provider" onBack={() => router.back()} />
        <View style={styles.blocked}>
          <Ionicons name="lock-closed-outline" size={36} color={Colors.muted} />
          <Text style={styles.blockedTitle}>Rating unlocks after payment</Text>
          <Text style={styles.blockedBody}>
            Once your payment is confirmed (or the trip is completed), you can rate the
            payment experience and the service you received.
          </Text>
          <Button title="Back to booking" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="Rate provider" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing['4xl'] },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{providerName}</Text>
          <Text style={styles.heroSub}>
            {alreadyRated
              ? 'You already submitted feedback for this booking.'
              : 'Rate both the payment experience and the service — takes under a minute.'}
          </Text>
          {booking.bookingCode ? (
            <Text style={styles.code}>Booking {booking.bookingCode}</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="wallet-outline" size={22} color={Colors.primary} />
            <Text style={styles.cardTitle}>Payment experience</Text>
          </View>
          <StarRatingRow
            value={paymentRating}
            onChange={alreadyRated ? () => undefined : setPaymentRating}
            hint="How smooth was sending payment and getting confirmation?"
          />
          <TextInput
            style={styles.input}
            editable={!alreadyRated}
            placeholder="Optional note about payment (transfer, proof, speed…)"
            placeholderTextColor={Colors.mutedLight}
            value={paymentComment}
            onChangeText={setPaymentComment}
            multiline
            maxLength={400}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="sparkles-outline" size={22} color={Colors.accent} />
            <Text style={styles.cardTitle}>Service quality</Text>
          </View>
          <StarRatingRow
            value={serviceRating}
            onChange={alreadyRated ? () => undefined : setServiceRating}
            hint="How was the trip, pickup, seats, and provider support?"
          />
          <TextInput
            style={styles.input}
            editable={!alreadyRated}
            placeholder="Optional note about the service you received"
            placeholderTextColor={Colors.mutedLight}
            value={serviceComment}
            onChangeText={setServiceComment}
            multiline
            maxLength={400}
          />
        </View>

        {previewOverall != null || alreadyRated ? (
          <View style={styles.overall}>
            <Text style={styles.overallLabel}>Overall score</Text>
            <Text style={styles.overallValue}>
              {alreadyRated ? existing!.rating : previewOverall}/5
            </Text>
            <Text style={styles.overallHint}>
              Average of payment and service ratings
            </Text>
          </View>
        ) : null}

        {!alreadyRated ? (
          <Button
            title="Submit rating"
            loading={submitting}
            disabled={!canSubmit}
            onPress={() => void onSubmit()}
          />
        ) : (
          <Button
            title="Back to booking"
            variant="outline"
            onPress={() => router.replace(`/(customer)/booking-details/${bookingId}`)}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  hero: {
    gap: Spacing.xs,
  },
  heroTitle: {
    ...Typography.h2,
    fontFamily: Fonts.display,
    color: Colors.dark,
  },
  heroSub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.muted,
  },
  code: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.mutedLight,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    color: Colors.dark,
  },
  input: {
    minHeight: 88,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.md,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.dark,
    textAlignVertical: 'top',
  },
  overall: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
  },
  overallLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
  },
  overallValue: {
    fontFamily: Fonts.display,
    fontSize: 32,
    color: Colors.dark,
  },
  overallHint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.mutedLight,
  },
  blocked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  blockedTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    color: Colors.dark,
    textAlign: 'center',
  },
  blockedBody: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.muted,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
});
