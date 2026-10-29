# Banjara Bookings screen UI guide

Current customer Bookings tab, reviewed against the source on 28 October 2026.
This explains the existing layout and behavior; it does not change the screen or
add demo bookings.

Main screen: [`bookings.tsx`](<Banjara/app/(customer)/(tabs)/bookings.tsx>).
Related guides: [Home](HOME-UI-README.md), [Messages](MESSAGES-UI-README.md),
[Profile](PROFILE-UI-README.md) and [shared app UI](UI-README.md).

## What the user sees

```text
Safe-area header: Bookings
Upcoming / Completed / Cancelled status selector
All / Transport / Hotels / Tours / Guides category chips
Scrollable booking cards, newest created first
  Service/provider details
  Dates and guest/seat information
  Status badge and relevant payment/approval hint
  Total price and available actions
Customer bottom navigation
```

The default selection is **Upcoming + All**. Status and category are local screen
state. Category chips wrap onto another line when they do not fit; they are not a
horizontal scrolling rail.

The screen combines four booking types in one `FlatList`. It sorts the combined
items by `createdAt`, newest first, rather than sorting by departure/check-in date.
Restaurants are not a booking category in this screen.

## Status and category controls

The status selector is a card-colored, bordered rounded track. Its three buttons
share the width equally through `flex: 1`, with centered labels.

- Track radius: **16**; inner button radius: **14**.
- Track inset: **4**; button vertical padding: **10**.
- Selected status: strong green `colors.action`, with white text.
- Unselected text: muted.
- Labels: Plus Jakarta Sans SemiBold, **12**.

Category chips use **12** horizontal / **8** vertical padding and radius **14**.
Their gap is **8**. A selected chip has a soft-green background, green border and
green text; unselected chips use card surfaces and muted text.

The Upcoming filter accepts the frontend values `upcoming`, `confirmed` and
`pending`. Completed and Cancelled match their named frontend statuses. These
values come through service mapping; they are not a list of every backend
booking/payment status. Payment state and booking state are separate concerns.

## Booking card components

### Transport — `BookingCard`

Source: [`BookingCard.tsx`](Banjara/components/booking/BookingCard.tsx).

The top row places provider/route copy on the left and journey/status badges on
the right. Below that are payment or approval hints, a journey description when
available, travel date/time and seat numbers. The footer places the total beside
the available text actions.

- Surface: themed card with a 1-unit border, radius **20**, padding **16** and
  an **8** content gap.
- Provider text: Plus Jakarta Sans Medium, **12**.
- Route: Plus Jakarta Sans Bold, **16**.
- Status tone changes for cancelled, completed, pending and payment-action states.
- The price currently uses primary text color; it is not universally green.
- Payment labels/actions come from
  [`continuePayment.ts`](Banjara/utils/continuePayment.ts).

Tapping the card opens transport booking details. An eligible payment action
opens that booking's payment flow. A **Ticket** action appears only when the
component's status/payment conditions allow it; it is not rendered for every card.
The list itself does not implement a universal Cancel button.

### Hotels — `HotelBookingCard`

Source: [`HotelBookingCard.tsx`](Banjara/components/hotels/HotelBookingCard.tsx).

When hotel details are available, a full-width **120**-high image appears above
the body. The body includes hotel name and status, room name, check-in/out dates,
guest/room counts, any pending-approval hint, booking code and total.

- Card radius: **20**, with clipped image corners and a border.
- Body padding: **16**; internal gap: **4**.
- Hotel name: shared `Typography.h3`, teal.
- Metadata: shared caption typography and muted color.
- Total: shared body-bold typography, teal.
- Footer aligns the total and **View Details** horizontally.

Tapping opens hotel booking details. If supplemental data has not been loaded,
the component can display fallback labels such as **Hotel booking** and **Room**.

### Tours — `PackageBookingCard`

Source: [`PackageBookingCard.tsx`](Banjara/components/booking/PackageBookingCard.tsx).

This is a horizontal card with a compass icon, package title, tour type/destination,
start date, traveler count, optional pending-approval copy and price. The right
side contains status/code information and a chevron.

The parent currently routes a tap to the operator's **agency profile**. It does
not route to a dedicated package-booking detail page from this list.

### Guides — `GuideBookingCard`

Source: [`GuideBookingCard.tsx`](Banjara/components/booking/GuideBookingCard.tsx).

The guide card has a **44 × 44** icon tile, service name, provider name, booking
date/time, guest information, price, status badge and booking code. Its outer
radius is **20**, padding/gap **12**, title size **15**, metadata **12**, and price
**14**. The right column aligns its contents to the trailing edge.

A tap currently opens the booked guide's **public profile**. Pending cards include
**Awaiting guide approval** text.

## Data loading, refresh and empty states

- Transport uses `useBookings`; hotels use `useHotelBookings`.
- Package and guide records load through `tourBookingService` and
  `guideBookingService` into local component state.
- Trip, hotel and room details are fetched for visible items and cached in local
  maps. This fills in route names, hotel images and room labels.
- Pull-to-refresh requests all four booking datasets.
- If any dataset is loading, this screen renders **Loading bookings...** rather
  than independently showing a loading placeholder for each category.
- An empty filtered list shows **No bookings yet**, with a description mentioning
  transport, hotel, tour and guide reservations.
- If loading has finished, a dataset error exists and the filtered list is empty,
  the screen returns a shared `ErrorState` with a refresh retry action. That early
  branch does not render the normal Bookings header/filter controls.

Provider listings being present in Home does not create customer bookings. This
screen displays reservations belonging to the signed-in customer. The marketplace
demo seed adds providers/inventory; it does not fill every customer's booking list.

## Colors, typography and alignment

The screen uses the same tokens as Home:

- Light background `#F8FAFC`, card `#FFFFFF`, main text `#1C1917`.
- Teal `#0F9B98`, green `#16B364`, muted text `#57534E`, border `#E2E8F0`.
- Dark background `#0B1424`, card `#18263A`, main text `#F8FAFC`.

`Colors` and `useThemeColors()` provide the existing theme behavior. Badge tones
are defined by [`Badge.tsx`](Banjara/components/ui/Badge.tsx); a tone name should
not be assumed to be a hardcoded color on every theme.

Main content has a **16** horizontal gutter and **12** vertical gaps. List bottom
padding is `bottomSafeArea + 24`. `ScreenHeader` supplies top safe-area handling;
the shared tab layout owns the bottom navigation.

Long card titles often use `numberOfLines`; category chips wrap, while some card
headers combine flexible copy with a trailing badge column. Check long English
and Urdu names on a narrow device before changing widths or fixed heights.

## Where to edit

- Filter labels/order, combined sorting and navigation:
  [`bookings.tsx`](<Banjara/app/(customer)/(tabs)/bookings.tsx>).
- Header: [`ScreenHeader.tsx`](Banjara/components/navigation/ScreenHeader.tsx).
- Card content/layout: the four card components described above.
- Status pills: `components/ui/Badge.tsx`.
- Loading/error/empty presentation: `components/ui/EmptyState.tsx`.
- Global colors, spacing and fonts: `constants/colors.ts`, `spacing.ts`,
  `typography.ts` inside the mobile project.

Shared component changes affect other screens too. Preserve existing payment
conditions and route callbacks when changing presentation. Check all four service
types, each status filter, pending payments, long titles, missing supplemental
images and both themes in Expo Go.
