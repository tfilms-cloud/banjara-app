import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';

const STEPS = [
  { id: 1, label: 'Pay' },
  { id: 2, label: 'Proof' },
  { id: 3, label: 'Verify' },
  { id: 4, label: 'Done' },
] as const;

type Props = {
  /** 1 = pay instructions, 2 = submit proof, 3 = provider verify, 4 = confirmed */
  activeStep: 1 | 2 | 3 | 4;
};

export function PaymentFlowSteps({ activeStep }: Props) {
  return (
    <View style={styles.row} accessibilityRole="summary">
      {STEPS.map((step, index) => {
        const done = activeStep > step.id;
        const active = activeStep === step.id;
        return (
          <View key={step.id} style={styles.item}>
            <View style={styles.track}>
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  active && styles.dotActive,
                ]}
              >
                <Text
                  style={[
                    styles.dotText,
                    (done || active) && styles.dotTextOn,
                  ]}
                >
                  {done ? '✓' : step.id}
                </Text>
              </View>
              {index < STEPS.length - 1 ? (
                <View style={[styles.line, done && styles.lineDone]} />
              ) : null}
            </View>
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function paymentStepFromStatus(status: string): 1 | 2 | 3 | 4 {
  if (status === 'confirmed' || status === 'paid') return 4;
  if (status === 'proof_submitted' || status === 'under_review' || status === 'disputed') {
    return 3;
  }
  if (status === 'payment_initiated' || status === 'rejected') return 2;
  return 1;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
  },
  item: { flex: 1, alignItems: 'center', gap: 6 },
  track: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    zIndex: 1,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dotDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  dotText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.muted,
  },
  dotTextOn: { color: Colors.white },
  line: {
    position: 'absolute',
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: Colors.border,
    zIndex: 0,
  },
  lineDone: { backgroundColor: Colors.success },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.muted,
    textAlign: 'center',
  },
  labelActive: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.primary,
  },
});
