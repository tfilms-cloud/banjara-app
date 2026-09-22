# Banjara mobile app

Expo React Native app for **customers** (book transport and hotels) and **service providers** (manage fleet, trips, rooms, bookings).

**Tagline:** Your Journey. Your Seat. Your Way.

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

```bash
npm run typecheck
```
