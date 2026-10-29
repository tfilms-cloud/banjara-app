import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import {
  useLiveLocationStore,
  type LiveShareAudience,
} from '@/store/liveLocationStore';

type Props = {
  bookingId: string;
  /** Customer shares with lodging / tour / guide / restaurant */
  audience: LiveShareAudience;
  role: 'customer' | 'provider_vehicle';
  title?: string;
};

export function LiveLocationShareCard({
  bookingId,
  audience,
  role,
  title,
}: Props) {
  const session = useLiveLocationStore((s) => s.sessions[bookingId]);
  const startShare = useLiveLocationStore((s) => s.startShare);
  const stopShare = useLiveLocationStore((s) => s.stopShare);
  const refreshPosition = useLiveLocationStore((s) => s.refreshPosition);
  const active = Boolean(session?.active);

  const onStart = async () => {
    const next = await startShare({ bookingId, audience, role });
    if (!next) {
      Alert.alert('Location permission', 'Allow location access to share live position.');
      return;
    }
    Alert.alert(
      'Sharing started',
      role === 'customer'
        ? 'Your live location is visible to the provider for this confirmed booking.'
        : 'Your vehicle location is visible to the customer for this trip.'
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Ionicons name="navigate-circle-outline" size={22} color={Colors.primary} />
        <Text style={styles.title}>
          {title ??
            (role === 'customer' ? 'Share live location' : 'Share vehicle location')}
        </Text>
      </View>
      <Text style={styles.body}>
        {role === 'customer'
          ? 'After confirmation, hotels, tour operators, guides, and restaurants can use your live location for arrival.'
          : 'Customers see your vehicle’s live position for pickup and the journey.'}
      </Text>
      {active && session?.latitude != null ? (
        <Text style={styles.coords}>
          Live · {session.latitude.toFixed(5)}, {session.longitude?.toFixed(5)}
        </Text>
      ) : null}
      {active ? (
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Button
              title="Refresh"
              variant="outline"
              onPress={() => void refreshPosition(bookingId)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Stop sharing" variant="ghost" onPress={() => stopShare(bookingId)} />
          </View>
        </View>
      ) : (
        <Button title="Start live sharing" onPress={() => void onStart()} />
      )}
      <Pressable onPress={() => stopShare(bookingId)}>
        <Text style={styles.note}>You can stop sharing anytime.</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.dark, flex: 1 },
  body: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  coords: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.primary },
  row: { flexDirection: 'row', gap: Spacing.sm },
  note: { ...Typography.caption, color: Colors.muted, textAlign: 'center' },
});
