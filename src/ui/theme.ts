import type { TextStyle, ViewStyle } from 'react-native';

/**
 * Design tokens from the Joinly design handoff (code/theme.ts and the spec's Design tokens section).
 * Components read colour, type, spacing, radius and timing from here only, never raw hex, so dark
 * mode is a token swap. Light is the launch target; the dark palette is kept ready for it.
 */
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

export type Colors = { [K in keyof typeof palette.light]: string };

/** The launch theme. */
export const colors: Colors = palette.light;

/** The QR plate is always white with black modules, in both themes. */
export const qr = { plate: '#FFFFFF', module: '#000000', edge: '#DDE1E6', quietZone: 12 } as const;

/** Spacing scale (dp): 4, 8, 12, 16, 24, 32, 48. */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 28, full: 999 } as const;

export const size = {
  touchTarget: 48,
  button: 52,
  buttonSmall: 48,
  fab: 56,
  appBar: 56,
  screenMargin: 16,
  avatar: { sm: 28, md: 40, lg: 72 },
  codeCell: { width: 44, height: 60, gap: 8, groupGap: 16 },
  qrInvite: 240,
} as const;

/** Inter, loaded in the root layout with @expo-google-fonts/inter. */
export const fonts = {
  400: 'Inter_400Regular',
  500: 'Inter_500Medium',
  600: 'Inter_600SemiBold',
  700: 'Inter_700Bold',
} as const;

type Weight = keyof typeof fonts;
type TypeToken = {
  size: number;
  line: number;
  weight: Weight;
  tracking: number;
  tabular?: boolean;
};

/** Sizes in sp (they follow Android font scaling). Tracking is a fraction of the font size. */
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

/** Text style for a type token. Codes use tabular figures and always run left to right. */
export function text(name: TypeName): TextStyle {
  const t: TypeToken = typeScale[name];
  return {
    fontFamily: fonts[t.weight],
    fontSize: t.size,
    lineHeight: t.line,
    letterSpacing: t.tracking * t.size,
    ...(t.tabular ? { fontVariant: ['tabular-nums'], writingDirection: 'ltr' } : {}),
  };
}

/** Text style for a one-off size that still uses the type family, e.g. the large app-bar title. */
export function font(weight: Weight, fontSize: number, lineHeight: number): TextStyle {
  return { fontFamily: fonts[weight], fontSize, lineHeight };
}

/** Cards are flat with a 1 dp line edge; only the FAB and toasts cast a shadow. */
export const elevation = {
  fab: {
    shadowColor: '#101828',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  toast: {
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} satisfies Record<string, ViewStyle>;

/** Durations in ms. Pulses and slides are skipped when the system asks for reduced motion. */
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

/** The scanner's camera chrome (P2): fixed light-on-dark in both themes, like the QR plate. */
export const camera = {
  bg: '#15181C',
  fg: '#F3F5F8',
  control: 'rgba(255,255,255,0.16)',
  controlOn: '#FFFFFF',
  onControlOn: '#15181C',
  guide: '#FFFFFF',
  found: '#5FCB91',
  onFound: '#0E2A1A',
} as const;
