/**
 * Design tokens. Components read colour, type, spacing and radius from here only, so a dark theme
 * or a brand refresh is a change to this file, and layouts use start/end so RTL stays cheap.
 * Text colours meet 4.5:1 contrast on their intended backgrounds.
 */
export const colors = {
  primary: '#2F5BEA',
  primaryPressed: '#2448C0',
  primarySoft: '#E8EEFD',
  onPrimary: '#FFFFFF',

  background: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF0F3',
  border: '#DADDE3',

  text: '#14171F',
  textMuted: '#5A6170',
  textDisabled: '#9AA0AC',

  success: '#1E7F4F',
  successSoft: '#E3F4EB',
  warning: '#8A5A00',
  warningSoft: '#FDF1D8',
  danger: '#C2312B',
  dangerPressed: '#A2261F',
  dangerSoft: '#FBE7E6',

  overlay: 'rgba(20, 23, 31, 0.5)',
  skeleton: '#E4E7EC',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 40, lineHeight: 48, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  code: { fontSize: 56, lineHeight: 64, fontWeight: '700', letterSpacing: 4 },
} as const;

/** Minimum touch target (dp), per Android accessibility guidance. */
export const touchTarget = 48;

export const theme = { colors, spacing, radius, typography, touchTarget } as const;
export type Theme = typeof theme;
