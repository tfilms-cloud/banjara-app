import { useThemeColors } from '@/constants/colors';
import { useHomeDesign } from '@/constants/homeDesign';
import { useUserStore } from '@/store/userStore';

/** Property-detail accents from Figma 79:2, layered over the shared travel foundation. */
export function useHotelDesign() {
  const theme = useHomeDesign();
  const colors = useThemeColors();
  const dark = useUserStore((state) => state.settings.darkMode);
  return {
    ...theme,
    action: colors.action,
    onAction: '#FFFFFF',
    neutral: dark ? theme.field : '#f4f6f9',
    typeFill: dark ? colors.softAmber : '#FFF7E9',
    typeText: dark ? colors.warning : '#AA6524',
  };
}
