import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import * as providerService from '@/services/providerService';
import { useProviderStore } from '@/store/providerStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

export default function ProviderRoomsScreen() {
  const insets = useSafeAreaInsets();
  const rooms = useProviderStore((s) => s.rooms);
  const refreshDashboard = useProviderStore((s) => s.refreshDashboard);

  const onDelete = (id: string) => {
    Alert.alert('Delete room', 'Remove this room from your inventory?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await providerService.deleteRoom(id);
          await refreshDashboard();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Room Management" showBack fallbackHref={'/(provider)/hotel/index' as never} />
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, paddingBottom: insets.bottom + 100 }}
        ListEmptyComponent={<EmptyState title="No rooms" icon="bed-outline" />}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              router.push({ pathname: '/(provider)/rooms/add', params: { id: item.id } } as never)
            }
          >
            <Image
              source={{ uri: normalizeMediaUrl(item.images[0]) ?? item.images[0] }}
              style={styles.image}
              contentFit="cover"
            />
            <View style={styles.body}>
              <View style={styles.top}>
                <Text style={styles.title}>{item.name}</Text>
                <Badge label={item.available ? 'Available' : 'Unavailable'} tone={item.available ? 'green' : 'gray'} />
              </View>
              <Text style={styles.meta}>
                {item.roomType} · {item.bedType} · {item.capacity} guests · {item.sizeSqm} m²
              </Text>
              <Text style={styles.meta}>
                {item.quantity} rooms · {formatCurrency(item.pricePerNight)} / night
              </Text>
              <Text style={styles.meta}>{item.amenities.join(' · ')}</Text>
              <View style={styles.actions}>
                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/(provider)/rooms/add', params: { id: item.id } } as never)
                  }
                >
                  <Text style={styles.edit}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => onDelete(item.id)}
                >
                  <Text style={styles.delete}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        )}
      />
      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button title="Add Room" onPress={() => router.push('/(provider)/rooms/add')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: { width: '100%', height: 140 },
  body: { padding: Spacing.lg, gap: 6 },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  title: { ...Typography.h3, color: Colors.primary, flex: 1 },
  meta: { ...Typography.caption, color: Colors.muted },
  actions: { flexDirection: 'row', gap: Spacing.lg, marginTop: 4 },
  edit: { ...Typography.caption, color: Colors.secondary, fontWeight: '700' },
  delete: { ...Typography.caption, color: Colors.danger, fontWeight: '700' },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
