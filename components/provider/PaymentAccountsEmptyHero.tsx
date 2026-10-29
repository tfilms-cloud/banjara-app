import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PayoutChannelIcon } from '@/components/payments/PayoutChannelIcon';
import { Button } from '@/components/ui/Button';
import { Colors, useThemeColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';

const METHODS = [
  { id: 'bank' as const, label: 'Bank' },
  { id: 'easypaisa' as const, label: 'Easypaisa' },
  { id: 'jazzcash' as const, label: 'JazzCash' },
  { id: 'raast' as const, label: 'Raast' },
];

type Props = {
  onAddAccount: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
};

/**
 * Full-viewport setup state when the provider has no receiving accounts.
 * Disappears automatically once at least one active account exists.
 */
export function PaymentAccountsEmptyHero({ onAddAccount, onRefresh, refreshing }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { height } = useWindowDimensions();
  const compact = height < 720;
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(14)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [fade, rise, pulse]);

  const orbSize = compact ? 64 : 76;
  const tabBarPad = 72;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primarySoft, colors.background, colors.background]}
        locations={[0, 0.38, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + (compact ? Spacing.md : Spacing.xl),
            paddingBottom: insets.bottom + tabBarPad,
            minHeight: height - tabBarPad,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fade,
              transform: [{ translateY: rise }],
              gap: compact ? Spacing.md : Spacing.lg,
            },
          ]}
        >
          <View style={[styles.heroBlock, { gap: compact ? Spacing.sm : Spacing.md }]}>
            <Animated.View
              style={[
                styles.orb,
                {
                  width: orbSize,
                  height: orbSize,
                  borderRadius: orbSize / 2,
                  transform: [{ scale: pulse }],
                },
              ]}
            >
              <LinearGradient
                colors={[colors.primary, colors.action]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.orbInner, { borderRadius: orbSize / 2 }]}
              >
                <Ionicons name="wallet" size={compact ? 28 : 32} color={Colors.white} />
              </LinearGradient>
            </Animated.View>

            <Text style={[styles.kicker, { color: colors.primary }]}>PAYMENT SETUP</Text>
            <Text
              style={[
                styles.title,
                { color: colors.dark, fontSize: compact ? 22 : 26, lineHeight: compact ? 28 : 32 },
              ]}
            >
              Add how customers pay you
            </Text>
            <Text style={[styles.body, { color: colors.muted }]}>
              Connect Bank, Easypaisa, JazzCash, or Raast. Travelers can’t book you until this is
              done.
            </Text>
          </View>

          <View style={styles.methodGrid}>
            {METHODS.map((method) => (
              <View
                key={method.id}
                style={[
                  styles.methodCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    paddingVertical: compact ? Spacing.sm : Spacing.md,
                  },
                ]}
              >
                <PayoutChannelIcon channel={method.id} size={compact ? 36 : 42} />
                <Text style={[styles.methodLabel, { color: colors.dark }]} numberOfLines={1}>
                  {method.label}
                </Text>
              </View>
            ))}
          </View>

          <View
            style={[
              styles.tipCard,
              { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}22` },
            ]}
          >
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.muted }]}>
              Customers pay you directly. BANJARA only helps verify the transfer — we don’t hold
              your money.
            </Text>
          </View>

          <View style={styles.actions}>
            <Button title="Add payment account" onPress={onAddAccount} />
            {onRefresh ? (
              <Pressable onPress={onRefresh} style={styles.refreshBtn} disabled={refreshing}>
                <Ionicons name="refresh-outline" size={16} color={colors.primary} />
                <Text style={[styles.refreshText, { color: colors.primary }]} numberOfLines={1}>
                  {refreshing ? 'Checking…' : 'I’ve added an account — refresh'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  heroBlock: { alignItems: 'center' },
  orb: {
    marginBottom: Spacing.xs,
  },
  orbInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1.3,
  },
  title: {
    fontFamily: Fonts.display,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
  },
  body: {
    ...Typography.body,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.xs,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.sm,
  },
  methodCard: {
    width: '48.5%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 8,
  },
  methodLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },
  tipCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    alignItems: 'flex-start',
  },
  tipText: {
    ...Typography.caption,
    flex: 1,
    flexShrink: 1,
    lineHeight: 18,
  },
  actions: { gap: Spacing.sm },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  refreshText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    flexShrink: 1,
  },
});
