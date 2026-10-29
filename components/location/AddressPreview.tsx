import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { StructuredAddress } from '@/types/location';
import { isRtlLocationText } from '@/utils/locationText';

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
  title = 'Selected location',
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
    'Move the map, then tap Pin location';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {updating ? (
          <View style={styles.updating}>
            <ActivityIndicator size="small" color={Colors.secondary} />
            <Text style={styles.updatingText}>Updating…</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.row}>
        <View style={styles.iconBadge}>
          <Ionicons name="location" size={22} color={Colors.action} />
        </View>
        <View style={styles.copy}>
          {placeName ? <Text style={[styles.place, isRtlLocationText(placeName) && styles.rtl]}>{placeName}</Text> : null}
          <Text style={[styles.address, isRtlLocationText(line) && styles.rtl]}>{line}</Text>
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
    flexWrap: 'wrap',
  },
  title: { ...Typography.caption, color: Colors.muted },
  updating: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  updatingText: { ...Typography.small, color: Colors.secondary },
  row: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  iconBadge: { width: 42, height: 42, borderRadius: Radius.md, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0, gap: 6 },
  place: { ...Typography.bodyBold, color: Colors.dark, textAlign: 'left' },
  address: { ...Typography.body, color: Colors.muted, lineHeight: 23, textAlign: 'left' },
  rtl: { textAlign: 'right', writingDirection: 'rtl', fontFamily: undefined, lineHeight: 29 },
  coords: { ...Typography.small, color: Colors.muted, marginTop: 4, writingDirection: 'ltr', textAlign: 'left' },
});
