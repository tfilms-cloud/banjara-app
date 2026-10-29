You are redesigning the UI of my existing Expo React Native app "Banjara" (a travel marketplace: transport, hotels, tour operators, guides, restaurants). Work in the existing project. Do not rebuild it.

REFERENCE FILES
- docs/design/*.png are Stitch pictures. They are a STYLE and LAYOUT reference only.
- docs/design/*-UI-README.md explain how each current screen works and which file owns what. Read them before editing.

KEEP FROM THE EXISTING APP (never copy from the pictures)
1. Logo: always use components/brand/BrandMark.tsx (assets/logo-gold.png). The logo in the pictures is fake. Never draw or replace it.
2. Service categories: use the exact names, order, icons and ids from constants/productModes.ts (Transport, Hotels, Tour Operators, Guides, Restaurants). The pictures use short names like Ride/Stay/Food. Ignore those.
3. All text and data: names, prices, routes, dates, ratings, seats and images come from the existing hooks, stores and API. Sample text in the pictures (Rs 6,500, Islamabad to Hunza, Ali, etc.) must never be hardcoded.
4. All logic: API calls, hooks, stores, routes, navigation, booking and payment rules, pull-to-refresh, loading, empty and error states, dark mode, safe areas.

CHANGE ONLY THE UI: layout, spacing, radius, shadows, card design, chips, section order, type sizes, icons and small animations.

DESIGN SYSTEM TO APPLY
- Keep the existing palette: background #F8FAFC, cards #FFFFFF, teal #0F9B98, green #16B364, text #1C1917, muted #57534E, border #E2E8F0, with the existing dark-mode values.
- Add tokens: darker teal #0B7A78 for small text links, coral #FF6B4A for urgency badges, likes and the help button (plus dark-mode equivalents).
- Radii: hero 28, cards 20, tiles 16, chips and buttons fully round.
- Shadows: lighter (opacity about 0.08, blur 16, offset y 6).
- Fonts: Outfit for headings, Plus Jakarta Sans for body (existing typography.ts).
- Spacing: 16 screen gutters, 24 between sections, 12 between a heading and its content.
- Use existing tokens in constants/colors.ts, spacing.ts and typography.ts. No hardcoded colors or sizes unless a token is missing, and then add the token.

ORDER OF WORK (finish each step before the next)
Step 1. Shared tokens and components: colors.ts, spacing.ts, Shadows, Badge.tsx, Button.tsx, ScreenHeader.tsx. Keep every prop and export. List all screens that use each shared component before editing it.

Step 2. Home (home.png, HOME-UI-README.md): app/(customer)/(tabs)/index.tsx and components/travel/HomeHeroHeader.tsx.
- Header: real BrandMark and BANJARA name, with search, notification and avatar actions styled like the picture.
- Service selector: icon over label with an active indicator, using the services from productModes.ts.
- Hero: keep the existing photo, greeting and route logic. 28 radius, dark gradient, chips as in the picture.
- Search card overlapping the hero's bottom by 28, always visible in the Transport branch. Reuse the existing TransportSearchCard logic, LocationPinSheet, DatePickerModal and PassengerPicker. Change only how it looks and where it sits.
- Keep Available rides / Customise route, all existing sections and their data-driven visibility.
- Softer cards, bolder price on TripCard.
- Optional extras, each in its own component, controlled by a flag at the top of the file, default false, using static placeholder data and a TODO (no invented API calls): SHOW_STORIES, SHOW_ROAD_STATUS_CHIP, SHOW_HELP_BUTTON.

Step 3. Explore (explore.png, EXPLORE-UI-README.md): app/(customer)/(tabs)/search.tsx, components/explore/ExplorePanels.tsx, ThumbnailGrid.tsx.
- Reuse the same header, service selector and section headings as Home.
- Keep the existing grid logic (default 4 columns). Apply the new tile radius 16 and 8 gaps. Check that labels fit on a narrow phone.
- Keep ExploreFilterChips, FloatingCrossSell, empty states, refresh and the live-inventory hint.

Step 4. Bookings (bookings.png, BOOKINGS-UI-README.md): app/(customer)/(tabs)/bookings.tsx, BookingCard, HotelBookingCard, PackageBookingCard, GuideBookingCard.
- Restyle the status selector and category chips. Keep the same options and filter logic.
- Restyle the cards. Keep every action (Pay now, Ticket, View details) and its conditions from continuePayment.ts.
- Keep the newest-first combined list, loading, empty and error states, and all navigation targets.

Step 5. Messages (messages.png, MESSAGES-UI-README.md): components/chat/ConversationListScreen.tsx, ConversationRow.tsx, ChatThread.tsx, MessageBubble.tsx, MessageComposer.tsx, ChatProfilePreview.tsx.
- Match the search field, 52 avatar, unread card style (teal border, soft teal background), role pill and unread badge.
- Keep local search, connection subtitle, typing dots, receipts, retry, attachments and keyboard handling. Do not touch chatStore or socket code.

Step 6. Trip Details (trip-details.png, TRIP-DETAILS-UI-README.md): app/(customer)/trip/[id].tsx, TripRouteTimeline, VehicleCard, AgencyCard, JourneyTypePanel.
- Match the hero, badges, journey summary, fact tiles, section cards and fixed booking bar.
- Use real trip data only. Do not render the floating blue gear.
- Keep every booking guard (Choose pickup / No seats / Unavailable), BookingStore.setTrip, image-failure fallback, photo dots, capacity versus available seats, and the existing price wording.

Step 7. Consistency pass across all five screens:
- Same header, same real logo, same service names, same tokens for color, radius and shadow.
- Search for hardcoded colors, sizes or sample text copied from the pictures and replace them with tokens or real data.

RULES
- Expo Go compatible only. Do not add native modules or switch to a dev build.
- Do not change API calls, stores, routes or booking and payment logic.
- Shared components appear on other screens. Check their other consumers and keep their props and exports.
- Check, by reading the code, dark mode, long English/Urdu names, missing images, small screens and safe areas.
- After each step run `npx tsc --noEmit` and `npx expo lint`, fix errors, then list the changed files.
- Make one git commit per step with a clear message (for example "redesign: home").
- Do not claim you tested on a phone. At the end, list what still needs checking in Expo Go.

OUTPUT
After each step: a short summary, the changed files, the tsc and lint results, and anything you could not match from the picture and why. If a picture and the README disagree, follow the README for behavior and the picture for looks.