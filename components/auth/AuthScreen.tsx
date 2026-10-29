import { Ionicons } from '@expo/vector-icons';
import { ArrowLeft, CircleAlert } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  findNodeHandle,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthBrandMark } from '@/components/auth/AuthBrandMark';
import { AuthContext } from '@/components/auth/AuthContext';
import { AuthFonts } from '@/constants/authFonts';
import { Colors, useThemeColors } from '@/constants/colors';
import { AUTH_BG_IMAGE } from '@/constants/destinations';
import { Radius, Shadows, Spacing } from '@/constants/spacing';

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
  const scrollRef = useRef<ScrollView>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const keyboardProgress = useSharedValue(0);
  const keyboardHeight = useSharedValue(0);

  const expandedHeroHeight = Math.max(220, insets.top + 160);
  const collapsedHeroHeight = insets.top + 52;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setIsKeyboardOpen(true);
      const duration = e.duration || (Platform.OS === 'ios' ? 260 : 200);
      const h = e.endCoordinates.height;
      keyboardProgress.value = withTiming(1, {
        duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      keyboardHeight.value = withTiming(h, {
        duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    });

    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      setIsKeyboardOpen(false);
      const duration = e.duration || (Platform.OS === 'ios' ? 240 : 200);
      keyboardProgress.value = withTiming(0, {
        duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      keyboardHeight.value = withTiming(0, {
        duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardHeight, keyboardProgress]);

  const onBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallbackHref);
  };

  const handleInputFocus = useCallback((target: any) => {
    if (!target || !scrollRef.current) return;
    setTimeout(() => {
      try {
        const responder = scrollRef.current?.getScrollResponder();
        const node = typeof target === 'number' ? target : findNodeHandle(target);
        if (responder && node) {
          responder.scrollResponderScrollNativeHandleToKeyboard(
            node,
            Platform.OS === 'ios' ? 85 : 55,
            true
          );
        }
      } catch {
        // Safe fallback
      }
    }, 130);
  }, []);

  const contextValue = useMemo(
    () => ({
      onInputFocus: handleInputFocus,
      isKeyboardOpen,
    }),
    [handleInputFocus, isKeyboardOpen]
  );

  const animatedHeroStyle = useAnimatedStyle(() => {
    const h = interpolate(
      keyboardProgress.value,
      [0, 1],
      [expandedHeroHeight, collapsedHeroHeight],
      Extrapolation.CLAMP
    );
    return {
      height: h,
    };
  });

  const animatedHeroCopyStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(keyboardProgress.value, [0, 0.45], [1, 0], Extrapolation.CLAMP),
      transform: [
        {
          translateY: interpolate(keyboardProgress.value, [0, 1], [0, -22], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const animatedBrandStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(keyboardProgress.value, [0, 0.4], [1, 0], Extrapolation.CLAMP),
      transform: [
        {
          scale: interpolate(keyboardProgress.value, [0, 0.4], [1, 0.85], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const animatedCollapsedTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(keyboardProgress.value, [0.45, 1], [0, 1], Extrapolation.CLAMP),
      transform: [
        {
          translateY: interpolate(keyboardProgress.value, [0.45, 1], [10, 0], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const animatedDismissStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(keyboardProgress.value, [0.5, 1], [0, 1], Extrapolation.CLAMP),
      transform: [
        {
          scale: interpolate(keyboardProgress.value, [0.5, 1], [0.85, 1], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const animatedSheetContainerStyle = useAnimatedStyle(() => {
    return {
      flex: 1,
      paddingBottom: Platform.OS === 'ios' ? keyboardHeight.value : 0,
    };
  });

  const animatedSheetStyle = useAnimatedStyle(() => {
    const topRadius = interpolate(
      keyboardProgress.value,
      [0, 1],
      [Radius.sheet, Radius.xl],
      Extrapolation.CLAMP
    );
    return {
      borderTopLeftRadius: topRadius,
      borderTopRightRadius: topRadius,
    };
  });

  return (
    <AuthContext.Provider value={contextValue}>
      <View style={styles.root}>
        <Animated.View
          style={[styles.hero, { paddingTop: insets.top }, animatedHeroStyle]}
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

            <View style={styles.topBarCenter}>
              <Animated.View
                style={[styles.brandWrap, animatedBrandStyle]}
                pointerEvents={isKeyboardOpen ? 'none' : 'auto'}
              >
                {showBrand ? <AuthBrandMark compact light /> : null}
              </Animated.View>

              <Animated.View
                style={[styles.titleWrap, animatedCollapsedTitleStyle]}
                pointerEvents="none"
              >
                <Text style={styles.collapsedTitle} numberOfLines={1}>
                  {title}
                </Text>
              </Animated.View>
            </View>

            <View style={styles.backBtnSpacer}>
              <Animated.View
                style={[StyleSheet.absoluteFill, styles.centerAll, animatedDismissStyle]}
                pointerEvents={isKeyboardOpen ? 'auto' : 'none'}
              >
                <Pressable
                  onPress={Keyboard.dismiss}
                  style={({ pressed }) => [styles.dismissBtn, pressed && styles.dismissBtnPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Close keyboard"
                  hitSlop={8}
                >
                  <Ionicons name="chevron-down" size={20} color={Colors.white} />
                </Pressable>
              </Animated.View>
            </View>
          </View>

          <Animated.View
            style={[styles.heroCopy, animatedHeroCopyStyle]}
            pointerEvents={isKeyboardOpen ? 'none' : 'auto'}
          >
            {caption ? (
              <View style={styles.captionPill}>
                <Text style={styles.caption}>{caption}</Text>
              </View>
            ) : null}
            <Text style={styles.heroTitle}>{title}</Text>
          </Animated.View>
        </Animated.View>

        <Animated.View style={animatedSheetContainerStyle}>
          <Animated.View style={[styles.sheet, { backgroundColor: colors.card }, animatedSheetStyle]}>
            <Pressable onPress={Keyboard.dismiss} accessible={false} hitSlop={12}>
              <View
                style={styles.handle}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
            </Pressable>

            <ScrollView
              ref={scrollRef}
              style={styles.flex}
              contentContainerStyle={[
                styles.scroll,
                { paddingBottom: Math.max(insets.bottom, Spacing.md) + Spacing.xl },
              ]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              showsVerticalScrollIndicator={false}
              bounces={true}
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
                {subtitle ? (
                  <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>
                ) : null}
                <View style={styles.body}>{children}</View>
                {footer ? <View style={styles.footer}>{footer}</View> : null}
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </View>
    </AuthContext.Provider>
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
    zIndex: 2,
  },
  topBarCenter: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: Spacing.xs,
  },
  brandWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedTitle: {
    fontFamily: AuthFonts.displayBold,
    fontSize: 16,
    color: Colors.white,
    letterSpacing: -0.2,
  },
  centerAll: {
    alignItems: 'center',
    justifyContent: 'center',
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
  dismissBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  dismissBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  backBtnSpacer: {
    width: 42,
    height: 42,
    position: 'relative',
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
    marginTop: -20,
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    overflow: 'hidden',
    ...Shadows.card,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.xs,
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
