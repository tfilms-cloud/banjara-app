import { useThemeColors } from '@/constants/colors';

export function useThemedStackOptions(animation: 'slide_from_right' | 'fade' = 'slide_from_right') {
  const colors = useThemeColors();
  return {
    headerShown: false as const,
    contentStyle: { backgroundColor: colors.background },
    animation,
  };
}
