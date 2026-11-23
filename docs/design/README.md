# Joinly — design handoff package

Everything needed to build the Joinly Android app (Expo / React Native) from the finished design. Exported 22 Nov 2026.

## Start here

1. Read `spec/joinly-handoff-spec.md`. It has the tokens, layout rules, components, every screen and state, accessibility behaviour, the full English + Arabic copy deck, and the behaviour rules the backend must match.
2. Drop `code/theme.ts` into the app. Every colour, type style, spacing, radius and timing comes from it; components should never hard-code hex values.
3. Build the 17 components in the spec's Components table first (they're drawn in `screens/_boards/Components.png`), then assemble the screens from `screens/`.

## What's in the folder

| Path | What it is |
| --- | --- |
| `spec/joinly-handoff-spec.md` | The developer spec (source of truth for behaviour, accessibility and copy). |
| `code/theme.ts` | Tokens as TypeScript: light/dark palettes, `text()` type helper (switches to the Arabic font), spacing, radius, motion, `invite.link()` / `invite.parseLink()` for `joinly://join?code=…`, `retryAfterSeconds()` for the rate-limit countdown. Strict-mode type-checked. |
| `tokens/tokens.json` | The same tokens as plain JSON. |
| `screens/<ID-Screen>/NN-state.png` | One PNG per screen state at 2× (720 × 1600 for a 360 × 800 dp phone). 82 states across S1–S4, T1–T5, P1–P6, global states and the Arabic RTL check. |
| `screens/_boards/` | Full boards: Foundations (colours, type, contrast, spacing, radius), Components, and each screen board with its notes. |
| `assets/` | App mark (SVG) and a sample invite QR that encodes `joinly://join?code=482913`. |
| `canvas-source/` | The design canvas's source files (HTML + `joinly.css`), for reference only — not app code. |

## Key decisions

- **Platform:** Android first, phone, portrait, 360 × 800 dp reference. T4 (invite) also supports landscape.
- **Primary action:** one per screen, always in the bottom third (bottom bar, extended FAB or sheet).
- **Invite codes:** 6 digits shown as 482 913, expire after 24 h, always left-to-right. QR payload `joinly://join?code=482913`.
- **Rate limit:** 5 wrong codes in 15 minutes; the server returns HTTP 429 + `Retry-After`, and the app counts down from that value.
- **Arabic:** IBM Plex Sans Arabic, Western digits, gender-neutral wording, layout mirrors through start/end only.
- **Dark mode:** token swap only; the QR plate stays white.

## Still open

- Class size cap / roster paging beyond 100 students.
- Official Google sign-in button mark and the real app version string.

## Live links (need access to the owner's Claude account)

- Design canvas (all boards, plus a clickable student join prototype on the Prototype page): https://claude.ai/artifact/BhXGKfePa7QF1zhGUCDdkz
- Live spec doc: https://claude.ai/artifact/Pe14HLuGEHPiasJHkvfNCx
