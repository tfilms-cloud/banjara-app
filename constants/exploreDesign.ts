import { useHomeDesign } from '@/constants/homeDesign';
import { useUserStore } from '@/store/userStore';

/** Explore accents from Figma 1:1554; the requested white page uses the Home foundation. */
export function useExploreDesign() {
  const base = useHomeDesign();
  const dark = useUserStore((state) => state.settings.darkMode);
  return {
    ...base,
    accent: dark ? base.soft : '#99e6dc',
    coral: dark ? base.coral : '#FF6B4A',
    positive: dark ? '#86DBB1' : '#147D53',
    positiveSoft: dark ? '#163D30' : '#E8F6EE',
  };
}
