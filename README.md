# TwoLips

A private couples app where two users share a garden, send pokes with flower animations, and exchange ephemeral photo snaps. Works as a PWA on web (with iOS Add to Home Screen support) and as a native Android app.

## Overview

- Garden poke feature -- tap a flower to send an animated poke to your partner in real time
- Snap feature -- take or pick a photo, send it as a one-time-view ephemeral image
- Real-time updates via Appwrite Realtime subscriptions
- Push notifications on both web (OneSignal) and native (Expo Notifications)
- Two hardcoded users (user_a, user_b) -- designed for a single couple

## Tech Stack

- Expo SDK 54 / React Native (New Architecture enabled)
- React 19, TypeScript
- Expo Router (file-based routing)
- Appwrite (auth, database, storage, realtime)
- OneSignal (web push notifications)
- Expo Notifications (native push)
- Lottie (flower animations)
- Vercel (web hosting and serverless API functions)
- PWA with service workers

## Project Structure

```
app/              Expo Router entry screens (layout, login, home)
api/              Vercel serverless functions (send-poke, send-snap, debug-onesignal)
my-app/src/
  components/     UI components (garden, overlays, camera button)
  config/         Appwrite client, constants, theme
  context/        Auth context providers (.web.ts for web, .ts for native)
  screens/        HomeScreen, LoginScreen
  utils/          Camera, notifications, storage, toast (platform-split files)
assets/           Lottie animation JSON files, app icons
public/           PWA manifest, service workers
```

Platform-specific files use the `.web.ts` / `.ts` convention. Metro automatically resolves the correct file per platform.

## Prerequisites

- Node.js 18+
- npm
- An Appwrite Cloud account (or self-hosted instance)
- A OneSignal account
- A Vercel account (for web deployment)
- (Optional) EAS CLI for native builds: `npm install -g eas-cli`

## Setup

### 1. Clone the repository

```bash
git clone <https://github.com/jayyy404/TwoLips.gitl>
cd TwoLips
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and set:

```
EXPO_PUBLIC_APPWRITE_PROJECT_ID=<your appwrite project id>
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PLATFORM_ANDROID=com.twolips.android
EXPO_PUBLIC_APPWRITE_DATABASE_ID=<your database id>
EXPO_PUBLIC_APPWRITE_BUCKET_TEMPORARY_IMAGES=<your bucket id>
EXPO_PUBLIC_ONESIGNAL_APP_ID=<your onesignal app id>
EXPO_PUBLIC_EAS_PROJECT_ID=<your eas project id>
```

### 4. Set up Appwrite

1. Create a new project in the Appwrite Console
2. Enable Email/Password authentication under Auth > Settings
3. Create two user accounts (these map to user_a and user_b in the app)
4. Create a database, then create the following collections:
   - **garden** -- stores the shared garden poke state
     - Attributes: `last_poked_by` (string), `poke_animation` (string), `poke_count` (integer)
     - Create a single document with ID `our_plot`
   - **temporary_images** -- stores metadata for ephemeral snaps
     - Attributes: `sender_id` (string), `receiver_id` (string), `image_url` (string), `viewed` (boolean, default false), `created_at` (datetime)
   - **users** -- stores push tokens
     - Attributes: `push_token` (string), `platform` (string)
     - Use the Appwrite user ID as the document ID
5. Create a storage bucket for temporary snap images
6. Set permissions on collections and bucket so both users can read/write
7. Copy the Database ID and Bucket ID into your `.env` file

### 5. Set up OneSignal

1. Create a new app in the OneSignal dashboard
2. Configure Web Push:
   - Set your site URL (your Vercel deployment URL)
   - Choose a custom service worker path: `/OneSignalSDKWorker.js`
3. Copy the OneSignal App ID into your `.env` as `EXPO_PUBLIC_ONESIGNAL_APP_ID`
4. Copy the OneSignal REST API Key -- you will set this in Vercel (step 7), not in `.env`

### 6. Run locally

Start the Expo dev server:

```bash
npx expo start
```

- Press `w` to open in browser (PWA/web)
- Press `a` to open on Android (requires emulator or device with Expo Go)

### 7. Deploy to Vercel

1. Link the repo to a Vercel project
2. Set these environment variables in the Vercel dashboard:
   - `ONESIGNAL_APP_ID` -- your OneSignal App ID
   - `ONESIGNAL_API_KEY` -- your OneSignal REST API Key
3. The build command and output directory are already configured in `vercel.json`
4. Deploy

### 8. Build native (optional)

For an Android APK or AAB via EAS Build:

```bash
eas build --platform android --profile preview
```

Make sure your `app.json` has the correct `extra.eas.projectId`.

## Notes

- The app is designed for exactly two users. To change users, update the `USERS` object in `my-app/src/config/constant.ts`.
- Snap images are stored temporarily in Appwrite Storage and are meant to be viewed once.
- The Vercel `/api/send-poke` and `/api/send-snap` endpoints handle sending push notifications server-side using the OneSignal REST API.
