import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { getHomeHref } from '@/utils/routing';

export default function NotFoundScreen() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const href = isAuthenticated ? getHomeHref(user) : '/(auth)/welcome';

  return (
    <>
      <Stack.Screen options={{ title: 'Not Found', headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.message}>This screen does not exist in Banjara.</Text>
        <Link href={href} style={styles.link}>
          Go back home
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  title: {
    ...Typography.h2,
    color: Colors.primary,
  },
  message: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
  },
  link: {
    ...Typography.bodyBold,
    color: Colors.secondary,
    marginTop: Spacing.md,
  },
});
