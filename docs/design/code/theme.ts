// Joinly design tokens for Expo / React Native.
// Source of truth: "Joinly — developer handoff spec" (Design tokens section) and the canvas Foundations board.
// Components read tokens only; never hard-code hex values.

import { TextStyle, ViewStyle } from 'react-native';

export const palette = {
  light: {
    bg: '#F5F6F8',
    surface: '#FFFFFF',
    surface2: '#EDEFF2',
    ink: '#121722',
    ink2: '#525B68',
    line: '#DDE1E6',
    lineStrong: '#848D9A',
    primary: '#2F5BEA',
    primaryPressed: '#2449C4',
    onPrimary: '#FFFFFF',
    primarySoft: '#E7EDFD',
    onPrimarySoft: '#1D3FAE',
    success: '#1B7A4B',
    successSoft: '#E2F2E9',
    danger: '#BD372C',
    onDanger: '#FFFFFF',
    dangerSoft: '#FBE8E6',
    warning: '#8A5A00',
    warningSoft: '#FCF0D6',
    inverse: '#1E232C',
    onInverse: '#F3F5F8',
    scrim: 'rgba(12,16,24,0.56)',
    skeleton: '#E2E5EA',
  },
  dark: {
    bg: '#101318',
    surface: '#181C23',
    surface2: '#222731',
    ink: '#EEF1F5',
    ink2: '#A8B0BC',
    line: '#2B313B',
    lineStrong: '#6E7786',
    primary: '#86A2FF',
    primaryPressed: '#A3B8FF',
    onPrimary: '#0A1433',
    primarySoft: '#1E2A4D',
    onPrimarySoft: '#C3D0FF',
    success: '#5FCB91',
    successSoft: '#13301F',
    danger: '#FF8F84',
    onDanger: '#2A0A07',
    dangerSoft: '#3B1815',
    warning: '#F0C05A',
    warningSoft: '#33270C',
    inverse: '#E9EDF2',
    onInverse: '#14181E',
    scrim: 'rgba(0,0,0,0.64)',
    skeleton: '#262C36',
  },
} as const;

export type ColorScheme = keyof typeof palette;
export type Colors = { [K in keyof typeof palette.light]: string };

/** The QR plate is always white with black modules, in both themes. */
export const qr = { plate: '#FFFFFF', module: '#000000', quietZone: 12, errorCorrection: 'M' } as const;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 28, full: 999 } as const;

export const size = {
  touchTarget: 48,
  button: 52,
  fab: 56,
  appBar: 56,
  screenMargin: 16,
  avatar: { sm: 28, md: 40, lg: 72 },
  codeCell: { width: 44, height: 60, gap: 8, groupGap: 16 },
  qrInvite: 240,
} as const;

// Fonts: load Inter (400/500/600/700) and IBM Plex Sans Arabic (400/500/600/700) with expo-font.
// Names below match @expo-google-fonts/inter and @expo-google-fonts/ibm-plex-sans-arabic.
const fonts = {
  latin: { 400: 'Inter_400Regular', 500: 'Inter_500Medium', 600: 'Inter_600SemiBold', 700: 'Inter_700Bold' },
  arabic: {
    400: 'IBMPlexSansArabic_400Regular',
    500: 'IBMPlexSansArabic_500Medium',
    600: 'IBMPlexSansArabic_600SemiBold',
    700: 'IBMPlexSansArabic_700Bold',
  },
} as const;

type Weight = 400 | 500 | 600 | 700;
type TypeToken = { size: number; line: number; weight: Weight; tracking: number; tabular?: boolean };

/** Sizes in sp (follow Android font scaling). Tracking is a fraction of the font size. */
export const typeScale = {
  display: { size: 32, line: 40, weight: 700, tracking: -0.015 },
  title: { size: 24, line: 32, weight: 700, tracking: -0.01 },
  headline: { size: 20, line: 28, weight: 600, tracking: 0 },
  subhead: { size: 17, line: 24, weight: 600, tracking: 0 },
  body: { size: 16, line: 24, weight: 400, tracking: 0 },
  body2: { size: 15, line: 22, weight: 400, tracking: 0 },
  label: { size: 14, line: 20, weight: 600, tracking: 0 },
  caption: { size: 13, line: 18, weight: 500, tracking: 0 },
  codeL: { size: 32, line: 40, weight: 700, tracking: 0.08, tabular: true },
  codeXL: { size: 60, line: 68, weight: 700, tracking: 0.06, tabular: true },
} satisfies Record<string, TypeToken>;

export type TypeName = keyof typeof typeScale;

/**
 * Text style for a type token. In Arabic: Plex Sans Arabic, no letter-spacing, body lines at 26.
 * Codes always use the Latin font and stay left-to-right (wrap them with writingDirection: 'ltr').
 */
export function text(name: TypeName, locale: 'en' | 'ar' = 'en'): TextStyle {
  const t: TypeToken = typeScale[name];
  const isCode = t.tabular === true;
  const arabic = locale === 'ar' && !isCode;
  const style: TextStyle = {
    fontFamily: (arabic ? fonts.arabic : fonts.latin)[t.weight],
    fontSize: t.size,
    lineHeight: arabic && (name === 'body' || name === 'body2') ? 26 : t.line,
    letterSpacing: arabic ? 0 : t.tracking * t.size,
  };
  if (isCode) {
    style.fontVariant = ['tabular-nums'];
    style.writingDirection = 'ltr';
  }
  return style;
}

export const elevation = {
  fab: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  toast: { shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
} satisfies Record<string, ViewStyle>;

/** Durations in ms. Respect AccessibilityInfo.isReduceMotionEnabled(): skip pulses and slides. */
export const motion = {
  skeletonPulse: 1400,
  liveDotPulse: 1600,
  spinnerTurn: 800,
  sheetIn: 250,
  toast: 3000,
  joinedAutoContinue: 1500,
  scanFoundToConfirm: 300,
  counterAnnounceThrottle: 5000,
} as const;

export const invite = {
  codeLength: 6,
  expiresAfterHours: 24,
  /** Display as two groups of three: "482 913". */
  format: (code: string) => `${code.slice(0, 3)} ${code.slice(3, 6)}`,
  /** Screen-reader form: "4 8 2 9 1 3". */
  spoken: (code: string) => code.split('').join(' '),
  /** QR payload: the code is a query parameter, not part of the path. */
  link: (code: string) => `joinly://join?code=${encodeURIComponent(code)}`,
  /** Read a scanned or opened link. Returns null for anything that isn't a Joinly join link with 6 digits. */
  parseLink: (url: string): string | null => {
    const m = /^joinly:\/\/join\?(.*)$/i.exec(url.trim());
    if (!m) return null;
    const code = new URLSearchParams(m[1]).get('code') ?? '';
    return /^\d{6}$/.test(code) ? code : null;
  },
} as const;

/**
 * Wrong-code limit: 5 wrong codes in 15 minutes locks entry. The SERVER enforces it and answers
 * HTTP 429 with Retry-After (seconds). Count down from that header; never assume a fixed lock length.
 */
export const wrongCodeLimit = { attempts: 5, windowMinutes: 15 } as const;

/** Seconds to lock for, from a 429 response's Retry-After (delta-seconds or HTTP date). */
export function retryAfterSeconds(header: string | null, now: number = Date.now()): number | null {
  if (!header) return null;
  const secs = Number(header);
  if (Number.isFinite(secs)) return Math.max(0, Math.ceil(secs));
  const at = Date.parse(header);
  return Number.isNaN(at) ? null : Math.max(0, Math.ceil((at - now) / 1000));
}

export function makeTheme(scheme: ColorScheme) {
  return { scheme, colors: palette[scheme] as Colors, space, radius, size, text, elevation, motion, qr, invite, wrongCodeLimit };
}

export type Theme = ReturnType<typeof makeTheme>;
