import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import { AuthErrorBanner, AuthScreen } from '@/components/auth/AuthScreen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthFonts } from '@/constants/authFonts';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import * as authService from '@/services/authService';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState, getValues } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await authService.requestPasswordReset(values.email);
      setMessage(result.message);
      setSent(true);
    } catch (error) {
      setSent(false);
      setMessage(error instanceof Error ? error.message : 'Unable to send reset code');
    } finally {
      setLoading(false);
    }
  });

  return (
    <AuthScreen
      title="Reset password"
      caption="Account help"
      subtitle="Enter your email and we’ll send a verification code to get you back in."
      fallbackHref="/(auth)/login"
      footer={
        <Text style={styles.footer}>
          Remembered it?{' '}
          <Text style={styles.link} onPress={() => router.push('/(auth)/login')}>
            Sign in
          </Text>
        </Text>
      }
    >
      <View style={styles.form}>
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
              editable={!sent}
            />
          )}
        />

        {message && !sent ? <AuthErrorBanner message={message} /> : null}

        {sent ? (
          <View style={styles.success}>
            <Text style={styles.successTitle}>Code sent</Text>
            <Text style={styles.successBody}>
              {message ?? `Check ${getValues('email')} for your reset code, then continue to verify.`}
            </Text>
            <Button title="Enter verification code" onPress={() => router.push('/(auth)/verify')} />
            <Button title="Resend code" variant="ghost" loading={loading} onPress={onSubmit} />
          </View>
        ) : (
          <Button title="Send code" loading={loading} onPress={onSubmit} />
        )}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.lg,
  },
  success: {
    gap: Spacing.md,
    backgroundColor: Colors.softGreen,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  successTitle: {
    fontFamily: AuthFonts.bodySemiBold,
    fontSize: 16,
    color: Colors.primary,
  },
  successBody: {
    fontFamily: AuthFonts.body,
    fontSize: 14,
    color: Colors.muted,
    lineHeight: 21,
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
