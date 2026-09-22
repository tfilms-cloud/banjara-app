import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { StructuredAddress } from '@/types/location';

interface AddressPreviewProps {
  title?: string;
  placeName?: string;
  address: StructuredAddress;
  updating?: boolean;
  showCoords?: boolean;
  latitude?: number;
  longitude?: number;
}

export function AddressPreview({
  title = 'Selected Location',
  placeName,
  address,
  updating,
  showCoords,
  latitude,
  longitude,
}: AddressPreviewProps) {
  const line =
    address.formattedAddress ||
    [address.street, address.area, address.city, address.region, address.country]
      .filter(Boolean)
      .join(', ') ||
    'Move the map to set your business location';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {updating ? (
          <View style={styles.updating}>
            <ActivityIndicator size="small" color={Colors.secondary} />
            <Text style={styles.updatingText}>Updating address...</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.row}>
        <Ionicons name="location" size={20} color={Colors.secondary} />
        <View style={{ flex: 1, gap: 2 }}>
          {placeName ? <Text style={styles.place}>{placeName}</Text> : null}
          <Text style={styles.address}>{line}</Text>
          {showCoords && latitude != null && longitude != null ? (
            <Text style={styles.coords}>
              Lat {latitude.toFixed(6)} · Lng {longitude.toFixed(6)}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: { ...Typography.caption, color: Colors.muted, fontWeight: '600' },
  updating: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  updatingText: { ...Typography.small, color: Colors.secondary },
  row: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  place: { ...Typography.bodyBold, color: Colors.primary },
  address: { ...Typography.body, color: Colors.dark, lineHeight: 21 },
  coords: { ...Typography.small, color: Colors.muted, marginTop: 4 },
});
