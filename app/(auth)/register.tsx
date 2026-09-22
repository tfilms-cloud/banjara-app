import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { AuthFonts } from '@/constants/authFonts';
import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function RoleTile({
  title,
  description,
  icon,
  tone,
  badge,
  onPress,
  delay,
}: {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'pine' | 'copper';
  badge?: string;
  onPress: () => void;
  delay: number;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const isPine = tone === 'pine';
  const bg = isPine ? Colors.primarySoft : Colors.actionSoft;
  const iconColor = isPine ? Colors.primary : Colors.action;
  const accent = isPine ? Colors.primary : Colors.action;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.985);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={animatedStyle}
      >
        <View style={[styles.card, { borderColor: isPine ? '#C5DDD9' : '#F0D5C4' }]}>
          <View style={[styles.accentBar, { backgroundColor: accent }]} />
          <View style={styles.cardInner}>
            <View style={[styles.icon, { backgroundColor: bg }]}>
              <Ionicons name={icon} size={26} color={iconColor} />
            </View>
            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{title}</Text>
                {badge ? (
                  <View style={[styles.badge, { backgroundColor: bg }]}>
                    <Text style={[styles.badgeText, { color: accent }]}>{badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.desc}>{description}</Text>
              <Text style={[styles.cta, { color: accent }]}>Continue →</Text>
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function RegisterChooserScreen() {
  return (
    <AuthScreen
      title="Join Banjara"
      caption="Create account"
      subtitle="Choose how you’ll use the app. You can switch or manage this anytime in settings."
      fallbackHref="/(auth)/welcome"
      footer={
        <Text style={styles.footer}>
          Already have an account?{' '}
          <Text style={styles.link} onPress={() => router.push('/(auth)/login')}>
            Sign in
          </Text>
        </Text>
      }
    >
      <View style={styles.roles}>
        <RoleTile
          title="I'm a traveler"
          description="Search routes, pick seats, book hotels, and message providers."
          icon="compass-outline"
          tone="pine"
          badge="Popular"
          delay={60}
          onPress={() => router.push('/(auth)/register-customer')}
        />
        <RoleTile
          title="I'm a provider"
          description="Offer transport, stays, or a travel guide — then manage bookings and earnings."
          icon="briefcase-outline"
          tone="copper"
          delay={140}
          onPress={() => router.push('/(provider)/register' as never)}
        />
      </View>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.muted} />
        <Text style={styles.noteText}>Takes about 2 minutes. No payment needed to start.</Text>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  roles: {
    gap: Spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    borderWidth: 1.5,
    overflow: 'hidden',
    ...Shadows.card,
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontFamily: AuthFonts.bodyBold,
    fontSize: 17,
    color: Colors.dark,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontFamily: AuthFonts.bodySemiBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  desc: {
    fontFamily: AuthFonts.body,
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 19,
    marginTop: 2,
  },
  cta: {
    fontFamily: AuthFonts.bodySemiBold,
    fontSize: 13,
    marginTop: 8,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.lg,
  },
  noteText: {
    flex: 1,
    fontFamily: AuthFonts.body,
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 17,
  },
  footer: {
    fontFamily: AuthFonts.body,
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
  },
  link: {
    fontFamily: AuthFonts.bodySemiBold,
    color: Colors.action,
  },
});
