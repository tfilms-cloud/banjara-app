import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionGrid, type ActionItem } from '@/components/ui/ActionGrid';
import { Badge } from '@/components/ui/Badge';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { get } from '@/services/api';
import { asArray, mapHotel, type AnyRecord } from '@/services/mappers';
import { useProviderStore } from '@/store/providerStore';
import type { Hotel } from '@/types/hotel';
import { normalizeMediaUrl } from '@/utils/mediaUrl';
import { pushPath } from '@/utils/navigation';

export default function ProviderHotelScreen() {
  const insets = useSafeAreaInsets();
  const rooms = useProviderStore((s) => s.rooms);
  const bookings = useProviderStore((s) => s.bookings);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loadingHotel, setLoadingHotel] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      setLoadingHotel(true);
      void get<unknown>('/hotels')
        .then((data) => {
          if (!alive) return;
          const list = asArray<AnyRecord>(data).map(mapHotel);
          setHotel(list[0] ?? null);
        })
        .catch(() => {
          if (alive) setHotel(null);
        })
        .finally(() => {
          if (alive) setLoadingHotel(false);
        });
      return () => {
        alive = false;
      };
    }, [])
  );

  const hotelBookings = bookings.filter((b) => b.kind === 'hotel');
  const upcoming = hotelBookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'upcoming' || b.status === 'pending'
  ).length;

  const roomActions: ActionItem[] = [
    {
      key: 'rooms',
      label: 'Manage rooms',
      subtitle: `${rooms.length} types`,
      icon: 'bed-outline',
      tone: 'green',
      onPress: () => pushPath('/(provider)/rooms'),
    },
    {
      key: 'add',
      label: 'Add room',
      subtitle: 'New inventory',
      icon: 'add-outline',
      tone: 'blue',
      onPress: () => router.push('/(provider)/rooms/add'),
    },
    {
      key: 'availability',
      label: 'Availability',
      subtitle: 'Calendar & rates',
      icon: 'calendar-outline',
      tone: 'amber',
      onPress: () => pushPath('/(provider)/hotel/availability'),
    },
    {
      key: 'bookings',
      label: 'Bookings',
      subtitle: `${upcoming} upcoming`,
      icon: 'ticket-outline',
      tone: 'navy',
      onPress: () => router.push('/(provider)/(tabs)/bookings'),
    },
    {
      key: 'reviews',
      label: 'Reviews',
      subtitle: hotel ? `${hotel.rating.toFixed(1)} ★` : 'Guest feedback',
      icon: 'star-outline',
      tone: 'amber',
      onPress: () => pushPath('/(provider)/reviews'),
    },
  ];

  return (
    <View style={styles.container}>
      <Header title="Hotel Management" showBack fallbackHref="/(provider)/(tabs)/services" />
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 40,
          gap: Spacing.lg,
        }}
      >
        {loadingHotel ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.action} />
            <Text style={styles.loadingText}>Loading property…</Text>
          </View>
        ) : hotel ? (
          <View style={styles.card}>
            <Image
              source={{ uri: normalizeMediaUrl(hotel.images[0]) ?? hotel.images[0] }}
              style={styles.image}
              contentFit="cover"
            />
            <View style={styles.body}>
              <View style={styles.row}>
                <Text style={styles.title}>{hotel.name}</Text>
                <Badge
                  label={hotel.isVerified ? 'Verified' : hotel.hotelType.replace('_', ' ')}
                  tone={hotel.isVerified ? 'green' : 'amber'}
                />
              </View>
              <Text style={styles.meta}>
                {hotel.location.address || hotel.location.area}, {hotel.location.city}
              </Text>
              <Text style={styles.meta}>
                Check-in {hotel.checkInTime} · Check-out {hotel.checkOutTime}
              </Text>
              {hotel.description ? <Text style={styles.bodyText}>{hotel.description}</Text> : null}
              {hotel.amenities.length ? (
                <Text style={styles.meta} numberOfLines={2}>
                  {hotel.amenities.slice(0, 6).join(' · ')}
                </Text>
              ) : null}
            </View>
          </View>
        ) : (
          <Pressable
            style={styles.emptyCard}
            onPress={() => router.push('/(provider)/register/hotel')}
          >
            <Text style={styles.emptyTitle}>No hotel linked yet</Text>
            <Text style={styles.empty}>
              Add your property details so travelers can find and book your rooms.
            </Text>
            <Text style={styles.emptyCta}>Set up hotel →</Text>
          </Pressable>
        )}

        <View style={styles.statsRow}>
          <Stat label="Room types" value={`${rooms.length}`} />
          <Stat label="Upcoming" value={`${upcoming}`} />
          <Stat label="Rating" value={hotel ? hotel.rating.toFixed(1) : '—'} />
        </View>

        <Text style={styles.section}>Room tools</Text>
        <ActionGrid items={roomActions} />
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.sm,
  },
  loadingText: { ...Typography.caption, color: Colors.muted },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: { width: '100%', height: 160, backgroundColor: Colors.border },
  body: { padding: Spacing.lg, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { ...Typography.h3, color: Colors.primary, flex: 1 },
  meta: { ...Typography.caption, color: Colors.muted },
  bodyText: { ...Typography.body, color: Colors.dark, marginTop: 4 },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: { fontFamily: Fonts.bodyBold, fontSize: 16, color: Colors.dark },
  empty: { ...Typography.caption, color: Colors.muted },
  emptyCta: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.action, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  statValue: { fontFamily: Fonts.bodyBold, fontSize: 18, color: Colors.primary },
  statLabel: { fontFamily: Fonts.body, fontSize: 11, color: Colors.muted, marginTop: 2 },
  section: { ...Typography.h3, color: Colors.dark },
});
