import { useThemedStyles } from '@/hooks/useThemedStyles';
import { StyleSheet, Text, View } from 'react-native';
import { type ColorTokens } from '@/constants/colors';
import { CustomerType, Fonts, Typography, TypeSize } from '@/constants/typography';
import { Radius, Shadows, Spacing, Size } from '@/constants/spacing';
import type { PickupPoint } from '@/types/route';
import { formatTime } from '@/utils/formatTime';

type TripRouteTimelineProps = {
  from: string;
  to: string;
  departureTime?: string;
  arrivalTime?: string;
  pickups?: PickupPoint[];
};

export function TripRouteTimeline({
  from,
  to,
  departureTime,
  arrivalTime,
  pickups = [],
}: TripRouteTimelineProps) {
  const styles = useThemedStyles(createStyles);
  const origin = from.trim();
  const destination = to.trim();
  if (!origin && !destination) return null;

  const boarding = pickups.filter((point) => point.name.trim());

  return (
    <View style={styles.card} accessibilityLabel="Trip route">
      {origin ? (
        <TimelineRow
          title={origin}
          time={departureTime}
          caption="Departure"
          first
        />
      ) : null}

      {boarding.map((point) => (
        <TimelineRow
          key={point.id}
          title={point.name}
          time={point.time}
          caption={point.address || 'Boarding point'}
          branch
        />
      ))}

      {destination ? (
        <TimelineRow
          title={destination}
          time={arrivalTime}
          caption="Arrival"
          last
        />
      ) : null}
    </View>
  );
}

function TimelineRow({
  title,
  time,
  caption,
  first,
  last,
  branch,
}: {
  title: string;
  time?: string;
  caption?: string;
  first?: boolean;
  last?: boolean;
  branch?: boolean;
}) {
  const styles = useThemedStyles(createStyles);
  const formatted = time ? formatTime(time) : '';
  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        {!first ? <View style={[styles.line, styles.lineTop]} /> : <View style={styles.lineSpacer} />}
        <View style={[styles.dot, last && styles.dotLast, branch && styles.dotBranch]} />
        {!last ? <View style={[styles.line, styles.lineBottom]} /> : <View style={styles.lineSpacer} />}
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
        {formatted ? <Text style={styles.time}>{formatted}</Text> : null}
      </View>
    </View>
  );
}

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: Radius['2xl'],
    borderWidth: Size.border,
    borderColor: colors.border,
    ...Shadows.soft,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    minHeight: Size.row,
  },
  rail: {
    width: Size.icon,
    alignItems: 'center',
  },
  line: {
    width: Size.borderActive,
    flex: 1,
    backgroundColor: colors.border,
  },
  lineTop: { marginBottom: Spacing.xxs },
  lineBottom: { marginTop: Spacing.xxs },
  lineSpacer: { flex: 1 },
  dot: {
    width: Size.iconXs,
    height: Size.iconXs,
    borderRadius: Radius.full,
    backgroundColor: colors.primary,
  },
  dotLast: {
    backgroundColor: colors.action,
  },
  dotBranch: {
    width: Size.iconTiny,
    height: Size.iconTiny,
    borderRadius: Radius.full,
    backgroundColor: colors.coral,
  },
  copy: {
    flex: 1,
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  title: {
    ...CustomerType.card,
    color: colors.dark,
    flexShrink: 1,
  },
  caption: {
    ...Typography.caption,
    color: colors.muted,
    marginTop: Spacing.xxs,
  },
  time: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: TypeSize.label,
    color: colors.dark,
    marginTop: Spacing.xs,
  },
});
