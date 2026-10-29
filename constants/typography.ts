import { DarkColors, LightColors, type ColorTokens } from '@/constants/colors';
import { useUserStore } from '@/store/userStore';
import { getCachedDarkMode } from '@/utils/themeModeCache';

/** Outfit = headings · Plus Jakarta Sans = UI body */
export const Fonts = {
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
  display: 'Outfit_600SemiBold',
  displayBold: 'Outfit_700Bold',
  secondary: 'PlusJakartaSans_400Regular',
  secondaryMedium: 'PlusJakartaSans_500Medium',
  secondarySemiBold: 'PlusJakartaSans_600SemiBold',
} as const;

export const AuthFonts = {
  display: Fonts.display,
  displayBold: Fonts.displayBold,
  body: Fonts.body,
  bodyMedium: Fonts.bodyMedium,
  bodySemiBold: Fonts.bodySemiBold,
  bodyBold: Fonts.bodyBold,
} as const;

/** Customer typography scale; compact labels still allow English/Urdu wrapping. */
export const TypeSize = {
  tiny: 9, overline: 10, micro: 11, caption: 12, label: 13,
  body: 14, medium: 15, card: 16, subtitle: 18, section: 19,
  title: 20, heading: 22, hero: 24, display: 26,
} as const;

export const Leading = {
  compact: 16, caption: 18, body: 20, card: 22,
  title: 24, section: 26, hero: 30, display: 32,
} as const;

export const CustomerType = {
  hero: { fontFamily: Fonts.displayBold, fontSize: 24, lineHeight: 32 },
  section: { fontFamily: Fonts.display, fontSize: 19, lineHeight: 26 },
  card: { fontFamily: Fonts.display, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: Fonts.body, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: Fonts.bodySemiBold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: Fonts.bodyMedium, fontSize: 12, lineHeight: 18 },
  micro: { fontFamily: Fonts.bodyMedium, fontSize: 11, lineHeight: 16 },
} as const;

function makeTypography(c: ColorTokens) {
  return {
    display: {
      fontFamily: Fonts.display,
      fontSize: 36,
      lineHeight: 42,
      letterSpacing: -0.4,
      color: c.dark,
    },
    hero: {
      fontFamily: Fonts.display,
      fontSize: 32,
      lineHeight: 38,
      letterSpacing: -0.3,
      color: c.dark,
    },
    brand: {
      fontFamily: Fonts.display,
      fontSize: 22,
      letterSpacing: 0.4,
      color: c.primary,
    },
    h1: {
      fontFamily: Fonts.display,
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: -0.3,
      color: c.dark,
    },
    h2: {
      fontFamily: Fonts.display,
      fontSize: 22,
      lineHeight: 28,
      letterSpacing: -0.2,
      color: c.dark,
    },
    h3: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 17,
      lineHeight: 24,
      color: c.dark,
    },
    section: {
      fontFamily: Fonts.display,
      fontSize: 22,
      lineHeight: 28,
      color: c.dark,
    },
    cardTitle: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 16,
      lineHeight: 22,
      color: c.dark,
    },
    bodyLarge: {
      fontFamily: Fonts.body,
      fontSize: 16,
      lineHeight: 24,
      color: c.dark,
    },
    body: {
      fontFamily: Fonts.body,
      fontSize: 15,
      lineHeight: 22,
      color: c.dark,
    },
    bodyBold: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 15,
      lineHeight: 22,
      color: c.dark,
    },
    bodySmall: {
      fontFamily: Fonts.body,
      fontSize: 13,
      lineHeight: 18,
      color: c.muted,
    },
    caption: {
      fontFamily: Fonts.body,
      fontSize: 13,
      lineHeight: 18,
      color: c.muted,
    },
    small: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: c.muted,
    },
    label: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 11,
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
      color: c.muted,
    },
    button: {
      fontFamily: Fonts.body,
      fontSize: 14,
    },
    price: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 20,
      color: c.dark,
    },
  };
}

const darkTypography = makeTypography(DarkColors);
const lightTypography = makeTypography(LightColors);

export type TypographyScale = typeof lightTypography;

/** Follows the active light/dark setting when read during render. */
export const Typography: TypographyScale = new Proxy(lightTypography, {
  get(_target, prop) {
    const source = getCachedDarkMode() ? darkTypography : lightTypography;
    return source[prop as keyof TypographyScale];
  },
});

export const Brand = {
  name: 'BANJARA',
  tagline: 'Your Journey. Your Seat. Your Way.',
  description:
    'Discover vans, buses, private trips, and stays — then book with confidence.',
} as const;
