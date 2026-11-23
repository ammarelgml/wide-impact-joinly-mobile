# Joinly — developer handoff spec

Exported 22 Nov 2026. Live version (source of truth if this file and the doc ever differ): https://claude.ai/artifact/Pe14HLuGEHPiasJHkvfNCx

## Overview

Build Joinly's Expo / React Native app from this spec and the design canvas: the canvas is the source of truth for layout, this spec is the source of truth for tokens, behaviour, accessibility and copy. Tokens ship as `code/theme.ts` (and `tokens/tokens.json`). Light theme is the launch target; dark mode and Arabic right-to-left are already designed and cost only token and string work.

| What | Where |
| --- | --- |
| All 15 screens and every state | `screens/<screen>/` PNGs, or the [design canvas](https://claude.ai/artifact/BhXGKfePa7QF1zhGUCDdkz) (pages Shared, Teacher, Student) |
| Tokens and components | `screens/_boards/Foundations.png`, `screens/_boards/Components.png` |
| Arabic RTL check | `screens/AR-RTL/` |
| Clickable student join flow, with a 15 s stopwatch | Canvas page Prototype (press Play) |
| Tokens as code | `code/theme.ts`, `tokens/tokens.json` |

Reference device: Android phone, portrait, 360 × 800 dp. Screen IDs (S1–S4 shared, T1–T5 teacher, P1–P6 student) match the brief and the canvas.

## Design tokens

Components reference tokens only, never raw hex, so dark mode is a token swap. Every text pair below passes WCAG 4.5:1 in both themes and input borders pass 3:1 (ratios on the Foundations board). The QR always renders black on `#FFFFFF`, in both themes.

### Colour

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| bg | #F5F6F8 | #101318 | Screen background |
| surface | #FFFFFF | #181C23 | Cards, sheets, bars |
| surface2 | #EDEFF2 | #222731 | Tonal fills, disabled fills |
| ink | #121722 | #EEF1F5 | Primary text and icons |
| ink2 | #525B68 | #A8B0BC | Secondary text |
| line | #DDE1E6 | #2B313B | Dividers, card edges |
| lineStrong | #848D9A | #6E7786 | Input borders, unselected radio and switch |
| primary | #2F5BEA | #86A2FF | Primary buttons, links, focus ring |
| onPrimary | #FFFFFF | #0A1433 | Text on primary |
| primarySoft | #E7EDFD | #1E2A4D | Selected card, info banner, tonal button |
| onPrimarySoft | #1D3FAE | #C3D0FF | Text on primarySoft |
| success | #1B7A4B | #5FCB91 | Joining open, joined |
| successSoft | #E2F2E9 | #13301F | Success fills, live counter |
| danger | #BD372C | #FF8F84 | Destructive actions, errors |
| onDanger | #FFFFFF | #2A0A07 | Text on danger |
| dangerSoft | #FBE8E6 | #3B1815 | Error banners |
| warning | #8A5A00 | #F0C05A | Code expired, rate limit |
| warningSoft | #FCF0D6 | #33270C | Warning banners |
| inverse | #1E232C | #E9EDF2 | Offline strip, toast |
| onInverse | #F3F5F8 | #14181E | Text on inverse |
| scrim | rgba(12,16,24,.56) | rgba(0,0,0,.64) | Behind sheets |
| skeleton | #E2E5EA | #262C36 | Skeleton blocks |

### Type (Inter; Arabic: IBM Plex Sans Arabic, same sizes)

Sizes are sp, so they follow Android font scaling. Arabic sets letter-spacing to 0 and body line height to 26.

| Token | Size / line | Weight | Tracking | Example |
| --- | --- | --- | --- | --- |
| display | 32 / 40 | 700 | −1.5% | Joinly, You’re in |
| title | 24 / 32 | 700 | −1% | Screen and empty-state titles |
| headline | 20 / 28 | 600 | 0 | App bar title, sheet title |
| subhead | 17 / 24 | 600 | 0 | Card and row names |
| body | 16 / 24 | 400 | 0 | Inputs, body copy |
| body2 | 15 / 22 | 400 | 0 | Secondary copy (ink2) |
| label | 14 / 20 | 600 | 0 | Field labels, section labels |
| caption | 13 / 18 | 500 | 0 | Helper text, meta (ink2) |
| codeL | 32 / 40 | 700 | +8%, tabular | Invite card code |
| codeXL | 60 / 68 | 700 | +6%, tabular | Invite screen code |

Codes always render as two groups of three (482 913), tabular figures, and left-to-right in every locale.

### Spacing, radius, elevation, motion

- **Spacing (dp):** 4, 8, 12, 16, 24, 32, 48. Screen side margin 16; card padding 16 (hero cards 20); stack gaps 8, 12 or 16.
- **Radius (dp):** sm 8 (skeleton, keypad keys) · md 12 (buttons, inputs, code cells, banners) · lg 16 (cards, lists, QR plate, FAB) · xl 28 (sheet top corners) · full (pills, avatars, switch).
- **Elevation:** flat cards with a 1 dp `line` edge; shadow only on the FAB (y 6, blur 16, 20% black) and toasts (y 8, blur 24, 24%).
- **Motion:** skeleton pulse 1.4 s; live-dot pulse 1.6 s; spinner 0.8 s per turn; sheets slide up 250 ms ease-out. With Android “remove animations” on, pulses and spinners stop and sheets appear without sliding.

## Platform and layout rules

Every screen has one primary action, and it sits in the bottom third: a bottom bar, an extended FAB, or the bottom of a sheet. Nothing important goes in the top-right corner.

- **Screen anatomy:** safe-area top inset, then a 56 dp app bar (back or close, title, up to one icon action), then scrolling content with 16 dp side margins, then a bottom action area (16 dp sides, 12 dp top, 28 dp bottom plus the gesture-bar inset).
- **Bottom bar:** on T2 and T3 it has a `surface` background and a 1 dp top border, and the content scrolls under it. It sits above the keyboard when the keyboard is open.
- **Extended FAB:** on T1 and P1 lists, 56 dp tall, 16 dp from the end and bottom edges. It's hidden on empty states, where a full-width button replaces it.
- **Sheets:** bottom sheets for every confirm and chooser, with a drag handle, 24 dp padding, and the destructive or primary action on top with Cancel below. Tapping the scrim or pressing system back cancels, except while an action is running.
- **Touch targets:** 48 × 48 dp minimum; buttons are 52 dp tall and full width in action areas.
- **Font scaling:** test at 200%. Titles wrap; single-line names (cards, rows, app bars) ellipsize; codes never wrap and step down from codeXL to codeL when they don't fit.
- **Right-to-left:** use start/end (never left/right) for padding, margins, positioning and alignment. Mirror back arrows, chevrons, the switch and FAB icon order. Never mirror the 6-digit code, the number keypad, the QR, email addresses or other Latin strings (wrap them as left-to-right isolates).
- **Dark mode:** follow the system setting. Swap tokens only; the QR plate stays white.
- **Invite screen (T4):** keep the screen awake while it's open and raise brightness to full; restore both on exit.
- **Orientation:** portrait, except T4, which also supports landscape: QR on the start side; class name, code, counter, joining switch and actions on the end side.

## Components

Seventeen components cover all 15 screens; build these first and the screens are assembly. Each one is drawn with its states in `screens/_boards/Components.png`.

| Component | Props and variants | States | Notes |
| --- | --- | --- | --- |
| Button | variant: primary, secondary, tonal, text, danger, dangerText · icon? · fullWidth (default true) | default, pressed, busy, disabled | Busy keeps its width and shows a spinner plus a verb-ing label (Joining…). Disabled uses surface2 / ink2. |
| ExtendedFab | label, icon | default, disabled | Lists only; replaced by a full-width button on empty states. |
| IconButton | icon, accessibilityLabel, tonal? | default, pressed, disabled | 48 dp target, 24 dp icon. |
| TextField | label, placeholder, helper?, maxLength, counter?, multiline? | default, focused, filled, error, read-only (saving) | Error text sits under the field with an icon and is linked as its description. |
| CodeInput | value, onComplete, error?, locked? | empty, typing, complete (checking), error, locked | One real input (`inputMode="numeric"`, `autoComplete="one-time-code"`, `maxLength=6`) under six 44 × 60 dp cells split 3+3. Calls onComplete on the sixth digit; accepts paste of 6 digits with or without a space. |
| ClassroomCard (teacher) | name, studentCount, joiningOpen | default, pressed, skeleton | Status pill: dot + “Joining open” or lock + “Joining closed”. |
| ClassCard (student) | name, teacherName, teacherPhoto, joinedAt | default, pressed, skeleton | Teacher on line 2, joined date on line 3. |
| RosterRow | name, email, photo, joinedAt, onMenu | default, skeleton | Menu button label: “Options for {name}”. |
| InviteCard | code, expiresAt, status: live, closed, expired | live, closed (dimmed), expired | Copy button only when live. |
| StatusPill | kind: open, closed, expired, role | — | Always icon or dot plus text. |
| LiveCounter | count | idle, ticking | Announces politely on change. |
| Switch row | title, subtitle, value | on, off, disabled | Subtitle states the effect (“New students can’t join”). |
| Banner / OfflineStrip / Toast | kind: error, warning, info, success · message | — | Banner stays until fixed; toast 3 s; offline strip under the app bar while offline. |
| ConfirmSheet | title, body, confirmLabel, confirmKind: danger or primary, cancelLabel | idle, confirming, error | Error appears inside the sheet; confirm becomes “Try again”. |
| QrDisplay | value, size | live, regenerating, expired, hidden | White plate, 12 dp quiet zone, error correction M. |
| Skeleton | width, height, radius | pulsing | Mirror the real layout block for block. |
| Avatar | photoUrl?, name, size: 28, 40, 72 | photo, initials | Initials while the Google photo loads or when there is none. |

## Screens

The 15 screens with every state to build; each state has a PNG in `screens/<screen>/`. Loading, empty, error and offline exist on every screen that loads data.

| ID | Screen | States | Primary action | Leads to |
| --- | --- | --- | --- | --- |
| S1 | Launch | Restoring | — | Home if the session restores, else S2 |
| S2 | Welcome and sign in | Idle (also cancelled), signing in, failed, offline, demo accounts sheet (review build) | Continue with Google | S3 if new, else home; P4 if opened from a QR link |
| S3 | Choose your role | Nothing selected, selected, submitting, error | Continue as {role} | T1 or P1 (P4 if a join is pending) |
| S4 | Profile sheet | Default, signing out | Sign out | S2 |
| T1 | My classrooms (teacher) | Loading, empty, list, error, offline, pull to refresh | New classroom | T2, T3 |
| T2 | New or edit classroom | Pristine, invalid, saving, server error, edit mode, keyboard open, discard changes? | Save | T3; Delete classroom → T5 |
| T3 | Classroom (teacher) | Loading, empty roster, roster, student menu, joining closed, code expired, error | Show QR code (or Turn on joining / Regenerate code) | T4, T2, T5 |
| T4 | Invite (full screen) | Live, regenerating, code expired, joining closed, landscape | Share | Back to T3 |
| T5 | Confirm sheets | Delete classroom, remove student, also regenerate?, regenerate code, confirming, error | The named action | Back to T1, T3 or T4 |
| P1 | My classrooms (student) | Loading, empty, list, join sheet, error, offline | Join a class | P2, P3, P5 |
| P2 | Scan QR | Before permission, permission denied, scanning, not a Joinly code, found | (scans automatically) | P4; Enter code → P3 |
| P3 | Enter code | Empty, typing, checking, invalid, expired, too many attempts | (submits on the 6th digit) | P4 |
| P4 | Join confirm | Loading preview, ready, joining, already a member, joining closed, error | Join class | P6; Open class → P5 |
| P5 | Classroom (student) | Loading, ready, leave confirm, leaving, no longer available | Leave class (text button) | P1 |
| P6 | Joined | Success moment | Continue (auto after 1.5 s) | P5 |

Global states (`screens/G-Global/`): the offline strip on any network screen; session expired returns to S2 with “Please sign in again” and keeps a pending join code; a QR link opened while signed out goes S2 → S3 (if new) → P4.

## Accessibility

Target: WCAG 2.1 AA, verified with TalkBack and at 200% font size before release.

- **Contrast:** use only the token pairs in Design tokens; all pass 4.5:1 for text and 3:1 for borders in both themes.
- **Never colour alone:** joining status, errors and selection always carry an icon or dot plus words; selected role cards add a check mark.
- **Targets:** 48 × 48 dp minimum, including the copy button, row menus and the torch.
- **Focus order:** follows reading order; when a sheet opens, focus moves to its title and is trapped in the sheet; on close it returns to the control that opened it.
- **Errors:** inline errors are announced (`accessibilityLiveRegion="assertive"`) and linked to their field; banners announce politely.

| Element | Screen-reader behaviour |
| --- | --- |
| Invite code (T3, T4) | Read digit by digit: “Code 4 8 2 9 1 3”, not “four hundred eighty-two thousand”. |
| Code input (P3) | Label “Class code, 6 digits”; after each digit announce “{n} of 6 digits entered”. Cells are hidden from the reader. |
| QR image (T4) | “QR code to join {class name}”. |
| Live counter (T4) | Polite live region: “{n} students joined”, at most once every 5 s. |
| Joining switch | Role switch, label “Joining open”, state on/off. |
| Role cards (S3) | Radio group “Choose your role”; each card is a radio with title and description. |
| Icon buttons | Back, Close, Copy code, Edit classroom, Options for {name}, Torch (pressed state), Profile and sign out. |
| Skeletons | Hidden from the reader; the container says “Loading” once. |
| Pull to refresh (T1, P1) | Announce “Refreshing classrooms”. |
| Scanner (P2) | Instruction text is a status region; on found announce “Code found”. |
| Countdown (P3 locked) | Announce the start and when trying is allowed again, not every second. |

## Copy deck

Where the canvas and this table differ, this table wins. Arabic is gender-neutral: verbal nouns or “يُرجى” instead of imperatives, and “المعلّم/ة” for the teacher. Counts use ICU plural rules (Arabic has six forms); digits are Western 0–9 in both languages.

### Buttons

| English | Arabic |
| --- | --- |
| Continue with Google | المتابعة باستخدام Google |
| Continue | متابعة |
| Cancel | إلغاء |
| Try again / Retry | المحاولة مرة أخرى |
| New classroom | فصل جديد |
| Save / Save changes | حفظ / حفظ التعديلات |
| Show QR code | عرض رمز QR |
| Share | مشاركة |
| Regenerate code | إنشاء رمز جديد |
| Turn on joining | فتح الانضمام |
| Join a class | الانضمام إلى فصل |
| Scan QR code / Enter code | مسح رمز QR / إدخال الرمز |
| Enter code instead | إدخال الرمز بدلًا من ذلك |
| Allow camera / Open settings | السماح بالكاميرا / فتح الإعدادات |
| Paste code | لصق الرمز |
| Join class / Open class | الانضمام إلى الفصل / فتح الفصل |
| Leave class / Stay in class | مغادرة الفصل / البقاء في الفصل |
| Delete classroom / Remove student | حذف الفصل / إزالة الطالب/ة |
| Discard / Keep editing | تجاهل / متابعة التعديل |
| Sign out | تسجيل الخروج |

### Messages

| Where | English | Arabic |
| --- | --- | --- |
| S2 tagline | Create classes and join them with a code or a scan. | إنشاء الفصول والانضمام إليها برمز من 6 أرقام أو بالمسح. |
| S2 caption | Teachers and students use the same sign-in. | المعلمون والطلاب يسجّلون الدخول بالطريقة نفسها. |
| S2 failed | Couldn’t sign in with Google. Check your connection and try again. | تعذّر تسجيل الدخول باستخدام Google. يُرجى التحقّق من الاتصال ثم المحاولة مرة أخرى. |
| S2 offline | Connect to the internet to sign in. | يلزم الاتصال بالإنترنت لتسجيل الدخول. |
| Session expired | Your session expired. Please sign in again. | انتهت الجلسة. يُرجى تسجيل الدخول مرة أخرى. |
| S3 title | How will you use Joinly? | طريقة استخدام Joinly |
| S3 teacher card | Teacher — Create classes and invite students | معلّم/ة — إنشاء الفصول ودعوة الطلاب |
| S3 student card | Student — Join your classes | طالب/ة — الانضمام إلى الفصول |
| S3 note | Your role can’t be changed later. | لا يمكن تغيير الدور لاحقًا. |
| S3 error | Couldn’t save your role. Check your connection and try again. | تعذّر حفظ الدور. يُرجى التحقّق من الاتصال ثم المحاولة مرة أخرى. |
| Offline strip | You’re offline. Showing what was last loaded. | لا يوجد اتصال بالإنترنت. يظهر آخر ما تم تحميله. |
| T1 empty | Create your first classroom. Then invite students with a QR code or a 6-digit code. | إنشاء أول فصل. ثم دعوة الطلاب برمز QR أو برمز من 6 أرقام. |
| T1 error | Couldn’t load your classrooms. Check your connection and try again. | تعذّر تحميل الفصول. يُرجى التحقّق من الاتصال ثم المحاولة مرة أخرى. |
| T1 refreshing (screen reader) | Refreshing classrooms | جارٍ تحديث الفصول |
| T2 name helper | Students see this name. | يظهر هذا الاسم للطلاب. |
| T2 name error | Add a class name to continue. | يلزم إدخال اسم الفصل للمتابعة. |
| T2 save error | Couldn’t save the classroom. Your changes are still here — try again. | تعذّر حفظ الفصل. التعديلات محفوظة هنا، يُرجى المحاولة مرة أخرى. |
| T2 discard | Discard your changes? The class name and description you typed won’t be saved. | تجاهل التغييرات؟ لن يُحفظ اسم الفصل والوصف. |
| T3 expiry | Expires in {hours} hours | تنتهي صلاحيته خلال {hours} ساعة (ICU plural) |
| T3 closed | Joining is closed, so this code doesn’t work. Turn joining on to let new students in. | الانضمام مغلق، لذا لا يعمل هذا الرمز. يمكن فتح الانضمام لاستقبال طلاب جدد. |
| T3 expired | This code stopped working after 24 hours. Make a new one to keep inviting. | توقّف هذا الرمز بعد 24 ساعة. يلزم إنشاء رمز جديد لمواصلة الدعوة. |
| T3 empty roster | No students yet. Show the QR code, or share code {code}. | لا يوجد طلاب بعد. يمكن عرض رمز QR أو مشاركة الرمز {code}. |
| Joining switch | Joining open · Students can join with the code or QR · New students can’t join | الانضمام مفتوح · يمكن للطلاب الانضمام بالرمز أو رمز QR · لا يمكن لطلاب جدد الانضمام |
| T4 counter | {n} students joined | انضم {n} طالبًا (ICU plural) |
| T5 delete | Delete this classroom? All {n} students in {class} lose access, and the invite code stops working. This can’t be undone. | حذف هذا الفصل؟ يتوقف وصول جميع الطلاب ({n}) إلى {class}، ويتوقف رمز الدعوة. لا يمكن التراجع عن ذلك. |
| T5 remove | Remove {name}? They lose access to this class right away. They can rejoin only with a working code. | إزالة {name}؟ يتوقف الوصول إلى هذا الفصل فورًا، ولا تكون العودة ممكنة إلا برمز صالح. |
| T5 follow-up | {name} was removed. If they still have the current code, they could rejoin. A new code stops the old code and QR working for everyone. | تمت إزالة {name}. الرمز الحالي لا يزال يسمح بالعودة. إنشاء رمز جديد يوقف الرمز القديم ورمز QR للجميع. |
| T5 regenerate | Make a new invite code? The current code and QR will stop working. Students already in the class stay in. | إنشاء رمز دعوة جديد؟ سيتوقف الرمز الحالي ورمز QR عن العمل. يبقى الطلاب الحاليون في الفصل. |
| P1 empty | Join your first class. Scan your teacher’s QR code or type the 6-digit code. | الانضمام إلى أول فصل. بمسح رمز QR من شاشة المعلّم/ة أو بإدخال الرمز المكوّن من 6 أرقام. |
| P2 before permission | Scan your class QR code. Joinly uses the camera only to read the code. Nothing is recorded or saved. | مسح رمز QR الخاص بالفصل. يستخدم Joinly الكاميرا لقراءة الرمز فقط، ولا يُسجَّل أو يُحفظ أي شيء. |
| P2 denied | Camera access is off. Turn it on in Settings to scan, or type the code instead. | الوصول إلى الكاميرا متوقف. يمكن تفعيله من الإعدادات للمسح، أو إدخال الرمز بدلًا من ذلك. |
| P2 hint | Point your camera at the QR code on your teacher’s screen | توجيه الكاميرا نحو رمز QR على شاشة المعلّم/ة |
| P2 wrong code | That’s not a Joinly code. Keep the class QR in the frame. | هذا ليس رمز Joinly. يُرجى إبقاء رمز QR الخاص بالفصل داخل الإطار. |
| P3 title | Enter the 6-digit code. Your teacher can see it on their screen. | إدخال الرمز المكوّن من 6 أرقام. يظهر الرمز على شاشة المعلّم/ة. |
| P3 invalid | That code doesn’t match a class. Check the digits and try again. | هذا الرمز لا يطابق أي فصل. يُرجى التحقّق من الأرقام ثم المحاولة مرة أخرى. |
| P3 expired | This code has expired. Ask your teacher for a new one. | انتهت صلاحية هذا الرمز. يُرجى طلب رمز جديد من المعلّم/ة. |
| P3 locked | Too many tries. You can try again in {m:ss}. | محاولات كثيرة جدًا. تُتاح المحاولة مرة أخرى بعد {m:ss}. |
| P4 already | You’re already in this class. | أنت بالفعل في هذا الفصل. |
| P4 closed | This class isn’t accepting new students. Ask your teacher to turn on joining. | لا يقبل هذا الفصل طلابًا جددًا حاليًا. يُرجى طلب فتح الانضمام من المعلّم/ة. |
| P5 leave | Leave {class}? You’ll lose access right away. To come back, you’ll need a new code from your teacher. | مغادرة {class}؟ يتوقف الوصول فورًا، وتلزم العودة برمز جديد من المعلّم/ة. |
| P5 gone | This class is no longer available. Your teacher removed you or deleted the class. | هذا الفصل لم يعد متاحًا. ربما حُذف الفصل أو تمت الإزالة منه. |
| P6 | You’re in | تم الانضمام |

## Behaviour and edge cases

The rules the screens assume; the backend has to enforce the same ones.

### Invite codes

- **Format:** 6 numeric digits, shown as 3+3. Avoid codes that are all one digit or a straight run (111111, 123456).
- **Expiry:** 24 hours after creation. T3 and T4 show a relative time (“Expires in 18 hours”, then minutes in the last hour) and switch to the expired state at zero without a refresh.
- **Regenerate:** always confirmed (T5). The old code and QR stop working immediately; members stay. T4 shows “Making a new code…” until the new code arrives.
- **Joining open / closed:** closing hides the QR and code on T4 and dims the invite card on T3. The code itself keeps its expiry; reopening doesn’t extend it.
- **QR payload:** `joinly://join?code=482913` — the code is a query parameter, not part of the path. The app opens P4 with that code; ignore unknown parameters, and treat a code that isn’t 6 digits as “not a Joinly code”. Scanned with the phone’s own camera app, the link opens Joinly only if it’s installed. Helpers: `invite.link()` and `invite.parseLink()` in `theme.ts`.

### Joining (student)

- **Submit:** P3 submits on the 6th digit; there is no submit button. A paste of 6 digits (with or without a space) fills and submits.
- **Errors stay on P3:** invalid and expired keep the digits so one can be fixed; the next digit typed clears the field and starts again.
- **Too many attempts:** 5 wrong codes in 15 minutes locks entry. The server enforces it and returns HTTP 429 with `Retry-After` (seconds); the cells lock and the countdown starts from that value — never a fixed length — and input unlocks at zero. Helper: `retryAfterSeconds()` in `theme.ts`.
- **Already a member:** P4 shows the info banner and Open class — not an error.
- **Pending join across sign-in:** a code from a QR link or typed before a session expired is kept through S2 and S3 and resumes at P4.
- **Speed target:** under 15 s from tapping Join a class to “You’re in”. Test with the canvas prototype.

### Teacher forms

- **Discard changes (T2):** close, system back or swipe with unsaved edits opens “Discard your changes?”. Untouched forms close without asking.
- **Keyboard (T2):** the Save bar rides above the keyboard; the form scrolls so the focused field stays visible.

### Live updates, timing and feedback

- **T4 counter:** updates within 2 s of each join (realtime or polling); the dot pulses once per change.
- **Roster (T3):** new students appear at the top without a pull-to-refresh.
- **Pull to refresh (T1, P1):** standard Android indicator; the list nudges down while it spins.
- **Removed or deleted class:** the next open of P5 shows “This class is no longer available”; P1 drops the card on refresh.
- **Timings:** P6 auto-continues after 1.5 s; toasts last 3 s; scan found → P4 within 300 ms.
- **Haptics:** a light tick when a QR is found and a success pattern on joined; nothing on errors.
- **Offline:** cached lists stay readable; actions that need the network are disabled, not hidden, and the strip says why.
- **Sign-out:** clears the session and any pending join code, then returns to S2.

## Decisions and open questions

- **Decided — QR link:** `joinly://join?code=482913`.
- **Decided — rate limit:** 5 wrong codes in 15 minutes; the server sends `Retry-After` and the app counts down from it.
- **Decided — digits:** Western 0–9 in both languages.
- **Decided — Arabic:** gender-neutral wording, no gender field.
- **Decided — T4 landscape:** supported; see `screens/T4-Invite/05-landscape.png`.
- [ ] **Open — roster size:** is there a class size cap, and should T3 page the roster beyond 100 students?
- [ ] **Open — assets:** official Google sign-in button mark; real app version string on S4.
