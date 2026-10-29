import { useUserStore } from '@/store/userStore';
import { getCachedDarkMode } from '@/utils/themeModeCache';

/**
 * BANJARA design tokens — dark-first travel marketplace with a full light theme.
 * Use `useThemeColors()` in components. `Colors` follows the live Appearance setting.
 */
export type ColorTokens = {
  primary: string;
  primaryDark: string;
  primarySoft: string;
  action: string;
  actionDark: string;
  actionSoft: string;
  dark: string;
  secondaryDark: string;
  muted: string;
  mutedLight: string;
  background: string;
  surfaceSecondary: string;
  elevated: string;
  card: string;
  white: string;
  border: string;
  success: string;
  softGreen: string;
  warning: string;
  softAmber: string;
  danger: string;
  softDanger: string;
  accent: string;
  overlay: string;
  seatAvailable: string;
  seatSelected: string;
  seatOccupied: string;
  seatReserved: string;
  secondary: string;
  softBlue: string;
  softNavy: string;
  filterBg: string;
  filterText: string;
  inputBg: string;
  info: string;
};

export const DarkColors: ColorTokens = {
  primary: '#0F9B98',
  primaryDark: '#08111F',
  primarySoft: '#123A3D',

  action: '#16B364',
  actionDark: '#128A4C',
  actionSoft: '#123D2A',

  dark: '#F8FAFC',
  secondaryDark: '#F8FAFC',
  muted: '#A7B3C5',
  mutedLight: '#718096',

  background: '#0B1424',
  surfaceSecondary: '#142033',
  elevated: '#203047',
  card: '#18263A',
  white: '#FFFFFF',

  border: '#26364B',

  success: '#16B364',
  softGreen: '#123D2A',
  warning: '#F5B83D',
  softAmber: '#3D3014',
  danger: '#EF4444',
  softDanger: '#3F1D24',

  accent: '#FF6B6B',

  overlay: 'rgba(8, 17, 31, 0.64)',

  seatAvailable: '#203047',
  seatSelected: '#16B364',
  seatOccupied: '#26364B',
  seatReserved: '#123A3D',

  secondary: '#16B364',
  softBlue: '#123A3D',
  softNavy: '#08111F',

  filterBg: '#123A3D',
  filterText: '#19C3BC',
  inputBg: '#142237',
  info: '#19C3BC',
};

export const LightColors: ColorTokens = {
  primary: '#0F9B98',
  primaryDark: '#1C1917',
  primarySoft: '#CCFBF1',

  action: '#16B364',
  actionDark: '#128A4C',
  actionSoft: '#DCFCE7',

  dark: '#1C1917',
  secondaryDark: '#1C1917',
  muted: '#57534E',
  mutedLight: '#78716C',

  background: '#F8FAFC',
  surfaceSecondary: '#F1F5F9',
  elevated: '#FFFFFF',
  card: '#FFFFFF',
  white: '#FFFFFF',

  border: '#E2E8F0',

  success: '#16B364',
  softGreen: '#DCFCE7',
  warning: '#F5B83D',
  softAmber: '#FEF3C7',
  danger: '#EF4444',
  softDanger: '#FEE2E2',

  accent: '#FF6B6B',

  overlay: 'rgba(28, 25, 23, 0.52)',

  seatAvailable: '#FFFFFF',
  seatSelected: '#16B364',
  seatOccupied: '#E2E8F0',
  seatReserved: '#CCFBF1',

  secondary: '#16B364',
  softBlue: '#CCFBF1',
  softNavy: '#1C1917',

  filterBg: '#CCFBF1',
  filterText: '#0F9B98',
  inputBg: '#F1F5F9',
  info: '#0F9B98',
};

/**
 * Live color tokens. `themedStyleSheet` remaps StyleSheet.create snapshots;
 * this proxy keeps JSX `Colors.x` on the active light/dark setting.
 */
export const Colors: ColorTokens = new Proxy(LightColors, {
  get(_target, prop) {
    if (typeof prop !== 'string' || !(prop in LightColors)) {
      return Reflect.get(LightColors, prop as keyof ColorTokens);
    }
    return (getCachedDarkMode() ? DarkColors : LightColors)[prop as keyof ColorTokens];
  },
  ownKeys: () => Reflect.ownKeys(LightColors),
  getOwnPropertyDescriptor(_target, prop) {
    const desc = Reflect.getOwnPropertyDescriptor(LightColors, prop);
    return desc ? { ...desc, configurable: true } : desc;
  },
});

export type ColorKey = keyof ColorTokens;

export function getThemeColors(darkMode: boolean): ColorTokens {
  return darkMode ? DarkColors : LightColors;
}

export function useThemeColors(): ColorTokens {
  const darkMode = useUserStore((state) => state.settings.darkMode);
  return darkMode ? DarkColors : LightColors;
}

export function useIsDarkMode(): boolean {
  return useUserStore((state) => state.settings.darkMode);
}
