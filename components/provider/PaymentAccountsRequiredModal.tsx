import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';

type Props = {
  visible: boolean;
  onSetup: () => void;
  onLater?: () => void;
};

/**
 * Blocks / reminds providers to add Bank / Easypaisa / JazzCash / Raast
 * before they can offer bookable services to customers.
 */
export function PaymentAccountsRequiredModal({ visible, onSetup, onLater }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onLater ?? onSetup}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="wallet-outline" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Complete payment account details</Text>
          <Text style={styles.body}>
            Add at least one receiving account (Bank, Easypaisa, JazzCash, or Raast) before you can
            offer services to customers. Travelers need these details to pay you for bookings.
          </Text>
          <Button title="Add payment account" onPress={onSetup} />
          {onLater ? (
            <Pressable onPress={onLater} style={styles.later} hitSlop={8}>
              <Text style={styles.laterText}>I’ll do it later</Text>
            </Pressable>
          ) : (
            <Text style={styles.requiredNote}>
              Required before you can add or offer services on BANJARA.
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 17, 31, 0.55)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.dark,
    textAlign: 'center',
  },
  body: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  later: { alignItems: 'center', paddingVertical: Spacing.sm },
  laterText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.muted },
  requiredNote: {
    ...Typography.caption,
    color: Colors.warning,
    textAlign: 'center',
    lineHeight: 18,
  },
});
