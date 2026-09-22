import { Check } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import type { BookingStatus, PaymentStatus } from '@/types/booking';

type Step = {
  key: string;
  label: string;
  hint: string;
  done: boolean;
  current: boolean;
};

function buildSteps(
  status: BookingStatus,
  paymentStatus: PaymentStatus,
  createdAt: string
): Step[] {
  const cancelled = status === 'cancelled';
  const completed = status === 'completed';
  const confirmed =
    status === 'confirmed' || status === 'upcoming' || status === 'completed';
  const paid = paymentStatus === 'paid' || paymentStatus === 'refunded';

  if (cancelled) {
    return [
      {
        key: 'placed',
        label: 'Booking placed',
        hint: new Date(createdAt).toLocaleString(),
        done: true,
        current: false,
      },
      {
        key: 'cancelled',
        label: 'Cancelled',
        hint: 'Seats released',
        done: true,
        current: true,
      },
    ];
  }

  return [
    {
      key: 'placed',
      label: 'Booking placed',
      hint: new Date(createdAt).toLocaleString(),
      done: true,
      current: !confirmed,
    },
    {
      key: 'payment',
      label: paid ? 'Payment confirmed' : 'Awaiting payment',
      hint: paid ? 'You are all set' : 'Complete payment if needed',
      done: paid,
      current: confirmed && !paid && !completed,
    },
    {
      key: 'confirmed',
      label: 'Trip confirmed',
      hint: 'Show ticket at boarding',
      done: confirmed && paid,
      current: confirmed && paid && !completed,
    },
    {
      key: 'completed',
      label: 'Trip completed',
      hint: completed ? 'Thanks for traveling with Banjara' : 'After you arrive',
      done: completed,
      current: completed,
    },
  ];
}

type BookingStatusTimelineProps = {
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
};

export function BookingStatusTimeline({
  status,
  paymentStatus,
  createdAt,
}: BookingStatusTimelineProps) {
  const steps = buildSteps(status, paymentStatus, createdAt);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Booking progress</Text>
      {steps.map((step, index) => (
        <View key={step.key} style={styles.row}>
          <View style={styles.rail}>
            <View
              style={[
                styles.dot,
                step.done && styles.dotDone,
                step.current && styles.dotCurrent,
              ]}
            >
              {step.done ? <Check size={12} color={Colors.white} strokeWidth={3} /> : null}
            </View>
            {index < steps.length - 1 ? (
              <View style={[styles.line, step.done && styles.lineDone]} />
            ) : null}
          </View>
          <View style={styles.copy}>
            <Text style={[styles.label, step.current && styles.labelCurrent]}>{step.label}</Text>
            <Text style={styles.hint}>{step.hint}</Text>
          </View>
        </View>
      ))}
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
  },
  title: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.dark,
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    minHeight: 56,
  },
  rail: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  dotCurrent: {
    backgroundColor: Colors.action,
    borderColor: Colors.action,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  lineDone: {
    backgroundColor: Colors.success,
  },
  copy: {
    flex: 1,
    paddingBottom: Spacing.md,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.dark,
  },
  labelCurrent: {
    color: Colors.action,
  },
  hint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
});
