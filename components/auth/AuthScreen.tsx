import { ArrowLeft, CircleAlert } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
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
import { AuthBrandMark } from '@/components/auth/AuthBrandMark';
import { AuthFonts } from '@/constants/authFonts';
import { Colors, useThemeColors } from '@/constants/colors';
import { AUTH_BG_IMAGE } from '@/constants/destinations';
import { Radius, Spacing } from '@/constants/spacing';

type AuthScreenProps = {
  title: string;
  subtitle?: string;
  caption?: string;
  showBack?: boolean;
  fallbackHref?: Href;
  children: ReactNode;
  footer?: ReactNode;
  showBrand?: boolean;
  /** Visual step progress under the sheet subtitle */
  progress?: { step: number; of: number };
};

export function AuthScreen({
  title,
  subtitle,
  caption,
  showBack = true,
  fallbackHref = '/(auth)/welcome',
  children,
  footer,
  showBrand = true,
  progress,
}: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  const onBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallbackHref);
  };

  const form = (
    <View style={[styles.sheet, { backgroundColor: colors.card }]}>
      <Pressable onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.handle} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      </Pressable>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, Spacing.md) + Spacing['4xl'] },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
        bounces={false}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        <View style={styles.content}>
          {progress ? (
            <View
              style={styles.progressRow}
              accessibilityLabel={`Step ${progress.step} of ${progress.of}`}
            >
              {Array.from({ length: progress.of }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressDot,
                    i < progress.step ? styles.progressDotActive : null,
                    i === progress.step - 1 ? styles.progressDotCurrent : null,
                  ]}
                />
              ))}
            </View>
          ) : null}
          {subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
          <View style={styles.body}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.root}>
      <Pressable
        style={[styles.hero, { paddingTop: insets.top }]}
        onPress={Keyboard.dismiss}
        accessible={false}
      >
        <Image source={{ uri: AUTH_BG_IMAGE }} style={styles.heroImage} contentFit="cover" />
        <LinearGradient
          colors={['rgba(8,17,31,0.28)', 'rgba(8,17,31,0.58)', 'rgba(8,17,31,0.92)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroBar}>
          {showBack ? (
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
            >
              <ArrowLeft size={20} color={Colors.white} strokeWidth={2.2} />
            </Pressable>
          ) : (
            <View style={styles.backBtnSpacer} />
          )}
          {showBrand ? <AuthBrandMark compact light /> : <View />}
          <View style={styles.backBtnSpacer} />
        </View>
        <View style={styles.heroCopy}>
          {caption ? (
            <View style={styles.captionPill}>
              <Text style={styles.caption}>{caption}</Text>
            </View>
          ) : null}
          <Text style={styles.heroTitle}>{title}</Text>
        </View>
      </Pressable>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {form}
      </KeyboardAvoidingView>
    </View>
  );
}

export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.errorBanner} accessibilityRole="alert">
      <CircleAlert size={18} color={Colors.danger} strokeWidth={2} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  flex: { flex: 1 },
  hero: {
    height: 228,
    overflow: 'hidden',
    backgroundColor: Colors.primaryDark,
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  heroBar: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  backBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.26)',
  },
  backBtnSpacer: {
    width: 42,
    height: 42,
  },
  heroCopy: {
    paddingHorizontal: Spacing.screen,
    marginTop: 'auto',
    paddingBottom: Spacing['3xl'],
    gap: Spacing.sm,
  },
  captionPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(202,138,4,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(202,138,4,0.35)',
  },
  caption: {
    fontFamily: AuthFonts.bodySemiBold,
    fontSize: 11,
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  heroTitle: {
    fontFamily: AuthFonts.displayBold,
    fontSize: 30,
    lineHeight: 36,
    color: Colors.white,
    letterSpacing: -0.4,
  },
  sheet: {
    flex: 1,
    marginTop: -24,
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.md,
  },
  content: {
    gap: Spacing.lg,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.xs,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceSecondary,
  },
  progressDotActive: {
    backgroundColor: Colors.actionSoft,
  },
  progressDotCurrent: {
    backgroundColor: Colors.action,
  },
  subtitle: {
    fontFamily: AuthFonts.body,
    fontSize: 15,
    lineHeight: 23,
    color: Colors.muted,
  },
  body: {
    gap: Spacing.xl,
  },
  footer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.softDanger,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    flex: 1,
    fontFamily: AuthFonts.bodyMedium,
    fontSize: 13,
    color: Colors.danger,
    lineHeight: 19,
  },
});
