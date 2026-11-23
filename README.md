# Joinly mobile app

Expo (React Native + TypeScript) app for **Joinly**: teachers sign in with Google, create
classrooms, and onboard students with a **QR code** or a **6-digit joining code**; students sign
in with Google and join by scanning or typing the code. This repository is the mobile app; the
REST API, database and API documentation live in
[wide-impact-joinly-backend](https://github.com/ammarelgml/wide-impact-joinly-backend).

[![CI](https://github.com/ammarelgml/wide-impact-joinly-mobile/actions/workflows/ci.yml/badge.svg)](https://github.com/ammarelgml/wide-impact-joinly-mobile/actions/workflows/ci.yml)

|                          |                                                                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Android APK              | [Latest release](https://github.com/ammarelgml/wide-impact-joinly-mobile/releases/latest)                                                                                      |
| Hosted API (used by APK) | https://wide-impact-joinly-backend-production.up.railway.app                                                                                                                   |
| API documentation        | [Swagger UI](https://wide-impact-joinly-backend-production.up.railway.app/docs), [docs/api.md](https://github.com/ammarelgml/wide-impact-joinly-backend/blob/main/docs/api.md) |
| Development approach     | [docs/approach.md](https://github.com/ammarelgml/wide-impact-joinly-backend/blob/main/docs/approach.md) (backend repo)                                                         |
| AI usage disclosure      | [docs/ai-usage.md](https://github.com/ammarelgml/wide-impact-joinly-backend/blob/main/docs/ai-usage.md) (backend repo)                                                         |

## Demo videos

Recorded on an Android emulator with the release APK against the hosted API, for a look at the app
without installing it:

- [Teacher flow](https://github.com/ammarelgml/wide-impact-joinly-mobile/releases/download/v1.0.0/joinly-teacher-flow.mp4)
  (2:56): demo sign-in, create a classroom, full-screen QR and code, share the QR image or the link,
  regenerate the code, close and reopen joining, roster.
- [Student flow](https://github.com/ammarelgml/wide-impact-joinly-mobile/releases/download/v1.0.0/joinly-student-flow.mp4)
  (2:11): the QR link on a phone without the app, the same link opening Joinly, demo sign-in, join a
  class, "already in this class", the scanner, leave.

Google sign-in works for any Google account; the **Teacher demo** and **Student demo** buttons are
there for faster checks.

## Design files

The UI was designed before the build, and the design handoff is in [`docs/design/`](docs/design):

- [`design-brief.md`](docs/design/design-brief.md): the brief the design was made from.
- [`spec/joinly-handoff-spec.md`](docs/design/spec/joinly-handoff-spec.md): tokens, components, every
  screen and state, accessibility and copy.
- [`screens/`](docs/design/screens): one PNG per screen state (teacher T1 to T5, student P1 to P6,
  sign-in S1 to S4, global states), plus full boards in [`screens/_boards/`](docs/design/screens/_boards).
- [`code/theme.ts`](docs/design/code/theme.ts) and [`tokens/`](docs/design/tokens): the design tokens
  that `src/ui/theme.ts` is built from. [`canvas-source/`](docs/design/canvas-source) is the design
  canvas source, for reference only.

The app follows the design with the differences listed under [Known limitations](#known-limitations):
light theme and English only. The QR now encodes an https link instead of the `joinly://` link the
design shows, so it also works on phones without the app.

## Overview

| Teacher                                                                               | Student                                                                     |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Sign in with Google, choose "Teacher" once                                            | Sign in with Google, choose "Student" once                                  |
| Create, edit and delete classrooms                                                    | Join by scanning the QR code (in-app scanner or the phone's camera app)     |
| Show a classroom's 6-digit code and a full-screen QR, share the QR image or the link  | Join by typing the 6-digit code (paste supported, submits on the 6th digit) |
| Watch students appear live on the invite screen (screen stays awake, full brightness) | See the class (name, teacher, student count) before confirming              |
| Open or close joining, make a new code (the old code and QR stop working)             | See joined classes, leave a class                                           |
| See the roster, remove a student (then optionally make a new code)                    |                                                                             |

Every data screen has loading (skeletons), empty, error-with-retry and offline states. Errors are
shown on the screen where they happen, in one sentence that says what to do next.

## Technologies

| Concern           | Choice                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework         | Expo SDK 58, React Native 0.88, React 19, TypeScript (strict, `noUncheckedIndexedAccess`)                                                               |
| Navigation        | Expo Router (file-based), role routing with `Stack.Protected` guards, Android App Link `https://<api>/join?code=…` (plus legacy `joinly://join?code=…`) |
| Server state      | TanStack Query (caching, pull to refresh, optimistic updates, polling while a live screen is open)                                                      |
| Client state      | zustand, for the session only                                                                                                                           |
| API client        | `openapi-fetch` typed by `openapi-typescript`, generated from the API's OpenAPI 3.1 document                                                            |
| Forms             | react-hook-form + zod (same limits as the API, checked by a test)                                                                                       |
| Auth              | `@react-native-google-signin/google-signin` (native Google sign-in), `expo-secure-store` (Keystore)                                                     |
| QR                | `react-native-qrcode-svg` (show), `expo-camera` `CameraView` (scan)                                                                                     |
| UI                | Own components built from the Joinly design handoff: its tokens (`src/ui/theme.ts`), Inter via `@expo-google-fonts/inter`, Ionicons                     |
| Device            | `expo-keep-awake`, `expo-brightness`, `expo-screen-orientation` (invite screen), `expo-haptics`, `expo-clipboard`, `@react-native-community/netinfo`    |
| Tests and quality | Jest (`jest-expo`), React Native Testing Library, ESLint (`eslint-config-expo`), Prettier, GitHub Actions                                               |
| Builds            | EAS Build (`preview` profile produces the APK)                                                                                                          |

## Architecture

```
src/
  app/                    Routes only (Expo Router). Each file re-exports a screen from features/.
    _layout.tsx           Providers, session restore, role guards
    join.tsx              Invite link target (https://<api>/join?code=… and joinly://join?code=…)
    teacher/              Teacher stack: classrooms, classroom, invite, create/edit
    student/              Student stack: classes, scan, enter code, confirm, class
  api/
    schema.gen.ts         Generated from openapi/openapi.json. Never edited by hand.
    client.ts             Typed client + unwrap() that turns failures into ApiError
    auth-fetch.ts         Bearer token, single-flight refresh on 401, one retry
    errors.ts, messages.ts  ApiError (stable server `code`) and one-sentence user messages
    query-client.ts       Query defaults (retry only network/5xx), query keys
  features/
    auth/                 Session store, Google sign-in, welcome, role, profile
    classrooms/           Teacher queries/mutations and screens
    enrollments/          Student queries/mutations and screens
    join/                 QR payload parsing, code input, scanner, code entry, join confirm
  lib/                    Config (validated at startup), formatting, small hooks
  ui/                     Design tokens (theme.ts) and shared components
test/                     Unit and component tests
openapi/openapi.json      Copy of the API contract the app is built against
```

**How the app talks to the backend.** Every request goes through one typed client generated from
the backend's OpenAPI document, so a wrong path, parameter or body is a compile error, and CI fails
if the deployed API's contract changes without the app being updated. Errors come back as RFC 9457
problem details with a stable `code` (`JOIN_CODE_EXPIRED`, `JOINING_CLOSED`, `RATE_LIMITED`, …);
screens branch on that code, never on message text.

**Sign-in and session.** Native Google sign-in returns an ID token for the Web client ID; the app
sends it to `POST /v1/auth/google`. A new user gets `422 ROLE_REQUIRED`, picks Teacher or Student,
and the app resends the same token with the role. The API then issues a 15-minute access token
(kept in memory only) and a 30-day rotating refresh token (stored in the Android Keystore via
`expo-secure-store`). On `401 TOKEN_EXPIRED` the client refreshes once and retries; concurrent
requests share that single refresh, because the API treats a reused refresh token as theft and
revokes the session. A rejected refresh token signs the user out with "Please sign in again".
The saved session is restored without a network call, so the app opens instantly and offline.

**Joining.** A QR encodes `https://<api host>/join?code=482913`. Android opens it in Joinly through a
verified App Link (`autoVerify` intent filter in `app.json`; the API serves
`/.well-known/assetlinks.json` with the signing certificate). On a phone without the app, the camera
opens the API's small web page with the code, a download link and an "Open in Joinly" button. Older
QRs with `joinly://join?code=…` still work. Scanned data is untrusted, so `parseJoinUrl` accepts only
those two forms, https only on the API's own host, with one 6-digit code (unit-tested against
hostile input). A scanned QR, a link opened by the phone's camera app, and a typed code all reach the
same preview call, then the same join call. A link opened while signed out is kept through sign-in
and role choice, then lands on the join confirm.

## Setup

**Requirements:** Node.js 22+, npm 10+, Android Studio with an emulator or an Android phone with
USB debugging, and an [Expo account](https://expo.dev) only if you build with EAS.

Native Google sign-in and the camera need a development build; Expo Go is not supported.

```bash
git clone https://github.com/ammarelgml/wide-impact-joinly-mobile.git
cd wide-impact-joinly-mobile
npm install
cp .env.example .env        # points at the hosted API by default
```

### Backend and database

The app works against the hosted API out of the box. To run your own backend and PostgreSQL
database (Docker one-liner or local Node), follow the
[backend README](https://github.com/ammarelgml/wide-impact-joinly-backend#setup), then set
`EXPO_PUBLIC_API_URL` in `.env` (from an Android emulator, the host machine is `http://10.0.2.2:3000`).
The database schema, migrations and seed script live in the backend repository.

### Environment variables

All values are public (they ship inside the app); no secrets belong in this repository.

| Variable                           | Purpose                                                                                             |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`              | Base URL of the Joinly API                                                                          |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google OAuth Web client ID; the audience of the ID token, matching the API's `GOOGLE_WEB_CLIENT_ID` |
| `EXPO_PUBLIC_DEMO_LOGIN_ENABLED`   | `true` shows "Demo accounts" on the welcome screen (the API must have `DEMO_LOGIN_ENABLED=true`)    |

Local runs read `.env`; EAS builds take the values from the profiles in [`eas.json`](eas.json).
The app validates them at startup and refuses to start with a clear message if one is missing.

### Run on Android

```bash
npm run android     # expo run:android: builds the native app, installs it, starts Metro
```

After the first native build, `npm start` is enough while you only change JavaScript.

### Build the APK

```bash
npm install -g eas-cli && eas login
eas build --platform android --profile preview
```

The `preview` profile produces an installable APK against the hosted API with demo sign-in on.

**Google sign-in on Android** needs an OAuth client of type _Android_ in the same Google Cloud
project as the Web client, with package name `com.ammarelgml.joinly` and the SHA-1 of the signing
key (`eas credentials -p android` shows it). Without it, Google sign-in fails with
`DEVELOPER_ERROR`; demo sign-in keeps working.

### iOS

The code is cross-platform, but no iOS build is provided (no Apple developer account in the time
box). To run it on the iOS simulator on a Mac: create an _iOS_ OAuth client for bundle ID
`com.ammarelgml.joinly`, add the Google sign-in config plugin with its reversed client ID to
`app.json` (`["@react-native-google-signin/google-signin", { "iosUrlScheme": "com.googleusercontent.apps.…" }]`),
add that client ID to the API's `GOOGLE_WEB_CLIENT_ID` list, then run `npm run ios`.

## Tests and checks

```bash
npm test            # Jest: unit and component tests
npm run lint        # ESLint + Prettier
npm run typecheck   # tsc --noEmit
npm run api:sync    # refresh openapi/openapi.json from the API and regenerate src/api/schema.gen.ts
```

The tests cover the logic that breaks silently: QR payload parsing against hostile input, the
auth fetch (token attach, refresh on 401, one retry, one shared refresh for parallel requests),
the session (Keystore storage, restore, rotation, sign-out, expiry), the Google sign-in branches
(cancelled, returning, role required), error-code-to-message mapping, the code input (paste,
auto-submit), invite states, and the form limits against the API contract. CI runs lint,
typecheck, tests, the generated-types check, an Android bundle build, a contract check against
the live API, and a secret scan.

## Test accounts

1. **Your own Google account.** Sign in and choose Teacher or Student once. Use two Google
   accounts (one per role) on two phones for the full flow.
2. **Demo accounts**, no Google needed. On the welcome screen tap **Demo accounts**, then
   **Teacher demo** or **Student demo**:

| Account      | Name             | Seeded data                                                                             |
| ------------ | ---------------- | --------------------------------------------------------------------------------------- |
| Teacher demo | Ms. Amira Hassan | "Grade 8 Science" (joining open, 3 students) and "Grade 9 Mathematics" (joining closed) |
| Student demo | Omar Khaled      | Enrolled in "Grade 8 Science"                                                           |

A third classroom, **"Arabic Literature"**, belongs to another teacher and has the fixed join
code **`246810`** (valid 30 days), so the demo student can test joining on one device.

## Testing QR code and numeric code onboarding

**Numeric code, one device**

1. Sign in as **Student demo**.
2. Tap **Join a class**, then **Enter code**, and type `246810` (or tap **Paste code** with
   `246 810` copied). It checks the code as soon as the sixth digit is in.
3. The confirm screen shows "Arabic Literature" by Mr. Youssef Nabil. Tap **Join class**.
4. "You're in" shows, then the class opens and appears in My classrooms. Entering the code again shows
   "You're already in this class". **Leave class** removes it.

**QR code, two devices**

1. Phone A: sign in as a teacher (or **Teacher demo**), open a classroom, tap **Show QR code**.
2. Phone B: sign in as a student, tap **Join a class**, then **Scan QR code**, and point it at
   phone A. You can also scan with the phone's own camera app, which opens the link in Joinly
   (on a phone without the app it opens a web page with the code and a download link).
3. Tap **Join class** on phone B. Phone A's "students joined" counter updates within 2 seconds.

**QR code, one device:** scan this QR (code `246810`) from another screen or a printout:

<img src="docs/assets/demo-join-qr.png" alt="Join QR for code 246810" width="200" />

**Edge cases worth trying**

- Teacher taps **Share** on the invite screen: **Share QR image** sends a picture of the QR with
  the class name and code (WhatsApp or any app); **Share code and link** sends text.
- Teacher taps **Regenerate** on the invite screen: the old code and QR stop working at once.
- Teacher turns **Joining open** off: the invite hides the QR and code, and students see
  "Joining is closed".
- Five wrong codes within 15 minutes: entry is blocked with a countdown.
- Scanning any other QR code: "That's not a Joinly code", and the scanner keeps going.
- Denying camera permission: the scanner offers **Open settings** and **Enter code instead**.
- Airplane mode: an offline strip appears under the app bar, cached screens stay readable and
  actions that need the network are disabled.
- Teacher removes a student: the app offers to regenerate the code, so the student can't rejoin.
- Editing a classroom and closing without saving asks "Discard your changes?" first.
- Turning the phone sideways on the invite screen switches to a landscape layout.

## Known limitations

- **iOS is not built or device-tested.** The code is cross-platform; see [iOS](#ios).
- **Live updates use polling** (every 2 s on the invite screen, every 5 s on the classroom screen,
  only while that screen is open), not push or WebSockets. Other screens refresh on focus and pull
  to refresh.
- **Without the app, the QR opens a web page, not a join.** A phone without Joinly (including any
  iPhone, since there is no iOS build) sees the code and a link to download the Android APK. App
  Links verification covers the EAS signing key; a Play Store release would add Play's signing key
  to `assetlinks.json`.
- **Changing the system font size in the first seconds after installing or updating the app** can
  restart the app's JavaScript root before navigation is ready, and the next tap may close the app
  (an expo-router issue with Android re-creating the root). Font size, display size and language
  changes at any other time are handled in place (`plugins/with-android-config-changes.js`).
- **No offline writes.** Reading cached data works offline; creating, joining and leaving need a
  connection.
- **Role is permanent.** An account is a teacher or a student, chosen once; changing it is an admin
  task. No co-teachers.
- **No in-app account deletion** or push notifications.
- **Light theme only**, English only. The design includes dark and Arabic (right-to-left) versions;
  colours, type and spacing come from its tokens (`src/ui/theme.ts`, dark palette included) and
  layouts use start/end, so both are additive work.
- The web build is used only for local screen smoke tests and is not a supported target.
