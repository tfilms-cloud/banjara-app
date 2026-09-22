import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    minHeight: 64,
  },
  rail: {
    width: 20,
    alignItems: 'center',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
  },
  lineTop: { marginBottom: 2 },
  lineBottom: { marginTop: 2 },
  lineSpacer: { flex: 1 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  dotLast: {
    backgroundColor: Colors.action,
  },
  dotBranch: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  copy: {
    flex: 1,
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  title: {
    ...Typography.bodyBold,
    color: Colors.primary,
    flexShrink: 1,
  },
  caption: {
    ...Typography.caption,
    color: Colors.muted,
    marginTop: 2,
  },
  time: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.dark,
    marginTop: 4,
  },
});
