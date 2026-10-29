# Banjara UI redesign — step 1

Applied to the Agency profile and Provider Dashboard on 25 October 2026.

## What changed

- Profile: provider identity before an inset, rounded vehicle hero; larger section headings; driver, fleet, service area and contact cards; green fares; restrained shadows. Saved provider photography is used, with existing missing-image fallbacks.
- Service areas: green region dots and a small endpoint map when a listed trip has saved coordinates. No route geometry or location is invented. Existing pickup/drop-off lists remain.
- Contact: existing phone/email/website actions in wrapping tiles, followed by selectable contact values. A phone number alone does not establish WhatsApp availability.
- Dashboard: white/themed statistic cards, clear numerical hierarchy, status-colored accents, roomier section cards and trip-capacity typography. Service-specific dashboard variants benefit from the shared stat/chart components.
- A new opt-in Shadows.premium token uses 0.055 opacity, 12-unit blur and elevation 1. Existing global shadow tokens are unchanged.
- APIs, backend, data persistence, signup gates, booking actions and navigation destinations are unchanged.

## Exact changes

[Open the exact patch](UI-REDESIGN-STEP-1.patch). It contains only the changes from this step, compared with a local snapshot taken immediately before the redesign. **These changes are already applied in this workspace; do not apply the patch again here.**

The patch includes JSX/layout changes and imports. The complete current StyleSheet definitions below are provided for direct inspection. Keep the existing component behavior above each StyleSheet; use the full source links or patch when copying changes to another checkout.

## Files and current styles

### constants/spacing.ts

[Open full updated source](<constants/spacing.ts>).

```tsx
export const Spacing = {
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
} as const;

export const Radius = {
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
    shadowOpacity: 0.055,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  soft: {
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  float: {
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
} as const;

```

### components/agency/ContactCard.tsx

[Open full updated source](<components/agency/ContactCard.tsx>).

```tsx
const styles = StyleSheet.create({
  section: { marginTop: Spacing.xl, gap: Spacing.sm },
  title: {
    fontFamily: Fonts.display,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.xl,
    ...Shadows.premium,
  },
  location: { padding: Spacing.xl, gap: Spacing.md },
  locationHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  locationTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    lineHeight: 26,
    writingDirection: 'auto',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  flex: { flex: 1, minWidth: 0 },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    lineHeight: 18,
    letterSpacing: 0.3,
  },
  address: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 26,
    writingDirection: 'auto',
  },
  value: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 24,
    writingDirection: 'auto',
    flexShrink: 1,
  },
  mapButton: {
    minHeight: 48,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mapText: { fontFamily: Fonts.bodySemiBold, fontSize: 12, flex: 1 },
  hint: { fontFamily: Fonts.body, fontSize: 11, lineHeight: 18 },
  method: {
    flexGrow: 1,
    flexBasis: '28%',
    minWidth: 80,
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    alignItems: 'center',
    minHeight: 110,
  },
  actionText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    lineHeight: 20,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  methods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  contactDetails: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  methodCopy: { alignItems: 'center', width: '100%' },
});
```

### components/agency/DriverCard.tsx

[Open full updated source](<components/agency/DriverCard.tsx>).

```tsx
const styles = StyleSheet.create({
  section: { marginTop: Spacing.xl },
  heading: {
    fontFamily: Fonts.display,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
    marginBottom: Spacing.md,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    ...Shadows.premium,
  },
  portrait: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    flexShrink: 0,
  },
  photo: { width: 88, height: 88 },
  details: { flex: 1, minWidth: 0, gap: Spacing.xs },
  role: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    lineHeight: 18,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  name: {
    fontFamily: Fonts.display,
    fontSize: 23,
    lineHeight: 32,
    writingDirection: 'auto',
  },
  experience: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  caption: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 22, flex: 1 },
});
```

### components/agency/FleetPricingCard.tsx

[Open full updated source](<components/agency/FleetPricingCard.tsx>).

```tsx
const styles = StyleSheet.create({
  section: { marginTop: Spacing.xl, gap: Spacing.sm },
  title: {
    fontFamily: Fonts.display,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.xl,
    ...Shadows.premium,
  },
  vehicleSection: { padding: Spacing.xl, gap: Spacing.lg },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehiclePhoto: {
    width: 96,
    height: 88,
    borderRadius: Radius.lg,
    flexShrink: 0,
  },
  flex: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    letterSpacing: 0.7,
    lineHeight: 16,
  },
  vehicleTitle: { fontFamily: Fonts.display, fontSize: 22, lineHeight: 30 },
  caption: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 20 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  fact: {
    flexBasis: '45%',
    flexGrow: 1,
    minWidth: 110,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  factLabel: { fontFamily: Fonts.bodyMedium, fontSize: 11, lineHeight: 18 },
  factValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 23,
    writingDirection: 'auto',
  },
  types: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: {
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 9,
    maxWidth: '100%',
  },
  chipText: { fontFamily: Fonts.bodyMedium, fontSize: 11, flexShrink: 1 },
  insurance: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  insuranceTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 2,
  },
  pricing: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  pricingHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pricingTitle: { fontFamily: Fonts.bodyBold, fontSize: 14, lineHeight: 22 },
  rate: { gap: 5 },
  priceLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: 7,
  },
  price: {
    fontFamily: Fonts.displayBold,
    fontSize: 30,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  priceUnit: { fontFamily: Fonts.bodyMedium, fontSize: 13 },
  explanation: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 20 },
  tripFares: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    gap: 5,
  },
  tripFare: { fontFamily: Fonts.bodySemiBold, fontSize: 16, lineHeight: 26 },
  fareUnit: { fontFamily: Fonts.body, fontSize: 12 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  noteText: { flex: 1, fontFamily: Fonts.body, fontSize: 11, lineHeight: 18 },
  cta: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  ctaText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, flexShrink: 1 },
});
```

### components/agency/ServiceArea.tsx

[Open full updated source](<components/agency/ServiceArea.tsx>).

```tsx
const styles = StyleSheet.create({
  section: { gap: Spacing.md, marginTop: Spacing.xl },
  intro: { gap: 6 },
  title: {
    fontFamily: Fonts.display,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  description: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 22 },
  coverage: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  coverageRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  mapPreview: { flex: 1, minWidth: 0, gap: Spacing.xs },
  mapCaption: {
    fontFamily: Fonts.body,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
  },
  coverageTitle: { fontFamily: Fonts.bodyMedium, fontSize: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    maxWidth: '100%',
  },
  chipLabel: { fontFamily: Fonts.bodyMedium, fontSize: 12, flexShrink: 1 },
  listLabel: { fontFamily: Fonts.bodyMedium, fontSize: 12, marginTop: 4 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.xl,
    ...Shadows.premium,
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  routeLabel: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  routeNumber: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  stopCount: { fontFamily: Fonts.bodySemiBold, fontSize: 11 },
  cardBody: { padding: Spacing.xl },
  journeyRow: { flexDirection: 'row', gap: 12 },
  rail: { width: 32, alignItems: 'center' },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    flex: 1,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    minHeight: 20,
    marginVertical: 5,
  },
  stopContent: { flex: 1, minWidth: 0, paddingTop: 1 },
  connectedContent: { paddingBottom: 22 },
  eyebrow: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    letterSpacing: 0.6,
    lineHeight: 16,
  },
  city: {
    fontFamily: Fonts.display,
    fontSize: 21,
    lineHeight: 30,
    writingDirection: 'auto',
    marginTop: Spacing.xs,
  },
  places: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  placeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  stopNumber: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    lineHeight: 22,
    minWidth: 17,
  },
  placeName: {
    flex: 1,
    minWidth: 0,
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 24,
    writingDirection: 'auto',
  },
  missing: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 44,
  },
  moreText: { fontFamily: Fonts.bodySemiBold, fontSize: 12, flexShrink: 1 },
  unassigned: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 16,
  },
  compactRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, minWidth: 0 },
  pending: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  pendingTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 3,
  },
  caption: { fontFamily: Fonts.body, fontSize: 11, lineHeight: 18 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  noteTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 3,
  },
});
```

### app/(customer)/agency/[id].tsx

[Open full updated source](<app/(customer)/agency/[id].tsx>).

```tsx
const styles = StyleSheet.create({
  container: { flex: 1 },
  bannerFallback: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  content: { padding: Spacing.screen, gap: Spacing.md },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
  },
  name: {
    fontFamily: Fonts.displayBold,
    fontSize: 30,
    lineHeight: 40,
    letterSpacing: -0.6,
    writingDirection: 'auto',
  },
  metaMuted: {
    fontFamily: Fonts.body,
    fontSize: 13,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  locationText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 24,
    writingDirection: 'auto',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  actionLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    ...Shadows.premium,
  },
  statCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: Spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  statValue: {
    fontFamily: Fonts.displayBold,
    fontSize: 20,
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
    marginTop: Spacing.xl,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  pricePill: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  cardBlock: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.premium,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  infoValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    marginTop: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  chipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },
  listBlock: { gap: 4 },
  listLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    marginBottom: 2,
  },
  listItem: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 20,
  },
  tripList: { gap: Spacing.md },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  packageCover: {
    width: 84,
    height: 84,
    borderRadius: Radius.lg,
    backgroundColor: Colors.softBlue,
  },
  packageBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  packageType: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  packageTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
  },
  packageMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  packagePrice: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    marginTop: 2,
  },
  routeList: { gap: Spacing.sm },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  routeIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeFrom: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  routeTo: {
    fontFamily: Fonts.body,
    fontSize: 13,
    marginTop: 1,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  galleryTile: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  galleryFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing['2xl'],
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  galleryModal: {
    flex: 1,
    backgroundColor: 'rgba(11, 31, 51, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  galleryClose: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.white,
  },
  reviewList: { gap: Spacing.md },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  reviewName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
  },
  reviewDate: {
    ...Typography.small,
    marginTop: 2,
  },
  reviewComment: {
    ...Typography.body,
    lineHeight: 22,
  },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.lg,
    ...Shadows.premium,
  },
  ctaLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  ctaPrice: { fontFamily: Fonts.displayBold, fontSize: 21, lineHeight: 28 },
  ctaButton: {
    minWidth: 120,
  },
  heroFrame: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSecondary,
  },
  identity: { gap: Spacing.md, paddingTop: Spacing.sm },
});
```

### app/(provider)/(tabs)/index.tsx

[Open full updated source](<app/(provider)/(tabs)/index.tsx>).

```tsx
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  greeting: {
    fontFamily: Fonts.display,
    fontSize: 26,
    lineHeight: 36,
    letterSpacing: -0.4,
    color: Colors.dark,
    writingDirection: 'auto',
  },
  business: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 22,
    color: Colors.muted,
    marginTop: Spacing.xs,
  },
  heading: { ...Typography.h2, color: Colors.dark },
  sub: { ...Typography.body, color: Colors.muted },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.premium,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 21,
    lineHeight: 29,
    color: Colors.dark,
    flexShrink: 1,
  },
  sectionSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 21,
    color: Colors.muted,
  },
  link: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.primary,
  },
  lockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    backgroundColor: Colors.softDanger,
  },
  lockText: {
    flex: 1,
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.danger,
    lineHeight: 18,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  requestTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 23,
    color: Colors.dark,
    writingDirection: 'auto',
  },
  requestMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 20,
    color: Colors.muted,
    marginTop: Spacing.xs,
  },
  requestAmount: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.action,
  },
  reviewCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceSecondary,
    gap: Spacing.sm,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  reviewBody: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.dark,
    lineHeight: 24,
    writingDirection: 'auto',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  routeRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeRankText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.primary,
  },
});
```

### components/provider/ProviderStatCard.tsx

[Open full updated source](<components/provider/ProviderStatCard.tsx>).

```tsx
const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: '45%',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
    ...Shadows.premium,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dot: { width: 6, height: 6, borderRadius: Radius.full },
  value: {
    fontFamily: Fonts.display,
    fontSize: 28,
    lineHeight: 38,
    letterSpacing: -0.5,
    writingDirection: 'auto',
  },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 20,
    flex: 1,
  },
});
```

### components/provider/SimpleBarChart.tsx

[Open full updated source](<components/provider/SimpleBarChart.tsx>).

```tsx
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    gap: Spacing.lg,
    ...Shadows.premium,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 21,
    lineHeight: 29,
    color: Colors.dark,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    minHeight: 140,
  },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: {
    height: 110,
    width: '100%',
    justifyContent: 'flex-end',
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderTopLeftRadius: Radius.sm,
    borderTopRightRadius: Radius.sm,
  },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    lineHeight: 18,
    color: Colors.muted,
  },
  value: { ...Typography.small, color: Colors.primary, fontSize: 10 },
  hint: { ...Typography.caption, color: Colors.muted },
});
```

### components/provider/InventoryCapacityCard.tsx

[Open full updated source](<components/provider/InventoryCapacityCard.tsx>).

```tsx
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 25,
    color: Colors.dark,
    writingDirection: 'auto',
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 20,
    color: Colors.muted,
    marginTop: Spacing.xs,
  },
  statusPill: {
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  metricWrap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: Colors.border,
  },
  metric: { flex: 1, alignItems: 'center', gap: 2 },
  metricValue: {
    fontFamily: Fonts.display,
    fontSize: 23,
    lineHeight: 32,
    color: Colors.dark,
  },
  metricLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    lineHeight: 18,
    color: Colors.muted,
    textAlign: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.inputBg,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  fillLabel: { ...Typography.small, color: Colors.muted, flex: 1 },
  trailing: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.primary,
  },
});
```

### components/hotels/HotelImageGallery.tsx

[Open full updated source](<components/hotels/HotelImageGallery.tsx>).

```tsx
const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: Colors.softBlue,
    overflow: 'hidden',
  },
  fav: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
  },
  dots: {
    position: 'absolute',
    bottom: Spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    backgroundColor: Colors.card,
    width: 16,
    borderRadius: Radius.full,
  },
});
```

## Verification

- TypeScript: npm run typecheck.
- Existing presentation/onboarding regression checks: 31 passed.
- Both iOS and Android Expo Go bundles compiled through Metro.
- Phone visual review remains necessary: light/dark mode, long English/Urdu values, contact tile wrapping, hero swipe width, endpoint map loading and bottom booking bar. Bundle compilation alone cannot verify native appearance.
