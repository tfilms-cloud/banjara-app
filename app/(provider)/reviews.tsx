import { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import * as providerService from '@/services/providerService';
import { useProviderStore } from '@/store/providerStore';

export default function ProviderReviewsScreen() {
  const insets = useSafeAreaInsets();
  const reviews = useProviderStore((s) => s.reviews);
  const refreshDashboard = useProviderStore((s) => s.refreshDashboard);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});

  const overall =
    reviews.length === 0
      ? 0
      : Math.round((reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length) * 10) / 10;

  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((item) => item.rating === star).length,
  }));

  return (
    <View style={styles.container}>
      <Header title="Reviews" showBack fallbackHref="/(provider)/(tabs)/profile" />
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={
          <View style={styles.summary}>
            <Text style={styles.score}>{overall || '—'}</Text>
            <Text style={styles.meta}>{reviews.length} total reviews</Text>
            {counts.map((item) => (
              <Text key={item.star} style={styles.meta}>
                {item.star}★ · {item.count}
              </Text>
            ))}
          </View>
        }
        ListEmptyComponent={<EmptyState title="No reviews yet" icon="star-outline" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>
              {item.customerName} · {item.rating}★
            </Text>
            <Text style={styles.meta}>{item.serviceLabel}</Text>
            <Text style={styles.body}>{item.comment}</Text>
            {item.reply ? <Text style={styles.reply}>Reply: {item.reply}</Text> : null}
            {!item.reply ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Write a reply"
                  placeholderTextColor={Colors.muted}
                  value={replyDraft[item.id] ?? ''}
                  onChangeText={(text) => setReplyDraft((prev) => ({ ...prev, [item.id]: text }))}
                />
                <Button
                  title="Reply"
                  onPress={async () => {
                    const text = replyDraft[item.id]?.trim();
                    if (!text) return;
                    await providerService.replyToReview(item.id, text);
                    await refreshDashboard();
                    Alert.alert('Sent', 'Reply posted.');
                  }}
                />
              </>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  summary: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
    marginBottom: Spacing.md,
  },
  score: { ...Typography.h1, color: Colors.primary },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  title: { ...Typography.h3, color: Colors.primary },
  meta: { ...Typography.caption, color: Colors.muted },
  body: { ...Typography.body, color: Colors.dark, lineHeight: 20 },
  reply: { ...Typography.caption, color: Colors.secondary },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    color: Colors.primary,
    backgroundColor: Colors.background,
  },
});
