# DukaVerse Mobile

React Native / Expo app for DukaVerse — same Supabase backend as the web app.

## Setup

```bash
npm install
```

Set environment variables in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://iokplwgvpgeuggmrfqhg.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Run

```bash
# Install Expo Go on your phone, then:
npm start

# Android emulator
npm run android

# iOS simulator (Mac only)
npm run ios
```

## Build APK (Android)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```
This produces a `.apk` you can install directly on any Android phone.

## Build for App Store (iOS)

```bash
eas build --platform ios --profile production
```
Requires an Apple Developer account.

## Architecture

- `lib/supabase/client.ts`  — Supabase client with SecureStore session
- `lib/supabase/api.ts`     — All data operations (same logic as web server-actions)
- `lib/supabase/hooks.ts`   — React hooks with real-time subscriptions
- `lib/colors.ts`           — Shared design tokens (same palette as web)
- `lib/translations.ts`     — EN/SW translations (shared with web)
- `app/(auth)/`             — Login screen
- `app/(tabs)/`             — Dashboard, Sales, Inventory, Reports, Profile
- `components/UI.tsx`       — Reusable primitives (StatCard, GoldButton, Input, Badge, etc.)
