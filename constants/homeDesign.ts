import { useUserStore } from '@/store/userStore';

/** Approved Home palette. Kept local until the remaining screens are migrated. */
const light = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  field: '#F1F5F9',
  text: '#1C1917',
  muted: '#57534E',
  primary: '#0F9B98',
  /** Filled buttons and active tabs. `primary` stays teal for links and text accents. */
  action: '#16B364',
  soft: '#CCFBF1',
  border: '#E2E8F0',
  coral: '#FF6B6B',
  coralSoft: '#FFE5E5',
};
const dark: typeof light = {
  background: '#101C21',
  surface: '#1B2B31',
  field: '#24363B',
  text: '#f2f5f9',
  muted: '#9cacc0',
  primary: '#99e6dc',
  action: '#16B364',
  soft: '#193F40',
  border: '#30464B',
  coral: '#FFAA96',
  coralSoft: '#50342E',
};
export function useHomeDesign() {
  return useUserStore((state) => state.settings.darkMode) ? dark : light;
}
