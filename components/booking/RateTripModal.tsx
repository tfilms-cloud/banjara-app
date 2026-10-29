import { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StarRatingRow } from '@/components/booking/StarRatingRow';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import * as reviewService from '@/services/review.service';

type RateTripModalProps = {
  visible: boolean;
  bookingId: string;
  agencyName: string;
  onClose: () => void;
  onSubmitted?: () => void;
};

export function RateTripModal({
  visible,
  bookingId,
  agencyName,
  onClose,
  onSubmitted,
}: RateTripModalProps) {
  const [paymentRating, setPaymentRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [paymentComment, setPaymentComment] = useState('');
  const [serviceComment, setServiceComment] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = paymentRating >= 1 && serviceRating >= 1;

  const reset = () => {
    setPaymentRating(0);
    setServiceRating(0);
    setPaymentComment('');
    setServiceComment('');
  };

  const onSubmit = async () => {
    if (!canSubmit) {
      Alert.alert('Almost there', 'Please rate both payment and service (1–5 stars).');
      return;
    }
    setLoading(true);
    try {
      await reviewService.createReview({
        bookingId,
        paymentRating,
        serviceRating,
        paymentComment: paymentComment.trim() || undefined,
        serviceComment: serviceComment.trim() || undefined,
        comment:
          [paymentComment.trim(), serviceComment.trim()].filter(Boolean).join('\n\n') ||
          undefined,
      });
      Alert.alert('Thanks!', 'Your payment and service ratings were submitted.');
      onSubmitted?.();
      onClose();
      reset();
    } catch (error) {
      Alert.alert('Could not submit', getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Rate {agencyName}</Text>
          <Text style={styles.sub}>Two quick scores — payment and service.</Text>

          <StarRatingRow
            value={paymentRating}
            onChange={setPaymentRating}
            label="Payment experience"
            hint="Transfer, proof, and confirmation"
            size={32}
          />
          <TextInput
            style={styles.input}
            placeholder="Payment note (optional)"
            placeholderTextColor={Colors.mutedLight}
            value={paymentComment}
            onChangeText={setPaymentComment}
            multiline
            maxLength={200}
          />

          <StarRatingRow
            value={serviceRating}
            onChange={setServiceRating}
            label="Service quality"
            hint="Trip, pickup, and provider support"
            size={32}
          />
          <TextInput
            style={styles.input}
            placeholder="Service note (optional)"
            placeholderTextColor={Colors.mutedLight}
            value={serviceComment}
            onChangeText={setServiceComment}
            multiline
            maxLength={200}
          />

          <Button
            title="Submit rating"
            loading={loading}
            disabled={!canSubmit}
            onPress={() => void onSubmit()}
          />
          <Button title="Not now" variant="ghost" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,25,23,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    padding: Spacing.xl,
    gap: Spacing.md,
    maxHeight: '92%',
  },
  title: {
    fontFamily: Fonts.bodyBold,
    fontSize: 20,
    color: Colors.dark,
  },
  sub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.muted,
    marginBottom: Spacing.xs,
  },
  input: {
    minHeight: 64,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.md,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.dark,
    textAlignVertical: 'top',
  },
});
