# Banjara Explore screen UI guide

Reviewed against the mobile source on **28 October 2026**. This explains the
current page and its alignment; it does not change search or listing behavior.
See [all screen guides](SCREENS-UI-README.md), [Home](HOME-UI-README.md),
[Transport](TRANSPORT-UI-README.md), [Hotels](HOTELS-UI-README.md) and
[other services](SERVICES-UI-README.md).

Main page: [tabs/search.tsx](<Banjara/app/(customer)/(tabs)/search.tsx>).
Its visible title is **Explore**, even though the source filename is search.

## What the user sees

~~~text
Explore header + notifications
All BANJARA services
Subtitle for the selected category
Horizontal service-category chips
Category-specific filters, thumbnail grids and sections
Relevant cross-service suggestions
Optional live-inventory loading hint
Bottom customer navigation
~~~

The default local category is Transport. ExplorePanels draws the main category
content, and FloatingCrossSell draws the related-service suggestions. Both are
exported from [ExplorePanels.tsx](Banjara/components/explore/ExplorePanels.tsx).

## Category content and controls

| Category | Presentation supplied by the panels |
| --- | --- |
| Transport | Vehicle-class filtering, vehicle/trip thumbnails and transporter summaries built from live trips. |
| Hotels | Residence-class filters and property thumbnails with location/rating/price data. |
| Tours | Tour types, published itinerary content and operator browsing. |
| Guides | Guide filters and provider thumbnails with the available profile information. |
| Restaurants | Destination search, relevant restaurant lists, offers and visited/nearby ranking presentations. |

Category definitions/options are in
[exploreCatalog.ts](Banjara/constants/exploreCatalog.ts). The page receives live
trip, hotel, restaurant, guide and tour-provider data through the existing hooks;
the panels also load their relevant tour catalog. It refreshes datasets on focus
and through pull-to-refresh.

Destination/story assets and catalog fallbacks are different from a provider's
uploaded photos. A stock fallback image does not prove that a listing has supplied
its own photograph. EmptyCatalog explains missing content instead of creating a
bookable record from a decorative tile.

## Header, chips and grid alignment

The header is [ScreenHeader](Banjara/components/navigation/ScreenHeader.tsx).
The introduction uses **16** horizontal padding, **8** top, **12** bottom and
**4** gap. The heading is Outfit **22**, subtitle Plus Jakarta Sans **13**.

Service chips sit in a horizontal ScrollView with **16** side insets and **8**
gaps. Each chip has **14** horizontal / **10** vertical padding, pill radius,
a border and soft shadow. Selected chips use teal with white semibold text;
unselected chips use card background, border and normal text. This is separate
from the customer's bottom navigation.

[ThumbnailGrid](Banjara/components/explore/ThumbnailGrid.tsx) defaults to **4**
columns and **3** rows. Cell width is calculated, not fixed:

~~~text
cell width = floor((screen width - 32 - 8 × (columns - 1)) / columns)
image height = cell width × 0.92
~~~

The grid uses **16** screen gutters and **8** between cells. Labels/meta allow
two lines. Badge and optional rating overlays belong to the image box, not the
text baseline. Show more is rendered only when its callback is supplied and
the component's visibility condition permits it.

ExploreFilterChips in the same file draws the smaller within-category selector.
Use its flexible row/chip layout rather than changing the service-tab rail when
only the vehicle/hotel subtype control needs an alignment fix.

## Navigation and map previews

ThumbnailGrid uses the passed onItemPress override when present, otherwise an
item's href. Different tiles can therefore open a trip, provider, property or
other existing route. They are not all one universal detail page.

Restaurant destination selection can use LocationPinSheet. A listing map opens
the dedicated Explore map route with supplied location/context. Its behavior is
explained in [Maps and settings](LOCATION-SETTINGS-UI-README.md).

## Loading and visual maintenance

The screen displays Loading live inventory when its existing trip/hotel/restaurant
loading-and-empty condition is met. That condition is not a full-screen loading
gate for every service hook. Keep each panel's empty presentation and refresh
behavior when restyling it.

Change the route's StyleSheet for header-adjacent spacing/service chips,
ExplorePanels for section order/category content, ThumbnailGrid for grid sizing,
and shared theme tokens for palette/fonts. Check four-column labels on a narrow
phone, missing data/photos, dark mode and mixed-script names in Expo Go. This is
a source-reviewed guide, not a device test report.
