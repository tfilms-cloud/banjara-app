# Banjara Messages screen UI guide

Current customer inbox and conversation UI, reviewed on 28 October 2026.
This documents existing presentation and interactions; it does not add seeded
conversations or alter Socket.IO/API behavior.

Entry screen: [`inbox.tsx`](<Banjara/app/(customer)/(tabs)/inbox.tsx>).
Related guides: [Home](HOME-UI-README.md), [Bookings](BOOKINGS-UI-README.md),
[Profile](PROFILE-UI-README.md) and [shared UI](UI-README.md).

## Inbox layout

```text
Messages header with back control
Connection subtitle when connecting/reconnecting
Search messages field
Scrollable conversation cards
  Avatar and optional online dot
  Name                                     Updated time
  Provider / Traveler / Admin pill and presence text
  Last-message preview                     Unread count
  Booking link hint when present
Customer bottom navigation
```

The customer tab is a small wrapper around
[`ConversationListScreen.tsx`](Banjara/components/chat/ConversationListScreen.tsx).
It passes `threadBasePath="/(customer)/messages"` and a customer-tabs back fallback.
The component refreshes the inbox when focused and supports pull-to-refresh.

`Header` is a compatibility wrapper over `ScreenHeader`, so the inbox shares the
app's navigation-header styling rather than implementing another independent bar.

## Search field

The field filters already-loaded conversations by the other person's name or
last-message text. It is a local, case-insensitive filter, not a server search of
all historical message bodies.

- Horizontal outer inset: **16**; space underneath: **8**.
- Input padding: **12** on each axis; radius: **16**.
- Background: input token; border: 1-unit themed border.
- Text: shared body typography, normally Plus Jakarta Sans Regular **15/22**.
- Placeholder: **Search messages...** in muted text.

## Conversation cards

Source: [`ConversationRow.tsx`](Banjara/components/chat/ConversationRow.tsx).

The row places a **52**-unit circular avatar beside a flexible text body. A **12**
online dot overlays the avatar when the loaded presence says online. Name and
timestamp share the top line. Role/presence sit underneath, followed by a preview
and optional unread badge.

- Outer radius: **20**; border width: **1**; padding/gap: **12**.
- List padding: **16**; inter-card gap: **12**.
- Body uses `flex: 1` and `minWidth: 0` to give long text room to shrink.
- Name: Plus Jakarta Sans Bold, **16**, limited to one line.
- Preview: Regular **13/18**, limited to two lines.
- Role: SemiBold **11** inside a small rounded neutral pill.
- Time/presence: shared caption/small styles.
- Unread badge: minimum width **22**, height **22**, with `99+` above 99.

Unread cards use a teal border and soft-teal background. Their name becomes teal,
preview becomes darker/semibold and time uses the green accent. Read cards use
normal card surfaces, neutral borders and muted previews.

The role label maps provider/agency/operator roles to **Provider**, admin to
**Admin**, and other/default roles to **Traveler**. A booking ID adds **Linked to
a booking** below the preview.

Tapping opens the other user's thread and includes a `bookingId` query parameter
when one exists. It does not create a new conversation by itself.

## Loading, no-data and connection states

- No cached inbox while fetching: **Loading messages...**.
- Error with no conversations: shared `ErrorState` with retry.
- Empty filtered list: **Start a conversation** with a provider-message explanation.
  The same empty component is currently used for a search with no matches.
- Connection subtitle is hidden when connected, **Connecting…** while connecting,
  and **Reconnecting…** otherwise.
- With existing conversations, the list remains the normal branch rather than
  replacing it with the empty-inbox loading/error state.

The Messages bottom-tab badge is separate from an individual row badge. It uses
the chat store's total unread count in the shared customer tab layout.

## Conversation thread layout

Route: [`messages/[userId].tsx`](<Banjara/app/(customer)/messages/[userId].tsx>).
Shared implementation: [`ChatThread.tsx`](Banjara/components/chat/ChatThread.tsx).

```text
Back / person name / presence or connection text / avatar
Date separators and message bubbles
  Incoming messages on left
  Outgoing messages on right
Optional typing indicator
Optional new-message jump pill
Attachment button / multiline message input / Send
Bottom safe-area padding
```

The route uses the matching inbox conversation for the title/avatar when available;
its fallback title is **Provider**. Opening/closing the thread is coordinated by
`chatStore`. Initial loading uses four alternating left/right skeleton bubbles.

The thread groups messages with date separators and controls avatar/tail display.
Scrolling near the top can load older messages; a text action also exposes earlier
history. If incoming messages arrive while the reader is away from the bottom,
a count pill offers a jump to the newest messages rather than always moving the
reader automatically. Typing is shown through `TypingDots` and accompanying text.

## Message bubbles and status

Source: [`MessageBubble.tsx`](Banjara/components/chat/MessageBubble.tsx).

- Maximum bubble width: **82%** of its containing layout.
- Standard radius: **18**, with a **6** lower corner on the corresponding side.
- Outgoing: right aligned, strong-green background, white message text.
- Incoming: left aligned, secondary surface with border and themed dark text.
- Normal padding: **12** horizontal, **10** top, **8** bottom.
- Message text uses the shared body font with an explicit line height of **20**.
- Timestamps are **11** and align at the lower trailing edge with receipt icons.
- Photo tiles are currently **220 × 220**, cropped to cover, with radius **14**.

Outgoing receipt icons distinguish sending, failed, sent, delivered and read.
Read checks use the existing light-blue accent. A failed message with a retry
handler is tappable and shows **Tap to retry**. These icons reflect message
delivery state, not booking/payment confirmation.

Attachments are rendered from the message's attachment references; the generic
text **Photo** is hidden when it is just the image-message label. This component
does not by itself implement a full-screen photo viewer.

## Message composer

Source: [`MessageComposer.tsx`](Banjara/components/chat/MessageComposer.tsx).

The composer is a horizontal row aligned along its lower edge. Attachment and send
controls are **44 × 44** circles. The flexible input grows from **44** to a maximum
height of **120**, with radius **20**, **12** horizontal and **10** vertical padding.
The field is multiline with a **4,000-character** limit.

Send is enabled only when trimmed text exists and the composer is neither sending
nor disabled. Active send is green; disabled send uses the border color. During
sending, the icon changes to an hourglass and text editing is disabled. The current
thread supplies the attachment handler, which picks/uploads a chat image and sends
its reference; photo-upload failure raises an alert.

The wrapper has a top border, **12** top/horizontal padding, **8** between controls,
and bottom padding of `bottomSafeArea + 12`. The thread uses iOS keyboard-avoidance
padding; verify keyboard layout on both device platforms before changing heights.

## Chat profile preview

Tapping the thread-header avatar opens
[`ChatProfilePreview.tsx`](Banjara/components/chat/ChatProfilePreview.tsx): a centered
modal with an overlay, a **72**-unit avatar, name, role, presence and Close action.
The card has maximum width **360**, radius **20** and padding **20**.

The component supports an optional View profile callback, but this thread does
not currently pass that callback. Do not document that button as always present.

## Colors, data and safe edits

Light-mode foundations are background `#F8FAFC`, white cards, dark text `#1C1917`,
teal `#0F9B98`, soft teal `#CCFBF1`, green `#16B364` and border `#E2E8F0`.
Dark mode uses the existing `Colors`/theme behavior, including `#0B1424` background
and `#18263A` cards. Font tokens come from `constants/typography.ts`.

`store/chatStore.ts` manages inbox/history, live updates, typing, unread state,
presence, sending and retry. `services/socket.ts` provides the socket connection;
saved messages are also retrieved through the messaging API. Presence and typing
are transient signals. Payment-specific chat is a separate feature and is not
the same inbox/thread described here.

For changes, edit the smallest component responsible: `ConversationRow` for inbox
cards, `ConversationListScreen` for search/states, `MessageBubble` for messages,
`MessageComposer` for input alignment, and `ChatThread` for thread coordination.
Shared components also appear outside the customer tab. Keep existing routing,
send/retry/read events and keyboard handling intact during visual work.

Check long names, English/Urdu text, multi-line messages, photos, unread counts,
empty search, reconnecting state and keyboard visibility in Expo Go. Fixed image
sizes and truncated inbox labels need real narrow-screen checks; this guide does
not claim automatic RTL handling for every field.
