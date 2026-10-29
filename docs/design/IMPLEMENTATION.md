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

## Step 4 — Bookings

Changed bookings.tsx, BookingCard, HotelBookingCard, PackageBookingCard and GuideBookingCard. Round teal status/filter controls, softer cards, Outfit titles, green prices, wrapping actions and separate code/status rows. Theme-dependent styles now update with the theme. Every payment/ticket condition, filter, newest-first merge, loading/error branch and navigation target is preserved. TypeScript passed; Expo lint: 0 new errors against baseline, 60 warnings. No Bookings reference image supplied; no phone test.

## Step 5 — Messages

Changed ConversationListScreen, ConversationRow, ChatThread, MessageBubble, MessageComposer and ChatProfilePreview. Round search with icon, 52px avatars, soft unread cards, teal pills/bubbles, lighter incoming cards and theme-derived styles. Local search, connection text, typing, pagination, attachments, retry, receipts and keyboard handling remain. No chatStore/socket edits. TypeScript passed; Expo lint: 0 new errors against baseline, 60 warnings. No Messages reference image supplied; no phone test.

## Step 6 — Trip Details

Changed trip/[id].tsx, TripRouteTimeline, VehicleCard, AgencyCard and JourneyTypePanel. Rounded vehicle-photo hero, clearer summary/facts, Outfit section headings, softer route/provider/vehicle cards, green prices and a flexible fixed booking bar. Theme-derived styles update on theme changes. Availability guards, setTrip handoff, map preview, image fallback/dots, capacity and available-seat distinctions, reviews and price wording remain. No floating gear was added or found in this screen. TypeScript passed; Expo lint: 0 new errors against baseline, 60 warnings. No Trip Details reference image supplied; no phone test.

## Exact file inventory by completed step

### 7c52e26 redesign: shared UI tokens and controls

- `.gitignore`
- `components/navigation/ScreenHeader.tsx`
- `components/ui/Badge.tsx`
- `components/ui/Button.tsx`
- `constants/colors.ts`
- `constants/spacing.ts`
- `constants/typography.ts`
- `docs/design/BOOKINGS-UI-README.md`
- `docs/design/DESIGN-reference.md`
- `docs/design/EXPLORE-UI-README.md`
- `docs/design/HOME-UI-README.md`
- `docs/design/IMPLEMENTATION.md`
- `docs/design/LINT-BASELINE.md`
- `docs/design/MESSAGES-UI-README.md`
- `docs/design/REDESIGN-BRIEF.md`
- `docs/design/SHARED-CONSUMERS.md`
- `docs/design/TRIP-DETAILS-UI-README.md`
- `docs/design/home.png`
- `eslint-suppressions.json`
- `eslint.config.js`
- `package-lock.json`
- `package.json`
- `scripts/eslint-resolver.cjs`

### b636d65 redesign: home

- `app/(customer)/(tabs)/index.tsx`
- `components/travel/CustomerHeader.tsx`
- `components/travel/HomeHelpButton.tsx`
- `components/travel/HomeHeroHeader.tsx`
- `components/travel/HomeSection.tsx`
- `components/travel/HomeStories.tsx`
- `components/travel/RoadStatusChip.tsx`
- `components/travel/SearchCard.tsx`
- `components/trip/TripCard.tsx`
- `constants/spacing.ts`
- `docs/design/IMPLEMENTATION.md`

### fb5c170 redesign: explore

- `app/(customer)/(tabs)/search.tsx`
- `components/explore/ExplorePanels.tsx`
- `components/explore/ThumbnailGrid.tsx`
- `docs/design/IMPLEMENTATION.md`
- `hooks/useThemedStyles.ts`

### c365359 redesign: bookings

- `app/(customer)/(tabs)/bookings.tsx`
- `components/booking/BookingCard.tsx`
- `components/booking/GuideBookingCard.tsx`
- `components/booking/PackageBookingCard.tsx`
- `components/hotels/HotelBookingCard.tsx`
- `docs/design/IMPLEMENTATION.md`

### 522f5a2 redesign: messages

- `components/chat/ChatProfilePreview.tsx`
- `components/chat/ChatThread.tsx`
- `components/chat/ConversationListScreen.tsx`
- `components/chat/ConversationRow.tsx`
- `components/chat/MessageBubble.tsx`
- `components/chat/MessageComposer.tsx`
- `docs/design/IMPLEMENTATION.md`

### 4f358c4 redesign: trip details

- `app/(customer)/trip/[id].tsx`
- `components/trip/AgencyCard.tsx`
- `components/trip/JourneyTypePanel.tsx`
- `components/trip/TripRouteTimeline.tsx`
- `components/trip/VehicleCard.tsx`
- `docs/design/IMPLEMENTATION.md`

## Step 7 — consistency and final verification

- Updated the five screen families and shared controls to use the same size, type, radius and color tokens; removed unused local styles after extracting the header.
- Corrected the doubled Explore gutter. Updated Home search-by-name, destination and benefit styling to match the rest of Home. Added theme-derived styles where needed.
- Confirmed the real BrandMark and source service categories are retained; no screenshot names, prices, routes, reviews, availability or claims were inserted as live data. Optional previews remain disabled.
- Checked all redesigned source files: no inline color/font/icon-size literals remain. Structural layout values and existing animation/behavior constants remain where appropriate.
- Fixed all 87 local links in the five copied UI guides.
- TypeScript passes. Expo lint passes against the explicit existing baseline: 175 recorded existing errors remain suppressed and 60 warnings remain; this is not a clean lint baseline or a claim those older issues were fixed.
- Existing regression checks passed: runtime 10/10, transportation onboarding 17/17, service-area 5/5, and all location-picker checks.
- Compared 19 key booking/search/chat rules and handlers with the starting commit: unchanged. Services, stores, navigation utilities, productModes and app configuration files are unchanged.
- See EXPO-GO-CHECKLIST.md for phone checks still required. Only Home has an image reference; the other screens share that direction rather than an exact absent reference.

### Step 7 changed files

- `app/(customer)/(tabs)/bookings.tsx`
- `app/(customer)/(tabs)/index.tsx`
- `app/(customer)/(tabs)/search.tsx`
- `app/(customer)/trip/[id].tsx`
- `components/booking/BookingCard.tsx`
- `components/booking/GuideBookingCard.tsx`
- `components/booking/PackageBookingCard.tsx`
- `components/chat/ChatProfilePreview.tsx`
- `components/chat/ChatThread.tsx`
- `components/chat/ConversationListScreen.tsx`
- `components/chat/ConversationRow.tsx`
- `components/chat/MessageBubble.tsx`
- `components/chat/MessageComposer.tsx`
- `components/explore/ExplorePanels.tsx`
- `components/explore/ThumbnailGrid.tsx`
- `components/hotels/HotelBookingCard.tsx`
- `components/navigation/ScreenHeader.tsx`
- `components/travel/DestinationCard.tsx`
- `components/travel/HomeHelpButton.tsx`
- `components/travel/HomeHeroHeader.tsx`
- `components/travel/HomeSection.tsx`
- `components/travel/NameSearchCard.tsx`
- `components/travel/SearchCard.tsx`
- `components/travel/TrustGrid.tsx`
- `components/trip/AgencyCard.tsx`
- `components/trip/JourneyTypePanel.tsx`
- `components/trip/TripCard.tsx`
- `components/trip/TripRouteTimeline.tsx`
- `components/trip/VehicleCard.tsx`
- `components/ui/Badge.tsx`
- `components/ui/Button.tsx`
- `constants/spacing.ts`
- `constants/typography.ts`
- `docs/design/BOOKINGS-UI-README.md`
- `docs/design/EXPLORE-UI-README.md`
- `docs/design/EXPO-GO-CHECKLIST.md`
- `docs/design/HOME-UI-README.md`
- `docs/design/IMPLEMENTATION.md`
- `docs/design/LINT-BASELINE.md`
- `docs/design/MESSAGES-UI-README.md`
- `docs/design/TRIP-DETAILS-UI-README.md`

Final native JavaScript exports passed for both iOS and Android after the last source changes. These are local bundle/compiler checks, not a phone test or a native app build. Expo Go configuration remains unchanged.
