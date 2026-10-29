import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { useProviderStore } from '@/store/providerStore';
import { needsProviderOnboarding } from '@/utils/routing';

const copy = {
  pending: {
    title: 'Your application is under review.',
    body: 'Banjara will notify you once verification is complete.',
    icon: 'time-outline' as const,
    color: Colors.accent,
  },
  rejected: {
    title: 'Your application needs changes.',
    body: 'Please review feedback and resubmit your provider details.',
    icon: 'alert-circle-outline' as const,
    color: Colors.danger,
  },
  suspended: {
    title: 'Your provider account is currently suspended.',
    body: 'Contact Banjara support to restore access.',
    icon: 'ban-outline' as const,
    color: Colors.danger,
  },
  approved: {
    title: 'Your provider account is verified.',
    body: 'You can manage services from your dashboard.',
    icon: 'shield-checkmark-outline' as const,
    color: Colors.success,
  },
};

export default function ProviderStatusScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const provider = useProviderStore((s) => s.provider);
  const status = provider?.verificationStatus ?? user?.providerStatus ?? 'pending';
  const content = copy[status] ?? copy.pending;

  if (needsProviderOnboarding(user)) {
    return <Redirect href="/(provider)/register/services" />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing['3xl'], paddingBottom: insets.bottom + Spacing['2xl'] }]}>
      <View style={[styles.icon, { backgroundColor: content.color }]}>
        <Ionicons name={content.icon} size={32} color={Colors.white} />
      </View>
      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.body}>{content.body}</Text>
      {status === 'approved' ? (
        <Button title="Open Dashboard" onPress={() => router.replace('/(provider)/(tabs)' as never)} />
      ) : (
        <Button title="View Application" onPress={() => router.push('/(provider)/register/review')} />
      )}
      {provider ? <Button title="Refresh status" variant="outline"
        onPress={() => void useProviderStore.getState().loadProvider(provider.id)} /> : null}
      <Button title="Sign Out" variant="ghost" onPress={() => {
        useAuthStore.getState().logout();
        router.replace('/(auth)/welcome');
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.lg,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...Typography.h2, color: Colors.primary, textAlign: 'center' },
  body: { ...Typography.body, color: Colors.muted, textAlign: 'center', lineHeight: 22 },
});
