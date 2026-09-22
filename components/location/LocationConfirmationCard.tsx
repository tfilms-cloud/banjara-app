import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AddressPreview } from '@/components/location/AddressPreview';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { StructuredAddress } from '@/types/location';

interface LocationConfirmationCardProps {
  businessName?: string;
  placeName?: string;
  address: StructuredAddress;
  latitude: number;
  longitude: number;
  saving?: boolean;
  error?: string | null;
  onEdit: () => void;
  onConfirm: () => void;
}

export function LocationConfirmationCard({
  businessName,
  placeName,
  address,
  latitude,
  longitude,
  saving,
  error,
  onEdit,
  onConfirm,
}: LocationConfirmationCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
        <Text style={styles.badgeText}>Confirm before saving</Text>
      </View>
      <Text style={styles.heading}>Is this your exact business location?</Text>
      <Text style={styles.sub}>
        Customers will see this pin when finding {businessName || 'your business'}.
      </Text>

      <AddressPreview
        title="Business location"
        placeName={placeName || businessName}
        address={address}
        showCoords
        latitude={latitude}
        longitude={longitude}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <Button title="Edit Location" variant="outline" onPress={onEdit} disabled={saving} />
        <Button
          title={saving ? 'Saving location...' : 'Confirm & Save'}
          onPress={onConfirm}
          loading={saving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { ...Typography.caption, color: Colors.success, fontWeight: '600' },
  heading: { ...Typography.h2, color: Colors.primary },
  sub: { ...Typography.body, color: Colors.muted, lineHeight: 21 },
  actions: { gap: Spacing.sm, marginTop: Spacing.sm },
  error: { ...Typography.caption, color: Colors.danger },
});
