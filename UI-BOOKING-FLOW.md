# Mobile booking flow

For the complete screen guide, source links, previews, and testing status, read
the [Booking and Payment UI README](BOOKING-FLOW-UI-README.md).

The transport booking flow now uses the same travel foundation as Home, Explore, and Trip Details: Outfit headings, Plus Jakarta Sans body text, teal actions, white or dark travel surfaces, rounded panels, and safe-area-aware headers and footers.

Updated screens:

- Choose pickup: `/pickup/[id]`
- Select your seats: `/seat/[id]`
- Review booking: `/booking/review`
- Choose payment method: `/booking/payment`
- Payment instructions and transaction status: `/payments/[paymentId]`
- Upload payment proof: `/payments/proof/[paymentId]`
- Booking result: `/booking/success`

`components/booking/BookingFlowPresentation.tsx` shares the header, four-step progress indicator, journey summary, section cards, notices, footer, and travel color mapping. Pickup, review, and booking result have dedicated feature components with thin route exports. Existing seat/payment service calls, provider receiving accounts, receipt upload, verification, chat, and booking navigation remain connected to their original APIs.

Shared inputs, fare cards, seat controls, payment progress, receipt picker, and payment chat opt into travel colors through `TravelDesignProvider`. Other consumers keep their existing palette outside that provider. Both light and dark appearances are supported.

Pickup choices must still be present in the current published points. Seat continuation requires a loaded seat map without a load error. Occupied and reserved seats remain disabled. Provider methods remain API-derived; unavailable methods cannot advance. The result screen distinguishes a submitted request from a confirmed booking and does not show a success claim without a current booking record. Backend outages preserve screen controls while clearing server records; locally entered passenger and receipt drafts remain local input.

Validation:

- `npm run typecheck`
- `node --test scripts/checkout-presentation.test.cjs scripts/backend-availability.test.cjs scripts/trip-details.test.cjs scripts/booking-presentation.test.cjs`
- `npx expo export --platform android`

The read-only HTML harness in `scripts/helpers/checkout-render.cjs` renders the actual feature components with native primitives represented in HTML and mocked stores/services. It checks navigation callbacks, disabled states, appearance, and offline masking without creating bookings or performing uploads/transfers. Browser layout review uses a 390 × 844 phone frame. Native map, keyboard, font scaling, camera/receipt picker, and device interaction checks still require an Android or iOS device.
