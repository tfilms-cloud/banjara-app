import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useProviderStore } from '@/store/providerStore';
import { formatCurrency } from '@/utils/formatCurrency';
import type { RoomAvailabilityStatus } from '@/types/provider';

const tone: Record<RoomAvailabilityStatus, 'green' | 'blue' | 'red' | 'amber'> = {
  available: 'green',
  booked: 'blue',
  blocked: 'red',
  maintenance: 'amber',
};

export default function HotelAvailabilityScreen() {
  const insets = useSafeAreaInsets();
  const availability = useProviderStore((s) => s.availability);
  const rooms = useProviderStore((s) => s.rooms);
  const room = rooms[0];

  return (
    <View style={styles.container}>
      <Header title="Room Availability" showBack fallbackHref={'/(provider)/hotel/index' as never} />
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40, gap: Spacing.md }}>
        <Text style={styles.heading}>{room?.name ?? 'Room calendar'}</Text>
        <Text style={styles.sub}>Tap a day to cycle status in a future release. Mock statuses shown below.</Text>

        <View style={styles.legend}>
          {(['available', 'booked', 'blocked', 'maintenance'] as RoomAvailabilityStatus[]).map((status) => (
            <Badge key={status} label={status} tone={tone[status]} />
          ))}
        </View>

        <View style={styles.grid}>
          {availability.map((day) => (
            <Pressable key={day.date} style={styles.day}>
              <Text style={styles.date}>{day.date.slice(5)}</Text>
              <Badge label={day.status} tone={tone[day.status]} />
              {day.priceOverride ? (
                <Text style={styles.price}>{formatCurrency(day.priceOverride)}</Text>
              ) : (
                <Text style={styles.price}>{formatCurrency(room?.pricePerNight ?? 0)}</Text>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heading: { ...Typography.h2, color: Colors.primary },
  sub: { ...Typography.caption, color: Colors.muted, marginBottom: Spacing.sm },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  day: {
    width: '47%',
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  date: { ...Typography.bodyBold, color: Colors.primary },
  price: { ...Typography.caption, color: Colors.muted },
});
