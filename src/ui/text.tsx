import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { colors, typography } from './theme';

type Variant = keyof typeof typography;
type Tone = 'default' | 'muted' | 'primary' | 'danger' | 'success' | 'onPrimary';

const toneColor: Record<Tone, string> = {
  default: colors.text,
  muted: colors.textMuted,
  primary: colors.primary,
  danger: colors.danger,
  success: colors.success,
  onPrimary: colors.onPrimary,
};

export type TextProps = RNTextProps & {
  variant?: Variant;
  tone?: Tone;
  align?: TextStyle['textAlign'];
};

export function Text({ variant = 'body', tone = 'default', align, style, ...rest }: TextProps) {
  return (
    <RNText
      {...rest}
      style={[
        typography[variant] as TextStyle,
        { color: toneColor[tone], textAlign: align },
        style,
      ]}
    />
  );
}
