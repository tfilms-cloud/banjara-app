import { ShieldCheck } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandMark } from '@/components/brand/BrandMark';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { POPULAR_DESTINATIONS, WELCOME_IMAGE } from '@/constants/destinations';
import { Radius, Spacing } from '@/constants/spacing';
import { Brand, Fonts } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const setOnboarded = useAuthStore((state) => state.setOnboarded);

  return (
    <View style={styles.container}>
      <Image source={{ uri: WELCOME_IMAGE }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={['rgba(8,17,31,0.2)', 'rgba(8,17,31,0.55)', 'rgba(8,17,31,0.96)']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing['2xl'],
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <Animated.View entering={FadeIn.duration(600)} style={styles.top}>
          <View style={styles.logoRow}>
            <BrandMark size={48} />
            <Text style={styles.brand}>{Brand.name}</Text>
          </View>

          <Text style={styles.headline}>Travel the north{'\n'}with confidence</Text>
          <Text style={styles.description}>
            Book vans, buses, and stays across Hunza, Skardu, Gilgit and more — in one app.
          </Text>

          <View style={styles.chips}>
            {POPULAR_DESTINATIONS.slice(0, 4).map((d) => (
              <View key={d.id} style={styles.chip}>
                <Text style={styles.chipText}>{d.name}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(140).duration(480)} style={styles.bottom}>
          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <ShieldCheck size={16} color={Colors.accent} strokeWidth={2} />
              <Text style={styles.trustText}>Verified providers</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="bus" size={16} color={Colors.accent} />
              <Text style={styles.trustText}>Live seat maps</Text>
            </View>
          </View>

          <View style={styles.panel}>
            <Button
              title="Create account"
              onPress={() => {
                setOnboarded();
                router.push('/(auth)/register');
              }}
            />
            <Button
              title="Sign in"
              variant="outline"
              style={styles.signIn}
              textColor={Colors.dark}
              onPress={() => {
                setOnboarded();
                router.push('/(auth)/login');
              }}
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screen,
    justifyContent: 'space-between',
  },
  top: {
    gap: Spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  brand: {
    fontFamily: Fonts.bodyBold,
    fontSize: 20,
    color: Colors.white,
    letterSpacing: 1.2,
  },
  headline: {
    fontFamily: Fonts.displayBold,
    fontSize: 36,
    lineHeight: 42,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 23,
    maxWidth: 340,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  chipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.white,
  },
  bottom: {
    gap: Spacing.md,
  },
  trustRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    justifyContent: 'center',
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.88)',
  },
  panel: {
    backgroundColor: Colors.card,
    borderRadius: Radius.sheet,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  signIn: {
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
});
