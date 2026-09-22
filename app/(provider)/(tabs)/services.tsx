import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CatalogEmpty,
  CatalogSection,
  ChildServiceCard,
  ParentServiceCard,
  SubServicePills,
  type CatalogTone,
  type ChildServiceItem,
  type ParentStat,
  type SubServiceChip,
} from '@/components/provider/ServiceCatalog';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';
import { Colors, useThemeColors } from '@/constants/colors';
import {
  ROOM_TYPE_OPTIONS,
  SERVICE_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  canOrganizeTripsFromList,
  editServiceHref,
  isHotelService,
  isTourLikeService,
  isTransportService,
  serviceLabel,
} from '@/constants/providerOptions';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useProviderStore } from '@/store/providerStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { pushEditor, pushPath } from '@/utils/navigation';

function optionLabel(options: { value: string; label: string }[], value: string) {
  return options.find((item) => item.value === value)?.label ?? value;
}

function vehicleIcon(type: string): SubServiceChip['icon'] {
  if (type === 'car') return 'car-outline';
  if (type === 'bus') return 'bus-outline';
  if (type === 'minibus') return 'bus-outline';
  return 'car-sport-outline';
}

function roomIcon(type: string): SubServiceChip['icon'] {
  if (type === 'suite' || type === 'deluxe') return 'bed-outline';
  if (type === 'family') return 'home-outline';
  return 'bed-outline';
}

function vehicleStatusTone(status: string): ChildServiceItem['statusTone'] {
  if (status === 'active') return 'green';
  if (status === 'pending') return 'amber';
  if (status === 'rejected' || status === 'suspended') return 'red';
  return 'gray';
}

export default function ProviderServicesScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { provider, services, loading, rooms, vehicles, trips, refreshDashboard } = useProviderStore();
  const [subFilter, setSubFilter] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refreshDashboard();
    }, [refreshDashboard])
  );

  const current = services[0] ?? (provider?.services[0]
    ? {
        id: provider.services[0],
        type: provider.services[0],
        label: serviceLabel(provider.services[0]),
        status: 'active' as const,
      }
    : null);

  const type = current?.type ?? '';
  const isTransport = Boolean(type && (isTransportService(type) || type === 'carRental'));
  const isHotel = Boolean(type && isHotelService(type));
  const isTour = Boolean(type && isTourLikeService(type));
  const canTrips = canOrganizeTripsFromList(provider?.services ?? []);
  const serviceMeta = SERVICE_OPTIONS.find((item) => item.type === type);

  const parentTone: CatalogTone = isHotel ? 'amber' : isTour ? 'green' : 'teal';
  const parentTitle =
    provider?.hotel?.hotelName ||
    provider?.transport?.businessName ||
    provider?.tour?.companyName ||
    provider?.businessName ||
    current?.label ||
    'Your service';

  const parentSubtitle =
    provider?.description?.trim() ||
    provider?.hotel?.description?.trim() ||
    provider?.transport?.description?.trim() ||
    provider?.tour?.description?.trim() ||
    serviceMeta?.description;

  const placeChips = useMemo(() => {
    if (isTransport) {
      const cities = [...(provider?.transport?.operatingCities ?? [])];
      if (provider?.city && !cities.includes(provider.city)) cities.unshift(provider.city);
      return cities.filter(Boolean).slice(0, 5);
    }
    if (isHotel) {
      const city = provider?.hotel?.city || provider?.city;
      return city ? [city] : [];
    }
    if (provider?.tour?.destination) return [provider.tour.destination];
    return provider?.city ? [provider.city] : [];
  }, [isHotel, isTransport, provider]);

  const parentStats: ParentStat[] = useMemo(() => {
    const items: ParentStat[] = [];
    if (isTransport) {
      items.push({ value: String(vehicles.length), label: vehicles.length === 1 ? 'vehicle' : 'vehicles' });
      if (canTrips) {
        items.push({ value: String(trips.length), label: trips.length === 1 ? 'trip' : 'trips' });
      }
    }
    if (isHotel) {
      items.push({ value: String(rooms.length), label: rooms.length === 1 ? 'room type' : 'room types' });
    }
    if (isTour && provider?.tour?.duration) {
      items.push({ value: provider.tour.duration, label: 'duration' });
    }
    return items;
  }, [canTrips, isHotel, isTour, isTransport, provider?.tour?.duration, rooms.length, trips.length, vehicles.length]);

  const subServices: SubServiceChip[] = useMemo(() => {
    if (isTransport) {
      const declared = provider?.transport?.vehicleTypes ?? [];
      const fromFleet = vehicles.map((item) => item.type);
      const keys = Array.from(new Set([...declared, ...fromFleet].filter(Boolean)));
      return keys.map((key) => {
        const count = vehicles.filter((item) => item.type === key).length;
        return {
          key,
          label: optionLabel(VEHICLE_TYPE_OPTIONS, key),
          icon: vehicleIcon(key),
          count,
          countLabel: `${count} vehicle${count === 1 ? '' : 's'}`,
        };
      });
    }
    if (isHotel) {
      const keys = Array.from(new Set(rooms.map((item) => item.roomType).filter(Boolean)));
      return keys.map((key) => {
        const count = rooms.filter((item) => item.roomType === key).length;
        return {
          key,
          label: optionLabel(ROOM_TYPE_OPTIONS, key),
          icon: roomIcon(key),
          count,
          countLabel: `${count} listing${count === 1 ? '' : 's'}`,
        };
      });
    }
    if (isTour && (provider?.tour?.tourName || provider?.tour?.destination)) {
      return [
        {
          key: 'package',
          label: type === 'travelGuide' ? 'Guided hosting' : 'Tour package',
          icon: 'compass-outline',
          count: 1,
          countLabel: '1 offering',
        },
      ];
    }
    return [];
  }, [isHotel, isTour, isTransport, provider, rooms, type, vehicles]);

  const vehicleChildren: ChildServiceItem[] = useMemo(() => {
    const list =
      subFilter && isTransport ? vehicles.filter((item) => item.type === subFilter) : vehicles;
    return list.map((item) => {
      const status = item.status ?? (item.active ? 'active' : 'pending');
      return {
        id: item.id,
        title: item.name,
        subtitle: `${optionLabel(VEHICLE_TYPE_OPTIONS, item.type)} · ${item.model} · ${item.totalSeats} seats`,
        meta: item.registrationNumber,
        image: item.images[0],
        icon: vehicleIcon(item.type),
        status: status.charAt(0).toUpperCase() + status.slice(1),
        statusTone: vehicleStatusTone(status),
        onPress: () => pushPath('/(provider)/transport'),
      };
    });
  }, [isTransport, subFilter, vehicles]);

  const roomChildren: ChildServiceItem[] = useMemo(() => {
    const list = subFilter && isHotel ? rooms.filter((item) => item.roomType === subFilter) : rooms;
    return list.map((item) => ({
      id: item.id,
      title: item.name,
      subtitle: `${optionLabel(ROOM_TYPE_OPTIONS, item.roomType)} · ${item.capacity} guests · ${item.quantity} rooms`,
      meta: `${formatCurrency(item.pricePerNight)} / night`,
      image: item.images[0],
      icon: roomIcon(item.roomType),
      status: item.available ? 'Available' : 'Unavailable',
      statusTone: item.available ? 'green' : 'gray',
      onPress: () =>
        router.push({ pathname: '/(provider)/rooms/add', params: { id: item.id } } as never),
    }));
  }, [isHotel, rooms, subFilter]);

  const tripChildren: ChildServiceItem[] = useMemo(() => {
    if (!canTrips) return [];
    const vehicleById = new Map(vehicles.map((item) => [item.id, item]));
    const list =
      subFilter && isTransport
        ? trips.filter((item) => vehicleById.get(item.vehicleId)?.type === subFilter)
        : trips;
    return list.map((item) => ({
      id: item.id,
      title: `${item.origin} → ${item.destination}`,
      subtitle: `${item.departureDate} · ${item.departureTime}`,
      meta: `Seats ${item.bookedSeats}/${item.totalSeats} · ${formatCurrency(item.price)}`,
      icon: 'map-outline',
      status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
      statusTone: item.status === 'cancelled' ? 'red' : item.status === 'upcoming' ? 'blue' : 'green',
      onPress: () => pushPath('/(provider)/transport'),
    }));
  }, [canTrips, isTransport, subFilter, trips, vehicles]);

  const tourChildren: ChildServiceItem[] = useMemo(() => {
    if (!isTour || !provider?.tour) return [];
    const tour = provider.tour;
    if (!tour.tourName && !tour.destination && !tour.companyName) return [];
    return [
      {
        id: 'tour-package',
        title: tour.tourName || tour.companyName || 'Tour package',
        subtitle: [tour.destination, tour.duration].filter(Boolean).join(' · '),
        meta: tour.price ? formatCurrency(tour.price) : undefined,
        image: tour.images[0],
        icon: 'compass-outline',
        status: current?.status,
        statusTone: current?.status === 'active' ? 'green' : 'amber',
        onPress: () => pushEditor('/(provider)/register/tours'),
      },
    ];
  }, [current?.status, isTour, provider?.tour]);

  const childItems = isHotel ? roomChildren : isTour ? tourChildren : vehicleChildren;

  if (loading && !provider) return <LoadingState title="Loading services..." />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.lg,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refreshDashboard} tintColor={colors.primary} />
      }
    >
      <View>
        <Text style={styles.title}>My Service</Text>
        <Text style={styles.sub}>
          {isHotel
            ? 'Your stay listing, room types, and rooms.'
            : isTour
              ? 'Your guide listing and the package travelers book.'
              : current
                ? 'Your transport listing, fleet types, and vehicles.'
                : 'Add the one service you offer on BANJARA.'}
        </Text>
      </View>

      {!current ? (
        <EmptyState
          title="No service yet"
          message="Add the one service you offer. After that you can edit it, but you cannot add another."
          icon="layers-outline"
          actionLabel="Add your service"
          onAction={() => router.push('/(provider)/register/services')}
        />
      ) : (
        <>
          <ParentServiceCard
            emoji={serviceMeta?.emoji ?? '✓'}
            eyebrow={current.label}
            title={parentTitle}
            subtitle={parentSubtitle}
            stats={parentStats}
            chips={placeChips}
            status={current.status.charAt(0).toUpperCase() + current.status.slice(1)}
            statusTone={current.status === 'active' ? 'green' : 'amber'}
            tone={parentTone}
            onEdit={() => pushEditor(editServiceHref(current.type))}
          />

          <CatalogSection
            title={isHotel ? 'Room types' : isTour ? 'Offerings' : 'Fleet types'}
            caption={
              isHotel
                ? 'Tap a type to filter your rooms'
                : isTour
                  ? 'What sits under this service'
                  : 'Tap a type to filter your vehicles'
            }
          >
            {subServices.length ? (
              <SubServicePills
                items={subServices}
                selectedKey={subFilter}
                onSelect={setSubFilter}
                allLabel={isHotel ? 'All rooms' : isTour ? 'All' : 'All fleet'}
              />
            ) : (
              <CatalogEmpty
                icon={isHotel ? 'bed-outline' : isTour ? 'compass-outline' : 'bus-outline'}
                title={isHotel ? 'No room types yet' : isTour ? 'No tour offering yet' : 'No fleet types yet'}
                message={
                  isHotel
                    ? 'Add a room to show the types travelers can book.'
                    : isTour
                      ? 'Edit your tour or guide profile to list this offering.'
                      : 'Add a vehicle to show car, van, minibus, or bus under Transport.'
                }
                actionLabel={isHotel ? 'Add room' : isTour ? 'Edit offering' : 'Add vehicle'}
                onAction={() => {
                  if (isHotel) router.push('/(provider)/rooms/add');
                  else if (isTour) pushEditor('/(provider)/register/tours');
                  else router.push('/(provider)/vehicles/add');
                }}
              />
            )}
          </CatalogSection>

          <CatalogSection
            title={isHotel ? 'Your rooms' : isTour ? 'Your package' : 'Your vehicles'}
            caption={
              isHotel
                ? 'Rooms travelers can book'
                : isTour
                  ? 'Listed under your service'
                  : 'Vehicles in the selected type'
            }
            actionLabel={
              isHotel && rooms.length ? 'See all' : isTransport && vehicles.length ? 'See all' : undefined
            }
            onAction={
              isHotel
                ? () => pushPath('/(provider)/rooms')
                : isTransport
                  ? () => pushPath('/(provider)/transport')
                  : undefined
            }
          >
            {childItems.length ? (
              <View style={styles.stack}>
                {childItems.slice(0, 6).map((item) => (
                  <ChildServiceCard key={item.id} item={item} />
                ))}
              </View>
            ) : (
              <CatalogEmpty
                icon={isHotel ? 'bed-outline' : isTour ? 'map-outline' : 'bus-outline'}
                title={
                  subFilter
                    ? 'Nothing in this type yet'
                    : isHotel
                      ? 'No rooms listed'
                      : isTour
                        ? 'No package listed'
                        : 'No vehicles listed'
                }
                message={
                  subFilter
                    ? 'Add a listing for this type, or tap All to see everything.'
                    : isHotel
                      ? 'Add a room so travelers can book a stay.'
                      : isTour
                        ? 'Add destination, duration, and price on your profile.'
                        : 'Add a vehicle so travelers can ride with you.'
                }
                actionLabel={isHotel ? 'Add room' : isTour ? 'Edit offering' : 'Add vehicle'}
                onAction={() => {
                  if (isHotel) router.push('/(provider)/rooms/add');
                  else if (isTour) pushEditor('/(provider)/register/tours');
                  else router.push('/(provider)/vehicles/add');
                }}
              />
            )}
          </CatalogSection>

          {canTrips ? (
            <CatalogSection
              title="Your trips"
              caption="Journeys on your fleet"
              actionLabel={trips.length ? 'See all' : undefined}
              onAction={() => pushPath('/(provider)/transport')}
            >
              {tripChildren.length ? (
                <View style={styles.stack}>
                  {tripChildren.slice(0, 5).map((item) => (
                    <ChildServiceCard key={item.id} item={item} />
                  ))}
                </View>
              ) : (
                <CatalogEmpty
                  icon="map-outline"
                  title="No trips yet"
                  message="When you create a trip, travelers can book seats on your vehicles."
                />
              )}
            </CatalogSection>
          ) : null}

          {isHotel ? (
            <View style={styles.stack}>
              <Button title="Add room" onPress={() => router.push('/(provider)/rooms/add')} />
              <Button
                title="Room availability"
                variant="outline"
                onPress={() => pushPath('/(provider)/hotel/availability')}
              />
            </View>
          ) : null}

          {isTransport ? (
            <View style={styles.stack}>
              {canTrips ? (
                <Button
                  title="Create trip"
                  onPress={() => router.push('/(provider)/transport/trips/create')}
                />
              ) : null}
              <Button
                title="Add vehicle"
                variant={canTrips ? 'outline' : 'primary'}
                onPress={() => router.push('/(provider)/vehicles/add')}
              />
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { ...Typography.h2, color: Colors.dark },
  sub: { ...Typography.caption, color: Colors.muted, marginTop: Spacing.xs },
  stack: { gap: Spacing.sm },
});
