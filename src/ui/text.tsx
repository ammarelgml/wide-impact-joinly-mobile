import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { colors, text, type TypeName } from './theme';

type Tone =
  | 'default'
  | 'muted'
  | 'primary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'onPrimary'
  | 'onPrimarySoft'
  | 'onInverse';

const toneColor: Record<Tone, string> = {
  default: colors.ink,
  muted: colors.ink2,
  primary: colors.primary,
  danger: colors.danger,
  success: colors.success,
  warning: colors.warning,
  onPrimary: colors.onPrimary,
  onPrimarySoft: colors.onPrimarySoft,
  onInverse: colors.onInverse,
};

/** Secondary styles default to the secondary ink, as in the design's type scale. */
const defaultTone: Partial<Record<TypeName, Tone>> = { body2: 'muted', caption: 'muted' };

export type TextProps = RNTextProps & {
  variant?: TypeName;
  tone?: Tone;
  align?: TextStyle['textAlign'];
};

export function Text({ variant = 'body', tone, align, style, ...rest }: TextProps) {
  const t = tone ?? defaultTone[variant] ?? 'default';
  return (
    <RNText {...rest} style={[text(variant), { color: toneColor[t], textAlign: align }, style]} />
  );
}
