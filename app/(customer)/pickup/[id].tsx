import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PickupMap } from '@/components/map/PickupMap';
import { mapTravelerFromUser, mapVehicleFromTrip } from '@/components/map/mapParties';
import { PickupCard } from '@/components/map/PickupCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { useLocation } from '@/hooks/useLocation';
import * as tripService from '@/services/tripService';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';
import type { PickupPoint } from '@/types/route';
import { paramId } from '@/utils/navigation';

export default function PickupScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = paramId(params.id);
  const insets = useSafeAreaInsets();
  const { location, request } = useLocation();
  const user = useAuthStore((s) => s.user);
  const selectedPickup = useBookingStore((state) => state.selectedPickup);
  const selectedTrip = useBookingStore((state) => state.selectedTrip);
  const setPickup = useBookingStore((state) => state.setPickup);
  const [pickups, setPickups] = useState<PickupPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void request();
  }, [request]);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      const data = await tripService.getPickupPoints(id);
      if (!mounted) return;
      setPickups(data);
      const current = useBookingStore.getState().selectedPickup;
      if (data[0] && (!current || !data.some((p) => p.id === current.id))) {
        setPickup(data[0]);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [id, setPickup]);

  return (
    <View style={styles.container}>
      <Header
        title="Choose pickup"
        subtitle="Tap a pin or card to select your boarding point"
        onBack={() => router.back()}
      />

      <View style={styles.mapWrap}>
        <PickupMap
          pickups={pickups}
          selectedPickupId={selectedPickup?.id}
          onSelectPickup={setPickup}
          userLocation={location}
          traveler={mapTravelerFromUser(user)}
          vehicle={mapVehicleFromTrip(selectedTrip)}
          height={340}
          allowFullscreen
          showControls
          showSelectedCard
        />
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>All boarding points</Text>
        <Text style={styles.listHint}>{pickups.length} nearby</Text>
      </View>

      {loading ? (
        <LoadingState title="Loading pickup points..." />
      ) : (
        <FlatList
          data={pickups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
          ListEmptyComponent={<EmptyState title="No pickup points" />}
          renderItem={({ item, index }) => (
            <PickupCard
              pickup={item}
              index={index + 1}
              selected={selectedPickup?.id === item.id}
              onPress={() => setPickup(item)}
            />
          )}
        />
      )}

      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
        {selectedPickup ? (
          <Pressable style={styles.selectedStrip} onPress={() => undefined}>
            <Text style={styles.selectedStripText} numberOfLines={1}>
              Selected: {selectedPickup.name}
            </Text>
          </Pressable>
        ) : null}
        <Button
          title="Continue to seats"
          disabled={!selectedPickup}
          onPress={() => router.push(`/(customer)/seat/${id}`)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  mapWrap: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  listHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.dark,
  },
  listHint: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.muted,
  },
  list: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  selectedStrip: {
    backgroundColor: Colors.actionSoft,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  selectedStripText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.action,
  },
});
