import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessagesHeaderActions } from '@/components/chat/MessagesHeaderActions';
import { ProviderEarningsFeeCard } from '@/components/provider/ProviderEarningsFeeCard';
import { ProviderStatCard } from '@/components/provider/ProviderStatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { ROOM_TYPE_OPTIONS } from '@/constants/providerOptions';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import * as providerService from '@/services/providerService';
import { useHotelCheckInStore } from '@/store/hotelCheckInStore';
import { useProviderStore } from '@/store/providerStore';
import type { Provider, ProviderRoom } from '@/types/provider';
import { formatCurrency } from '@/utils/formatCurrency';
import { pushPath } from '@/utils/navigation';

function roomTypeLabel(value: string) {
  return ROOM_TYPE_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= Math.round(rating) ? 'star' : 'star-outline'}
          size={14}
          color="#F5B83D"
        />
      ))}
    </View>
  );
}

function OccupancyRow({
  room,
  onChanged,
}: {
  room: ProviderRoom;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const free = room.availableCount ?? (room.available ? room.quantity : 0);

  const adjust = async (delta: number) => {
    const nextQty = Math.max(0, room.quantity + delta);
    const nextFree = Math.max(0, Math.min(nextQty, free + delta));
    setBusy(true);
    try {
      if (nextQty === 0) {
        Alert.alert('Remove room type', `Remove “${room.name}” from your occupancy?`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              void (async () => {
                await providerService.deleteRoom(room.id);
                onChanged();
              })();
            },
          },
        ]);
        return;
      }
      await providerService.updateRoom(room.id, {
        quantity: nextQty,
        availableCount: nextFree,
        available: nextFree > 0,
      });
      onChanged();
    } catch (error) {
      Alert.alert(
        'Could not update',
        error instanceof Error ? error.message : 'Try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.occRow}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.occTitle} numberOfLines={1}>
          {room.name}
        </Text>
        <Text style={styles.occMeta}>
          {roomTypeLabel(room.roomType)} · {free}/{room.quantity} free ·{' '}
          {formatCurrency(room.pricePerNight)}/night
        </Text>
      </View>
      <View style={styles.occControls}>
        <Pressable
          style={styles.occBtn}
          disabled={busy}
          onPress={() => void adjust(-1)}
        >
          <Ionicons name="remove" size={18} color={Colors.primary} />
        </Pressable>
        <Text style={styles.occCount}>{room.quantity}</Text>
        <Pressable style={styles.occBtn} disabled={busy} onPress={() => void adjust(1)}>
          <Ionicons name="add" size={18} color={Colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

export function HospitalityDashboard({
  greeting,
  provider,
  userName,
}: {
  greeting: string;
  provider: Provider;
  userName?: string;
}) {
  const insets = useSafeAreaInsets();
  const {
    stats,
    loading,
    bookings,
    earnings,
    reviews,
    rooms,
    refreshDashboard,
  } = useProviderStore();
  const checkIns = useHotelCheckInStore((s) => s.byBookingId);

  const roomRequests = useMemo(
    () =>
      bookings
        .filter(
          (b) =>
            b.kind === 'hotel' &&
            (b.status === 'pending' || b.paymentStatus === 'pending')
        )
        .slice(0, 6),
    [bookings]
  );

  const activeBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        if (b.kind !== 'hotel') return false;
        if (checkIns[b.id]) return true;
        return b.status === 'confirmed' || b.status === 'upcoming';
      })
      .slice(0, 6);
  }, [bookings, checkIns]);

  const recentReviews = useMemo(() => reviews.slice(0, 5), [reviews]);
  const totalUnits = rooms.reduce((sum, r) => sum + r.quantity, 0);
  const freeUnits = rooms.reduce(
    (sum, r) => sum + (r.availableCount ?? (r.available ? r.quantity : 0)),
    0
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.lg,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.lg,
      }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshDashboard} />}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>
            {greeting}, {provider.ownerName?.split(' ')[0] ?? userName?.split(' ')[0] ?? 'Host'}
          </Text>
          <Text style={styles.business}>
            {provider.hotel?.hotelName || provider.businessName || 'Lodging'}
          </Text>
        </View>
        <MessagesHeaderActions
          messagesHref="/(provider)/messages"
          notificationsHref="/(provider)/notifications"
        />
      </View>

      {provider.verificationStatus === 'approved' ? (
        <Badge label="✓ Verified lodging" tone="green" />
      ) : (
        <Badge label={`${provider.verificationStatus ?? 'pending'} verification`} tone="amber" />
      )}

      <View style={styles.stats}>
        <ProviderStatCard label="Available rooms" value={String(stats?.availableRooms ?? freeUnits)} tone="green" />
        <ProviderStatCard label="Today's bookings" value={String(stats?.todaysBookings ?? 0)} tone="blue" />
        <ProviderStatCard
          label="Today's revenue"
          value={formatCurrency(stats?.todaysRevenue ?? 0)}
          tone="amber"
        />
      </View>

      {/* 1. Occupancy / add-remove rooms */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Occupancy</Text>
          <Pressable onPress={() => router.push('/(provider)/rooms/add')}>
            <Text style={styles.link}>Add room</Text>
          </Pressable>
        </View>
        <Text style={styles.sectionSub}>
          Create availability and adjust room counts. Add or remove units for each room type.
        </Text>
        <Text style={styles.occSummary}>
          {totalUnits} rooms offered · {freeUnits} available
        </Text>
        {rooms.length === 0 ? (
          <View style={{ gap: Spacing.md }}>
            <Text style={styles.sectionSub}>No rooms yet. Add a room type to start taking guests.</Text>
            <Button title="Add room" onPress={() => router.push('/(provider)/rooms/add')} />
          </View>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {rooms.map((room) => (
              <OccupancyRow key={room.id} room={room} onChanged={() => void refreshDashboard()} />
            ))}
            <Button
              title="Add another room type"
              variant="outline"
              onPress={() => router.push('/(provider)/rooms/add')}
            />
          </View>
        )}
      </View>

      {/* 2. Request for rooms */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Pending room requests</Text>
        <Text style={styles.sectionSub}>
          New stay requests wait here until you approve or reject them.
        </Text>
        {roomRequests.length === 0 ? (
          <Text style={styles.sectionSub}>No pending room requests right now.</Text>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {roomRequests.map((item) => (
              <Pressable
                key={item.id}
                style={styles.requestRow}
                onPress={() => pushPath(`/(provider)/booking/${item.id}`)}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.requestTitle} numberOfLines={1}>
                    {item.customerName}
                  </Text>
                  <Text style={styles.requestMeta} numberOfLines={1}>
                    {item.detailLabel || item.seatsOrRoom || item.serviceLabel} · {item.date}
                  </Text>
                </View>
                <Badge label="Approve" tone="amber" />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* 3. Active bookings */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Active bookings</Text>
          <Pressable onPress={() => pushPath('/(provider)/(tabs)/bookings')}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>
        <Text style={styles.sectionSub}>Rooms currently in use by customers.</Text>
        {activeBookings.length === 0 ? (
          <Text style={styles.sectionSub}>No active stays right now.</Text>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {activeBookings.map((item) => {
              const checkIn = checkIns[item.id];
              return (
                <Pressable
                  key={item.id}
                  style={styles.requestRow}
                  onPress={() => pushPath(`/(provider)/booking/${item.id}`)}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.requestTitle} numberOfLines={1}>
                      {checkIn?.guestName ?? item.customerName}
                    </Text>
                    <Text style={styles.requestMeta} numberOfLines={1}>
                      {checkIn
                        ? `${checkIn.roomsAvailed} room(s) · ${checkIn.days} night(s) · ${checkIn.guests} guests`
                        : `${item.detailLabel || item.seatsOrRoom} · ${item.date}`}
                    </Text>
                  </View>
                  <Badge label="In house" tone="green" />
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* 4. Earnings + BANJARA fee */}
      <ProviderEarningsFeeCard
        totalRevenue={earnings?.totalRevenue ?? 0}
        platformFees={earnings?.platformFees ?? 0}
        platformFeePercent={earnings?.platformFeePercent}
        netEarnings={earnings?.netEarnings}
      />

      {/* 5. Reviews */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Customer reviews</Text>
          <Pressable onPress={() => pushPath('/(provider)/reviews')}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>
        {recentReviews.length === 0 ? (
          <Text style={styles.sectionSub}>No reviews yet.</Text>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {recentReviews.map((item) => (
              <View key={item.id} style={styles.reviewCard}>
                <View style={styles.reviewHead}>
                  <Text style={styles.requestTitle}>{item.customerName}</Text>
                  <Stars rating={item.rating} />
                </View>
                <Text style={styles.reviewBody} numberOfLines={3}>
                  {item.comment}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  greeting: { ...Typography.h2, color: Colors.dark },
  business: { ...Typography.caption, color: Colors.muted },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontFamily: Fonts.display, fontSize: 18, color: Colors.dark },
  sectionSub: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  link: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.primary },
  occSummary: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.primary },
  occRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  occTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.dark },
  occMeta: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted, marginTop: 2 },
  occControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  occBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceSecondary,
  },
  occCount: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.dark, minWidth: 20, textAlign: 'center' },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  requestTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.dark },
  requestMeta: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted, marginTop: 2 },
  requestAmount: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.primary },
  reviewCard: {
    padding: Spacing.md,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceSecondary,
    gap: 6,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  reviewBody: { fontFamily: Fonts.body, fontSize: 13, color: Colors.dark, lineHeight: 18 },
});
