import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

export function Skeleton({
  width = '100%',
  height = 16,
  radius = Radius.md,
  style,
}: SkeletonProps) {
  return (
    <View
      style={[
        styles.base,
        { width, height, borderRadius: radius },
        style,
      ]}
    />
  );
}

export function TripCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton width={44} height={44} radius={Radius.full} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width="55%" height={14} />
          <Skeleton width="35%" height={12} />
        </View>
      </View>
      <Skeleton height={48} style={{ marginTop: Spacing.md }} />
      <Skeleton width="40%" height={16} style={{ marginTop: Spacing.md, alignSelf: 'flex-end' }} />
    </View>
  );
}

export function HotelCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={160} radius={Radius.xl} />
      <Skeleton width="70%" height={16} style={{ marginTop: Spacing.md }} />
      <Skeleton width="45%" height={12} style={{ marginTop: Spacing.sm }} />
    </View>
  );
}

export function DestinationSkeleton() {
  return <Skeleton width={158} height={200} radius={Radius.xl} style={{ marginRight: Spacing.md }} />;
}

export function BookingSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width="60%" height={16} />
      <Skeleton width="40%" height={12} style={{ marginTop: Spacing.sm }} />
      <Skeleton width="30%" height={16} style={{ marginTop: Spacing.md }} />
    </View>
  );
}

export function AgencyProfileSkeleton() {
  return (
    <View accessibilityLabel="Loading provider profile" accessibilityState={{ busy: true }}>
      <Skeleton height={180} radius={0} />
      <View style={{ paddingHorizontal: Spacing.screen, marginTop: -36 }}>
        <Skeleton width={80} height={80} radius={40} />
        <Skeleton width="62%" height={22} style={{ marginTop: Spacing.lg }} />
        <Skeleton width="38%" height={14} style={{ marginTop: Spacing.sm }} />
        <View style={styles.row}>
          <Skeleton width={88} height={58} radius={Radius.lg} />
          <Skeleton width={88} height={58} radius={Radius.lg} />
          <Skeleton width={88} height={58} radius={Radius.lg} />
        </View>
      </View>
      <View style={{ padding: Spacing.screen, gap: Spacing.md, marginTop: Spacing.md }}>
        <Skeleton height={88} radius={Radius.xl} />
        <TripCardSkeleton />
        <TripCardSkeleton />
      </View>
    </View>
  );
}

export function TripDetailsSkeleton() {
  return (
    <View accessibilityLabel="Loading trip details" accessibilityState={{ busy: true }}>
      <Skeleton height={220} radius={0} />
      <View style={{ padding: Spacing.screen, gap: Spacing.md, marginTop: Spacing.lg }}>
        <Skeleton width="70%" height={26} />
        <Skeleton width="45%" height={14} />
        <View style={styles.row}>
          <Skeleton width="48%" height={72} radius={Radius.lg} />
          <Skeleton width="48%" height={72} radius={Radius.lg} />
        </View>
        <Skeleton height={140} radius={Radius.xl} />
        <Skeleton height={180} radius={Radius.xl} />
        <Skeleton height={96} radius={Radius.xl} />
        <Skeleton height={88} radius={Radius.xl} />
      </View>
    </View>
  );
}

export function SeatSelectionSkeleton() {
  return (
    <View
      accessibilityLabel="Loading seat map"
      accessibilityState={{ busy: true }}
      style={{ padding: Spacing.screen, gap: Spacing.md }}
    >
      <Skeleton width="55%" height={18} />
      <Skeleton width="40%" height={12} />
      <View style={[styles.row, { justifyContent: 'center', marginTop: Spacing.sm }]}>
        <Skeleton width={64} height={16} radius={Radius.sm} />
        <Skeleton width={64} height={16} radius={Radius.sm} />
        <Skeleton width={64} height={16} radius={Radius.sm} />
      </View>
      <View style={[styles.card, { alignItems: 'center', gap: Spacing.md, marginTop: Spacing.sm }]}>
        <Skeleton width={88} height={28} radius={Radius.full} />
        <View style={styles.row}>
          <Skeleton width={48} height={48} radius={Radius.md} />
          <Skeleton width={48} height={48} radius={Radius.md} />
          <Skeleton width={18} height={28} radius={2} />
          <Skeleton width={48} height={48} radius={Radius.md} />
          <Skeleton width={48} height={48} radius={Radius.md} />
        </View>
        <View style={styles.row}>
          <Skeleton width={48} height={48} radius={Radius.md} />
          <Skeleton width={48} height={48} radius={Radius.md} />
          <Skeleton width={18} height={28} radius={2} />
          <Skeleton width={48} height={48} radius={Radius.md} />
          <Skeleton width={48} height={48} radius={Radius.md} />
        </View>
        <View style={styles.row}>
          <Skeleton width={48} height={48} radius={Radius.md} />
          <Skeleton width={48} height={48} radius={Radius.md} />
          <Skeleton width={18} height={28} radius={2} />
          <Skeleton width={48} height={48} radius={Radius.md} />
          <Skeleton width={48} height={48} radius={Radius.md} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.border,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
});
