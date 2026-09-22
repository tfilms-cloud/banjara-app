import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { useProviderStore } from '@/store/providerStore';
import { getHomeHref, needsProviderOnboarding } from '@/utils/routing';

export default function ProviderApplicationSuccessScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const loadProvider = useProviderStore((s) => s.loadProvider);
  const loadProviderByUser = useProviderStore((s) => s.loadProviderByUser);
  const provider = useProviderStore((s) => s.provider);

  useEffect(() => {
    if (user?.providerId && !provider) {
      void loadProvider(user.providerId);
    } else if (user?.id && !provider) {
      void loadProviderByUser(user.id);
    }
  }, [user?.providerId, user?.id, provider, loadProvider, loadProviderByUser]);

  if (needsProviderOnboarding(user)) {
    return <Redirect href="/(provider)/register/services" />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing['3xl'], paddingBottom: insets.bottom + Spacing['2xl'] }]}>
      <View style={styles.icon}>
        <Ionicons name="checkmark" size={36} color={Colors.white} />
      </View>
      <Text style={styles.title}>Application Submitted</Text>
      <Text style={styles.sub}>
        Thank you for applying to become a BANJARA service provider.
      </Text>
      <Badge label="Pending Verification" tone="amber" />
      <Text style={styles.message}>
        Our team will review your application in MongoDB. An admin must approve your provider profile before you can manage vehicles, trips, or hotels.
      </Text>

      <View style={styles.card}>
        <Text style={styles.meta}>Applicant</Text>
        <Text style={styles.value}>{user?.name ?? provider?.ownerName ?? '—'}</Text>
        <Text style={styles.meta}>Business</Text>
        <Text style={styles.value}>{provider?.businessName ?? '—'}</Text>
        <Text style={styles.meta}>Status</Text>
        <Text style={styles.value}>{user?.providerStatus ?? provider?.verificationStatus ?? 'pending'}</Text>
      </View>

      <View style={styles.actions}>
        <Button title="View Application" onPress={() => router.push('/(provider)/register/review')} />
        <Button
          title="Check Status"
          variant="outline"
          onPress={() => router.push('/(provider)/status')}
        />
        <Button
          title="Back to Home"
          variant="ghost"
          onPress={() => router.replace(getHomeHref(user))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...Typography.h1, color: Colors.primary, textAlign: 'center' },
  sub: { ...Typography.body, color: Colors.muted, textAlign: 'center' },
  message: { ...Typography.caption, color: Colors.muted, textAlign: 'center', lineHeight: 20 },
  card: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  meta: { ...Typography.caption, color: Colors.muted, marginTop: Spacing.sm },
  value: { ...Typography.bodyBold, color: Colors.primary },
  actions: { width: '100%', gap: Spacing.md, marginTop: Spacing.md },
});
