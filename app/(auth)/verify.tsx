import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthErrorBanner, AuthScreen } from '@/components/auth/AuthScreen';
import { OtpInput } from '@/components/auth/OtpInput';
import { Button } from '@/components/ui/Button';
import { AuthFonts } from '@/constants/authFonts';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import * as authService from '@/services/authService';
import { writeAuthTokens } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { getHomeHref } from '@/utils/routing';

export default function VerifyScreen() {
  const params = useLocalSearchParams<{ phone?: string; mode?: string }>();
  const phone = typeof params.phone === 'string' ? params.phone : '';
  const phoneMode = params.mode === 'phone' || Boolean(phone);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);

  const onVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      if (phoneMode && phone) {
        const result = await authService.verifyPhoneOtp(phone, code);
        await writeAuthTokens(result.tokens.accessToken, result.tokens.refreshToken);
        useAuthStore.setState({
          user: result.user,
          token: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          isAuthenticated: true,
          hasOnboarded: true,
          error: null,
        });
        const next = useAuthStore.getState().user;
        if (next?.role === 'provider' && !next.providerId) {
          router.replace('/(provider)/register/services');
          return;
        }
        router.replace(getHomeHref(next));
        return;
      }

      const ok = await authService.verifyCode(code);
      if (!ok) {
        setError('Enter a valid 4 or 6 digit code');
        return;
      }
      if (user?.role === 'provider' && !user.providerId) {
        router.replace('/(provider)/register/services');
        return;
      }
      router.replace(getHomeHref(user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!phone) {
      router.push('/(auth)/forgot-password');
      return;
    }
    try {
      await authService.requestPhoneOtp(phone);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend OTP');
    }
  };

  return (
    <AuthScreen
      title={phoneMode ? 'Verify your phone' : 'Verify your email'}
      caption="OTP"
      subtitle={
        phoneMode
          ? `Enter the 4 or 6 digit code we sent to ${phone || 'your phone'}. It usually arrives within a minute.`
          : 'Enter the 4 or 6 digit code we sent to your email. It usually arrives within a minute.'
      }
      fallbackHref="/(auth)/login"
      progress={{ step: 2, of: 2 }}
      footer={
        <Pressable onPress={() => void onResend()} accessibilityRole="button" style={styles.resendHit}>
          <Text style={styles.resend}>Didn’t get a code? Request again</Text>
        </Pressable>
      }
    >
      <View style={styles.block}>
        <View style={styles.otpWrap}>
          <OtpInput value={code} onChange={setCode} length={6} />
        </View>
        {error ? <AuthErrorBanner message={error} /> : null}
        <Button
          title="Verify & continue"
          loading={loading}
          onPress={() => void onVerify()}
          disabled={code.length < 4}
        />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: Spacing.xl,
  },
  otpWrap: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
  },
  resendHit: {
    minHeight: 44,
    justifyContent: 'center',
  },
  resend: {
    fontFamily: AuthFonts.bodySemiBold,
    fontSize: 14,
    color: Colors.action,
    textAlign: 'center',
  },
});
