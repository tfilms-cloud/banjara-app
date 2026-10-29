import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChildServiceCard, type ChildServiceItem } from '@/components/provider/ServiceCatalog';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { canOrganizeTripsFromList, VEHICLE_TYPE_OPTIONS } from '@/constants/providerOptions';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import * as providerService from '@/services/providerService';
import { useProviderStore } from '@/store/providerStore';
import { corridorKey, displayStopName, parseCorridor, parseRouteStop, stopBelongsToRoute } from '@/utils/corridors';
import { formatCurrency } from '@/utils/formatCurrency';
import { paramId, pushPath } from '@/utils/navigation';

type Tab = 'vehicles' | 'trips' | 'routes' | 'pickups';

function optionLabel(value: string) {
  return VEHICLE_TYPE_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function statusTone(status: string): ChildServiceItem['statusTone'] {
  if (status === 'active' || status === 'upcoming') return 'green';
  if (status === 'pending') return 'amber';
  if (status === 'rejected' || status === 'cancelled' || status === 'suspended') return 'red';
  return 'gray';
}

export default function ProviderTransportScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string | string[] }>();
  const initialTab = paramId(params.tab);
  const { vehicles, trips, routes, provider, refreshDashboard, setTransport, saveProgress } =
    useProviderStore();
  const [tab, setTab] = useState<Tab>(
    initialTab === 'trips' || initialTab === 'routes' || initialTab === 'pickups'
      ? initialTab
      : 'vehicles'
  );
  const canCreateTrips = canOrganizeTripsFromList(provider?.services ?? []);
  const pickups = provider?.transport?.pickupLocations ?? [];
  const dropoffs = provider?.transport?.dropoffLocations ?? [];

  useFocusEffect(
    useCallback(() => {
      void useProviderStore.getState().refreshDashboard();
    }, [])
  );

  const displayedRoutes = useMemo(() => {
    const fromApi = routes.filter((item) => item.origin && item.destination);
    const seen = new Set(fromApi.map((item) => corridorKey(item.origin, item.destination)));
    const fromProfile = (provider?.transport?.operatingRoutes ?? [])
      .map((item) => parseCorridor(item) ?? { origin: item, destination: '' })
      .filter((item) => item.origin)
      .filter((item) => {
        const key = corridorKey(item.origin, item.destination || item.origin);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((item, index) => ({
        id: `profile-${index}-${item.origin}`,
        providerId: provider?.id ?? '',
        origin: item.origin,
        destination: item.destination,
        stops: [] as string[],
        pickupPoints: [] as string[],
        dropoffPoints: [] as string[],
        durationHours: 0,
        distanceKm: 0,
      }));

    return [...fromApi, ...fromProfile].map((item) => {
      const board = (provider?.transport?.pickupLocations ?? [])
        .filter((stop) => stopBelongsToRoute(stop, item.origin, item.destination))
        .map(displayStopName);
      const alight = (provider?.transport?.dropoffLocations ?? [])
        .filter((stop) => stopBelongsToRoute(stop, item.origin, item.destination))
        .map(displayStopName);
      return { ...item, pickups: board, dropoffs: alight };
    });
  }, [
    provider?.id,
    provider?.transport?.dropoffLocations,
    provider?.transport?.operatingRoutes,
    provider?.transport?.pickupLocations,
    routes,
  ]);

  const cancelTrip = (id: string) => {
    Alert.alert('Cancel trip', 'Cancel this upcoming trip?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel trip',
        style: 'destructive',
        onPress: async () => {
          await providerService.cancelTrip(id);
          await refreshDashboard();
        },
      },
    ]);
  };

  const removeProfileValue = async (
    field: 'operatingRoutes' | 'pickupLocations' | 'dropoffLocations',
    value: string
  ) => {
    const current = provider?.transport?.[field] ?? [];
    setTransport({
      ...provider?.transport,
      [field]: current.filter((item) => item !== value),
    });
    await saveProgress();
    await refreshDashboard();
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'vehicles', label: 'Vehicles', count: vehicles.length },
    { key: 'trips', label: 'Trips', count: trips.length },
    { key: 'routes', label: 'Routes', count: displayedRoutes.length },
    { key: 'pickups', label: 'Pickups', count: pickups.length + dropoffs.length },
  ];

  const vehicleItems: ChildServiceItem[] = vehicles.map((item) => {
    const status = item.status ?? (item.active ? 'active' : 'pending');
    return {
      id: item.id,
      title: item.name,
      subtitle: `${optionLabel(item.type)} · ${item.totalSeats} seats`,
      meta: [item.registrationNumber, item.model, item.year].filter(Boolean).join(' · '),
      image: item.images[0],
      icon: 'bus-outline',
      status: status.charAt(0).toUpperCase() + status.slice(1),
      statusTone: statusTone(status),
      actionLabel: 'Edit',
      onPress: () =>
        router.push({ pathname: '/(provider)/vehicles/add', params: { id: item.id } } as never),
    };
  });

  const tripItems: ChildServiceItem[] = trips.map((item) => ({
    id: item.id,
    title: `${item.origin} → ${item.destination}`,
    subtitle: `${item.departureDate} · ${item.departureTime}`,
    meta: `Seats ${item.bookedSeats}/${item.totalSeats} · ${formatCurrency(item.price)}`,
    icon: 'map-outline',
    status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    statusTone: statusTone(item.status),
    actionLabel: item.status === 'cancelled' ? undefined : 'Edit',
    onPress: () =>
      item.status === 'cancelled'
        ? pushPath('/(provider)/passengers')
        : router.push({
            pathname: '/(provider)/transport/trips/create',
            params: { id: item.id },
          } as never),
  }));

  const cta =
    tab === 'vehicles'
      ? { title: 'Add vehicle', onPress: () => router.push('/(provider)/vehicles/add') }
      : tab === 'trips' && canCreateTrips
        ? { title: 'Create trip', onPress: () => router.push('/(provider)/transport/trips/create') }
        : tab === 'routes'
          ? { title: 'Add route', onPress: () => router.push('/(provider)/transport/route-add') }
          : tab === 'pickups'
            ? { title: 'Add pickup', onPress: () => router.push('/(provider)/transport/stop-add') }
            : null;

  return (
    <View style={styles.container}>
      <Header title="Transport" showBack fallbackHref="/(provider)/(tabs)/services" />
      <View style={styles.tabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
        {tabs.map((item) => {
          const active = tab === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <View
                style={[
                  styles.tab,
                  {
                    backgroundColor: active ? Colors.primary : Colors.card,
                    borderColor: active ? Colors.primary : Colors.border,
                  },
                ]}
              >
                <Text style={[styles.tabText, { color: active ? Colors.white : Colors.dark }]}>
                  {item.label}
                </Text>
                <View
                  style={[
                    styles.tabCount,
                    { backgroundColor: active ? 'rgba(255,255,255,0.2)' : Colors.inputBg },
                  ]}
                >
                  <Text style={[styles.tabCountText, { color: active ? Colors.white : Colors.muted }]}>
                    {item.count}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
        </ScrollView>
      </View>
      <Text style={styles.intro}>
        {tab === 'vehicles'
          ? 'Tap a vehicle to edit photos, seats, or details.'
          : tab === 'trips'
            ? 'Dated departures travelers can book. Tap a trip to edit, or cancel if a run will not go.'
            : tab === 'routes'
              ? 'Each corridor has its own boarding and drop-off. Tap a route to edit From, To, and stops.'
              : 'Boarding and drop-off belong to a route. Hunza drop-offs stay on the Hunza corridor.'}
      </Text>

      {tab === 'vehicles' ? (
        <FlatList
          data={vehicleItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title="No vehicles yet"
              message="Add a van, car, minibus, or bus. Admin approves it before it can run trips."
              icon="bus-outline"
              actionLabel="Add vehicle"
              onAction={() => router.push('/(provider)/vehicles/add')}
            />
          }
          renderItem={({ item }) => <ChildServiceCard item={item} />}
        />
      ) : null}

      {tab === 'trips' ? (
        <FlatList
          data={tripItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title="No trips yet"
              message="A trip is a dated departure on a route, with seats travelers can book."
              icon="map-outline"
              actionLabel={canCreateTrips ? 'Create trip' : undefined}
              onAction={
                canCreateTrips
                  ? () => router.push('/(provider)/transport/trips/create')
                  : undefined
              }
            />
          }
          renderItem={({ item }) => (
            <View style={{ gap: Spacing.xs }}>
              <ChildServiceCard item={item} />
              {trips.find((trip) => trip.id === item.id)?.status !== 'cancelled' ? (
                <Pressable onPress={() => cancelTrip(item.id)} style={styles.inlineAction}>
                  <Text style={styles.delete}>Cancel trip</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        />
      ) : null}

      {tab === 'routes' ? (
        <FlatList
          data={displayedRoutes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            displayedRoutes.length ? (
              <Text style={styles.hint}>
                A route is the corridor you operate, like Islamabad → Hunza. Pin boarding in the start
                city and drop-off in the end city on that same route.
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              title="No routes yet"
              message="Add the corridors you drive. Pickup and drop-off sit on each route, so Hunza and Skardu never mix."
              icon="navigate-outline"
              actionLabel="Add route"
              onAction={() => router.push('/(provider)/transport/route-add')}
            />
          }
          renderItem={({ item }) => (
            <ChildServiceCard
              item={{
                id: item.id,
                title: item.destination ? `${item.origin} → ${item.destination}` : item.origin,
                subtitle: [
                  item.pickups.length ? `Board: ${item.pickups.join(', ')}` : null,
                  item.dropoffs.length ? `Drop: ${item.dropoffs.join(', ')}` : null,
                  item.stops.length ? `Via ${item.stops.join(', ')}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Tap to add boarding and drop-off for this corridor',
                meta:
                  item.distanceKm > 0
                    ? `${item.distanceKm} km · ~${item.durationHours || '—'}h`
                    : 'Saved on your listing',
                icon: 'navigate-outline',
                actionLabel: 'Edit',
                onPress: () =>
                  router.push({
                    pathname: '/(provider)/transport/route-add',
                    params: {
                      id: item.id.startsWith('profile-') ? '' : item.id,
                      from: item.origin,
                      to: item.destination,
                      stops: item.stops.join(', '),
                      previous: item.destination
                        ? `${item.origin} → ${item.destination}`
                        : item.origin,
                    },
                  } as never),
              }}
            />
          )}
        />
      ) : null}

      {tab === 'pickups' ? (
        <FlatList
          data={[
            ...pickups.map((point) => {
              const parsed = parseRouteStop(point);
              const corridor =
                parsed.origin && parsed.destination
                  ? `${parsed.origin} → ${parsed.destination}`
                  : '';
              return {
                id: `pick-${point}`,
                kind: 'pickup' as const,
                name: point,
                display: parsed.place,
                corridor,
              };
            }),
            ...dropoffs.map((point) => {
              const parsed = parseRouteStop(point);
              const corridor =
                parsed.origin && parsed.destination
                  ? `${parsed.origin} → ${parsed.destination}`
                  : '';
              return {
                id: `drop-${point}`,
                kind: 'dropoff' as const,
                name: point,
                display: parsed.place,
                corridor,
              };
            }),
          ]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            pickups.length || dropoffs.length ? (
              <Text style={styles.hint}>
                Each pin belongs to one corridor. Add a Hunza drop-off on Islamabad → Hunza, not as a
                shared list.
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              title="No boarding points yet"
              message="Add a route first, then pin boarding in the start city and drop-off in the end city."
              icon="location-outline"
              actionLabel="Add pickup"
              onAction={() => router.push('/(provider)/transport/stop-add')}
            />
          }
          renderItem={({ item }) => (
            <View style={{ gap: Spacing.xs }}>
              <ChildServiceCard
                item={{
                  id: item.id,
                  title: item.display,
                  subtitle: item.corridor
                    ? `${item.kind === 'pickup' ? 'Pickup' : 'Drop-off'} · ${item.corridor}`
                    : item.kind === 'pickup'
                      ? 'Pickup · boarding'
                      : 'Drop-off · alighting',
                  icon: item.kind === 'pickup' ? 'location-outline' : 'flag-outline',
                  actionLabel: 'Edit',
                  onPress: () =>
                    router.push({
                      pathname: '/(provider)/transport/stop-add',
                      params: { kind: item.kind, name: item.name, route: item.corridor },
                    } as never),
                }}
              />
              <Pressable
                onPress={() =>
                  void removeProfileValue(
                    item.kind === 'pickup' ? 'pickupLocations' : 'dropoffLocations',
                    item.name
                  )
                }
                style={styles.inlineAction}
              >
                <Text style={styles.delete}>Remove</Text>
              </Pressable>
            </View>
          )}
          ListFooterComponent={
            pickups.length || dropoffs.length ? (
              <Button
                title="Add drop-off"
                variant="outline"
                onPress={() =>
                  router.push({ pathname: '/(provider)/transport/stop-add', params: { kind: 'dropoff' } } as never)
                }
              />
            ) : null
          }
        />
      ) : null}

      {cta ? (
        <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
          <Button title={cta.title} onPress={cta.onPress} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabBar: {
    flexGrow: 0,
    flexShrink: 0,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  intro: {
    ...Typography.caption,
    color: Colors.muted,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
    lineHeight: 18,
  },
  tab: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tabText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  tabCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabCountText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: 120,
    gap: Spacing.sm,
  },
  hint: {
    ...Typography.caption,
    color: Colors.muted,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  inlineAction: {
    minHeight: 32,
    justifyContent: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.sm,
  },
  delete: { ...Typography.caption, color: Colors.danger },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
});
