# Banjara Home page UI guide

For the other mobile pages, see the [complete screen guide index](../../../SCREENS-UI-README.md).

This file explains the **current customer Home screen**: what users see, how the
layout changes between services, which components render it, and where its colors,
fonts and alignment come from. It documents the source reviewed on 28 October 2026.

Main screen: [`Banjara/app/(customer)/(tabs)/index.tsx`](<../../app/(customer)/(tabs)/index.tsx>).
The provider's dashboard is a separate screen; this guide covers the traveler Home.

For all app screens/components, read [UI-README.md](../../../UI-README.md). For system and
backend connections, read [ARCHITECTURE.md](../../../ARCHITECTURE.md).

Other customer tabs: [Bookings UI](BOOKINGS-UI-README.md),
[Messages UI](MESSAGES-UI-README.md) and [Profile UI](../../../PROFILE-UI-README.md).

## What the Home screen looks like

The screen uses a themed background, a compact brand/action header, a rounded
photographic hero, service-specific search/browsing controls and a scrolling feed
of cards. The customer bottom navigation stays outside the feed.

The first local state is **Transport → Available rides → Seat booking**. The
one-way/two-way value is initialized from the saved product search mode, so a
previous round-trip search can affect the trips shown.

Default Transport layout, from top to bottom:

```text
Phone safe area
BANJARA logo and name             Search / Notifications / Avatar
Service selector: Transport / Hotels / Tour Operators / Guides / Restaurants
Rounded destination-photo hero
  Availability badge
  Time-based greeting and selected route
  Duration / corridor chips when available
Available rides / Customise route selector
Available rides heading                         View all
  Trip cards, loading skeletons, or empty-state card
Popular destinations, when matching destinations exist
Travel inspiration, when transporter data exists
Why travelers choose BANJARA
Home / Explore / Bookings / Messages / Profile bottom tabs
```

This is the default branch. Choosing Customise route or another service changes
the middle of the page rather than navigating to a different Home route.

## Header and hero

Component: [`HomeHeroHeader.tsx`](../../components/travel/HomeHeroHeader.tsx).

### Top row

- Left: circular `BrandMark`, the word **BANJARA**, and a small teal dot.
- Right: search icon, notification icon with an unread indicator, and profile avatar.
- Items align vertically through `flexDirection: 'row'` and `alignItems: 'center'`.
- The row uses `justifyContent: 'space-between'` to separate identity from actions.
- The header adds the phone's top safe-area inset before its content.

[`BrandMark.tsx`](../../components/brand/BrandMark.tsx) currently uses
`assets/logo-gold.png`, clipped into a circle. The Home header requests a 30-unit
mark; the avatar is 34 units inside a 36-unit ring and a 44-unit press target.

### Service selector

`SearchModeTabs`, exported from
[`SearchCard.tsx`](../../components/travel/SearchCard.tsx), displays the service
categories defined in [`productModes.ts`](../../constants/productModes.ts).
The header uses its compact variant. Service selection changes the feed and hero
copy, and Home scrolls back to the top when the service changes.

These are **service categories**, separate from the five bottom navigation tabs.

### Photo hero

- Height: **195 React Native layout units**.
- Corner radius: **28** (`Radius.hero`).
- Image fills the card with `contentFit="cover"` and a 300 ms transition.
- A dark gradient increases contrast behind white text.
- A dark translucent availability pill sits at the top left.
- Greeting, title and optional metadata sit near the bottom.
- Pressing the hero slightly scales it down to `0.985`, then springs it back.
- The whole hero opens Explore/search; it is not itself a booking-confirmation action.

Hero titles depend on the selected category:

- Transport: the selected departure and destination, with fallback text
  `Islamabad to Hunza` when names are empty.
- Hotels: **Looking for a place to stay**, with a short stay-search description.
- Tours: **Discover tour packages**.
- Guides: **Find a local guide**.
- Restaurants: **Taste the north**.

The greeting uses the device's current hour and the user's first name. Transport's
live badge count comes from the capped today-trip list, while the Available rides
list uses a broader trip selection. These are not necessarily the same count.

## Transportation controls and content

### Available rides

The first pill is **Available rides**; the second is **Customise route**. The
selected pill uses teal with white text. Each pill flexes equally, centers its
label, and has a minimum height of 42.

Available rides hides the route/name search form and immediately shows up to eight
`TripCard` items. It uses trips filtered by the current journey/seat-or-vehicle
selection; unlike the Live rides section, it is not explicitly restricted to today.

When data is loading, the screen shows two `TripCardSkeleton` items. If no rides
are present, an `EmptyState` explains that and offers **Customise route**. The
heading's **View all** action opens the results page.

### Customise route

Selecting this branch reveals:

1. **One way / Two way** controls.
2. **Seat booking / Vehicle booking** controls.
3. **Route / name** search controls (`HomeSearchKindTabs`).
4. The selected search form.

`TransportSearchCard` renders departure/destination controls, swap, travel date,
passengers/travelers and a search CTA. A two-way search includes return-date
controls and can show a return-stay-length label. Whole-vehicle mode changes the
passenger wording to travelers and shows a whole-vehicle hint.

Overlays used by these fields are:

- `LocationPinSheet`: departure or destination selection, including map pinning.
- `DatePickerModal`: departure and return-date pickers.
- `PassengerPicker`: passenger/traveler count.

The name-search branch uses `NameSearchCard` instead of the route fields. Search
criteria are kept in `searchStore`; search actions open customer results.

Below the controls, this branch can show:

- **Continue searching:** currently a list of offered transporter trips, not merely
  the user's recent ride-history rows. It shows up to eight filtered trips.
- **Live rides:** trips departing today, sorted by departure and capped at six;
  includes a retry action when loading fails with no live data.
- **Recommended for you:** up to four trips marked recommended in the loaded data.
- Transport `ExplorePanels`: vehicle types, transporters and agency trip sections.
- **Popular routes:** route suggestions with matched trip counts/prices where present.
- A horizontal stay rail and a stay suggestion section when suitable hotel data exists.
- The conditional destination and shared footer sections described below.

## Hotels, tours, guides and restaurants

### Hotels

The hero changes to stay-related text and destination imagery. The search area
supports name search or `HotelSearchCard`; this Home usage passes
`showGuestControls={false}` and `showCta`, so it does not display the complete guest
controls found in every other use of that component.

The feed includes up to four recent hotel-search rows when saved searches exist.
Each row has a destination thumbnail, stay badge, dates, night count and a chevron;
tapping it reapplies the saved search and opens hotel results.

Hotel `ExplorePanels` handles residence-type filters, best stays and provider
offers/deals. Home can add connecting rides, a **Need a ride there?** section and
matching popular destinations.

### Tour Operators

The shared transport/hotel search block is hidden. `ExplorePanels` renders the
tour-specific content, including packages, newest listings and operator rankings.
`FloatingCrossSell` can suggest a guide when guide data is available.

### Guides

`ExplorePanels` shows the guide selection/filter controls and guide cards,
including the current male/female selection. Its cross-service suggestion points
to places to eat when restaurant data is available.

### Restaurants

The restaurant panel has its own destination search, nearby/deal sorting, offers,
restaurant cards and provider/inspiration sections. It can request location for
nearby results. Its cross-service suggestion can offer a local guide.

Category sections are controlled by
[`ExplorePanels.tsx`](../../components/explore/ExplorePanels.tsx). They are
conditional on the selected category and available records; every heading is not
guaranteed to appear in every session.

## Shared cards and footer sections

### `HomeSection`

[`HomeSection.tsx`](../../components/travel/HomeSection.tsx) standardizes section
headings, optional subtitles and an optional action such as View all or Explore.
It places the heading and action side by side, with a flexible title area.

- Space above a section: **24** (`Spacing['2xl']`).
- Gap between heading and content: **12** (`Spacing.md`).
- Heading horizontal inset: **16** (`Spacing.screen`).
- Title font: Outfit SemiBold, **19**, line height **25**.
- Subtitle: Plus Jakarta Sans Regular, **12**.
- Action: Plus Jakarta Sans SemiBold, **13**, teal, with a small chevron.

This component does not force every child into one generic card. Trip stacks,
hotel rails and destination rails supply their own layout.

### Trip and hotel cards

[`TripCard.tsx`](../../components/trip/TripCard.tsx) presents provider identity,
rating when available, journey type, vehicle/route details, departure/arrival
information, seat availability, price and the booking action. Availability colors
change with the seat count; three or fewer remaining seats use the danger tint.
Card taps call Home's `openTrip` handler, which sets the selected trip and opens
trip details. The full booking flow continues on subsequent screens.

[`HotelCard.tsx`](../../components/hotels/HotelCard.tsx) is reused by stay sections.
Because these are shared components, changing their styles also changes other
screens that import them.

### Popular destinations

The Home destination rail uses curated metadata from
[`destinations.ts`](../../constants/destinations.ts), filtered against place names
found in loaded trips/hotels. If none match, that Home section is omitted.

[`DestinationCard.tsx`](../../components/travel/DestinationCard.tsx) uses an
image-cover layout with a gradient and white overlaid text. Normal cards are
**172 × 218** with radius **20**; its featured variant is **230 × 218** with radius
**28**. Cards are horizontally scrollable, and press feedback scales to `0.97`.
Selecting a destination updates the relevant search and opens results.

### Travel inspiration

The final Home inspiration rail is built from trips grouped by agency, up to eight
providers. Cards show a provider image/name, route, optional rating and a summary
of its published trips. Despite internal `testimonial*` style names, this rail is
not a set of customer-written testimonials. Taps open the agency profile.

### Trust grid

[`TrustGrid.tsx`](../../components/travel/TrustGrid.tsx) renders the static
`TRUST_POINTS` copy under **Why travelers choose BANJARA**. It uses wrapping cards,
colored icon backgrounds and short descriptions. The press animation is visual
feedback; these items do not currently have a destination navigation handler.
Trust copy is marketing content, not a live payment/verification status check.

## Colors and theme behavior

Source: [`colors.ts`](../../constants/colors.ts).

Main light-mode tokens:

- Background: `#F8FAFC`.
- Cards: `#FFFFFF`.
- Main text (`colors.dark`): `#1C1917`.
- Muted text: `#57534E`; lighter muted text: `#78716C`.
- Teal selection/actions: `#0F9B98`.
- Strong green actions/success: `#16B364`.
- Soft teal: `#CCFBF1`; soft green: `#DCFCE7`.
- Borders: `#E2E8F0`; input background: `#F1F5F9`.

Dark mode uses `#0B1424` background, `#18263A` cards, `#F8FAFC` primary text and
`#A7B3C5` muted text. Teal/green retain their brand roles. Most components read
`useThemeColors()`; other styles use the existing theme-aware `Colors` export.
Hero/destination white text and overlays intentionally remain image-contrast colors.

Current Home also contains fixed icon accents, such as the purple/amber TrustGrid
tones. It is not implemented using only teal and green everywhere.

## Fonts, spacing, corners and shadows

Font definitions: [`typography.ts`](../../constants/typography.ts).
Spacing/shapes: [`spacing.ts`](../../constants/spacing.ts).

- Headings: **Outfit 600/700**.
- Body, labels and actions: **Plus Jakarta Sans 400/500/600/700**.
- Header brand text: Outfit SemiBold, **19**.
- Hero title: Outfit SemiBold, **24/30** font size/line height.
- Hero greeting: Plus Jakarta Sans Medium, **13**.
- Hero subtitle: Regular, **13/18**.
- Section titles: **19/25**, an explicit Home style rather than the global
  `Typography.section` value of 22/28.

The spacing scale is `xs=4`, `sm=8`, `md=12`, `lg=16`, `xl=20`, `2xl=24`,
`3xl=32`, `4xl=40`, `5xl=48`, `6xl=64`. The screen gutter is **16**.

The search block starts **8** below the hero area with **16** horizontal margins
and a **12** gap between children. The main scrolling feed ends with **40** bottom
padding. The search block's internal name `searchFloat` does not mean it currently
overlaps the hero using negative positioning.

Current shadow tokens used around Home include:

- `Shadows.soft`: opacity `0.18`, blur radius `8`, vertical offset `4`, elevation `2`.
- `Shadows.card`: opacity `0.22`, blur radius `12`, vertical offset `6`, elevation `3`.

`Shadows.premium` also exists in the shared token file, but its existence does not
mean every Home card uses it. Native shadow appearance varies between iOS/Android.
These numbers are React Native layout values, not a guarantee of physical pixels.

## Bottom navigation

Owned by [`(tabs)/_layout.tsx`](<../../app/(customer)/(tabs)/_layout.tsx>), not
the Home feed. Visible tabs are **Home, Explore, Bookings, Messages, Profile**.
Hotels and Notifications also have tab routes but are hidden from the visible bar.

The bar uses the card background, a subtle top border, teal active icons/text and
muted inactive icons/text. Height is `58 + max(bottomSafeArea, 6)` with safe-area
bottom padding. Labels are Plus Jakarta Sans SemiBold at **11**. The Messages badge
comes from chat unread state and displays `99+` above 99. The bar hides on keyboard.

## Data, refresh and empty states

- `useRecommendedTrips`, `usePopularHotels` and restaurant/guide/tour hooks supply
  loaded records. Search/history/preferences come from the relevant Zustand stores.
- Pull-to-refresh invalidates trip/hotel caches, refreshes both datasets and
  refreshes the active tours/guides/restaurants category when applicable.
- Focus/category effects can perform additional refreshes. A category change also
  resets vertical scroll position.
- Skeleton components preserve space while initial data loads. Empty states explain
  missing rides/stays and expose the actions wired by that branch.
- Some sections disappear when their underlying data is absent. A shorter Home
  feed does not necessarily mean a layout error.
- Loading, no-data and error treatment differ by branch. For example, the custom
  Live rides branch has an explicit retry state; Available rides uses its loading
  and empty branches rather than that identical error presentation.

Hero/destination imagery includes configured sample Unsplash URLs, while provider
and listing cards use their API image data/fallbacks. A sample landscape is not
proof of an exact photographed destination. Image fetching requires reachable URLs;
changing spacing alone cannot repair a broken image reference.

## Alignment and safe editing guide

The current layout combines equal-width flex controls, flexible text containers,
centered icon/label rows, safe-area padding and horizontal rails. Several labels
use `numberOfLines` to limit card/header height; text may truncate rather than wrap
indefinitely. Destination titles allow two lines; the transport hero title allows
one, while the hotel hero title allows two.

When editing this screen:

1. Change section order/visibility in the main Home screen's returned JSX. A helper
   block existing earlier in the file does not prove it is rendered in every mode.
2. Change hero/header geometry in `HomeHeroHeader.tsx`.
3. Change route/name controls in `SearchCard.tsx` and `NameSearchCard.tsx`.
4. Change category-specific feeds in `ExplorePanels.tsx`.
5. Change shared card internals in `TripCard`, `HotelCard` or `DestinationCard` and
   check their other consumers.
6. Use shared spacing/theme tokens for consistent alignment. Changing a global
   token affects other app screens, not just Home.
7. For English/Urdu mixed text, check actual device rendering, line height, wrapping
   and truncation before adding fixed text-container heights. This guide does not
   claim every current field has custom RTL/bidirectional handling.
8. Verify narrow screens, long names, missing images, dark mode, no-data/error
   states and the map/date/passenger overlays in the existing Expo Go setup.

This README documents the UI; adding it does not modify the Home screen, navigation,
API calls, data or existing design.
