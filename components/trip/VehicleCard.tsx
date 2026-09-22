import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { VehicleType } from '@/types/trip';
import { vehicleTypeLabel } from '@/utils/helpers';

export type VehicleCardData = {
  name: string;
  type: VehicleType;
  plateNumber?: string;
  brand?: string;
  model?: string;
  /** Permanent physical capacity of the vehicle */
  capacity: number;
  image?: string;
  images?: string[];
};

interface VehicleCardProps {
  vehicle: VehicleCardData;
  /** Trip seats still open for booking (not the vehicle permanent capacity) */
  availableSeats?: number;
  /** Trip total seats for this departure (copied from vehicle at create time) */
  tripTotalSeats?: number;
}

export function VehicleCard({ vehicle, availableSeats, tripTotalSeats }: VehicleCardProps) {
  const gallery =
    vehicle.images && vehicle.images.length > 0
      ? vehicle.images
      : vehicle.image
        ? [vehicle.image]
        : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const hero = gallery[activeIndex] ?? gallery[0];
  const capacity = vehicle.capacity || tripTotalSeats || 0;
  const seatsLeft = availableSeats ?? undefined;

  return (
    <View style={styles.card}>
      {hero ? <Image source={{ uri: hero }} style={styles.image} contentFit="cover" /> : null}

      {gallery.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbs}
        >
          {gallery.map((uri, index) => (
            <Pressable key={`${uri}-${index}`} onPress={() => setActiveIndex(index)}>
              <Image
                source={{ uri }}
                style={[styles.thumb, index === activeIndex && styles.thumbActive]}
                contentFit="cover"
              />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.content}>
        <Badge label={vehicleTypeLabel(vehicle.type)} tone="amber" />
        <Text style={styles.name}>{vehicle.name}</Text>
        {vehicle.brand || vehicle.model ? (
          <Text style={styles.meta}>
            {[vehicle.brand, vehicle.model].filter(Boolean).join(' ')}
          </Text>
        ) : null}
        {vehicle.plateNumber ? (
          <Text style={styles.meta}>Registration · {vehicle.plateNumber}</Text>
        ) : null}

        <View style={styles.seatRow}>
          <View style={styles.seatChip}>
            <Text style={styles.seatLabel}>Capacity</Text>
            <Text style={styles.seatValue}>{capacity ? `${capacity} seats` : '—'}</Text>
          </View>
          {seatsLeft != null ? (
            <View style={styles.seatChip}>
              <Text style={styles.seatLabel}>Available now</Text>
              <Text style={[styles.seatValue, styles.seatAvailable]}>
                {seatsLeft} left
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.border,
  },
  thumbs: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  thumb: {
    width: 56,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: Colors.secondary,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  name: {
    ...Typography.h3,
    color: Colors.primary,
  },
  meta: {
    ...Typography.caption,
    color: Colors.muted,
  },
  seatRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  seatChip: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  seatLabel: {
    ...Typography.small,
    color: Colors.muted,
  },
  seatValue: {
    ...Typography.bodyBold,
    color: Colors.primary,
    marginTop: 2,
  },
  seatAvailable: {
    color: Colors.success,
  },
});
