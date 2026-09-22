import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import { AuthErrorBanner, AuthScreen } from '@/components/auth/AuthScreen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthFonts } from '@/constants/authFonts';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useAuthStore } from '@/store/authStore';

const schema = z
  .object({
    name: z.string().min(2, 'Enter your full name'),
    email: z.string().email('Enter a valid email'),
    phone: z.string().min(10, 'Enter a valid phone number'),
    password: z.string().min(6, 'Minimum 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterCustomerScreen() {
  const registerUser = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        role: 'customer',
      });
      router.push('/(auth)/verify');
    } catch {
      // Surfaced via auth store error
    }
  });

  return (
    <AuthScreen
      title="Create traveler account"
      caption="Step 1 of 2"
      subtitle="Book vans, buses, cars, and hotels with one Banjara profile."
      fallbackHref="/(auth)/register"
      progress={{ step: 1, of: 2 }}
      footer={
        <Text style={styles.footer}>
          Already have an account?{' '}
          <Text style={styles.link} onPress={() => router.push('/(auth)/login')}>
            Sign in
          </Text>
        </Text>
      }
    >
      <View style={styles.form}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Full name"
              leftIcon="person-outline"
              placeholder="e.g. Ayesha Khan"
              autoComplete="name"
              value={value}
              onChangeText={onChange}
              error={formState.errors.name?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Email"
              leftIcon="mail-outline"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="you@email.com"
              value={value}
              onChangeText={onChange}
              error={formState.errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Phone"
              leftIcon="call-outline"
              keyboardType="phone-pad"
              autoComplete="tel"
              placeholder="03XX XXXXXXX"
              value={value}
              onChangeText={onChange}
              error={formState.errors.phone?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Password"
              leftIcon="lock-closed-outline"
              password
              autoComplete="new-password"
              placeholder="At least 6 characters"
              hint="Use a mix of letters and numbers for a stronger password."
              value={value}
              onChangeText={onChange}
              error={formState.errors.password?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Confirm password"
              leftIcon="shield-checkmark-outline"
              password
              autoComplete="new-password"
              placeholder="Re-enter password"
              value={value}
              onChangeText={onChange}
              error={formState.errors.confirmPassword?.message}
            />
          )}
        />
        {error ? <AuthErrorBanner message={error} /> : null}
        <Button title="Continue" loading={isLoading} onPress={onSubmit} />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.lg,
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
