import { ShieldCheck } from 'lucide-react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import { AuthErrorBanner, AuthScreen } from '@/components/auth/AuthScreen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthFonts } from '@/constants/authFonts';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useAuthStore } from '@/store/authStore';
import { getHomeHref } from '@/utils/routing';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
      const { useProviderStore } = await import('@/store/providerStore');
      useProviderStore.getState().clearSession();
      router.replace(getHomeHref(useAuthStore.getState().user));
    } catch {
      // surfaced via store error
    }
  });

  return (
    <AuthScreen
      title="Welcome back"
      caption="Sign in"
      subtitle="Manage bookings, messages, and trips with your Banjara account."
      fallbackHref="/(auth)/welcome"
      footer={
        <Text style={styles.footer}>
          New to Banjara?{' '}
          <Text style={styles.link} onPress={() => router.push('/(auth)/register')}>
            Create account
          </Text>
        </Text>
      }
    >
      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email"
              leftIcon="mail-outline"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="you@email.com"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={formState.errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Password"
              leftIcon="lock-closed-outline"
              password
              autoComplete="password"
              placeholder="Your password"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={formState.errors.password?.message}
            />
          )}
        />

        <Pressable
          onPress={() => router.push('/(auth)/forgot-password')}
          accessibilityRole="link"
          style={styles.forgotHit}
        >
          <Text style={styles.forgot}>Forgot password?</Text>
        </Pressable>

        {error ? <AuthErrorBanner message={error} /> : null}

        <Button title="Sign in" loading={isLoading} onPress={onSubmit} />

        <View style={styles.trust}>
          <ShieldCheck size={14} color={Colors.primary} strokeWidth={2.2} />
          <Text style={styles.trustText}>Your trips and messages stay private</Text>
        </View>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.lg,
  },
  forgotHit: {
    alignSelf: 'flex-end',
    minHeight: 36,
    justifyContent: 'center',
    marginTop: -Spacing.sm,
  },
  forgot: {
    fontFamily: AuthFonts.bodySemiBold,
    fontSize: 13,
    color: Colors.action,
  },
  trust: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.xs,
  },
  trustText: {
    fontFamily: AuthFonts.body,
    fontSize: 12,
    color: Colors.muted,
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
