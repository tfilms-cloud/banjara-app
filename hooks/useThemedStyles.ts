import { useMemo } from 'react';
import { useThemeColors, type ColorTokens } from '@/constants/colors';

/** Rebuild styles when the theme changes, including styles with color tokens. */
export function useThemedStyles<T>(factory: (colors: ColorTokens) => T): T {
  const colors = useThemeColors();
  return useMemo(() => factory(colors), [factory, colors]);
}
