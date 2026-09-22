import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      await reviewService.createReview({
        bookingId,
        rating,
        comment: comment.trim() || undefined,
      });
      Alert.alert('Thanks!', 'Your review helps other travelers choose with confidence.');
      onSubmitted?.();
      onClose();
      setComment('');
      setRating(5);
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
          <Text style={styles.title}>Rate your trip</Text>
          <Text style={styles.sub}>How was {agencyName}?</Text>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                key={value}
                onPress={() => setRating(value)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`${value} stars`}
              >
                <Text style={[styles.star, value <= rating && styles.starOn]}>★</Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Share a short tip for other travelers (optional)"
            placeholderTextColor={Colors.mutedLight}
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={400}
          />

          <Button title="Submit review" loading={loading} onPress={() => void onSubmit()} />
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
  },
  stars: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  star: {
    fontSize: 34,
    color: Colors.border,
  },
  starOn: {
    color: Colors.accent,
  },
  input: {
    minHeight: 96,
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
