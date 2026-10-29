# Final device checks in Expo Go

These are manual checks still to perform. Automated checks and JavaScript exports
do not establish that the layout has been tested on a phone. No native modules,
custom build, backend change or deployment were introduced.

## Home

- Confirm the real gold logo and the five original service categories.
- In Transport, check the overlapping search card in both Available rides and
  Customise route. Open location, date, return-date and passenger controls; swap
  locations; switch route/name search; verify the existing search results.
- Visit all five categories, refresh, and check loading/empty and live-content
  sections. Verify real names, photos, prices, seats and dates.
- Stories, road-status and help previews must remain off; all three flags default
  to false and require real approved content/actions before enabling.

## Explore

- Check four columns on a narrow phone, two-line labels, filters, Show more,
  suggestions, restaurant destination search and the live-inventory loading hint.
- Check that the selector and section headings share Home's gutters.

## Bookings

- Try every original status/category filter. Confirm the combined list remains
  newest first and each card opens its original destination.
- Check payment-required, approval-pending, confirmed, completed and cancelled
  examples. Pay now, Ticket and View details must follow the original conditions.

## Messages

- Check local search, unread count/role badges, presence and connection subtitle.
- Open a thread; check typing, history pagination, new-message scrolling, photos,
  send/delivered/read receipts and failed-message retry.
- Open/close the keyboard with a long multiline English/Urdu message; confirm
  attachment controls, send state and profile preview remain usable.

## Trip Details

- Check long routes, missing/failed photos, gallery dots, share and Back.
- Compare vehicle capacity with remaining trip seats; check the map preview and
  the separate Choose pickup booking flow.
- Check available, sold-out and unavailable departures and their disabled actions.
- Verify the fixed booking bar clears the home indicator and does not obscure
  the final price copy. Check provider, reviews, notes and journey details.

## Cross-screen

- Toggle light/dark mode while screens are mounted, including chat and cards.
- Check a narrow screen, enlarged text, long names and mixed English/Urdu.
- Check notches, home indicators, scrolling and landscape without clipped actions.
- Briefly check auth/provider forms because shared Button, Badge, Header and
  shadow tokens also affect those consumers (listed in SHARED-CONSUMERS.md).

Only home.png was supplied. Explore, Bookings, Messages and Trip Details follow
the shared visual direction; an exact comparison needs their reference images.
