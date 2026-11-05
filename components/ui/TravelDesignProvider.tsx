import { createContext, useContext, type ReactNode } from 'react';
import { useThemeColors, type ColorTokens } from '@/constants/colors';
import { useHomeDesign } from '@/constants/homeDesign';

const TravelDesignContext = createContext(false);

/** Opt in a screen's existing feature components without restyling other pages. */
export function TravelDesignProvider({ children }: { children: ReactNode }) {
  return <TravelDesignContext.Provider value={true}>{children}</TravelDesignContext.Provider>;
}

export function useTravelPresentation() {
  return useContext(TravelDesignContext);
}

export function usePresentationColors(): ColorTokens {
  const enabled = useTravelPresentation();
  const colors = useThemeColors();
  const theme = useHomeDesign();
  if (!enabled) return colors;
  return {
    ...colors,
    primary: theme.primary,
    primarySoft: theme.soft,
    action: theme.primary,
    actionSoft: theme.soft,
    dark: theme.text,
    secondaryDark: theme.text,
    muted: theme.muted,
    mutedLight: theme.muted,
    background: theme.background,
    card: theme.surface,
    elevated: theme.surface,
    inputBg: theme.field,
    surfaceSecondary: theme.field,
    border: theme.border,
  };
}
