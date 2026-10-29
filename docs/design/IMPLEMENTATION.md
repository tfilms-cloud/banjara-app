# Customer UI implementation

The explicit brief in REDESIGN-BRIEF.md takes precedence over DESIGN-reference.md.
Only home.png was supplied. The other four screens use the same visual system;
they cannot be compared with missing reference images. API data, routes and
booking/payment rules remain owned by the existing code.

## Step 1 — shared controls

- Added darker teal, coral, accessible coral text, media overlays and size/type tokens.
- Softer shared shadows; round buttons/badges; Outfit screen titles.
- Preserved all existing props and exports. See SHARED-CONSUMERS.md for the
  inventory recorded before editing.
- Added the missing Expo ESLint setup and a TypeScript resolver for the Windows
  workspace path. Existing findings are explicitly recorded in LINT-BASELINE.md
  and eslint-suppressions.json, rather than changing unrelated application logic.
- Checks: TypeScript passes; Expo lint checked against that existing baseline.
- Expo Go visual/device checks are still required; no phone testing is claimed.

## Step 2 — Home

Changed Home route, HomeHeroHeader, CustomerHeader, SearchCard, HomeSection, TripCard and Size tokens. Added three disabled optional preview components (HomeStories, RoadStatusChip, HomeHelpButton). Search now overlaps the hero by 28 and remains available in the Transport available-rides view; all existing handlers and data-driven sections remain. Prices are green; urgency is coral. TypeScript passed; Expo lint: 0 new errors against baseline, 60 warnings. The reference social feed is not fabricated: existing real inspiration content is retained. No phone testing.

## Step 3 — Explore

Changed search.tsx, ExplorePanels, ThumbnailGrid; added useThemedStyles. Home header and exact service categories are reused. Four-column sizing, 8px gaps, filters, live hint, refresh and suggestions are preserved. Tile radius is 16 and labels have extra line height. TypeScript passed; Expo lint: 0 new errors against baseline, 60 warnings. No Explore reference image supplied; no phone test.
