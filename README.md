# Banjara mobile app

Expo React Native app for **customers** (book transport and hotels) and **service providers** (manage fleet, trips, rooms, bookings).

**Tagline:** Your Journey. Your Seat. Your Way.

For each customer page and its copyable design prompt, use the
**[Customer UI design README collection](../CUSTOMER-UI-DESIGN-README.md)**.

For guides to every mobile page, start with the
**[Screen-by-screen UI README index](../SCREENS-UI-README.md)**. It covers
customer pages, provider signup/management, authentication, maps and settings.

For the current colors, typography, alignment rules, screen map, and component usage directory, read the **[Banjara UI README](../UI-README.md)**.

For the customer Home screen's layout, search modes, cards, spacing and component
files, read the **[Home page UI guide](../HOME-UI-README.md)**.

Customer screen guides: **[Bookings](../BOOKINGS-UI-README.md)**,
**[Messages](../MESSAGES-UI-README.md)** and **[Profile](../PROFILE-UI-README.md)**.

The full UI map, features, and **file-by-file functionality** (mobile + admin + backend) is in the root guide:

**[../README.md](../README.md)**

## Stack

- React Native + Expo (SDK 57)
- TypeScript
- Expo Router
- NativeWind / Tailwind CSS
- Zustand + AsyncStorage
- Axios → Express / MongoDB API
- Socket.IO (chat)
- React Hook Form + Zod

## API configuration

`.env`:

```env
EXPO_PUBLIC_API_URL=http://YOUR_PC_LAN_IP:5000/api
```

On a **physical phone**, `localhost` is the phone, not your PC. Use the IP shown in Metro (`exp://192.168.x.x:8081`). If the app says **Unable to connect to server**, it cannot reach this URL. Admin can still work because it uses `localhost` on the same computer.

- Android emulator: `http://10.0.2.2:5000/api`
- iOS simulator: `http://localhost:5000/api` usually works
- Restart Expo after changing `.env`

The app also follows Metro’s LAN IP for local APIs so a stale `.env` IP is less likely to break the phone.

## Run

```bash
npm install
npx expo start
```

Backend must be running (`banjara-backend` → `npm run dev` on port 5000).

On Windows, Metro's promise-based binary cache is limited to eight concurrent
operations, with bounded retries for `EMFILE`/`ENFILE`. Generated verification
exports are excluded from the watcher. After an interrupted refresh or a package
update, restart with `npm run start:clear`, then fully close and reopen Expo Go to
discard old JavaScript/LogBox instances. `npm run test:runtime` checks the cache
queue, the real Expo cache, and notification runtime support.

Remote push registration runs in native Banjara builds. Expo Go and web retain
the notification inbox and preferences without loading unsupported native push APIs.

## Location picking

Provider and customer location fields share `LocationPinSheet` and `LocationMap`.
Search or GPS positions the map; **Pin location** applies its exact center, then
the form's confirmation button accepts it. Moving the map or choosing another
search/GPS result requires a new pin. The on-map full-screen button and Back
preserve the candidate point. Closing the picker discards unconfirmed changes.

`usePinnedLocationPicker` keeps late address and GPS responses from overwriting a
newer choice. City searches use the selected city; address and stop fields retain
their corresponding address or place name.

Run `npm run test:location` for device-independent hook/control regression checks
(including native-map events and the WebView fallback). Run `npm run typecheck`
and export iOS/Android bundles to check integration. A physical device is still
needed to verify native touch behavior and permissions visually.

## Folders

```
app/            Screens (auth, customer, provider)
components/     UI (search, trips, hotels, maps, chat, seats)
store/          Zustand state
services/       Axios + Socket.IO
hooks/          Data hooks
types/          TypeScript models
constants/      Colors, fonts, place lists
utils/          Formatters and routing
```

## Typecheck

Transportation onboarding saves form edits locally and validates completed steps
on the API. The order is service, business, confirmed location, transporter
details, primary vehicle, CNIC verification, and review. An incomplete profile
resumes at its first unfinished step. Submitted transportation providers wait
for provider approval before entering the dashboard; vehicles retain their own
admin approval status before they can be used for trips.

The primary vehicle reuses signup details and photos. Passenger capacity must be
entered explicitly. CNIC form drafts use `expo-secure-store` (included in Expo
Go), are scoped to the signed-in account, and are cleared after successful
verification or sign-out. No custom native build is required.

Run `npm run test:transport` for mobile store, resume-route, form/navigation and
encrypted-draft checks. In `banjara-backend`, run
`npx vitest run test/transport-onboarding.test.ts` for the authenticated API
journey, interrupted/concurrent saves, validation and permissions. Those tests
use an isolated temporary MongoDB replica set and deterministic OCR output;
they do not access real identity documents or replace a physical Expo Go test.

```bash
npm run typecheck
```
