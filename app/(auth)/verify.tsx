import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthErrorBanner, AuthScreen } from '@/components/auth/AuthScreen';
import { OtpInput } from '@/components/auth/OtpInput';
import { Button } from '@/components/ui/Button';
import { AuthFonts } from '@/constants/authFonts';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import * as authService from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { getHomeHref } from '@/utils/routing';

export default function VerifyScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);

  const onVerify = async () => {
    setLoading(true);
    setError(null);
    try {
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      title="Verify your email"
      caption="Step 2 of 2"
      subtitle="Enter the 4 or 6 digit code we sent to your email. It usually arrives within a minute."
      fallbackHref="/(auth)/login"
      progress={{ step: 2, of: 2 }}
      footer={
        <Pressable
          onPress={() => router.push('/(auth)/forgot-password')}
          accessibilityRole="button"
          style={styles.resendHit}
        >
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
          onPress={onVerify}
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
