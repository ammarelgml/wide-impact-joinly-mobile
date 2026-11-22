import { formatJoinCode } from '@/lib/format';

import { Text } from './text';
import { colors } from './theme';

/**
 * A 6-digit invite code: tabular, left to right in every locale, and read digit by digit
 * ("Code 4 8 2 9 1 3"), never as a number.
 */
export function CodeText({
  code,
  size = 'L',
  struck = false,
  muted = false,
  testID,
}: {
  code: string;
  size?: 'L' | 'XL';
  struck?: boolean;
  muted?: boolean;
  testID?: string;
}) {
  return (
    <Text
      testID={testID}
      variant={size === 'XL' ? 'codeXL' : 'codeL'}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.5}
      accessibilityLabel={`Code ${code.split('').join(' ')}`}
      style={[
        (muted || struck) && { color: colors.ink2 },
        struck && { textDecorationLine: 'line-through' },
      ]}
    >
      {formatJoinCode(code)}
    </Text>
  );
}
