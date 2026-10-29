export const Spacing = {
  hairline: 1,
  xxs: 2,
  tight: 3,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  screen: 16,
  hero: 20,
  section: 24,
  sectionContent: 12,
  overlap: 28,
  micro: 6,
  badge: 5,
  control: 10,
} as const;

export const Radius = {
  tail: 6,
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20,
  '2xl': 20,
  '3xl': 24,
  hero: 28,
  sheet: 32,
  full: 999,
} as const;

export const Shadows = {
  premium: {
    shadowColor: '#08111F',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  soft: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  float: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
} as const;

/** Shared control/media dimensions for the customer redesign. */
export const Size = {
  iconTiny: 10, iconXs: 12, iconSmall: 14, iconDetail: 15,
  iconSm: 16, iconMd: 18, icon: 20, iconLg: 22, iconHero: 28,
  touch: 44, button: 48, avatar: 52, avatarSmall: 34,
  badgeDot: 6, photoDot: 7, sideSlot: 44,
  category: 76, minimumContent: 280,
  benefit: 100, destination: 172, destinationHeight: 218, destinationFeatured: 230,
  avatarRing: 36, profileAvatar: 72, thumbSmall: 56,
  compactControl: 40, row: 64, field: 46, badge: 26,
  photoSmall: 120, vehiclePhoto: 160, storyPhoto: 180,
  storyCard: 260, blogCard: 268, testimonialCard: 300,
  compactCard: 320, modal: 360, footerClearance: 118,
  hero: 220, tripHero: 260, map: 240, thumbnail: 68,
  border: 1, borderStrong: 1.5, borderActive: 2,
} as const;
