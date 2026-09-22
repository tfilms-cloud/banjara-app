import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import * as providerService from '@/services/providerService';
import type { ProviderPassenger } from '@/types/provider';
import { useProviderStore } from '@/store/providerStore';

export default function ProviderPassengersScreen() {
  const insets = useSafeAreaInsets();
  const provider = useProviderStore((s) => s.provider);
  const [passengers, setPassengers] = useState<ProviderPassenger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!provider) return;
      const result = await providerService.getPassengers(provider.id);
      if (mounted) {
        setPassengers(result);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [provider]);

  if (loading) return <LoadingState title="Loading passengers..." />;

  return (
    <View style={styles.container}>
      <Header title="Passengers" showBack fallbackHref={'/(provider)/transport/index' as never} />
      <FlatList
        data={passengers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, paddingBottom: insets.bottom + 24 }}
        ListEmptyComponent={<EmptyState title="No passengers" icon="people-outline" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.meta}>Seat {item.seat} · Booking {item.bookingId}</Text>
            <Text style={styles.meta}>
              {item.pickup} → {item.dropoff}
            </Text>
            <Text style={styles.meta}>
              {item.phone} · {item.status}
            </Text>
          </View>
        )}
      />
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
    gap: 4,
  },
  title: { ...Typography.h3, color: Colors.primary },
  meta: { ...Typography.caption, color: Colors.muted },
});
