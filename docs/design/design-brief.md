# Joinly — UI/UX design brief

Design the screens for **Joinly**, a mobile app (Android first, phone, portrait) built with Expo / React Native.

**What it does.** Teachers sign in with Google, create classrooms, and invite students with a QR code or a 6-digit numeric code. Students sign in with Google and join a classroom by scanning the QR code or typing the code. Each account is either a teacher or a student, chosen once at first sign-in.

**Product context.** Teachers use it in front of a class, often projecting or holding up the phone, so the invite screen must read from 3 metres away. Students use it once or twice to join, so joining must take under 15 seconds with no instructions. The interface should be professional with good usability, not visual flourish.

## Design principles

- One primary action per screen, always in thumb reach.
- Errors say what happened and what to do next, in one sentence, on the screen where they happened.
- Skeletons for loading lists, not spinners on blank screens.
- Destructive actions (delete class, remove student, regenerate code, leave class) always confirm, with the consequence stated.
- Accessible: 4.5:1 text contrast, 48 dp touch targets, screen-reader labels, no information by colour alone.
- Use design tokens (colour, type, spacing, radius) so dark mode and right-to-left (Arabic) layouts are cheap later.

## Key flows

**First sign-in.** Welcome → Continue with Google → (new users only) Choose your role → empty home screen with one clear next action. If the app was opened from a QR link, the student lands on the join confirm screen after sign-in.

**Teacher invites students.** My classrooms → New classroom (name, optional description) → Classroom screen with an invite card (6-digit code, Show QR) → full-screen Invite with a large QR and code; the student count ticks up live as students join → teacher turns "Joining open" off when everyone is in.

**Student joins.** My classrooms → Join a class → Scan QR or Enter code → Join confirm (class name, teacher, student count) → Join → classroom opens. If already a member: "You're already in this class" with Open class. Errors stay on the same screen: invalid code, expired code ("ask your teacher for a new one"), joining closed, or too many attempts (with a countdown).

**Managing membership.** Teacher removes a student (confirm, then offer "Also regenerate the code?"). Student leaves a class (confirm).

Codes expire 24 hours after they are created; the teacher can regenerate at any time, which stops the old code and QR working.

## Screens and states (15 screens)

Every data screen needs its loading, empty, error and offline state designed, not only the happy path.

### Shared

| # | Screen | What it shows | Actions | States to design |
| --- | --- | --- | --- | --- |
| S1 | Launch | App mark while the saved session is restored. | None | Restoring; failed restore goes to S2. |
| S2 | Welcome and sign in | App name, one-line value, Continue with Google. In the review build, a small "Demo accounts" link opening a sheet with Teacher and Student. | Sign in; demo sign-in | Idle; signing in; cancelled (no error); failed with retry; offline. |
| S3 | Choose your role | Two large cards: Teacher ("Create classes and invite students") and Student ("Join your classes"). Note that it can't be changed later. | Pick a role, confirm | Selected; submitting; error. Shown only on first sign-in. |
| S4 | Profile sheet | Photo, name, email, role badge, app version. | Sign out | Signing out. |

### Teacher

| # | Screen | What it shows | Actions | States to design |
| --- | --- | --- | --- | --- |
| T1 | My classrooms | Classroom cards: name, student count, joining open or closed. Header with profile avatar. | New classroom (primary); open a class; pull to refresh | Loading skeleton; empty ("Create your first classroom" with the action); list; error with retry; offline banner. |
| T2 | New or edit classroom | Name (required, up to 80 characters, with counter), description (optional, up to 500). | Save; cancel | Pristine; invalid with inline message; saving; server error. Edit mode adds Delete classroom at the bottom. |
| T3 | Classroom | Title and description; invite card with the 6-digit code, copy, Show QR, expiry; "Joining open" switch; roster header with count; roster rows (photo, name, email, joined date). | Show QR; copy code; toggle joining; edit; open a student's menu (Remove) | Loading; empty roster ("No students yet" with Show QR); roster; joining closed (invite card dimmed with explanation); code expired (invite card shows Regenerate); error. |
| T4 | Invite (full screen) | Very large QR, code in large spaced digits (482 913), class name, "Expires in 18 hours", live counter "12 students joined" that ticks up. | Share (code and link); Regenerate; close | Live; regenerating; code expired; joining closed (QR hidden, "Turn on joining"). Screen stays awake. |
| T5 | Confirm dialogs | Delete classroom; Remove student (then "Also regenerate the code?"); Regenerate code ("The current code and QR will stop working"). | Confirm; cancel | Confirming; error. |

### Student

| # | Screen | What it shows | Actions | States to design |
| --- | --- | --- | --- | --- |
| P1 | My classrooms | Class cards: name, teacher name and photo, joined date. Header with profile avatar. | Join a class (primary, opens a choice of Scan QR or Enter code); open a class; pull to refresh | Loading skeleton; empty ("Join your first class" with both Scan QR and Enter code); list; error; offline. |
| P2 | Scan QR | Full-screen camera with a framing guide, torch toggle, "Enter code instead". | Scan; torch; switch to P3 | Asking permission (explain why first); permission denied (Open settings, and Enter code instead); scanning; not a Joinly code (toast, keep scanning); found (haptic, go to P4). |
| P3 | Enter code | Six digit boxes, numeric keypad, paste support. | Submit (automatic on the sixth digit) | Empty; typing; checking; invalid code; expired code; too many attempts with a countdown to retry. |
| P4 | Join confirm | Class name, description, teacher name and photo, student count. | Join (primary); cancel | Loading preview; ready; joining; already a member (Open class instead); joining closed; error. |
| P5 | Classroom (student) | Class name, description, teacher, "Joined 3 days ago", student count. | Leave class (with confirm) | Loading; ready; leaving; removed or deleted since last view ("This class is no longer available"). |
| P6 | Joined | Brief success moment after P4, then into P5. | Continue | Can be a transition instead of a screen; designer's call. |

**Global states.** An offline banner on any screen that needs the network. Session expired returns to S2 with "Please sign in again" and keeps any pending join code. A QR link opened while signed out goes S2, then S3 if new, then P4.

## What we need back

1. A small design system: colour, type scale, spacing, radius, and core components (buttons, inputs, cards, list rows, banners, dialogs, the 6-digit code input, the QR display).
2. All 15 screens above with their states.
3. Light theme first; dark mode optional.
