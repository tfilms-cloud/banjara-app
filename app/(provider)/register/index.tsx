import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { useProviderStore } from '@/store/providerStore';
import { getHomeHref } from '@/utils/routing';

const schema = z
  .object({
    name: z.string().min(2, 'Enter your full name'),
    email: z.string().email('Enter a valid email'),
    phone: z.string().min(10, 'Enter a valid phone number'),
    password: z.string().min(6, 'Minimum 6 characters'),
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v, 'Accept terms to continue'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function ProviderRegisterScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const registerUser = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const authError = useAuthStore((state) => state.error);
  const setPersonal = useProviderStore((state) => state.setPersonal);

  const { control, handleSubmit, formState, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  const terms = watch('terms');

  const onSubmit = handleSubmit(async (values) => {
    const personal = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      password: values.password,
    };
    useProviderStore.getState().clearSession();
    setPersonal(personal);
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        role: 'provider',
      });
      const created = useAuthStore.getState().user;
      if (created?.id) {
        useProviderStore.setState({ draftUserId: created.id });
      }
      router.replace('/(provider)/register/services');
    } catch {
      // Surfaced via auth store error below
    }
  });

  if (isAuthenticated && user?.role === 'provider') {
    return <Redirect href={getHomeHref(user)} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="Service Provider" showBack fallbackHref="/(auth)/register" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        onScrollBeginDrag={Keyboard.dismiss}
      >
        <Text style={styles.heading}>Become a Banjara Service Provider</Text>
        <Text style={styles.sub}>
          List one service, reach more travelers, and grow your business with Banjara.
        </Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Full Name"
                leftIcon="person-outline"
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
                label="Phone Number"
                leftIcon="call-outline"
                keyboardType="phone-pad"
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
                label="Confirm Password"
                leftIcon="shield-checkmark-outline"
                password
                autoComplete="new-password"
                value={value}
                onChangeText={onChange}
                error={formState.errors.confirmPassword?.message}
              />
            )}
          />

          <Pressable style={styles.terms} onPress={() => setValue('terms', !terms)}>
            <View style={[styles.checkbox, terms && styles.checkboxOn]} />
            <Text style={styles.termsText}>
              I agree to Banjara Terms & Conditions for service providers.
            </Text>
          </Pressable>
          {formState.errors.terms ? (
            <Text style={styles.error}>{formState.errors.terms.message}</Text>
          ) : null}
          {authError ? <Text style={styles.error}>{authError}</Text> : null}

          <Button title="Continue" loading={isLoading} onPress={onSubmit} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  heading: { ...Typography.h1, color: Colors.primary, marginTop: Spacing.md },
  sub: { ...Typography.body, color: Colors.muted, marginBottom: Spacing.md, lineHeight: 22 },
  form: { gap: Spacing.lg },
  terms: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  termsText: { ...Typography.caption, color: Colors.muted, flex: 1, lineHeight: 18 },
  error: { ...Typography.caption, color: Colors.danger },
});
