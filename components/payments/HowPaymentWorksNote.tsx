import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';

type Props = {
  /** Shorter layout for hotel/tour/guide payment screens */
  compact?: boolean;
};

const STEPS: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}> = [
  {
    icon: 'wallet-outline',
    title: 'Pay the provider',
    body: 'Send money to their Bank, Easypaisa, JazzCash, or Raast account — not to BANJARA.',
  },
  {
    icon: 'cloud-upload-outline',
    title: 'Upload your proof',
    body: 'Add the receipt screenshot and transaction reference so they can verify it.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'They confirm',
    body: 'Your seats stay on hold until the provider verifies payment. Then you’re booked.',
  },
];

/**
 * Customer-facing explainer for the P2P payment flow.
 */
export function HowPaymentWorksNote({ compact }: Props) {
  const colors = useThemeColors();
  const steps = compact ? STEPS.slice(0, 2) : STEPS;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: `${colors.primary}14` }]}>
          <Ionicons name="lock-closed-outline" size={16} color={colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.dark }]}>How payment works</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Direct to provider · BANJARA never holds your money
          </Text>
        </View>
      </View>

      <View style={styles.steps}>
        {steps.map((step, index) => (
          <View key={step.title} style={styles.stepRow}>
            <View style={styles.rail}>
              <View style={[styles.stepIcon, { backgroundColor: `${colors.primary}12` }]}>
                <Ionicons name={step.icon} size={16} color={colors.primary} />
              </View>
              {index < steps.length - 1 ? (
                <View style={[styles.connector, { backgroundColor: `${colors.primary}22` }]} />
              ) : null}
            </View>
            <View style={[styles.stepCopy, index === steps.length - 1 && styles.stepCopyLast]}>
              <Text style={[styles.stepTitle, { color: colors.dark }]}>
                {index + 1}. {step.title}
              </Text>
              <Text style={[styles.stepBody, { color: colors.muted }]}>{step.body}</Text>
            </View>
          </View>
        ))}
      </View>

      {!compact ? (
        <View style={[styles.footer, { backgroundColor: `${colors.primary}08` }]}>
          <Ionicons name="information-circle" size={16} color={colors.primary} />
          <Text style={[styles.footerText, { color: colors.primary }]}>
            Choose a method below, then follow the provider’s account details on the next screen.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, gap: 2 },
  title: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 16,
  },
  steps: { gap: 0 },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  rail: {
    width: 32,
    alignItems: 'center',
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 14,
    marginVertical: 4,
    borderRadius: 1,
  },
  stepCopy: {
    flex: 1,
    paddingBottom: Spacing.md,
    gap: 2,
  },
  stepCopyLast: {
    paddingBottom: 0,
  },
  stepTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
  },
  stepBody: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  footerText: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 17,
  },
});
