# Banjara Trip Details — UI guide and reusable design prompt

Reviewed against the mobile source on **29 October 2026** and the supplied
Islamabad → Hunza screenshot. This document explains the existing screen and
includes a copyable prompt for future visual work. **This documentation change
does not redesign the page or change its behavior.**

Main source: [Trip Details screen](<Banjara/app/(customer)/trip/[id].tsx>).
Related guides: [Transport journey](TRANSPORT-UI-README.md),
[Agency profile](AGENCY-UI-README.md), [payments/tickets](PAYMENTS-TICKETS-UI-README.md)
and [all screens](SCREENS-UI-README.md).

## 1. What this page is for

Trip Details helps a customer inspect a particular departure before choosing a
boarding point and seats. It answers: where does the trip go, when does it leave,
what vehicle/provider operates it, what is available, and what does it cost?

The screenshot shows the **upper part** of this page. Route, pickup points,
amenities, vehicle, provider, reviews and other details continue below it.

The screenshot's Islamabad, Hunza, 31 Oct 2026, 8:00 AM, midnight, Rs 5,000 and
14 seats are values for that record. They are not fixed design constants. The
photo also comes from trip/vehicle data; the design does not require every trip
to use the yellow van in the example.

## 2. Full screen structure

~~~text
Safe-area header
  Back                 Origin → Destination                 Share

Scrollable content
  Full-width vehicle-photo hero
    Photo-selector dots, when multiple working photos exist
    Route title
    Departure date · time
    Fare                                   Seats available

  Body with 16-unit side gutters
    Verified / journey / vehicle / optional unavailable badges
    Departure city + time | duration | arrival city + time
    Two-column fact tiles
      Date        Departs
      Arrives     Duration
      Seats       Price

    Route timeline
    Pickup map and pickup cards, or missing-pickups message
    Amenities, when supplied
    Vehicle card
    Provider card + conditional Message provider
    Review summary and up to three reviews, or empty message
    Optional Trip notes with Read more
    Journey explanation and return information
    Price explanation

Fixed bottom booking bar
  From / availability                         Choose pickup
  Fare / Sold out                             or disabled state
Bottom safe-area padding
~~~

The header and bottom bar are outside the ScrollView. The hero belongs to the
scrolling content; it scrolls away with the body. This is a detail-stack screen,
not a page with a separate customer bottom tab bar drawn inside it.

The floating blue gear in the screenshot is not rendered by this route's JSX.
It is not part of the documented Trip Details layout or the copyable prompt.

## 3. Header and its actions

The route uses [Header](Banjara/components/ui/Header.tsx), a compatibility wrapper
around [ScreenHeader](Banjara/components/navigation/ScreenHeader.tsx).

- Back occupies a **44 × 44** circular bordered control.
- The title displays the actual origin and destination, otherwise “Trip.”
- Title typography is Plus Jakarta Sans SemiBold, **18 / 22** size/line height.
- The custom Share icon is size **22**, with **8** extra hit slop.
- Header padding includes the top safe area plus **8**, **16** side gutters and
  **12** bottom padding. The main header row has a **44** minimum height.

Back calls the existing safeBack helper with Results as its fallback. Share opens
the platform share sheet with a text summary: journey, route, date, departure,
journey explanation, fare and provider. It does not export a screenshot or PDF,
and the current handler does not generate a booking link.

## 4. Vehicle-photo hero

The hero is **240** high and spans the screen width. It has no outer rounded-card
corners in the current implementation. Images use cover sizing and a **200 ms**
transition. A transparent-to-dark gradient keeps white text readable near the
bottom; the lower gradient stop is rgba(11, 31, 51, 0.88).

The overlay has **16** padding and **4** gaps. Its hierarchy is:

| Element | Current style |
| --- | --- |
| Route title | Outfit Bold, **26 / 32**, white |
| Departure date/time | Plus Jakarta Sans Medium, **14**, translucent white |
| Fare | Plus Jakarta Sans Bold, **20**, white |
| Seat availability | Plus Jakarta Sans SemiBold, **13**, white, right aligned |
| Price/availability row | Horizontal, space-between, **12** gap, **8** top margin |

Image sources are collected from the trip image and vehicle images, normalized
and deduplicated. A failed URL is removed from the working hero choices. When no
working photo remains, a teal-to-dark gradient provides the background.

Photo dots appear only for multiple working photos. They are **7 × 7**, **6** apart,
at the top-right with **12** insets. Tapping a dot selects its image. The route
does not implement a swipe carousel, automatic slideshow or full-screen image
viewer for this hero.

## 5. Badges and journey summary

The body uses **16** padding and a **12** gap. Its badge row wraps with **8** gaps.
[Badge](Banjara/components/ui/Badge.tsx) supplies **12** semibold labels, **12**
horizontal / **5** vertical padding and radius **14**.

| Badge | When it appears | Tone |
| --- | --- | --- |
| Verified provider | Provider's verified flag is true | Soft green / green |
| One way or Round trip | Derived from journeyType | Neutral or soft teal |
| Van / bus / car etc. | Derived from vehicle type | Soft amber / warning |
| Unavailable status | Cancelled, completed or departed | Soft red / danger |

The journey-summary card uses a horizontal three-part layout. Left and right
columns each use flexible width with minWidth 0. The right column aligns its
contents to the end. The center column is **72** wide, containing a **40 × 2**
green line and the duration beneath it.

The card has **20** radius, **16** padding, a **1** border, **12** gap and the
shared soft shadow. City labels use the teal bodyBold token; departure/arrival
times use Outfit **22**. Duration uses semibold **11**.

This is an at-a-glance summary. The complete Route section below gives additional
boarding-point context. An arrival at 12:00 AM is not a return departure; return
details belong in the Journey section. The current summary does not separately
show an arrival calendar date or a “+1 day” indicator.

## 6. Fact tiles

The facts container wraps rows with **8** gaps. Each tile has width **48%** plus
flexGrow 1, creating the current two-column layout. Tiles use card background,
radius **16**, **12** padding and a **1** border.

Labels use the small token (**12 / 16**, muted). Values use bodyBold
(**15 / 22**, primary text), with **4** top margin. In the current typography
file, bodyBold resolves to Plus Jakarta Sans Medium despite its token name.

Date, departure, arrival and duration are conditional on their data. Seats and
Price are always presented from the current trip. Do not add fake values to
complete an otherwise uneven row.

## 7. Route and pickup sections

[TripRouteTimeline](Banjara/components/trip/TripRouteTimeline.tsx) shows origin,
named boarding points and destination. It does not automatically draw every
item in the trip's generic en-route stops array. Each timeline row can show
title, caption/address and formatted time.

The timeline card uses radius **20**, **16** horizontal / **12** vertical padding
and a border. Rows have **64** minimum height. The rail is **20** wide with
**2**-wide connector lines, teal origin dots, green destination dots and smaller
coral boarding dots.

When pickup locations exist, the page displays
[PickupMap](Banjara/components/map/PickupMap.tsx) at **240** height with full-screen
support, controls and a selected-point panel. A stack of
[PickupCard](Banjara/components/map/PickupCard.tsx) items follows with **8** gaps.
Their selection stays in sync with the map preview.

The page requests the user's location through the existing hook, and supplies
available traveler/vehicle context to the map. Permission and map fallback
behavior remain in the shared map/location implementation. Keep the existing
Expo Go-compatible map path; see [Maps](LOCATION-SETTINGS-UI-README.md).

The first pickup becomes the initial preview when available. Selecting a pin/card
here changes the local preview. **Choose pickup saves the trip and opens the
dedicated pickup page; it does not commit this preview ID to the booking store.**
The dedicated page handles the actual next-step boarding selection.

Without pickups, the page explains that boarding points will appear when the
provider publishes them. It does not fabricate a stop at the customer's GPS pin.

## 8. Amenities, vehicle and provider

Amenities appear only when supplied. They wrap as green-tinted chips with pill
radius, **12** horizontal / **8** vertical padding and **13** semibold text.

[VehicleCard](Banjara/components/trip/VehicleCard.tsx) presents vehicle photo,
type, name, optional brand/model and registration, plus separate **Capacity** and
**Available now** boxes. Its image is **160** high; thumbnail choices are
**56 × 44**, with the active one highlighted. The card has radius **16**, a
border and **16** content padding.

Physical vehicle capacity and seats remaining on this trip are different values.
The route passes vehicleCapacity with totalSeats as its fallback, and passes
availableSeats separately. A design must preserve that distinction.

[AgencyCard](Banjara/components/trip/AgencyCard.tsx) displays the provider logo or
initials, business name, conditional verification/rating/city and **View provider**.
The logo is **52 × 52**, radius **14**. The card uses radius **16**, **16** padding
and a **12** gap. It opens the provider's Agency profile.

Message provider is a separate secondary Button shown only when the provider
user ID exists. It opens the current customer chat route for that user.

## 9. Reviews, notes, journey and price

Reviews have a conditional rating summary. The screen displays at most the first
**three** loaded reviews, with **40** avatars, name, date, rating, comment and
optional provider reply. View provider reviews opens the Agency profile. With
no review records, it says “No reviews yet for this trip.” A review-load failure
currently falls back to an empty review list; there is no separate review error
panel in this route.

Trip notes use [ExpandableText](Banjara/components/agency/ExpandableText.tsx),
initially limited to **four lines**. Read more / Show less appears if the measured
text needs it. Text is body **15 / 22**, muted; the toggle is green **14** semibold.

[JourneyTypePanel](Banjara/components/trip/JourneyTypePanel.tsx) explains One way
or Round trip. It shows Going, then Return home for a round trip, using the
available return date/time or reverse route. One-way copy says no return is
included. The full panel is used here, not its compact variant.

The Price card currently labels the fare **Price per passenger**, shows the trip
price and explains that seat count/final total follow seat selection. It has
radius **20**, **16** padding and a border. This is the advertised fare, not an
already submitted receipt or proof of a paid booking.

## 10. Fixed booking action and status rules

The bottom bar is absolutely positioned at left/right/bottom 0. It uses card
background, a top border, the shared float shadow, **16** side padding, **12**
top padding and **bottom safe area + 12** bottom padding. The ScrollView reserves
**bottom safe area + 118** padding so its final content can clear the bar.

The left column is flexible. It displays From plus the teal fare, or Availability
plus Sold out. The green Button has minimum width **150**, maximum **200**, a
**48** minimum height and radius **16** through the shared Button component.

| Current condition | Button | Can advance? |
| --- | --- | --- |
| Not unavailable, seats greater than zero | Choose pickup | Yes |
| Status is cancelled, completed or departed | Unavailable | No |
| No seats and not in those unavailable statuses | No seats | No |

The handler checks the same canBook condition, writes the selected trip into
BookingStore, and opens the dedicated pickup route. It does not create a booking,
charge money or skip to seat selection from this page.

Current limitations to preserve/consider explicitly in future work:

- This route uses availableSeats for its booking guard, including the current
  whole-vehicle case; it does not define a separate private-hire guard here.
- The Price section currently says per passenger; a private-hire pricing-label
  improvement would require a deliberate follow-up, not an inaccurate claim
  that it already adapts here.
- The unavailable-status check is the explicit set above; there is no separate
  departure-date comparison in this screen's canBook calculation.

## 11. Colors, typography and alignment map

This page uses the shared theme, rather than the warm Home-only palette.
Colors, typography and spacing come from the existing constants and theme
compatibility layer.

| Role | Light | Dark |
| --- | --- | --- |
| Page | #F8FAFC | #0B1424 |
| Card | #FFFFFF | #18263A |
| Primary text | #1C1917 | #F8FAFC |
| Muted text | #57534E | #A7B3C5 |
| Border | #E2E8F0 | #26364B |
| Brand / secondary actions | #0F9B98 | #0F9B98 |
| Primary booking action | #16B364 | #16B364 |
| Soft teal | #CCFBF1 | #123A3D |

Outfit is used for prominent headings/times, Plus Jakarta Sans for body and UI.
Section headings use **22 / 28**, teal, with **8** extra top margin. The screenshot
is a scaled phone capture; its physical pixels are not the app's logical units.

Alignment decisions have different jobs:

- The summary's flexible city columns share space around a fixed center column.
- Fact tiles wrap into rows; labels and values stack vertically within each tile.
- Badge/amenity rows wrap instead of requiring one long line.
- The footer reserves width for its action while the price column flexes.
- Shadows are not identical everywhere: summary uses Shadows.soft (opacity .18,
  elevation 2), footer uses Shadows.float (.28, elevation 4), and many detail
  cards use borders. This is the current source, not a uniform premium-shadow
  redesign.

For longer English/Urdu names, increase usable width/wrapping and line height
before reducing font sizes. Automatic writing direction is not explicitly set
on every Text in this route today; complete RTL support must be verified rather
than assumed.

## 12. Data, loading and component ownership

~~~text
Route ID -> useTrip(id) -> tripService.getTripById
  -> TripWithDetails -> hero / badges / facts / child cards
  -> getTripReviews -> review state

Local screen state
  heroIndex + failed image URLs -> displayed hero
  previewPickupId -> selected map/card preview

Choose pickup -> BookingStore.setTrip -> pickup/[id]
~~~

Initial loading without a trip shows the header and TripDetailsSkeleton. Missing
or failed data shows “Couldn't load this trip” with Retry. Retry refreshes with
cache invalidation. This route does not attach a pull-to-refresh control.

| What you want to change | Edit here |
| --- | --- |
| Hero, fact grid, summary, footer, section order | [trip/[id].tsx](<Banjara/app/(customer)/trip/[id].tsx>) |
| Header geometry/typography | [ScreenHeader](Banjara/components/navigation/ScreenHeader.tsx) |
| Badge padding/tones | [Badge](Banjara/components/ui/Badge.tsx) |
| Route rail/boarding rows | [TripRouteTimeline](Banjara/components/trip/TripRouteTimeline.tsx) |
| Pickup map and full-screen behavior | [PickupMap](Banjara/components/map/PickupMap.tsx) |
| Pickup selection card | [PickupCard](Banjara/components/map/PickupCard.tsx) |
| Vehicle gallery/specifications | [VehicleCard](Banjara/components/trip/VehicleCard.tsx) |
| Provider identity/link | [AgencyCard](Banjara/components/trip/AgencyCard.tsx) |
| Journey/return explanation | [JourneyTypePanel](Banjara/components/trip/JourneyTypePanel.tsx) |
| Shared action colors/sizing | [Button](Banjara/components/ui/Button.tsx) |
| Palette, type scale, spacing/shadows | [colors](Banjara/constants/colors.ts), [typography](Banjara/constants/typography.ts), [spacing](Banjara/constants/spacing.ts) |

Shared-component edits also affect other pages. Use route-specific styles when
the requested change belongs only to Trip Details.

## 13. Copyable UI design prompt

The following is a **future implementation brief**, not a claim that these
optional refinements have been applied by writing this README.

~~~text
Improve the existing Trip Details screen of Banjara, an Expo React Native travel
marketplace for Pakistan. Start with app/(customer)/trip/[id].tsx and reuse its
existing Header, Badge, TripRouteTimeline, PickupMap, PickupCard, VehicleCard,
AgencyCard, JourneyTypePanel, ExpandableText and Button components.

Use the supplied Islamabad-to-Hunza screenshot as the visual reference. Preserve
the existing content and complete scrollable page, not only the screenshot's
visible top section. Render the actual loaded trip's data; do not hardcode the
example route, date, fare, seat count, verification, reviews or vehicle photo.

Visual direction:
- Pale #F8FAFC background, white rounded cards, teal #0F9B98 accents and strong
  green #16B364 primary action. Retain the existing navy dark-mode equivalents.
- Outfit headings and Plus Jakarta Sans body/UI, using current theme tokens.
- Keep the safe-area header with Back, centered route title and Share.
- Keep a full-width vehicle-photo hero with a dark lower gradient, readable
  white route/date/fare/availability text and conditional photo selection dots.
- Follow with wrapping verification/journey/vehicle badges, a clear departure-
  duration-arrival summary and aligned Date/Departs/Arrives/Duration/Seats/Price
  tiles. Prefer consistent 16-unit gutters, 8–12-unit gaps and 16–20-unit radii.
- Continue with Route, Pickup points, optional Amenities, Vehicle, Provider,
  Reviews, optional Trip notes, Journey and Price in the existing hierarchy.
- Keep the bottom booking bar visible with price on the left and Choose pickup
  on the right. Reserve enough scroll padding and safe-area space for it.
- Improve long-city, long-price and mixed English/Urdu wrapping. Maintain
  readable time columns, aligned value baselines and useful touch targets.
- Soften excessive shadows locally if needed; avoid changing every shared card
  in the app to fix one screen. Keep disabled/loading/error states legible.

Behavior constraints:
- Preserve API calls, stores, route IDs, navigation and existing booking guards.
- Back must use existing safe navigation; Share must keep its current action.
- Preserve image failure fallback and photo-dot switching; do not promise a
  swipe/full-screen photo viewer unless implementing it as a separate feature.
- Pickup-map selection here is a preview. Choose pickup must still save the
  trip and open the dedicated boarding-point step.
- Preserve unavailable/sold-out state and conditional provider chat/reviews.
- Keep permanent vehicle capacity distinct from remaining trip seats.
- Preserve one-way/round-trip explanations and return data. Do not mistake the
  destination's arrival time for the return departure.
- Identify existing pricing-label/private-hire limitations explicitly; do not
  silently change pricing calculations or claim an unsupported total is final.
- Do not add fake trust badges, amenities, reviews or payment guarantees.
- Keep Expo Go compatibility. Do not switch to a custom native/development build.

Deliver focused code edits with exact updated component/StyleSheet sections.
Explain which files changed and which checks actually ran. Test visual cases
including long text, missing images, no pickups/reviews, round trip, sold out,
unavailable status, dark mode and a small phone. Do not describe source review
or bundle compilation as proof of physical-phone visual testing.
~~~

## 14. Suggested review checklist

These are checks for a later UI implementation, **not a report of tests run by
this documentation change**:

1. Open a live trip from Home/Results and verify route/date/fare/seat values agree.
2. Use Back and Share; confirm a long header title remains usable.
3. Try multiple, missing and broken hero photos; test photo dots.
4. Check fact-grid wrapping, long prices and a small screen/larger text setting.
5. Inspect pickup-map preview/full-screen and its cards; advance to the dedicated
   pickup page and confirm actual selection is handled there.
6. Inspect vehicle capacity versus remaining seats, provider navigation/chat,
   zero reviews, existing replies and Read more/Show less.
7. Inspect one-way/round-trip and midnight-arrival wording without inventing a
   return date or day offset.
8. Verify unavailable/sold-out disables the booking action; do not bypass it.
9. Scroll the final section above the footer and inspect dark mode and Urdu text.
10. Keep the test environment in Expo Go and report any untested device behavior.
